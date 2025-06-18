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

// GET /api/categories - Lấy danh sách categories
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const isActive = searchParams.get('isActive');
    
    let whereClause = 'WHERE 1=1';
    const params: any = {};
    
    if (isActive !== null) {
      whereClause += ' AND IsActive = @isActive';
      params.isActive = isActive === 'true';
    }
    
    const query = `
      SELECT 
        CategoryID,
        CategoryName,
        Description,
        IsActive,
        CreatedAt,
        UpdatedAt
      FROM CRM_Categories
      ${whereClause}
      ORDER BY CategoryName
    `;
    
    const categories = await executeQuery<Category>(query, params);
    
    const response: ApiResponse<Category[]> = {
      success: true,
      data: categories
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch categories',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/categories - Tạo category mới
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate required fields
    if (!body.CategoryName) {
      return NextResponse.json(
        { success: false, error: 'CategoryName is required' },
        { status: 400 }
      );
    }
    
    // Check if category name already exists
    const existingCategory = await executeQuery(
      'SELECT CategoryID FROM CRM_Categories WHERE CategoryName = @categoryName',
      { categoryName: body.CategoryName }
    );
    
    if (existingCategory.length > 0) {
      return NextResponse.json(
        { success: false, error: 'Category name already exists' },
        { status: 400 }
      );
    }
    
    const insertQuery = `
      INSERT INTO CRM_Categories (CategoryName, Description)
      OUTPUT INSERTED.*
      VALUES (@categoryName, @description)
    `;
    
    const params = {
      categoryName: body.CategoryName,
      description: body.Description || null
    };
    
    const result = await executeQuery<Category>(insertQuery, params);
    
    const response: ApiResponse<Category> = {
      success: true,
      data: result[0],
      message: 'Category created successfully'
    };
    
    return NextResponse.json(response, { status: 201 });
  } catch (error) {
    console.error('Error creating category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to create category',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
