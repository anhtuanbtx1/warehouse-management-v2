import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';

// Interface cho Sales
interface SalesInvoice {
  InvoiceID: number;
  InvoiceNumber: string;
  CustomerID?: number;
  CustomerName?: string;
  SaleDate: string;
  TotalAmount: number;
  TaxAmount: number;
  DiscountAmount: number;
  FinalAmount: number;
  PaymentMethod: string;
  Status: string;
  Notes?: string;
  CreatedBy: string;
  CreatedAt: string;
  // Details
  ProductName?: string;
  IMEI?: string;
  SalePrice?: number;
}

interface SellProductRequest {
  ProductID: number;
  SalePrice: number;
  PaymentMethod?: string;
}

// GET /api/sales - Lấy danh sách hóa đơn bán hàng
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const customerPhone = searchParams.get('customerPhone');
    const invoiceNumber = searchParams.get('invoiceNumber');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (fromDate) {
      whereClause += ' AND CAST(i.SaleDate AS DATE) >= @fromDate';
      params.fromDate = fromDate;
    }
    
    if (toDate) {
      whereClause += ' AND CAST(i.SaleDate AS DATE) <= @toDate';
      params.toDate = toDate;
    }
    
    if (customerPhone) {
      whereClause += ' AND i.CustomerPhone LIKE @customerPhone';
      params.customerPhone = `%${customerPhone}%`;
    }
    
    if (invoiceNumber) {
      whereClause += ' AND i.InvoiceNumber LIKE @invoiceNumber';
      params.invoiceNumber = `%${invoiceNumber}%`;
    }
    
    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM CRM_SalesInvoices i
      ${whereClause}
    `;
    
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;
    
    // Lấy dữ liệu với phân trang
    const dataQuery = `
      SELECT 
        i.*,
        d.ProductName,
        d.IMEI,
        d.SalePrice as ProductSalePrice
      FROM CRM_SalesInvoices i
      LEFT JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
      ${whereClause}
      ORDER BY i.SaleDate DESC, i.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    params.offset = offset;
    params.limit = limit;
    
    const invoices = await executeQuery<SalesInvoice>(dataQuery, params);
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        data: invoices,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching sales invoices:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch sales invoices' },
      { status: 500 }
    );
  }
}

// POST /api/sales - Bán sản phẩm và tạo hóa đơn
export async function POST(request: NextRequest) {
  try {
    const body: SellProductRequest = await request.json();
    
    // Validate required fields
    if (!body.ProductID || !body.SalePrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: ProductID and SalePrice are required' },
        { status: 400 }
      );
    }

    if (typeof body.ProductID !== 'number' || body.ProductID <= 0) {
      return NextResponse.json(
        { success: false, error: 'ProductID must be a positive number' },
        { status: 400 }
      );
    }
    
    if (body.SalePrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Giá bán phải lớn hơn 0' },
        { status: 400 }
      );
    }
    
    // Validate payment method
    const validPaymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    const paymentMethod = body.PaymentMethod || 'CASH';
    if (!validPaymentMethods.includes(paymentMethod)) {
      return NextResponse.json(
        { success: false, error: 'Invalid payment method' },
        { status: 400 }
      );
    }
    
    // Check if product exists and is available
    const productCheck = await executeQuery(`
      SELECT ProductID, ProductName, IMEI, ImportPrice, Status
      FROM CRM_Products
      WHERE ProductID = @productId AND Status = 'IN_STOCK'
    `, { productId: body.ProductID });

    if (productCheck.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Product not found or not available for sale'
      }, { status: 404 });
    }

    const product = productCheck[0];

    // Generate invoice number
    const invoiceResult = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM CRM_SalesInvoices
      WHERE YEAR(CreatedAt) = YEAR(GETDATE())
    `);
    const invoiceNumber = `HD${new Date().getFullYear()}${(invoiceResult[0]?.count + 1 || 1).toString().padStart(6, '0')}`;

    // Create sales invoice - absolute minimal columns
    const invoiceQuery = `
      INSERT INTO CRM_SalesInvoices (
        InvoiceNumber, SaleDate, TotalAmount, FinalAmount
      )
      OUTPUT INSERTED.InvoiceID
      VALUES (
        @invoiceNumber, @saleDate, @totalAmount, @finalAmount
      )
    `;

    // Use Vietnam timezone for sale date
    const vietnamDate = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));

    const invoiceParams = {
      invoiceNumber,
      saleDate: vietnamDate.toISOString(),
      totalAmount: body.SalePrice,
      finalAmount: body.SalePrice
    };

    const invoiceInsert = await executeQuery<{ InvoiceID: number }>(invoiceQuery, invoiceParams);
    const invoiceId = invoiceInsert[0].InvoiceID;

    // Create invoice detail
    const detailQuery = `
      INSERT INTO CRM_SalesInvoiceDetails (
        InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice
      )
      VALUES (
        @invoiceId, @productId, @productName, @imei, @salePrice, 1, @totalPrice
      )
    `;

    const detailParams = {
      invoiceId,
      productId: body.ProductID,
      productName: product.ProductName,
      imei: product.IMEI,
      salePrice: body.SalePrice,
      totalPrice: body.SalePrice
    };

    await executeQuery(detailQuery, detailParams);

    // Update product status to SOLD
    const updateProductQuery = `
      UPDATE CRM_Products
      SET Status = 'SOLD',
          SalePrice = @salePrice,
          SoldDate = @soldDate,
          InvoiceNumber = @invoiceNumber,
          CustomerInfo = @customerInfo,
          UpdatedAt = GETDATE()
      WHERE ProductID = @productId
    `;

    const updateParams = {
      productId: body.ProductID,
      salePrice: body.SalePrice,
      soldDate: vietnamDate.toISOString(),
      invoiceNumber,
      customerInfo: 'Khách lẻ'
    };

    await executeQuery(updateProductQuery, updateParams);

    // Get the complete sale information
    const result = await executeQuery(`
      SELECT
        si.InvoiceID,
        si.InvoiceNumber,
        si.SaleDate,
        si.FinalAmount,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        (si.FinalAmount - p.ImportPrice) as Profit
      FROM CRM_SalesInvoices si
      INNER JOIN CRM_SalesInvoiceDetails sid ON si.InvoiceID = sid.InvoiceID
      INNER JOIN CRM_Products p ON sid.ProductID = p.ProductID
      WHERE si.InvoiceID = @invoiceId
    `, { invoiceId });
    
    const response: ApiResponse<any> = {
      success: true,
      data: result[0],
      message: 'Product sold successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error selling product:', error);

    // Handle specific SQL errors
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });

      if (error.message.includes('Sản phẩm không có sẵn để bán')) {
        return NextResponse.json(
          { success: false, error: 'Product is not available for sale' },
          { status: 400 }
        );
      }

      if (error.message.includes('Invalid object name')) {
        return NextResponse.json(
          { success: false, error: 'Database table not found. Please check database schema.' },
          { status: 500 }
        );
      }

      if (error.message.includes('Cannot insert duplicate key')) {
        return NextResponse.json(
          { success: false, error: 'Duplicate invoice number. Please try again.' },
          { status: 400 }
        );
      }
    }

    return NextResponse.json(
      { success: false, error: `Failed to sell product: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    );
  }
}


