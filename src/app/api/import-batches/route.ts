import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse, PaginatedResponse } from '@/types/warehouse';

// Interface cho Import Batch
interface ImportBatch {
  BatchID: number;
  BatchCode: string;
  ImportDate: string;
  CategoryID: number;
  CategoryName?: string;
  TotalQuantity: number;
  ImportPrice?: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  ProfitLoss: number;
  Status: string;
  Notes?: string;
  CreatedBy: string;
  CreatedAt: string;
  UpdatedAt: string;
}

interface CreateImportBatchRequest {
  CategoryID: number;
  ImportDate: string;
  TotalQuantity: number;
  ImportPrice?: number;
  TotalImportValue: number;
  Notes?: string;
}

// GET /api/import-batches - Lấy danh sách lô hàng
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const categoryId = searchParams.get('categoryId');
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const status = searchParams.get('status');

    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any = {};

    if (categoryId) {
      whereClause += ' AND b.CategoryID = @categoryId';
      params.categoryId = parseInt(categoryId);
    }

    if (fromDate) {
      whereClause += ' AND b.ImportDate >= @fromDate';
      params.fromDate = fromDate;
    }

    if (toDate) {
      whereClause += ' AND b.ImportDate <= @toDate';
      params.toDate = toDate;
    }

    if (status) {
      whereClause += ' AND b.Status = @status';
      params.status = status;
    }

    // Đếm tổng số records
    const countQuery = `
      SELECT COUNT(*) as total
      FROM CRM_ImportBatches b
      LEFT JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
      ${whereClause}
    `;

    const countResult = await executeQuery<{ total: number }>(countQuery, params);
    const total = countResult[0]?.total || 0;

    // Lấy dữ liệu với phân trang
    const dataQuery = `
      SELECT
        b.BatchID,
        b.BatchCode,
        b.ImportDate,
        b.CategoryID,
        b.TotalQuantity,
        b.ImportPrice,
        b.TotalImportValue,
        b.TotalSoldQuantity,
        b.TotalSoldValue,
        b.RemainingQuantity,
        b.ProfitLoss,
        b.Status,
        b.Notes,
        b.CreatedBy,
        b.CreatedAt,
        b.UpdatedAt,
        c.CategoryName
      FROM CRM_ImportBatches b
      LEFT JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
      ${whereClause}
      ORDER BY b.ImportDate DESC, b.CreatedAt DESC
      OFFSET @offset ROWS
      FETCH NEXT @limit ROWS ONLY
    `;

    params.offset = offset;
    params.limit = limit;

    const batches = await executeQuery<ImportBatch>(dataQuery, params);

    const response: ApiResponse<PaginatedResponse<ImportBatch>> = {
      success: true,
      data: {
        data: batches,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit)
      }
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching import batches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch import batches' },
      { status: 500 }
    );
  }
}

// POST /api/import-batches - Tạo lô hàng mới
export async function POST(request: NextRequest) {
  try {
    const body: CreateImportBatchRequest = await request.json();

    // Validate required fields
    if (!body.CategoryID || !body.ImportDate || !body.TotalQuantity || !body.TotalImportValue) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (body.TotalQuantity <= 0 || body.TotalImportValue <= 0) {
      return NextResponse.json(
        { success: false, error: 'Quantity and import value must be greater than 0' },
        { status: 400 }
      );
    }

    // Calculate ImportPrice if not provided
    const importPrice = body.ImportPrice || (body.TotalImportValue / body.TotalQuantity);

    // Tạo lô hàng bằng stored procedure
    const result = await executeProcedure<ImportBatch>('SP_CRM_CreateImportBatch', {
      CategoryID: body.CategoryID,
      ImportDate: body.ImportDate,
      TotalQuantity: body.TotalQuantity,
      ImportPrice: importPrice,
      TotalImportValue: body.TotalImportValue,
      Notes: body.Notes || null,
      CreatedBy: 'system' // TODO: Get from auth
    });

    // Kiểm tra xem danh mục có phải là "Cáp sạc" không
    const categoryInfo = await executeQuery<{CategoryName: string}>(
      'SELECT CategoryName FROM CRM_Categories WHERE CategoryID = @categoryId',
      { categoryId: body.CategoryID }
    );

    // Nếu là danh mục "Cáp sạc", tự động tạo sản phẩm
    if (categoryInfo.length > 0 && (
      categoryInfo[0].CategoryName.toLowerCase().includes('cáp') ||
      categoryInfo[0].CategoryName.toLowerCase().includes('cap') ||
      categoryInfo[0].CategoryName.includes('Cáp')
    )) {
      const batchId = result[0].BatchID;

      // Tạo sản phẩm tự động cho từng số lượng với tên chuẩn
      for (let i = 1; i <= body.TotalQuantity; i++) {
        const productCode = `CAP${Date.now()}${String(i).padStart(3, '0')}`;
        const standardProductName = `Type-C to Lightning #${i}`;

        try {
          await executeQuery(`
            INSERT INTO CRM_Products (
              BatchID, CategoryID, ProductName, IMEI, ImportPrice, Status, Notes, CreatedAt
            )
            VALUES (
              @batchId, @categoryId, @productName, @productCode, @importPrice, 'IN_STOCK', @notes, GETDATE()
            )
          `, {
            batchId: batchId,
            categoryId: body.CategoryID,
            productName: standardProductName,
            productCode: productCode,
            importPrice: importPrice,
            notes: `Tự động tạo từ lô hàng ${result[0].BatchCode}`
          });
        } catch (productError) {
          console.error(`Error creating product ${i}:`, productError);
          // Tiếp tục tạo các sản phẩm khác nếu có lỗi
        }
      }
    }

    const response: ApiResponse<ImportBatch> = {
      success: true,
      data: result[0],
      message: categoryInfo.length > 0 && (
        categoryInfo[0].CategoryName.toLowerCase().includes('cáp') ||
        categoryInfo[0].CategoryName.toLowerCase().includes('cap') ||
        categoryInfo[0].CategoryName.includes('Cáp')
      )
        ? `Lô hàng đã được tạo thành công với ${body.TotalQuantity} sản phẩm cáp sạc tự động`
        : 'Import batch created successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating import batch:', error);

    // Handle specific SQL errors
    if (error instanceof Error && error.message.includes('Lô hàng không tồn tại')) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to create import batch' },
      { status: 500 }
    );
  }
}
