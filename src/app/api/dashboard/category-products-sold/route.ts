import { NextRequest, NextResponse } from 'next/server';
import { getConnection, sql } from '@/lib/database';

// GET /api/dashboard/category-products-sold
// Lấy chi tiết sản phẩm đã bán theo danh mục
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const categoryId = searchParams.get('categoryId');
    const dateParam = searchParams.get('date');
    const startDateParam = searchParams.get('startDate');
    const endDateParam = searchParams.get('endDate');
    
    let startDate: Date;
    let endDate: Date;
    
    if (startDateParam && endDateParam) {
      startDate = new Date(startDateParam);
      endDate = new Date(endDateParam);
    } else {
      const targetDate = dateParam ? new Date(dateParam) : new Date();
      startDate = new Date(targetDate);
      startDate.setHours(0, 0, 0, 0);
      endDate = new Date(targetDate);
      endDate.setHours(23, 59, 59, 999);
    }

    const pool = await getConnection();
    
    let query = `
      SELECT 
        p.ProductID as productId,
        p.ProductName as productName,
        p.IMEI as imei,
        c.CategoryID as categoryId,
        c.CategoryName as categoryName,
        p.ImportPrice as importPrice,
        p.SalePrice as salePrice,
        (p.SalePrice - p.ImportPrice) as profit,
        p.SoldDate as soldDate,
        p.CustomerInfo as customerInfo,
        p.InvoiceNumber as invoiceNumber,
        b.BatchCode as batchCode
      FROM CRM_Products p
      INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      WHERE p.Status = 'SOLD'
        AND p.SoldDate >= @startDate 
        AND p.SoldDate <= @endDate
    `;
    
    const request = pool.request()
      .input('startDate', sql.DateTime, startDate)
      .input('endDate', sql.DateTime, endDate);
    
    if (categoryId && categoryId !== 'all') {
      query += ' AND c.CategoryID = @categoryId';
      request.input('categoryId', sql.Int, parseInt(categoryId));
    }
    
    query += ' ORDER BY p.SoldDate DESC';
    
    const result = await request.query(query);
    
    // Tính tổng thống kê
    const stats = {
      totalRevenue: 0,
      totalProfit: 0,
      totalCost: 0,
      totalProducts: result.recordset.length,
      byCategory: {} as any
    };
    
    result.recordset.forEach((product: any) => {
      stats.totalRevenue += product.salePrice || 0;
      stats.totalCost += product.importPrice || 0;
      stats.totalProfit += product.profit || 0;
      
      // Thống kê theo danh mục
      if (!stats.byCategory[product.categoryName]) {
        stats.byCategory[product.categoryName] = {
          count: 0,
          revenue: 0,
          profit: 0,
          categoryId: product.categoryId
        };
      }
      stats.byCategory[product.categoryName].count++;
      stats.byCategory[product.categoryName].revenue += product.salePrice || 0;
      stats.byCategory[product.categoryName].profit += product.profit || 0;
    });

    return NextResponse.json({
      success: true,
      data: result.recordset,
      stats: stats,
      dateRange: {
        start: startDate.toISOString(),
        end: endDate.toISOString()
      }
    });

  } catch (error) {
    console.error('Error fetching sold products by category:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch sold products data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/dashboard/category-products-sold
// Lấy thống kê chi tiết với filter
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { startDate, endDate, categoryIds, includeDetails = true } = body;

    if (!startDate || !endDate) {
      return NextResponse.json(
        { success: false, error: 'Start date and end date are required' },
        { status: 400 }
      );
    }

    const pool = await getConnection();
    
    // Query thống kê tổng hợp
    let summaryQuery = `
      SELECT 
        c.CategoryID as categoryId,
        c.CategoryName as categoryName,
        COUNT(p.ProductID) as productCount,
        COALESCE(SUM(p.SalePrice), 0) as totalRevenue,
        COALESCE(SUM(p.ImportPrice), 0) as totalCost,
        COALESCE(SUM(p.SalePrice - p.ImportPrice), 0) as totalProfit,
        COALESCE(AVG(p.SalePrice), 0) as avgSalePrice,
        COALESCE(MIN(p.SalePrice), 0) as minSalePrice,
        COALESCE(MAX(p.SalePrice), 0) as maxSalePrice
      FROM CRM_Categories c
      LEFT JOIN CRM_Products p ON c.CategoryID = p.CategoryID
        AND p.Status = 'SOLD'
        AND p.SoldDate >= @startDate 
        AND p.SoldDate <= @endDate
      WHERE c.IsActive = 1
    `;
    
    const summaryRequest = pool.request()
      .input('startDate', sql.DateTime, new Date(startDate))
      .input('endDate', sql.DateTime, new Date(endDate));
    
    if (categoryIds && categoryIds.length > 0) {
      summaryQuery += ` AND c.CategoryID IN (${categoryIds.map(() => '?').join(',')})`;
      categoryIds.forEach((id: number, index: number) => {
        summaryRequest.input(`categoryId${index}`, sql.Int, id);
        summaryQuery = summaryQuery.replace('?', `@categoryId${index}`);
      });
    }
    
    summaryQuery += ' GROUP BY c.CategoryID, c.CategoryName ORDER BY totalRevenue DESC';
    
    const summaryResult = await summaryRequest.query(summaryQuery);
    
    let detailsResult = null;
    
    if (includeDetails) {
      // Query chi tiết sản phẩm
      let detailsQuery = `
        SELECT TOP 100
          p.ProductID as productId,
          p.ProductName as productName,
          p.IMEI as imei,
          c.CategoryName as categoryName,
          p.ImportPrice as importPrice,
          p.SalePrice as salePrice,
          (p.SalePrice - p.ImportPrice) as profit,
          ROUND(((p.SalePrice - p.ImportPrice) * 100.0 / NULLIF(p.ImportPrice, 0)), 2) as profitMargin,
          p.SoldDate as soldDate,
          p.CustomerInfo as customerInfo,
          b.BatchCode as batchCode
        FROM CRM_Products p
        INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
        WHERE p.Status = 'SOLD'
          AND p.SoldDate >= @startDate 
          AND p.SoldDate <= @endDate
      `;
      
      const detailsRequest = pool.request()
        .input('startDate', sql.DateTime, new Date(startDate))
        .input('endDate', sql.DateTime, new Date(endDate));
      
      if (categoryIds && categoryIds.length > 0) {
        detailsQuery += ` AND c.CategoryID IN (${categoryIds.map((_, i: number) => `@categoryId${i}`).join(',')})`;
        categoryIds.forEach((id: number, index: number) => {
          detailsRequest.input(`categoryId${index}`, sql.Int, id);
        });
      }
      
      detailsQuery += ' ORDER BY p.SoldDate DESC';
      
      detailsResult = await detailsRequest.query(detailsQuery);
    }

    return NextResponse.json({
      success: true,
      data: {
        summary: summaryResult.recordset,
        details: detailsResult ? detailsResult.recordset : null,
        dateRange: {
          start: startDate,
          end: endDate
        },
        totalStats: {
          totalRevenue: summaryResult.recordset.reduce((sum: number, item: any) => sum + item.totalRevenue, 0),
          totalProfit: summaryResult.recordset.reduce((sum: number, item: any) => sum + item.totalProfit, 0),
          totalProducts: summaryResult.recordset.reduce((sum: number, item: any) => sum + item.productCount, 0),
          totalCategories: summaryResult.recordset.filter((item: any) => item.productCount > 0).length
        }
      }
    });

  } catch (error) {
    console.error('Error fetching category products statistics:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to fetch statistics',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
