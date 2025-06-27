import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// POST /api/setup-cable-category - Thêm danh mục cáp sạc nếu chưa có
export async function POST(request: NextRequest) {
  try {
    // Kiểm tra xem danh mục "Cáp sạc" đã tồn tại chưa
    const existingCategory = await executeQuery(
      `SELECT CategoryID, CategoryName FROM CRM_Categories WHERE CategoryName LIKE '%cáp sạc%'`
    );

    if (existingCategory.length > 0) {
      return NextResponse.json({
        success: true,
        message: 'Cable category already exists',
        data: existingCategory[0]
      });
    }

    // Thêm danh mục "Cáp sạc"
    const result = await executeQuery(`
      INSERT INTO CRM_Categories (CategoryName, Description, IsActive, CreatedAt, UpdatedAt)
      OUTPUT INSERTED.*
      VALUES ('Cáp sạc', 'Các loại cáp sạc điện thoại', 1, GETDATE(), GETDATE())
    `);

    return NextResponse.json({
      success: true,
      message: 'Cable category created successfully',
      data: result[0]
    }, { status: 201 });

  } catch (error) {
    console.error('Error setting up cable category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to setup cable category' },
      { status: 500 }
    );
  }
}

// GET /api/setup-cable-category - Kiểm tra danh mục cáp sạc
export async function GET(request: NextRequest) {
  try {
    const cableCategory = await executeQuery(
      `SELECT CategoryID, CategoryName, Description FROM CRM_Categories WHERE CategoryName LIKE '%cáp sạc%'`
    );

    return NextResponse.json({
      success: true,
      data: cableCategory.length > 0 ? cableCategory[0] : null,
      exists: cableCategory.length > 0
    });

  } catch (error) {
    console.error('Error checking cable category:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check cable category' },
      { status: 500 }
    );
  }
}
