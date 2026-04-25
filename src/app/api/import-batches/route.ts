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
  let body: CreateImportBatchRequest | null = null;
  
  try {
    body = await request.json();

    // Validate required fields
    if (!body || !body.CategoryID || !body.ImportDate || !body.TotalQuantity || !body.TotalImportValue) {
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

    let result: ImportBatch[];
    
    try {
      // Tạo lô hàng bằng stored procedure
      result = await executeProcedure<ImportBatch>('SP_CRM_CreateImportBatch', {
        CategoryID: body.CategoryID,
        ImportDate: body.ImportDate,
        TotalQuantity: body.TotalQuantity,
        ImportPrice: importPrice,
        TotalImportValue: body.TotalImportValue,
        Notes: body.Notes || null,
        CreatedBy: 'system' // TODO: Get from auth
      });
    } catch (procError) {
      console.error('Stored procedure error, attempting to update procedure:', procError);
      
      // Nếu procedure lỗi, thử cập nhật procedure rồi thử lại
      try {
        // Drop existing procedure
        await executeQuery(`
          IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_CreateImportBatch')
          DROP PROCEDURE SP_CRM_CreateImportBatch
        `);

        // Create updated procedure with ImportPrice support and BatchID fallback
        await executeQuery(`
          CREATE PROCEDURE SP_CRM_CreateImportBatch
            @CategoryID INT,
            @ImportDate DATE,
            @TotalQuantity INT,
            @ImportPrice DECIMAL(18,2) = NULL,
            @TotalImportValue DECIMAL(18,2),
            @Notes NVARCHAR(1000) = NULL,
            @CreatedBy NVARCHAR(100) = 'system'
          AS
          BEGIN
            SET NOCOUNT ON;

            DECLARE @BatchCode NVARCHAR(50);
            DECLARE @BatchID INT;
            DECLARE @HasIdentity BIT;

            SET @BatchCode = 'LOT' + FORMAT(GETDATE(), 'yyyyMMddHHmmss');

            WHILE EXISTS(SELECT 1 FROM CRM_ImportBatches WHERE BatchCode = @BatchCode)
            BEGIN
              WAITFOR DELAY '00:00:01';
              SET @BatchCode = 'LOT' + FORMAT(GETDATE(), 'yyyyMMddHHmmss');
            END

            IF @ImportPrice IS NULL AND @TotalQuantity > 0
            BEGIN
              SET @ImportPrice = @TotalImportValue / @TotalQuantity;
            END

            SELECT @HasIdentity = CASE
              WHEN COLUMNPROPERTY(OBJECT_ID('CRM_ImportBatches'), 'BatchID', 'IsIdentity') = 1 THEN 1
              ELSE 0
            END;

            IF @HasIdentity = 0
            BEGIN
              SELECT @BatchID = ISNULL(MAX(BatchID), 0) + 1 FROM CRM_ImportBatches;

              INSERT INTO CRM_ImportBatches (
                BatchID,
                BatchCode,
                ImportDate,
                CategoryID,
                TotalQuantity,
                ImportPrice,
                TotalImportValue,
                TotalSoldQuantity,
                TotalSoldValue,
                Status,
                Notes,
                CreatedBy,
                CreatedAt,
                UpdatedAt
              )
              VALUES (
                @BatchID,
                @BatchCode,
                @ImportDate,
                @CategoryID,
                @TotalQuantity,
                @ImportPrice,
                @TotalImportValue,
                0,
                0,
                'ACTIVE',
                @Notes,
                @CreatedBy,
                GETDATE(),
                GETDATE()
              );
            END
            ELSE
            BEGIN
              INSERT INTO CRM_ImportBatches (
                BatchCode,
                ImportDate,
                CategoryID,
                TotalQuantity,
                ImportPrice,
                TotalImportValue,
                TotalSoldQuantity,
                TotalSoldValue,
                Status,
                Notes,
                CreatedBy,
                CreatedAt,
                UpdatedAt
              )
              VALUES (
                @BatchCode,
                @ImportDate,
                @CategoryID,
                @TotalQuantity,
                @ImportPrice,
                @TotalImportValue,
                0,
                0,
                'ACTIVE',
                @Notes,
                @CreatedBy,
                GETDATE(),
                GETDATE()
              );

              SET @BatchID = SCOPE_IDENTITY();
            END

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
            WHERE b.BatchID = @BatchID;
          END
        `);

        console.log('Procedure updated successfully, retrying batch creation...');

        // Retry with updated procedure
        result = await executeProcedure<ImportBatch>('SP_CRM_CreateImportBatch', {
          CategoryID: body.CategoryID,
          ImportDate: body.ImportDate,
          TotalQuantity: body.TotalQuantity,
          ImportPrice: importPrice,
          TotalImportValue: body.TotalImportValue,
          Notes: body.Notes || null,
          CreatedBy: 'system'
        });
      } catch (updateError) {
        console.error('Failed to update procedure and retry:', updateError);
        throw procError; // Throw original error
      }
    }

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
            DECLARE @HasIdentity BIT;
            DECLARE @ProductID INT;

            SELECT @HasIdentity = CASE
              WHEN COLUMNPROPERTY(OBJECT_ID('CRM_Products'), 'ProductID', 'IsIdentity') = 1 THEN 1
              ELSE 0
            END;

            IF @HasIdentity = 0
            BEGIN
              SELECT @ProductID = ISNULL(MAX(ProductID), 0) + 1 FROM CRM_Products;

              INSERT INTO CRM_Products (
                ProductID, BatchID, CategoryID, ProductName, IMEI, ImportPrice, Status, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @ProductID, @batchId, @categoryId, @productName, @productCode, @importPrice, 'IN_STOCK', @notes, GETDATE(), GETDATE()
              );
            END
            ELSE
            BEGIN
              INSERT INTO CRM_Products (
                BatchID, CategoryID, ProductName, IMEI, ImportPrice, Status, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @batchId, @categoryId, @productName, @productCode, @importPrice, 'IN_STOCK', @notes, GETDATE(), GETDATE()
              );
            END
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

    // Log chi tiết lỗi
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      body: body,
      timestamp: new Date().toISOString()
    };
    
    console.error('Import batch creation error details:', JSON.stringify(errorDetails, null, 2));

    // Handle specific SQL errors
    if (error instanceof Error) {
      // Lỗi category không tồn tại
      if (error.message.includes('Lô hàng không tồn tại')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Category not found',
            details: errorDetails.message,
            sqlError: error.message
          },
          { status: 404 }
        );
      }

      // Lỗi NULL constraint
      if (error.message.includes('Cannot insert the value NULL') || 
          error.message.includes('does not allow nulls')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database constraint violation',
            details: 'Cột BatchID không cho phép NULL. Vui lòng kiểm tra cấu trúc bảng CRM_ImportBatches có IDENTITY(1,1) trên cột BatchID.',
            sqlError: error.message,
            suggestion: 'Chạy: ALTER TABLE CRM_ImportBatches ALTER COLUMN BatchID INT NOT NULL; hoặc thêm IDENTITY nếu chưa có.'
          },
          { status: 500 }
        );
      }

      // Lỗi permission
      if (error.message.includes('permission') || 
          error.message.includes('denied') ||
          error.message.includes('CREATE PROCEDURE')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database permission error',
            details: 'User không có quyền DROP/CREATE PROCEDURE. Vui lòng chạy script database/procedures_v2.sql thủ công.',
            sqlError: error.message
          },
          { status: 500 }
        );
      }

      // Trả về lỗi chi tiết hơn cho các lỗi khác
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to create import batch',
          details: errorDetails.message,
          errorType: errorDetails.name,
          sqlError: error.message,
          requestBody: body ? {
            CategoryID: body.CategoryID,
            ImportDate: body.ImportDate,
            TotalQuantity: body.TotalQuantity,
            TotalImportValue: body.TotalImportValue
          } : null
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create import batch',
        details: 'Unknown error occurred'
      },
      { status: 500 }
    );
  }
}
