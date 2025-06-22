import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Product, ProductForm, ApiResponse, PaginatedResponse } from '@/types/warehouse';
import { getVietnamNowISO } from '@/lib/timezone';

// GET /api/products - Lấy danh sách sản phẩm
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const search = searchParams.get('search') || '';
    const categoryId = searchParams.get('categoryId');
    const isActive = searchParams.get('isActive');
    
    const offset = (page - 1) * limit;
    
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (search) {
      whereClause += ' AND (p.ProductName LIKE @search OR p.ProductCode LIKE @search)';
      params.search = `%${search}%`;
    }
    
    if (categoryId) {
      whereClause += ' AND p.CategoryID = @categoryId';
      params.categoryId = parseInt(categoryId);
    }
    
    if (isActive !== null) {
      whereClause += ' AND p.IsActive = @isActive';
      params.isActive = isActive === 'true';
    }
    
    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM CRM_Products p
      ${whereClause}
    `;

    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Lấy dữ liệu với phân trang
    const dataQuery = `
      SELECT
        p.*,
        c.CategoryName,
        u.UnitName,
        u.UnitSymbol
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_Units u ON p.UnitID = u.UnitID
      ${whereClause}
      ORDER BY p.ProductName
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;
    
    params.offset = offset;
    params.limit = limit;
    
    const products = await executeQuery<Product>(dataQuery, params);
    
    const response: ApiResponse<PaginatedResponse<Product>> = {
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

// POST /api/products - Tạo sản phẩm mới trong lô
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Validate required fields
    if (!body.BatchID || !body.ProductName || !body.IMEI || !body.ImportPrice) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields: BatchID, ProductName, IMEI, ImportPrice' },
        { status: 400 }
      );
    }

    // Check if IMEI already exists
    const existingProduct = await executeQuery(
      'SELECT ProductID FROM CRM_Products WHERE IMEI = @imei',
      { imei: body.IMEI }
    );

    if (existingProduct.length > 0) {
      return NextResponse.json(
        { success: false, error: 'IMEI đã tồn tại!' },
        { status: 400 }
      );
    }

    // Get batch info to get CategoryID and check TotalQuantity limit
    const batchInfo = await executeQuery(
      'SELECT CategoryID, TotalQuantity FROM CRM_ImportBatches WHERE BatchID = @batchId',
      { batchId: body.BatchID }
    );

    if (batchInfo.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lô hàng không tồn tại' },
        { status: 404 }
      );
    }

    // Check current product count in this batch
    const currentProductCount = await executeQuery(
      'SELECT COUNT(*) as productCount FROM CRM_Products WHERE BatchID = @batchId',
      { batchId: body.BatchID }
    );

    const currentCount = currentProductCount[0]?.productCount || 0;
    const maxQuantity = batchInfo[0].TotalQuantity;

    // Check if adding this product would exceed the planned quantity
    if (currentCount >= maxQuantity) {
      return NextResponse.json(
        {
          success: false,
          error: `Không thể thêm sản phẩm. Lô hàng đã đạt giới hạn ${maxQuantity} sản phẩm (hiện tại: ${currentCount})`
        },
        { status: 400 }
      );
    }

    const insertQuery = `
      INSERT INTO CRM_Products (
        BatchID, CategoryID, ProductName, IMEI, ImportPrice, Status, Notes, CreatedAt
      )
      OUTPUT INSERTED.*
      VALUES (
        @batchId, @categoryId, @productName, @imei, @importPrice, 'IN_STOCK', @notes, @createdAt
      )
    `;

    const params = {
      batchId: body.BatchID,
      categoryId: batchInfo[0].CategoryID,
      productName: body.ProductName,
      imei: body.IMEI,
      importPrice: body.ImportPrice,
      notes: body.Notes || null,
      createdAt: getVietnamNowISO()
    };

    const result = await executeQuery(insertQuery, params);

    // Update batch total import value only (don't change TotalQuantity as it's planned quantity)
    await executeQuery(`
      UPDATE CRM_ImportBatches
      SET TotalImportValue = TotalImportValue + @importPrice,
          UpdatedAt = @updatedAt
      WHERE BatchID = @batchId
    `, {
      batchId: body.BatchID,
      importPrice: body.ImportPrice,
      updatedAt: getVietnamNowISO()
    });

    return NextResponse.json({
      success: true,
      data: result[0],
      message: 'Product added to batch successfully'
    }, { status: 201 });

  } catch (error) {
    console.error('Error creating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create product' },
      { status: 500 }
    );
  }
}
