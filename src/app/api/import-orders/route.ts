import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ImportOrder, ImportOrderForm, ApiResponse, PaginatedResponse } from '@/types/warehouse';

// GET /api/import-orders - Lấy danh sách phiếu nhập
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const status = searchParams.get('status');
    const supplierId = searchParams.get('supplierId');
    const warehouseId = searchParams.get('warehouseId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (search) {
      whereClause += ' AND (io.ImportOrderCode LIKE @search OR s.SupplierName LIKE @search)';
      params.search = `%${search}%`;
    }
    
    if (status) {
      whereClause += ' AND io.Status = @status';
      params.status = status;
    }
    
    if (supplierId) {
      whereClause += ' AND io.SupplierID = @supplierId';
      params.supplierId = parseInt(supplierId);
    }
    
    if (warehouseId) {
      whereClause += ' AND io.WarehouseID = @warehouseId';
      params.warehouseId = parseInt(warehouseId);
    }
    
    if (fromDate) {
      whereClause += ' AND io.ImportDate >= @fromDate';
      params.fromDate = fromDate;
    }
    
    if (toDate) {
      whereClause += ' AND io.ImportDate <= @toDate';
      params.toDate = toDate;
    }
    
    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM CRM_ImportOrders io
      LEFT JOIN CRM_Suppliers s ON io.SupplierID = s.SupplierID
      LEFT JOIN CRM_Warehouses w ON io.WarehouseID = w.WarehouseID
      ${whereClause}
    `;

    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Lấy dữ liệu với phân trang
    const dataQuery = `
      SELECT
        io.*,
        s.SupplierName,
        s.SupplierCode,
        w.WarehouseName,
        w.WarehouseCode
      FROM CRM_ImportOrders io
      LEFT JOIN CRM_Suppliers s ON io.SupplierID = s.SupplierID
      LEFT JOIN CRM_Warehouses w ON io.WarehouseID = w.WarehouseID
      ${whereClause}
      ORDER BY io.ImportDate DESC, io.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    params.offset = offset;
    params.limit = limit;
    
    const importOrders = await executeQuery<ImportOrder>(dataQuery, params);
    
    const response: ApiResponse<PaginatedResponse<ImportOrder>> = {
      success: true,
      data: {
        data: importOrders,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching import orders:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch import orders' },
      { status: 500 }
    );
  }
}

// POST /api/import-orders - Tạo phiếu nhập mới
export async function POST(request: NextRequest) {
  try {
    const body: ImportOrderForm = await request.json();
    
    // Validate required fields
    if (!body.SupplierID || !body.WarehouseID || !body.ImportDate || !body.Details || body.Details.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Validate details
    for (const detail of body.Details) {
      if (!detail.ProductID || !detail.Quantity || detail.Quantity <= 0 || !detail.UnitPrice || detail.UnitPrice <= 0) {
        return NextResponse.json(
          { success: false, error: 'Invalid product details' },
          { status: 400 }
        );
      }
    }
    
    // Calculate totals
    const totalAmount = body.Details.reduce((sum, detail) => sum + (detail.Quantity * detail.UnitPrice), 0);
    const taxAmount = body.TaxAmount || 0;
    const discountAmount = body.DiscountAmount || 0;
    const finalAmount = totalAmount + taxAmount - discountAmount;
    
    // Generate import order code
    const codeResult = await executeQuery<{ count: number }>(
      'SELECT COUNT(*) as count FROM CRM_ImportOrders WHERE YEAR(CreatedAt) = YEAR(GETDATE())'
    );
    const orderNumber = (codeResult[0]?.count || 0) + 1;
    const importOrderCode = `PN${new Date().getFullYear()}${orderNumber.toString().padStart(6, '0')}`;

    // Begin transaction - temporarily disabled
    // const connection = await sql.connect();
    // const transaction = new sql.Transaction(connection);

    try {
      // await transaction.begin(); // Temporarily disabled

      // Temporarily return mock data instead of database operations
      const mockImportOrderId = 1;
      
      // Mock response for now
      const mockResponse: ApiResponse<any> = {
        success: true,
        data: {
          ImportOrderID: mockImportOrderId,
          ImportOrderCode: importOrderCode,
          SupplierName: 'Mock Supplier',
          WarehouseName: 'Mock Warehouse'
        },
        message: 'Import order created successfully (mock)'
      };

      return NextResponse.json(mockResponse, { status: 201 });
    } catch (error) {
      console.error('Error in mock import order:', error);
      throw error;
    }
  } catch (error) {
    console.error('Error creating import order:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create import order' },
      { status: 500 }
    );
  }
}
