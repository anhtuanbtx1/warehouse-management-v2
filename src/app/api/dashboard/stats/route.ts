import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

interface DashboardStats {
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
    growth: number;
  };
  profit: {
    today: number;
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
    todayCount: number;
    thisMonthCount: number;
    avgOrderValue: number;
  };
}

export async function GET(request: NextRequest) {
  try {
    const today = new Date().toISOString().split('T')[0];
    const currentDate = new Date();
    const thisYear = currentDate.getFullYear();
    const thisMonth = currentDate.getMonth() + 1; // JavaScript months are 0-based

    console.log('Dashboard Stats - Date params:', { today, thisYear, thisMonth });

    // Revenue Statistics
    const revenueStats = await executeQuery(`
      SELECT
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = @today THEN SalePrice ELSE 0 END), 0) as todayRevenue,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear AND MONTH(SoldDate) = @thisMonth THEN SalePrice ELSE 0 END), 0) as monthRevenue,
        ISNULL(SUM(CASE WHEN YEAR(SoldDate) = @thisYear THEN SalePrice ELSE 0 END), 0) as yearRevenue,
        ISNULL(SUM(CASE WHEN CAST(SoldDate AS DATE) = DATEADD(day, -1, @today) THEN SalePrice ELSE 0 END), 0) as yesterdayRevenue
      FROM CRM_Products
      WHERE Status = 'SOLD' AND SoldDate IS NOT NULL
    `, { today, thisMonth, thisYear });

    // Profit Statistics
    const profitStats = await executeQuery(`
      SELECT
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

    // Calculate growth rate
    const growthRate = revenue.yesterdayRevenue > 0 
      ? ((revenue.todayRevenue - revenue.yesterdayRevenue) / revenue.yesterdayRevenue * 100)
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
        today: revenue.todayRevenue || 0,
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

    return NextResponse.json({
      success: true,
      data: stats
    });

  } catch (error) {
    console.error('Dashboard stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch dashboard stats'
    }, { status: 500 });
  }
}
