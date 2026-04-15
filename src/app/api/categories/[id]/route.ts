import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
  IsActive: boolean;
  CreatedAt: string;
  UpdatedAt: string;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    const body = await request.json();

    if (!body.CategoryName) {
      return NextResponse.json(
        { success: false, error: 'CategoryName is required' },
        { status: 400 }
      );
    }

    // Check existing category by ID
    const existingCategoryById = await executeQuery(
      'SELECT CategoryID FROM CRM_Categories WHERE CategoryID = @id',
      { id }
    );

    if (existingCategoryById.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    // Check if name exists in other records
    const existingCategoryByName = await executeQuery(
      'SELECT CategoryID FROM CRM_Categories WHERE CategoryName = @categoryName AND CategoryID != @id',
      { categoryName: body.CategoryName, id }
    );

    if (existingCategoryByName.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Category name already exists' },
        { status: 400 }
      );
    }

    const updateQuery = `
      UPDATE CRM_Categories
      SET 
        CategoryName = @categoryName,
        Description = @description,
        IsActive = @isActive,
        UpdatedAt = GETDATE()
      OUTPUT INSERTED.*
      WHERE CategoryID = @id
    `;

    const queryParams = {
      id,
      categoryName: body.CategoryName,
      description: body.Description || null,
      isActive: body.IsActive !== undefined ? body.IsActive : true
    };

    const result = await executeQuery<Category>(updateQuery, queryParams);

    const response: ApiResponse<Category> = {
      success: true,
      data: result[0],
      message: 'Category updated successfully'
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error('Error updating category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const id = parseInt(params.id);
    if (isNaN(id)) {
      return NextResponse.json(
        { success: false, error: 'Invalid ID format' },
        { status: 400 }
      );
    }

    // Check if category is used in products/batches before delete
    // If it's used, we might only allow 'deactivating' it rather than hard delete.
    const usedInBatches = await executeQuery(
      'SELECT TOP 1 BatchID FROM CRM_InventoryBatches WHERE CategoryID = @id',
      { id }
    );
    
    const usedInProducts = await executeQuery(
      'SELECT TOP 1 ProductID FROM CRM_Products WHERE CategoryID = @id',
      { id }
    );

    if (usedInBatches.length > 0 || usedInProducts.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Cannot delete category because it is being used in batches or products. Consider deactivating it instead.' },
        { status: 400 }
      );
    }

    const deleteQuery = `
      DELETE FROM CRM_Categories
      OUTPUT DELETED.CategoryID
      WHERE CategoryID = @id
    `;

    const result = await executeQuery(deleteQuery, { id });

    if (result.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Category not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Category deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting category:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to delete category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
