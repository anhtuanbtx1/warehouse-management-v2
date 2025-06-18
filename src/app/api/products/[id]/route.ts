import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { Product, ProductForm, ApiResponse } from '@/types/warehouse';

// GET /api/products/[id] - Lấy thông tin sản phẩm theo ID
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    const query = `
      SELECT
        p.*,
        c.CategoryName,
        u.UnitName,
        u.UnitSymbol
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_Units u ON p.UnitID = u.UnitID
      WHERE p.ProductID = @productId
    `;
    
    const result = await executeQuery<Product>(query, { productId });
    
    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }
    
    const response: ApiResponse<Product> = {
      success: true,
      data: result[0]
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch product' },
      { status: 500 }
    );
  }
}

// PUT /api/products/[id] - Cập nhật sản phẩm
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    const body: ProductForm = await request.json();
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Validate required fields
    if (!body.ProductCode || !body.ProductName || !body.CategoryID || !body.UnitID) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const existingProduct = await executeQuery(
      'SELECT ProductID FROM CRM_Products WHERE ProductID = @productId',
      { productId }
    );

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product code already exists (excluding current product)
    const duplicateProduct = await executeQuery(
      'SELECT ProductID FROM CRM_Products WHERE ProductCode = @productCode AND ProductID != @productId',
      { productCode: body.ProductCode, productId }
    );

    if (duplicateProduct.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Product code already exists' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE CRM_Products SET
        ProductCode = @productCode,
        ProductName = @productName,
        CategoryID = @categoryId,
        UnitID = @unitId,
        Description = @description,
        CostPrice = @costPrice,
        SalePrice = @salePrice,
        MinStock = @minStock,
        MaxStock = @maxStock,
        ImageUrl = @imageUrl,
        Barcode = @barcode,
        UpdatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE ProductID = @productId
    `;
    
    const queryParams = {
      productId,
      productCode: body.ProductCode,
      productName: body.ProductName,
      categoryId: body.CategoryID,
      unitId: body.UnitID,
      description: body.Description || null,
      costPrice: body.CostPrice || 0,
      salePrice: body.SalePrice || 0,
      minStock: body.MinStock || 0,
      maxStock: body.MaxStock || 0,
      imageUrl: body.ImageUrl || null,
      barcode: body.Barcode || null
    };
    
    const result = await executeQuery<Product>(updateQuery, queryParams);
    
    const response: ApiResponse<Product> = {
      success: true,
      data: result[0],
      message: 'Product updated successfully'
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update product' },
      { status: 500 }
    );
  }
}

// DELETE /api/products/[id] - Xóa sản phẩm (soft delete)
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const productId = parseInt(params.id);
    
    if (isNaN(productId)) {
      return NextResponse.json(
        { success: false, error: 'Invalid product ID' },
        { status: 400 }
      );
    }
    
    // Check if product exists
    const existingProduct = await executeQuery(
      'SELECT ProductID FROM CRM_Products WHERE ProductID = @productId',
      { productId }
    );

    if (existingProduct.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Product not found' },
        { status: 404 }
      );
    }

    // Check if product is used in any orders
    const usageCheck = await executeQuery(`
      SELECT COUNT(*) as count FROM (
        SELECT ProductID FROM CRM_ImportOrderDetails WHERE ProductID = @productId
        UNION ALL
        SELECT ProductID FROM CRM_ExportOrderDetails WHERE ProductID = @productId
      ) as usage
    `, { productId });

    if (usageCheck[0]?.count > 0) {
      // Soft delete - just mark as inactive
      await executeQuery(
        'UPDATE CRM_Products SET IsActive = 0, UpdatedAt = GETDATE() WHERE ProductID = @productId',
        { productId }
      );

      return NextResponse.json({
        success: true,
        message: 'Product deactivated successfully (product is used in orders)'
      });
    } else {
      // Hard delete if not used
      await executeQuery(
        'DELETE FROM CRM_Products WHERE ProductID = @productId',
        { productId }
      );

      return NextResponse.json({
        success: true,
        message: 'Product deleted successfully'
      });
    }
  } catch (error) {
    console.error('Error deleting product:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete product' },
      { status: 500 }
    );
  }
}
