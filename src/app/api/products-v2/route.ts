import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse, PaginatedResponse } from '@/types/warehouse';

// Interface cho Product V2
interface ProductV2 {
  ProductID: number;
  BatchID: number;
  CategoryID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  Status: 'IN_STOCK' | 'SOLD' | 'DAMAGED' | 'RETURNED';
  SoldDate?: string;
  InvoiceNumber?: string;
  CustomerInfo?: string;
  Notes?: string;
  CreatedAt: string;
  UpdatedAt: string;
  // Relations
  CategoryName?: string;
  BatchCode?: string;
  ImportDate?: string;
}

interface AddProductToBatchRequest {
  BatchID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  Notes?: string;
}

// GET /api/products-v2 - Lấy danh sách sản phẩm (có thể lọc theo trạng thái)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status'); // IN_STOCK, SOLD, etc.
    const categoryId = searchParams.get('categoryId');
    const batchId = searchParams.get('batchId');
    const batchCode = searchParams.get('batchCode'); // Filter theo batch code
    const search = searchParams.get('search'); // Tìm theo tên hoặc IMEI
    const availableOnly = searchParams.get('availableOnly') === 'true'; // Chỉ lấy sản phẩm còn hàng
    const fromDate = searchParams.get('fromDate'); // Filter từ ngày
    const toDate = searchParams.get('toDate'); // Filter đến ngày
    
    const offset = (page - 1) * limit;
    
    // Nếu chỉ lấy sản phẩm có sẵn để bán
    if (availableOnly) {
      const result = await executeProcedure<ProductV2>('SP_CRM_GetAvailableProducts', {
        CategoryID: categoryId ? parseInt(categoryId) : null,
        SearchTerm: search || null
      });
      
      // Phân trang thủ công cho stored procedure
      const total = result.length;
      const paginatedData = result.slice(offset, offset + limit);
      
      const response: ApiResponse<PaginatedResponse<ProductV2>> = {
        success: true,
        data: {
          data: paginatedData,
          total,
          page,
          limit,
          totalPages: Math.ceil(total / limit)
        }
      };
      
      return NextResponse.json(response);
    }
    
    // Query thông thường với filter
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (status) {
      whereClause += ' AND p.Status = @status';
      params.status = status;
    }
    
    if (categoryId) {
      whereClause += ' AND p.CategoryID = @categoryId';
      params.categoryId = parseInt(categoryId);
    }
    
    if (batchId) {
      whereClause += ' AND p.BatchID = @batchId';
      params.batchId = parseInt(batchId);
    }

    if (batchCode) {
      whereClause += ' AND b.BatchCode = @batchCode';
      params.batchCode = batchCode;
    }
    
    if (search) {
      whereClause += ' AND (p.ProductName LIKE @search OR p.IMEI LIKE @search)';
      params.search = `%${search}%`;
    }

    // Filter theo ngày bán (chỉ áp dụng cho sản phẩm đã bán)
    if (fromDate && status === 'SOLD') {
      whereClause += ' AND p.SoldDate >= @fromDate';
      params.fromDate = fromDate;
    }

    if (toDate && status === 'SOLD') {
      whereClause += ' AND p.SoldDate <= @toDate';
      params.toDate = toDate + ' 23:59:59'; // Include full day
    }
    
    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      ${whereClause}
    `;
    
    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;
    
    // Lấy dữ liệu với phân trang
    const dataQuery = `
      SELECT 
        p.*,
        c.CategoryName,
        b.BatchCode,
        b.ImportDate
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      ${whereClause}
      ORDER BY p.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    params.offset = offset;
    params.limit = limit;
    
    const products = await executeQuery<ProductV2>(dataQuery, params);
    
    const response: ApiResponse<PaginatedResponse<ProductV2>> = {
      success: true,
      data: {
        data: products,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch products' },
      { status: 500 }
    );
  }
}

// POST /api/products-v2 - Thêm sản phẩm vào lô hàng
export async function POST(request: NextRequest) {
  try {
    const body: AddProductToBatchRequest = await request.json();
    
    // Validate required fields
    if (!body.BatchID || !body.ProductName || !body.IMEI || !body.ImportPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    if (body.ImportPrice <= 0) {
      return NextResponse.json(
        { success: false, error: 'Import price must be greater than 0' },
        { status: 400 }
      );
    }
    
    // Validate IMEI format (basic check)
    if (!/^\d{15}$/.test(body.IMEI)) {
      return NextResponse.json(
        { success: false, error: 'IMEI must be 15 digits' },
        { status: 400 }
      );
    }
    
    // Thêm sản phẩm bằng stored procedure
    const result = await executeProcedure<ProductV2>('SP_CRM_AddProductToBatch', {
      BatchID: body.BatchID,
      ProductName: body.ProductName,
      IMEI: body.IMEI,
      ImportPrice: body.ImportPrice,
      Notes: body.Notes || null
    });
    
    const response: ApiResponse<ProductV2> = {
      success: true,
      data: result[0],
      message: 'Product added to batch successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error adding product to batch:', error);
    
    // Handle specific SQL errors
    if (error instanceof Error) {
      if (error.message.includes('Lô hàng không tồn tại')) {
        return NextResponse.json(
          { success: false, error: 'Batch not found' },
          { status: 404 }
        );
      }
      
      if (error.message.includes('IMEI đã tồn tại')) {
        return NextResponse.json(
          { success: false, error: 'IMEI đã tồn tại' },
          { status: 400 }
        );
      }
    }
    
    return NextResponse.json(
      { success: false, error: 'Failed to add product to batch' },
      { status: 500 }
    );
  }
}
