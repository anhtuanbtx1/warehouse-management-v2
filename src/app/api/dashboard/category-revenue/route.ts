import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get date from query params
    const searchParams = request.nextUrl.searchParams;
    const dateParam = searchParams.get('date');
    
    // Use today if no date provided
    const targetDate = dateParam ? new Date(dateParam) : new Date();
    const startDate = new Date(targetDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(targetDate);
    endDate.setHours(23, 59, 59, 999);

    const pool = await getConnection();
    
    // Query to get revenue by category for the specified date
    const result = await pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate)
      .query(`
        WITH CategoryRevenue AS (
          SELECT 
            c.CategoryID as categoryId,
            c.CategoryName as categoryName,
            COALESCE(SUM(p.SalePrice), 0) as revenue,
            COALESCE(COUNT(p.ProductID), 0) as salesCount,
            COALESCE(COUNT(p.ProductID), 0) as productCount
          FROM CRM_Categories c
          LEFT JOIN CRM_Products p ON c.CategoryID = p.CategoryID 
            AND p.Status = 'SOLD'
            AND p.SoldDate >= @startDate 
            AND p.SoldDate <= @endDate
          WHERE c.IsActive = 1
          GROUP BY c.CategoryID, c.CategoryName
        ),
        TotalRevenue AS (
          SELECT SUM(revenue) as total
          FROM CategoryRevenue
        )
        SELECT 
          cr.categoryId,
          cr.categoryName as category,
          cr.revenue,
          cr.salesCount as count,
          cr.productCount,
          CASE 
            WHEN tr.total > 0 THEN ROUND((cr.revenue * 100.0) / tr.total, 1)
            ELSE 0
          END as percentage
        FROM CategoryRevenue cr
        CROSS JOIN TotalRevenue tr
        WHERE cr.revenue > 0
        ORDER BY cr.revenue DESC
      `);

    // If no data, return categories with zero values
    if (result.recordset.length === 0) {
      const categoriesResult = await pool.request().query(`
        SELECT 
          CategoryID as categoryId,
          CategoryName as category,
          0 as revenue,
          0 as count,
          0 as productCount,
          0 as percentage
        FROM CRM_Categories
        WHERE IsActive = 1
        ORDER BY CategoryName
      `);
      
      return NextResponse.json({
        success: true,
        data: categoriesResult.recordset.slice(0, 5), // Return top 5 categories
        date: targetDate.toISOString().split('T')[0],
        message: 'No sales data for this date',
        total: 0
      }, {
        headers: {
          'Content-Type': 'application/json; charset=utf-8'
        }
      });
    }

    return NextResponse.json({
      success: true,
      data: result.recordset,
      date: targetDate.toISOString().split('T')[0],
      total: result.recordset.reduce((sum: number, item: any) => sum + item.revenue, 0)
    }, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8'
      }
    });

  } catch (error) {
    console.error('Error fetching category revenue:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category revenue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// API để lấy thống kê theo khoảng thời gian
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Query to get revenue by category for date range
    const result = await pool.request()
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate))
      .query(`
        WITH CategoryRevenue AS (
          SELECT 
            c.CategoryID as categoryId,
            c.CategoryName as categoryName,
            COALESCE(SUM(p.SalePrice), 0) as revenue,
            COALESCE(COUNT(p.ProductID), 0) as salesCount,
            COALESCE(COUNT(p.ProductID), 0) as productCount,
            COALESCE(AVG(p.SalePrice), 0) as avgOrderValue
          FROM CRM_Categories c
          LEFT JOIN CRM_Products p ON c.CategoryID = p.CategoryID
            AND p.Status = 'SOLD'
            AND p.SoldDate >= @startDate 
            AND p.SoldDate <= @endDate
          WHERE c.IsActive = 1
          GROUP BY c.CategoryID, c.CategoryName
        ),
        TotalRevenue AS (
          SELECT SUM(revenue) as total
          FROM CategoryRevenue
        )
        SELECT 
          cr.categoryId,
          cr.categoryName as category,
          cr.revenue,
          cr.salesCount,
          cr.productCount,
          cr.avgOrderValue,
          CASE 
            WHEN tr.total > 0 THEN ROUND((cr.revenue * 100.0) / tr.total, 1)
            ELSE 0
          END as percentage
        FROM CategoryRevenue cr
        CROSS JOIN TotalRevenue tr
        ORDER BY cr.revenue DESC
      `);

    // Cũng lấy top sản phẩm bán chạy theo danh mục
    const topProductsResult = await pool.request()
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate))
      .query(`
        SELECT TOP 5
          c.CategoryName as categoryName,
          p.ProductName as productName,
          p.IMEI as model,
          1 as salesCount,
          p.SalePrice as revenue
        FROM CRM_Products p
        JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        WHERE p.Status = 'SOLD'
          AND p.SoldDate >= @startDate 
          AND p.SoldDate <= @endDate
        ORDER BY p.SalePrice DESC
      `);

    return NextResponse.json({
      success: true,
      data: {
        categories: result.recordset,
        topProducts: topProductsResult.recordset,
        dateRange: {
          start: startDate,
          end: endDate
        },
        total: result.recordset.reduce((sum: number, item: any) => sum + item.revenue, 0)
      }
    });

  } catch (error) {
    console.error('Error fetching category revenue range:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch category revenue data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
