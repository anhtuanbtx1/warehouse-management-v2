import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';
import { getVietnamNowISO } from '@/lib/timezone';

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
  ImportPrice?: number;
  Profit?: number;
}

interface SellProductRequest {
  ProductID: number;
  SalePrice: number;
  PaymentMethod?: string;
  IncludeCable?: boolean;
  CableBatchId?: number;
  CablePrice?: number;
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
        d.SalePrice as ProductSalePrice,
        p.ImportPrice,
        (d.SalePrice - p.ImportPrice) as Profit
      FROM CRM_SalesInvoices i
      LEFT JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
      LEFT JOIN CRM_Products p ON d.ProductID = p.ProductID
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

    // Use Vietnam time for sale date (UTC+7)
    const vietnamTimeISO = getVietnamNowISO();

    // Calculate total amount including cable if sold
    const cableSalePrice = body.IncludeCable ? (body.CablePrice || 0) : 0;
    const totalAmount = body.SalePrice + cableSalePrice;

    const invoiceParams = {
      invoiceNumber,
      saleDate: vietnamTimeISO,
      totalAmount: totalAmount,
      finalAmount: totalAmount
    };

    const invoiceInsert = await executeQuery<{ InvoiceID: number }>(invoiceQuery, invoiceParams);
    const invoiceId = invoiceInsert[0].InvoiceID;

    // Handle cable gift - find and sell a cable automatically
    let cablePrice = 0;
    let soldCableId = null;
    let soldCableName = '';
    let soldCableIMEI = '';
    let availableCables = [];

    if (body.IncludeCable) {
      // Find an available cable to sell - prioritize specific batch if provided
      let cableQuery = `
        SELECT TOP 1
          p.ProductID,
          p.ProductName,
          p.IMEI,
          p.ImportPrice,
          c.CategoryName,
          b.BatchCode
        FROM CRM_Products p
        INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
        WHERE (c.CategoryName LIKE '%cáp%'
          OR c.CategoryName LIKE '%cap%'
          OR c.CategoryName LIKE '%Cáp%')
          AND p.Status = 'IN_STOCK'
      `;

      let queryParams = {};

      if (body.CableBatchId) {
        // Chọn cáp từ lô cụ thể
        cableQuery += ` AND p.BatchID = @batchId`;
        queryParams = { batchId: body.CableBatchId };
      }

      cableQuery += ` ORDER BY p.ImportPrice ASC, p.CreatedAt ASC`;

      availableCables = await executeQuery(cableQuery, queryParams);

      if (availableCables.length > 0) {
        const cable = availableCables[0];
        cablePrice = cable.ImportPrice;
        soldCableId = cable.ProductID;
        soldCableName = cable.ProductName;
        soldCableIMEI = cable.IMEI;

        // Mark the cable as sold - check if it's a gift or paid sale
        const cableSalePrice = body.CablePrice || 0;
        const isGift = cableSalePrice === 0;

        await executeQuery(`
          UPDATE CRM_Products
          SET Status = 'SOLD',
              SalePrice = @cableSalePrice,
              SoldDate = @soldDate,
              InvoiceNumber = @invoiceNumber,
              CustomerInfo = @customerInfo,
              Notes = CONCAT(ISNULL(Notes, ''), @notesSuffix),
              UpdatedAt = @updatedAt
          WHERE ProductID = @cableId
        `, {
          cableId: soldCableId,
          cableSalePrice: cableSalePrice,
          soldDate: getVietnamNowISO(),
          invoiceNumber,
          customerInfo: isGift ? 'Tặng kèm sản phẩm chính' : 'Bán kèm sản phẩm chính',
          notesSuffix: isGift
            ? ` [Tặng kèm hóa đơn ${invoiceNumber}]`
            : ` [Bán kèm hóa đơn ${invoiceNumber} - ${cableSalePrice.toLocaleString('vi-VN')} VNĐ]`,
          updatedAt: getVietnamNowISO()
        });
      } else {
        // No cable available, use average price for calculation
        try {
          const cablePriceResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/cable-price`);
          const cablePriceResult = await cablePriceResponse.json();
          if (cablePriceResult.success) {
            cablePrice = cablePriceResult.data.AvgCablePrice || 100000;
          }
        } catch (error) {
          console.error('Error fetching cable price:', error);
          cablePrice = 100000; // Default cable price
        }
        soldCableName = 'Cáp sạc (không có trong kho)';
      }
    }

    // Create invoice detail for main product
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

    // Create invoice detail for cable if included
    if (body.IncludeCable && soldCableId) {
      const cableSalePrice = body.CablePrice || 0;
      const isGift = cableSalePrice === 0;

      const cableDetailQuery = `
        INSERT INTO CRM_SalesInvoiceDetails (
          InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice
        )
        VALUES (
          @invoiceId, @cableId, @cableName, @cableImei, @cableSalePrice, 1, @totalPrice
        )
      `;

      const cableDetailParams = {
        invoiceId,
        cableId: soldCableId,
        cableName: `${soldCableName}${isGift ? ' (Tặng)' : ''}`,
        cableImei: soldCableIMEI || (isGift ? 'GIFT' : 'CABLE'),
        cableSalePrice: cableSalePrice,
        totalPrice: cableSalePrice
      };

      await executeQuery(cableDetailQuery, cableDetailParams);
    }

    // Update product status to SOLD
    const updateProductQuery = `
      UPDATE CRM_Products
      SET Status = 'SOLD',
          SalePrice = @salePrice,
          SoldDate = @soldDate,
          InvoiceNumber = @invoiceNumber,
          CustomerInfo = @customerInfo,
          Notes = CASE
            WHEN @includeCable = 1 THEN CONCAT(ISNULL(Notes, ''), ' [Tặng cáp sạc +', @cablePrice, ' VNĐ]')
            ELSE Notes
          END,
          UpdatedAt = @updatedAt
      WHERE ProductID = @productId
    `;

    const updateParams = {
      productId: body.ProductID,
      salePrice: body.SalePrice,
      soldDate: vietnamTimeISO,
      invoiceNumber,
      customerInfo: 'Khách lẻ',
      includeCable: body.IncludeCable ? 1 : 0,
      cablePrice: cablePrice,
      updatedAt: vietnamTimeISO
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
        (si.FinalAmount - p.ImportPrice - @cablePrice) as Profit,
        @cablePrice as CablePrice,
        @includeCable as IncludeCable,
        @soldCableId as SoldCableId,
        @soldCableName as SoldCableName
      FROM CRM_SalesInvoices si
      INNER JOIN CRM_SalesInvoiceDetails sid ON si.InvoiceID = sid.InvoiceID
      INNER JOIN CRM_Products p ON sid.ProductID = p.ProductID
      WHERE si.InvoiceID = @invoiceId
    `, {
      invoiceId,
      cablePrice: body.IncludeCable ? cablePrice : 0,
      includeCable: body.IncludeCable ? 1 : 0,
      soldCableId: soldCableId,
      soldCableName: soldCableName || ''
    });

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


