import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getVietnamToday, getVietnamYesterday } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const today = getVietnamToday();
    const yesterday = getVietnamYesterday();
    
    console.log('Debug Sales Data:', {
      today,
      yesterday,
      serverTime: new Date().toISOString(),
      vietnamTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
    });

    // Check all sold products with dates
    const allSoldProducts = await executeQuery(`
      SELECT 
        ProductID,
        ProductName,
        SalePrice,
        ImportPrice,
        SoldDate,
        CAST(SoldDate AS DATE) as SoldDateOnly,
        CASE 
          WHEN CAST(SoldDate AS DATE) = @today THEN 'TODAY'
          WHEN CAST(SoldDate AS DATE) = @yesterday THEN 'YESTERDAY'
          ELSE 'OTHER'
        END as DateCategory
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL
      ORDER BY SoldDate DESC
    `, { today, yesterday });

    // Count by date
    const countByDate = await executeQuery(`
      SELECT 
        CAST(SoldDate AS DATE) as SaleDate,
        COUNT(*) as Count,
        SUM(SalePrice) as TotalRevenue,
        SUM(SalePrice - ImportPrice) as TotalProfit
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL
      GROUP BY CAST(SoldDate AS DATE)
      ORDER BY CAST(SoldDate AS DATE) DESC
    `);

    // Today's specific data
    const todayData = await executeQuery(`
      SELECT 
        COUNT(*) as TodayCount,
        SUM(SalePrice) as TodayRevenue,
        SUM(SalePrice - ImportPrice) as TodayProfit
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL
        AND CAST(SoldDate AS DATE) = @today
    `, { today });

    return NextResponse.json({
      success: true,
      data: {
        timezone: {
          today,
          yesterday,
          serverTime: new Date().toISOString(),
          vietnamTime: new Date().toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' })
        },
        todayStats: todayData[0],
        recentSales: allSoldProducts.slice(0, 10),
        salesByDate: countByDate.slice(0, 10),
        totalSoldProducts: allSoldProducts.length
      }
    });

  } catch (error) {
    console.error('Debug sales data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch debug sales data'
    }, { status: 500 });
  }
}
