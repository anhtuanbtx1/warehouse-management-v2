import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    
    // Different timezone calculations
    const utcDate = now.toISOString().split('T')[0];
    const vietnamDate1 = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0];
    const vietnamDate2 = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" })).toISOString().split('T')[0];
    
    console.log('Production Timezone Debug:', {
      serverTime: now.toISOString(),
      utcDate,
      vietnamDate1,
      vietnamDate2,
      environment: process.env.NODE_ENV,
      vercelRegion: process.env.VERCEL_REGION,
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Test queries with different dates
    const testQueries = await Promise.all([
      // UTC date
      executeQuery(`
        SELECT 
          'UTC' as timezone,
          @date as queryDate,
          COUNT(*) as salesCount,
          SUM(SalePrice) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: utcDate }),
      
      // Vietnam date method 1
      executeQuery(`
        SELECT 
          'Vietnam_Method1' as timezone,
          @date as queryDate,
          COUNT(*) as salesCount,
          SUM(SalePrice) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: vietnamDate1 }),
      
      // Vietnam date method 2
      executeQuery(`
        SELECT 
          'Vietnam_Method2' as timezone,
          @date as queryDate,
          COUNT(*) as salesCount,
          SUM(SalePrice) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: vietnamDate2 })
    ]);

    // Get all recent sales for debugging
    const recentSales = await executeQuery(`
      SELECT TOP 10
        ProductID,
        ProductName,
        SoldDate,
        SalePrice,
        CAST(SoldDate AS DATE) as SoldDateOnly,
        DATEPART(hour, SoldDate) as SoldHour
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL 
      ORDER BY SoldDate DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        environment: {
          nodeEnv: process.env.NODE_ENV,
          vercelRegion: process.env.VERCEL_REGION || 'local',
          serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          serverTime: now.toISOString()
        },
        dates: {
          utc: utcDate,
          vietnamMethod1: vietnamDate1,
          vietnamMethod2: vietnamDate2,
          serverLocal: now.toLocaleDateString(),
          vietnamFormatted: now.toLocaleDateString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        },
        queryResults: {
          utc: testQueries[0][0],
          vietnamMethod1: testQueries[1][0],
          vietnamMethod2: testQueries[2][0]
        },
        recentSales: recentSales.slice(0, 5),
        recommendation: {
          issue: "Timezone difference between local and Vercel",
          solution: "Use proper timezone conversion for Vietnam (UTC+7)",
          bestMethod: vietnamDate2 !== utcDate ? "Method 2 (toLocaleString)" : "UTC is same as Vietnam today"
        }
      }
    });

  } catch (error) {
    console.error('Production timezone debug error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to debug timezone'
    }, { status: 500 });
  }
}
