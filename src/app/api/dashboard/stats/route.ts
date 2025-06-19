import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

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
    // Get Vietnam timezone date using proper timezone handling
    const now = new Date();
    const vietnamDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const today = vietnamDate.toISOString().split('T')[0];
    const thisYear = vietnamDate.getFullYear();
    const thisMonth = vietnamDate.getMonth() + 1; // JavaScript months are 0-based

    // Also get UTC date for comparison
    const utcToday = now.toISOString().split('T')[0];

    console.log('Dashboard Stats - Timezone Debug:', {
      serverTime: now.toISOString(),
      utcToday,
      vietnamToday: today,
      thisYear,
      thisMonth,
      vietnamDateTime: vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
      environment: process.env.NODE_ENV || 'development'
    });

    // Revenue statistics - Today vs Yesterday
    // Use both Vietnam date and UTC date for comparison in production
    const revenueStats = await executeQuery(`
      SELECT
        -- Doanh thu hôm nay (Vietnam timezone)
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @today THEN SalePrice ELSE 0 END), 0) as todayRevenue,
        -- Doanh thu hôm nay (UTC timezone) - for Vercel comparison
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @utcToday THEN SalePrice ELSE 0 END), 0) as todayRevenueUTC,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear AND MONTH(SoldDate) = @thisMonth THEN SalePrice ELSE 0 END), 0) as monthRevenue,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear THEN SalePrice ELSE 0 END), 0) as yearRevenue,
        -- Doanh thu hôm qua để tính growth
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = DATEADD(day, -1, @today) THEN SalePrice ELSE 0 END), 0) as yesterdayRevenue,
        -- Debug: Count records for today
        COUNT(CASE WHEN CAST(SoldDate AS DATE) = @today THEN 1 END) as todayCount,
        COUNT(CASE WHEN CAST(SoldDate AS DATE) = @utcToday THEN 1 END) as todayCountUTC
      FROM CRM_Products
      WHERE Status = 'SOLD' AND SoldDate IS NOT NULL
    `, { today, utcToday, thisMonth, thisYear });

    // Profit Statistics
    const profitStats = await executeQuery(`
      SELECT
        -- Lợi nhuận hôm nay
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @today THEN (SalePrice - ImportPrice) ELSE 0 END), 0) as todayProfit,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear AND MONTH(SoldDate) = @thisMonth THEN (SalePrice - ImportPrice) ELSE 0 END), 0) as monthProfit,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear THEN (SalePrice - ImportPrice) ELSE 0 END), 0) as yearProfit,
        ISNULL(SUM(CASE WHEN Status = 'SOLD' THEN SalePrice ELSE 0 END), 0) as totalRevenue,
        ISNULL(SUM(CASE WHEN Status = 'SOLD' THEN ImportPrice ELSE 0 END), 0) as totalCost
      FROM CRM_Products
      WHERE SoldDate IS NOT NULL
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

    // Sales Count Statistics
    const salesStats = await executeQuery(`
      SELECT
        -- Số đơn hôm nay
        COUNT(CASE WHEN CAST(SoldDate AS DATE) = @today THEN 1 END) as todayCount,
        COUNT(CASE WHEN YEAR(SoldDate) = @thisYear AND MONTH(SoldDate) = MONTH(GETDATE()) THEN 1 END) as monthCount,
        ISNULL(AVG(CASE WHEN Status = 'SOLD' THEN SalePrice END), 0) as avgOrderValue
      FROM CRM_Products
      WHERE Status = 'SOLD' AND SoldDate IS NOT NULL
    `, { today, thisYear });

    const revenue = revenueStats[0];
    const profit = profitStats[0];
    const inventory = inventoryStats[0];
    const sales = salesStats[0];

    // Debug logging for production
    console.log('Dashboard Stats - Revenue Debug:', {
      environment: process.env.NODE_ENV,
      todayVietnam: today,
      todayUTC: utcToday,
      todayRevenue: revenue.todayRevenue,
      todayRevenueUTC: revenue.todayRevenueUTC,
      todayCount: revenue.todayCount,
      todayCountUTC: revenue.todayCountUTC,
      salesTodayCount: sales.todayCount
    });

    // Use Vietnam timezone revenue for display, but log both for debugging
    const finalTodayRevenue = revenue.todayRevenue || 0;

    // Calculate growth rate
    const growthRate = revenue.yesterdayRevenue > 0
      ? ((finalTodayRevenue - revenue.yesterdayRevenue) / revenue.yesterdayRevenue * 100)
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
        todayCount: sales.todayCount || 0,
        thisMonthCount: sales.monthCount || 0,
        avgOrderValue: Math.round(sales.avgOrderValue || 0)
      }
    };

    // Add debug info for production troubleshooting
    const response = {
      success: true,
      data: stats,
      ...(process.env.NODE_ENV !== 'production' && {
        debug: {
          timezone: {
            server: now.toISOString(),
            vietnam: today,
            utc: utcToday
          },
          revenue: {
            vietnamTz: revenue.todayRevenue,
            utcTz: revenue.todayRevenueUTC,
            countVietnam: revenue.todayCount,
            countUTC: revenue.todayCountUTC
          }
        }
      })
    };

    return NextResponse.json(response);

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    }, { status: 500 });
  }
}
