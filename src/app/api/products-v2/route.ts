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
      let result: ProductV2[] = [];

      try {
        result = await executeProcedure<ProductV2>('SP_CRM_GetAvailableProducts', {
          CategoryID: categoryId ? parseInt(categoryId) : null,
          SearchTerm: search || null
        });
      } catch (procError) {
        console.error('SP_CRM_GetAvailableProducts failed, attempting to update procedure:', procError);

        try {
          await executeQuery(`
            IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_GetAvailableProducts')
            DROP PROCEDURE SP_CRM_GetAvailableProducts
          `);

          await executeQuery(`
            CREATE PROCEDURE SP_CRM_GetAvailableProducts
              @CategoryID INT = NULL,
              @SearchTerm NVARCHAR(255) = NULL
            AS
            BEGIN
              SET NOCOUNT ON;

              SELECT
                p.ProductID,
                p.BatchID,
                p.CategoryID,
                p.ProductName,
                p.IMEI,
                p.ImportPrice,
                p.SalePrice,
                p.Status,
                p.SoldDate,
                p.InvoiceNumber,
                p.CustomerInfo,
                p.Notes,
                p.CreatedAt,
                p.UpdatedAt,
                c.CategoryName,
                b.BatchCode,
                b.ImportDate
              FROM CRM_Products p
              INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
              INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
              WHERE
                p.Status = 'IN_STOCK'
                AND c.CategoryName NOT LIKE '%cáp%'
                AND c.CategoryName NOT LIKE '%cap%'
                AND c.CategoryName NOT LIKE '%Cáp%'
                AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
                AND (@SearchTerm IS NULL OR
                     p.ProductName LIKE '%' + @SearchTerm + '%' OR
                     p.IMEI LIKE '%' + @SearchTerm + '%')
              ORDER BY p.CreatedAt DESC;
            END
          `);

          console.log('SP_CRM_GetAvailableProducts updated successfully, retrying...');

          result = await executeProcedure<ProductV2>('SP_CRM_GetAvailableProducts', {
            CategoryID: categoryId ? parseInt(categoryId) : null,
            SearchTerm: search || null
          });
        } catch (updateError) {
          console.error('Failed to update SP_CRM_GetAvailableProducts, fallback to direct query:', updateError);

          // Fallback khi procedure chưa được cập nhật hoặc không tồn tại
          let fallbackWhereClause = `WHERE p.Status = 'IN_STOCK'
            AND c.CategoryName NOT LIKE '%cáp%'
            AND c.CategoryName NOT LIKE '%cap%'
            AND c.CategoryName NOT LIKE '%Cáp%'`;
          const fallbackParams: any = {};

          if (categoryId) {
            fallbackWhereClause += ' AND p.CategoryID = @categoryId';
            fallbackParams.categoryId = parseInt(categoryId);
          }

          if (search) {
            fallbackWhereClause += ' AND (p.ProductName LIKE @search OR p.IMEI LIKE @search)';
            fallbackParams.search = `%${search}%`;
          }

          const fallbackQuery = `
            SELECT
              p.ProductID,
              p.BatchID,
              p.CategoryID,
              p.ProductName,
              p.IMEI,
              p.ImportPrice,
              p.SalePrice,
              p.Status,
              p.SoldDate,
              p.InvoiceNumber,
              p.CustomerInfo,
              p.Notes,
              p.CreatedAt,
              p.UpdatedAt,
              c.CategoryName,
              b.BatchCode,
              b.ImportDate
            FROM CRM_Products p
            INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
            INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
            ${fallbackWhereClause}
            ORDER BY p.CreatedAt DESC
          `;

          result = await executeQuery<ProductV2>(fallbackQuery, fallbackParams);
        }
      }

      // Phân trang thủ công cho stored procedure hoặc fallback query
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
    
    // Log chi tiết lỗi
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('Products fetch error details:', JSON.stringify(errorDetails, null, 2));
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch products',
        details: errorDetails.message,
        errorType: errorDetails.name
      },
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

    // Validate IMEI/Product Code format
    // Cho phép IMEI 15 số hoặc mã sản phẩm bắt đầu bằng CAP cho cáp sạc
    if (!/^\d{15}$/.test(body.IMEI) && !/^CAP\d+$/.test(body.IMEI)) {
      return NextResponse.json(
        { success: false, error: 'IMEI must be 15 digits or product code starting with CAP for cables' },
        { status: 400 }
      );
    }

    // Thêm sản phẩm bằng stored procedure
    let result: ProductV2[];
    
    try {
      result = await executeProcedure<ProductV2>('SP_CRM_AddProductToBatch', {
        BatchID: body.BatchID,
        ProductName: body.ProductName,
        IMEI: body.IMEI,
        ImportPrice: body.ImportPrice,
        Notes: body.Notes || null
      });
    } catch (procError) {
      console.error('SP_CRM_AddProductToBatch failed, attempting to update procedure:', procError);

      // Thử cập nhật procedure rồi thử lại
      try {
        // Drop existing procedure
        await executeQuery(`
          IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_AddProductToBatch')
          DROP PROCEDURE SP_CRM_AddProductToBatch
        `);

        // Create updated procedure with ProductID fallback
        await executeQuery(`
          CREATE PROCEDURE SP_CRM_AddProductToBatch
            @BatchID INT,
            @ProductName NVARCHAR(200),
            @IMEI NVARCHAR(50),
            @ImportPrice DECIMAL(18,2),
            @Notes NVARCHAR(500) = NULL
          AS
          BEGIN
            SET NOCOUNT ON;

            DECLARE @CategoryID INT;
            DECLARE @ProductID INT;
            DECLARE @HasIdentity BIT;

            SELECT @CategoryID = CategoryID
            FROM CRM_ImportBatches
            WHERE BatchID = @BatchID;

            IF @CategoryID IS NULL
            BEGIN
              RAISERROR('Lô hàng không tồn tại', 16, 1);
              RETURN;
            END

            IF EXISTS(SELECT 1 FROM CRM_Products WHERE IMEI = @IMEI)
            BEGIN
              RAISERROR('IMEI đã tồn tại trong hệ thống', 16, 1);
              RETURN;
            END

            SELECT @HasIdentity = CASE WHEN COLUMNPROPERTY(OBJECT_ID('CRM_Products'), 'ProductID', 'IsIdentity') = 1 THEN 1 ELSE 0 END;

            IF @HasIdentity = 0
            BEGIN
              SELECT @ProductID = ISNULL(MAX(ProductID), 0) + 1 FROM CRM_Products;

              INSERT INTO CRM_Products (
                ProductID, BatchID, CategoryID, ProductName, IMEI, ImportPrice, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @ProductID, @BatchID, @CategoryID, @ProductName, @IMEI, @ImportPrice, @Notes, GETDATE(), GETDATE()
              );
            END
            ELSE
            BEGIN
              INSERT INTO CRM_Products (
                BatchID, CategoryID, ProductName, IMEI, ImportPrice, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @BatchID, @CategoryID, @ProductName, @IMEI, @ImportPrice, @Notes, GETDATE(), GETDATE()
              );

              SET @ProductID = SCOPE_IDENTITY();
            END

            SELECT * FROM CRM_Products WHERE ProductID = @ProductID;
          END
        `);

        console.log('SP_CRM_AddProductToBatch updated successfully, retrying...');

        // Retry with updated procedure
        result = await executeProcedure<ProductV2>('SP_CRM_AddProductToBatch', {
          BatchID: body.BatchID,
          ProductName: body.ProductName,
          IMEI: body.IMEI,
          ImportPrice: body.ImportPrice,
          Notes: body.Notes || null
        });
      } catch (updateError) {
        console.error('Failed to update procedure, attempting direct fallback:', updateError);

        // Fallback cuối: Insert trực tiếp với xử lý ProductID
        try {
          // Kiểm tra BatchID có tồn tại không
          const batchCheck = await executeQuery<{ CategoryID: number }>(
            'SELECT CategoryID FROM CRM_ImportBatches WHERE BatchID = @batchId',
            { batchId: body.BatchID }
          );

          if (batchCheck.length === 0) {
            return NextResponse.json(
              { success: false, error: 'Batch not found' },
              { status: 404 }
            );
          }

          const categoryId = batchCheck[0].CategoryID;

          // Kiểm tra IMEI đã tồn tại chưa
          const imeiCheck = await executeQuery<{ ProductID: number }>(
            'SELECT ProductID FROM CRM_Products WHERE IMEI = @imei',
            { imei: body.IMEI }
          );

          if (imeiCheck.length > 0) {
            return NextResponse.json(
              { success: false, error: 'IMEI đã tồn tại' },
              { status: 400 }
            );
          }

          // Insert với xử lý ProductID IDENTITY
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
                ProductID, BatchID, CategoryID, ProductName, IMEI, ImportPrice, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @ProductID, @batchId, @categoryId, @productName, @imei, @importPrice, @notes, GETDATE(), GETDATE()
              );
            END
            ELSE
            BEGIN
              INSERT INTO CRM_Products (
                BatchID, CategoryID, ProductName, IMEI, ImportPrice, Notes, CreatedAt, UpdatedAt
              )
              VALUES (
                @batchId, @categoryId, @productName, @imei, @importPrice, @notes, GETDATE(), GETDATE()
              );
            END
          `, {
            batchId: body.BatchID,
            categoryId: categoryId,
            productName: body.ProductName,
            imei: body.IMEI,
            importPrice: body.ImportPrice,
            notes: body.Notes || null
          });

          // Lấy sản phẩm vừa tạo
          result = await executeQuery<ProductV2>(
            'SELECT TOP 1 p.*, c.CategoryName, b.BatchCode, b.ImportDate FROM CRM_Products p LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID WHERE p.IMEI = @imei ORDER BY p.ProductID DESC',
            { imei: body.IMEI }
          );
        } catch (fallbackError) {
          console.error('Direct fallback also failed:', fallbackError);
          throw procError; // Throw original error
        }
      }
    }

    const response: ApiResponse<ProductV2> = {
      success: true,
      data: result[0],
      message: 'Product added to batch successfully'
    };

    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error adding product to batch:', error);

    // Log chi tiết lỗi
    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    };
    
    console.error('Add product error details:', JSON.stringify(errorDetails, null, 2));

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

      // Lỗi NULL constraint
      if (error.message.includes('Cannot insert the value NULL') || 
          error.message.includes('does not allow nulls')) {
        return NextResponse.json(
          { 
            success: false, 
            error: 'Database constraint violation',
            details: 'Cột ProductID không cho phép NULL. Vui lòng kiểm tra cấu trúc bảng CRM_Products có IDENTITY(1,1) trên cột ProductID.',
            sqlError: error.message,
            suggestion: 'Chạy: ALTER TABLE CRM_Products ALTER COLUMN ProductID INT NOT NULL; hoặc thêm IDENTITY nếu chưa có.'
          },
          { status: 500 }
        );
      }

      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to add product to batch',
          details: errorDetails.message,
          errorType: errorDetails.name
        },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to add product to batch' },
      { status: 500 }
    );
  }
}
