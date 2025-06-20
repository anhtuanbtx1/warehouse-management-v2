import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getVietnamToday, getVietnamYesterday, getVietnamCurrentMonth } from '@/lib/timezone';

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
      note: 'Using Vietnam timezone utilities for consistent date handling'
    });

    // Revenue statistics - Using Vietnam timezone dates
    // Database stores Vietnam time (+7), so we query with Vietnam dates
    const revenueStats = await executeQuery(`
      SELECT
        -- Doanh thu hôm nay (Vietnam timezone - database stores +7 time)
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @today THEN SalePrice ELSE 0 END), 0) as todayRevenue,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear AND MONTH(SoldDate) = @thisMonth THEN SalePrice ELSE 0 END), 0) as monthRevenue,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear THEN SalePrice ELSE 0 END), 0) as yearRevenue,
        -- Doanh thu hôm qua để tính growth (using Vietnam yesterday)
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @yesterday THEN SalePrice ELSE 0 END), 0) as yesterdayRevenue,
        -- Debug: Count records for today
        COUNT(CASE WHEN CAST(SoldDate AS DATE) = @today THEN 1 END) as todayCount
      FROM CRM_Products
      WHERE Status = 'SOLD' AND SoldDate IS NOT NULL
    `, { today, yesterday, thisMonth, thisYear });

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
      yesterday: yesterday,
      todayRevenue: revenue.todayRevenue,
      yesterdayRevenue: revenue.yesterdayRevenue,
      todayCount: revenue.todayCount,
      salesTodayCount: sales.todayCount,
      databaseTimezone: 'Vietnam +7 (stored in DB)',
      serverTimezone: 'UTC (Vercel) but using Vietnam dates for queries'
    });

    // Use Vietnam timezone revenue for display
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
            server: new Date().toISOString(),
            vietnam: today,
            yesterday: yesterday,
            explanation: 'Database stores Vietnam time (+7), queries use Vietnam dates'
          },
          revenue: {
            todayRevenue: revenue.todayRevenue,
            yesterdayRevenue: revenue.yesterdayRevenue,
            todayCount: revenue.todayCount,
            growthRate: Math.round(((finalTodayRevenue - revenue.yesterdayRevenue) / revenue.yesterdayRevenue * 100) * 100) / 100
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
