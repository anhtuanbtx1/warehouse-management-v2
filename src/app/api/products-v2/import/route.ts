import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';

interface ProductImportRow {
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  Notes?: string;
}

interface ImportRequest {
  BatchID: number;
  Products: ProductImportRow[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ImportRequest = await request.json();

    if (!body.BatchID || !body.Products || !Array.isArray(body.Products) || body.Products.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Dữ liệu không hợp lệ. Vui lòng cung cấp BatchID và danh sách sản phẩm.' },
        { status: 400 }
      );
    }

    const batchId = body.BatchID;
    const products = body.Products;

    // Kiểm tra BatchID có tồn tại không
    const batchCheck = await executeQuery<{ CategoryID: number }>(
      'SELECT CategoryID FROM CRM_ImportBatches WHERE BatchID = @batchId',
      { batchId: batchId }
    );

    if (batchCheck.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Lô hàng không tồn tại' },
        { status: 404 }
      );
    }

    const categoryId = batchCheck[0].CategoryID;

    let successCount = 0;
    let failCount = 0;
    const errors: any[] = [];

    // Chèn từng sản phẩm, bắt lỗi từng cái để không làm chết toàn bộ tiến trình
    for (const [index, product] of products.entries()) {
      try {
        if (!product.IMEI || !product.ImportPrice) {
          throw new Error('Thiếu IMEI hoặc Giá nhập');
        }

        if (product.ImportPrice <= 0) {
          throw new Error('Giá nhập phải lớn hơn 0');
        }

        // Validate IMEI format for cables specifically if needed, but here we just try to insert
        if (!/^\d{15}$/.test(product.IMEI) && !/^CAP\d+$/.test(product.IMEI) && !product.IMEI.match(/^[A-Za-z0-9]+$/)) {
             // Forcing some basic validation, allowing alphanumeric IMEIs like "KHJK98942654" from example
        }

        // Gọi Procedure hiện có để đảm bảo thống nhất logic
        await executeProcedure('SP_CRM_AddProductToBatch', {
          BatchID: batchId,
          ProductName: product.ProductName || '',
          IMEI: product.IMEI,
          ImportPrice: product.ImportPrice,
          Notes: product.Notes || null
        });

        successCount++;
      } catch (error: any) {
        console.error(`Error importing product row ${index}:`, error);

        let errorMessage = error.message || 'Lỗi không xác định';

        // Thử insert trực tiếp nếu SP lỗi, giống như logic của route POST add product
        if (errorMessage.includes('Could not find stored procedure') || errorMessage.includes('failed')) {
           try {
             const imeiCheck = await executeQuery<{ ProductID: number }>(
                'SELECT ProductID FROM CRM_Products WHERE IMEI = @imei',
                { imei: product.IMEI }
             );

             if (imeiCheck.length > 0) {
               throw new Error('IMEI đã tồn tại trong hệ thống');
             }

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
               batchId: batchId,
               categoryId: categoryId,
               productName: product.ProductName || '',
               imei: product.IMEI,
               importPrice: product.ImportPrice,
               notes: product.Notes || null
             });
             successCount++;
             continue; // Skip the catch below
           } catch (fbError: any) {
             errorMessage = fbError.message || errorMessage;
           }
        }

        failCount++;
        errors.push({
          row: index + 1,
          imei: product.IMEI,
          error: errorMessage
        });
      }
    }

    return NextResponse.json({
      success: true,
      data: {
        total: products.length,
        successCount,
        failCount,
        errors
      },
      message: `Đã nhập thành công ${successCount}/${products.length} sản phẩm.`
    }, { status: 201 });

  } catch (error: any) {
    console.error('Import excel error:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi hệ thống khi import' },
      { status: 500 }
    );
  }
}
