import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getVietnamToday, getVietnamYesterday, getVietnamCurrentMonth } from '@/lib/timezone';

// Disable caching for this API route
export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface DashboardStats {
  revenue: {
    today: number;       // Doanh thu hôm nay
    thisMonth: number;
    thisYear: number;
    growth: number;
  };
  profit: {
    today: number;       // Lợi nhuận hôm nay
    thisMonth: number;
    thisYear: number;
    margin: number;
  };
  inventory: {
    totalProducts: number;
    inStock: number;
    sold: number;
    lowStock: number;
  };
  sales: {
    todayCount: number;     // Số đơn hôm nay
    thisMonthCount: number;
    avgOrderValue: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    // Use timezone utilities to get Vietnam dates
    // This ensures correct timezone handling regardless of server timezone (UTC on Vercel)
    const today = getVietnamToday();
    const yesterday = getVietnamYesterday();
    const currentMonth = getVietnamCurrentMonth();
    const { year: thisYear, month: thisMonth } = currentMonth;

    console.log('Dashboard Stats - Timezone Debug:', {
      serverTime: new Date().toISOString(),
      vietnamToday: today,
      yesterday: yesterday,
      thisYear,
      thisMonth,
      currentMonth: currentMonth,
      environment: process.env.NODE_ENV || 'development',
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      vercelRegion: process.env.VERCEL_REGION || 'local',
      note: 'Using Vietnam timezone utilities for consistent date handling'
    });

    // Revenue statistics - Use CRM_SalesInvoices with Vietnam timezone handling
    const revenueStats = await executeQuery(`
      SELECT
        -- Doanh thu hôm nay - Database stores Vietnam time, compare directly with Vietnam date
        ISNULL(SUM(CASE
          WHEN CAST(DATEADD(HOUR, 0, i.SaleDate) AS DATE) = @today
          THEN i.FinalAmount ELSE 0 END), 0) as todayRevenue,
        ISNULL(SUM(CASE
          WHEN YEAR(DATEADD(HOUR, 0, i.SaleDate)) = @thisYear
          AND MONTH(DATEADD(HOUR, 0, i.SaleDate)) = @thisMonth
          THEN i.FinalAmount ELSE 0 END), 0) as monthRevenue,
        ISNULL(SUM(CASE
          WHEN YEAR(DATEADD(HOUR, 0, i.SaleDate)) = @thisYear
          THEN i.FinalAmount ELSE 0 END), 0) as yearRevenue,
        -- Doanh thu hôm qua để tính growth
        ISNULL(SUM(CASE
          WHEN CAST(DATEADD(HOUR, 0, i.SaleDate) AS DATE) = @yesterday
          THEN i.FinalAmount ELSE 0 END), 0) as yesterdayRevenue,
        -- Count invoices for today
        COUNT(CASE
          WHEN CAST(DATEADD(HOUR, 0, i.SaleDate) AS DATE) = @today
          THEN 1 END) as todayCount
      FROM CRM_SalesInvoices i
      WHERE i.SaleDate IS NOT NULL
    `, { today, yesterday, thisMonth, thisYear });

    // Profit Statistics - Use invoice details with Vietnam timezone handling
    const profitStats = await executeQuery(`
      SELECT
        -- Lợi nhuận hôm nay - Database stores Vietnam time, compare directly
        ISNULL(SUM(CASE
          WHEN CAST(DATEADD(HOUR, 0, i.SaleDate) AS DATE) = @today
          THEN (d.SalePrice - p.ImportPrice) ELSE 0 END), 0) as todayProfit,
        ISNULL(SUM(CASE
          WHEN YEAR(DATEADD(HOUR, 0, i.SaleDate)) = @thisYear
          AND MONTH(DATEADD(HOUR, 0, i.SaleDate)) = @thisMonth
          THEN (d.SalePrice - p.ImportPrice) ELSE 0 END), 0) as monthProfit,
        ISNULL(SUM(CASE
          WHEN YEAR(DATEADD(HOUR, 0, i.SaleDate)) = @thisYear
          THEN (d.SalePrice - p.ImportPrice) ELSE 0 END), 0) as yearProfit,
        ISNULL(SUM(d.SalePrice), 0) as totalRevenue,
        ISNULL(SUM(p.ImportPrice), 0) as totalCost
      FROM CRM_SalesInvoices i
      INNER JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
      INNER JOIN CRM_Products p ON d.ProductID = p.ProductID
      WHERE i.SaleDate IS NOT NULL
    `, { today, thisMonth, thisYear });

    // Inventory Statistics - Phân biệt rõ sản phẩm có sẵn vs tồn kho
    const inventoryStats = await executeQuery(`
      SELECT
        -- Tổng số lượng nhập từ tất cả lô hàng
        ISNULL(SUM(ib.TotalQuantity), 0) as totalImported,
        -- Số sản phẩm có sẵn (Status = IN_STOCK)
        ISNULL((SELECT COUNT(*) FROM CRM_Products WHERE Status = 'IN_STOCK'), 0) as availableProducts,
        -- Số sản phẩm đã bán (Status = SOLD)
        ISNULL((SELECT COUNT(*) FROM CRM_Products WHERE Status = 'SOLD'), 0) as soldProducts,
        -- Tổng số sản phẩm đã tạo
        ISNULL((SELECT COUNT(*) FROM CRM_Products), 0) as totalProducts,
        -- Số lô hàng
        COUNT(DISTINCT ib.BatchID) as totalBatches
      FROM CRM_ImportBatches ib
    `);

    // Sales Count Statistics - Use invoice data with Vietnam timezone handling
    const salesStats = await executeQuery(`
      SELECT
        -- Số đơn hôm nay - Database stores Vietnam time, compare directly
        COUNT(CASE
          WHEN CAST(DATEADD(HOUR, 0, i.SaleDate) AS DATE) = @today
          THEN 1 END) as todayCount,
        COUNT(CASE
          WHEN YEAR(DATEADD(HOUR, 0, i.SaleDate)) = @thisYear
          AND MONTH(DATEADD(HOUR, 0, i.SaleDate)) = @thisMonth
          THEN 1 END) as monthCount,
        ISNULL(AVG(i.FinalAmount), 0) as avgOrderValue
      FROM CRM_SalesInvoices i
      WHERE i.SaleDate IS NOT NULL
    `, { today, thisYear, thisMonth });

    const revenue = revenueStats[0];
    const profit = profitStats[0];
    const inventory = inventoryStats[0];
    const sales = salesStats[0];

    // Debug logging for production - Enhanced for timezone troubleshooting
    console.log('Dashboard Stats - Revenue Debug:', {
      environment: process.env.NODE_ENV,
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      vercelRegion: process.env.VERCEL_REGION || 'local',
      serverTime: new Date().toISOString(),
      vietnamTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
      todayVietnam: today,
      yesterday: yesterday,
      todayRevenue: revenue.todayRevenue,
      yesterdayRevenue: revenue.yesterdayRevenue,
      todayCount: revenue.todayCount,
      salesTodayCount: sales.todayCount,
      monthRevenue: revenue.monthRevenue,
      yearRevenue: revenue.yearRevenue,
      databaseTimezone: 'Database stores Vietnam time - using DATEADD(HOUR, 0, date) for consistency',
      queryParams: { today, yesterday, thisMonth, thisYear },
      note: 'Server UTC+0, Database Vietnam time, Query handles timezone correctly'
    });

    // Database stores Vietnam time, use direct comparison values
    const finalTodayRevenue = revenue.todayRevenue || 0;
    const finalYesterdayRevenue = revenue.yesterdayRevenue || 0;
    const finalTodayCount = revenue.todayCount || 0;

    // Calculate growth rate using the correct yesterday revenue
    const growthRate = finalYesterdayRevenue > 0
      ? ((finalTodayRevenue - finalYesterdayRevenue) / finalYesterdayRevenue * 100)
      : 0;

    // Calculate profit margin
    const profitMargin = profit.totalRevenue > 0 
      ? (profit.yearProfit / profit.totalRevenue * 100)
      : 0;

    // Tính toán chính xác
    const totalImported = inventory.totalImported || 0; // Tổng nhập từ lô hàng
    const soldProducts = inventory.soldProducts || 0;   // Số sản phẩm đã bán
    const availableProducts = inventory.availableProducts || 0; // Sản phẩm có sẵn (IN_STOCK)
    const totalStock = totalImported - soldProducts;    // Tồn kho = Nhập - Bán

    const stats: DashboardStats = {
      revenue: {
        today: finalTodayRevenue,
        thisMonth: revenue.monthRevenue || 0,
        thisYear: revenue.yearRevenue || 0,
        growth: Math.round(growthRate * 100) / 100
      },
      profit: {
        today: profit.todayProfit || 0,
        thisMonth: profit.monthProfit || 0,
        thisYear: profit.yearProfit || 0,
        margin: Math.round(profitMargin * 100) / 100
      },
      inventory: {
        totalProducts: Math.max(totalStock, 0), // Tồn kho = Tổng nhập - Đã bán
        inStock: availableProducts,             // Sản phẩm có sẵn (Status = IN_STOCK)
        sold: soldProducts,                     // Số sản phẩm đã bán
        lowStock: inventory.totalBatches || 0   // Số lô hàng
      },
      sales: {
        todayCount: finalTodayCount,
        thisMonthCount: sales.monthCount || 0,
        avgOrderValue: Math.round(sales.avgOrderValue || 0)
      }
    };

    // Add debug info for production troubleshooting - Always include for timezone debugging
    const responseTimestamp = new Date().toISOString();
    const response = {
      success: true,
      data: stats,
      timestamp: responseTimestamp, // Track when response was generated
      debug: {
        timezone: {
          server: responseTimestamp,
          vietnam: today,
          yesterday: yesterday,
          environment: process.env.NODE_ENV || 'development',
          serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          explanation: 'Database stores Vietnam time (+7), queries use Vietnam dates'
        },
        revenue: {
          todayRevenue: finalTodayRevenue,
          yesterdayRevenue: finalYesterdayRevenue,
          todayCount: finalTodayCount,
          growthRate: Math.round(growthRate * 100) / 100
        },
        rawData: {
          revenueQuery: revenue,
          salesQuery: sales,
          inventoryQuery: inventory
        },
        caching: {
          note: 'API configured with no-store, no-cache for fresh data',
          dynamic: 'force-dynamic',
          revalidate: 0
        }
      }
    };

    // Disable all caching for production (Vercel) - Force fresh data
    const jsonResponse = NextResponse.json(response);

    // Disable browser caching
    jsonResponse.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0');
    jsonResponse.headers.set('Pragma', 'no-cache');
    jsonResponse.headers.set('Expires', '0');

    // Disable Vercel Edge caching
    jsonResponse.headers.set('CDN-Cache-Control', 'no-store');
    jsonResponse.headers.set('Vercel-CDN-Cache-Control', 'no-store');

    // Add timestamp to response for debugging
    jsonResponse.headers.set('X-Timestamp', new Date().toISOString());

    return jsonResponse;

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    }, { status: 500 });
  }
}
