import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import sql from 'mssql';

// PUT - Update product (only for IN_STOCK products)
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    console.log('PUT request received for product ID:', params.id);

    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'ID sản phẩm không hợp lệ' },
        { status: 400 }
      );
    }

    const body = await request.json();
    console.log('Request body:', body);

    const { ProductName, IMEI, ImportPrice, Notes } = body;

    // Validation
    if (!ProductName || !IMEI || !ImportPrice) {
      return NextResponse.json(
        { success: false, error: 'Thiếu thông tin bắt buộc' },
        { status: 400 }
      );
    }

    if (isNaN(parseFloat(ImportPrice)) || parseFloat(ImportPrice) <= 0) {
      return NextResponse.json(
        { success: false, error: 'Giá nhập phải là số dương' },
        { status: 400 }
      );
    }

    console.log('Connecting to database...');
    const pool = await getConnection();
    console.log('Database connected successfully');

    // Check if product exists and is IN_STOCK
    console.log('Checking if product exists with ID:', productId);
    const checkResult = await pool.request()
      .input('ProductID', sql.Int, productId)
      .query(`
        SELECT ProductID, Status, ProductName, IMEI
        FROM CRM_Products
        WHERE ProductID = @ProductID
      `);

    console.log('Check result:', checkResult.recordset);

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sản phẩm không tồn tại' },
        { status: 404 }
      );
    }

    const existingProduct = checkResult.recordset[0];
    if (existingProduct.Status !== 'IN_STOCK') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Chỉ có thể chỉnh sửa sản phẩm có trạng thái "Còn hàng". Trạng thái hiện tại: ${existingProduct.Status}` 
        },
        { status: 400 }
      );
    }

    // Check if IMEI is unique (excluding current product)
    const imeiCheckResult = await pool.request()
      .input('IMEI', sql.NVarChar(50), IMEI)
      .input('ProductID', sql.Int, productId)
      .query(`
        SELECT ProductID, ProductName 
        FROM CRM_Products 
        WHERE IMEI = @IMEI AND ProductID != @ProductID
      `);

    if (imeiCheckResult.recordset.length > 0) {
      const conflictProduct = imeiCheckResult.recordset[0];
      return NextResponse.json(
        { 
          success: false, 
          error: `IMEI "${IMEI}" đã được sử dụng cho sản phẩm "${conflictProduct.ProductName}" (ID: ${conflictProduct.ProductID})` 
        },
        { status: 400 }
      );
    }

    // Update product
    const updateResult = await pool.request()
      .input('ProductID', sql.Int, productId)
      .input('ProductName', sql.NVarChar(255), ProductName)
      .input('IMEI', sql.NVarChar(50), IMEI)
      .input('ImportPrice', sql.Decimal(18, 2), parseFloat(ImportPrice))
      .input('Notes', sql.NVarChar(500), Notes || null)
      .query(`
        UPDATE CRM_Products 
        SET 
          ProductName = @ProductName,
          IMEI = @IMEI,
          ImportPrice = @ImportPrice,
          Notes = @Notes,
          UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID AND Status = 'IN_STOCK'
      `);

    if (updateResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Không thể cập nhật sản phẩm' },
        { status: 400 }
      );
    }

    // Get updated product info
    const updatedResult = await pool.request()
      .input('ProductID', sql.Int, productId)
      .query(`
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
        LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
        WHERE p.ProductID = @ProductID
      `);

    return NextResponse.json({
      success: true,
      message: 'Cập nhật sản phẩm thành công',
      data: updatedResult.recordset[0]
    });

  } catch (error) {
    console.error('Error updating product:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi cập nhật sản phẩm' },
      { status: 500 }
    );
  }
}

// GET - Get single product details
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'ID sản phẩm không hợp lệ' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    const result = await pool.request()
      .input('ProductID', sql.Int, productId)
      .query(`
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
        LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
        WHERE p.ProductID = @ProductID
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sản phẩm không tồn tại' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: result.recordset[0]
    });

  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi lấy thông tin sản phẩm' },
      { status: 500 }
    );
  }
}

// DELETE - Delete product (only IN_STOCK products)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'ID sản phẩm không hợp lệ' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Check if product exists and is IN_STOCK
    const checkResult = await pool.request()
      .input('ProductID', sql.Int, productId)
      .query(`
        SELECT ProductID, Status, ProductName 
        FROM CRM_Products 
        WHERE ProductID = @ProductID
      `);

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Sản phẩm không tồn tại' },
        { status: 404 }
      );
    }

    const product = checkResult.recordset[0];
    if (product.Status !== 'IN_STOCK') {
      return NextResponse.json(
        { 
          success: false, 
          error: `Chỉ có thể xóa sản phẩm có trạng thái "Còn hàng". Trạng thái hiện tại: ${product.Status}` 
        },
        { status: 400 }
      );
    }

    // Delete product
    const deleteResult = await pool.request()
      .input('ProductID', sql.Int, productId)
      .query(`
        DELETE FROM CRM_Products 
        WHERE ProductID = @ProductID AND Status = 'IN_STOCK'
      `);

    if (deleteResult.rowsAffected[0] === 0) {
      return NextResponse.json(
        { success: false, error: 'Không thể xóa sản phẩm' },
        { status: 400 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `Đã xóa sản phẩm "${product.ProductName}" thành công`
    });

  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi xóa sản phẩm' },
      { status: 500 }
    );
  }
}
