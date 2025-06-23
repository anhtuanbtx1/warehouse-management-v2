import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getVietnamToday, getVietnamYesterday, getVietnamCurrentMonth } from '@/lib/timezone';

export async function GET(request: NextRequest) {
  try {
    const now = new Date();
    const today = getVietnamToday();
    const yesterday = getVietnamYesterday();
    const currentMonth = getVietnamCurrentMonth();
    const { year: thisYear, month: thisMonth } = currentMonth;

    // Get server environment info
    const environmentInfo = {
      nodeEnv: process.env.NODE_ENV || 'development',
      serverTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      vercelRegion: process.env.VERCEL_REGION || 'local',
      serverTime: now.toISOString(),
      vietnamTime: now.toLocaleString('en-US', { timeZone: 'Asia/Ho_Chi_Minh' }),
      calculatedToday: today,
      calculatedYesterday: yesterday
    };

    console.log('Production Comparison Debug:', environmentInfo);

    // Test different date calculation methods
    const utcToday = now.toISOString().split('T')[0];
    const manualVietnamToday = new Date(now.getTime() + (7 * 60 * 60 * 1000)).toISOString().split('T')[0];
    
    // Query with different date methods
    const queries = await Promise.all([
      // Method 1: Vietnam timezone utility (current method)
      executeQuery(`
        SELECT 
          'vietnam_utility' as method,
          @date as queryDate,
          COUNT(*) as salesCount,
          ISNULL(SUM(SalePrice), 0) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: today }),
      
      // Method 2: UTC date
      executeQuery(`
        SELECT 
          'utc_date' as method,
          @date as queryDate,
          COUNT(*) as salesCount,
          ISNULL(SUM(SalePrice), 0) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: utcToday }),
      
      // Method 3: Manual +7 hours
      executeQuery(`
        SELECT 
          'manual_plus7' as method,
          @date as queryDate,
          COUNT(*) as salesCount,
          ISNULL(SUM(SalePrice), 0) as revenue
        FROM CRM_Products 
        WHERE Status = 'SOLD' 
          AND SoldDate IS NOT NULL 
          AND CAST(SoldDate AS DATE) = @date
      `, { date: manualVietnamToday })
    ]);

    // Get recent sales with their actual dates
    const recentSales = await executeQuery(`
      SELECT TOP 10
        ProductName,
        SoldDate,
        SalePrice,
        CAST(SoldDate AS DATE) as SoldDateOnly,
        DATEPART(hour, SoldDate) as SoldHour,
        CASE 
          WHEN CAST(SoldDate AS DATE) = @today THEN 'TODAY_VN'
          WHEN CAST(SoldDate AS DATE) = @utcToday THEN 'TODAY_UTC'
          WHEN CAST(SoldDate AS DATE) = @manualToday THEN 'TODAY_MANUAL'
          ELSE 'OTHER'
        END as DateCategory
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL
      ORDER BY SoldDate DESC
    `, { 
      today, 
      utcToday, 
      manualToday: manualVietnamToday 
    });

    return NextResponse.json({
      success: true,
      data: {
        environment: environmentInfo,
        dateComparison: {
          vietnamUtility: today,
          utcDate: utcToday,
          manualPlus7: manualVietnamToday,
          explanation: 'Compare which date method matches your expected results'
        },
        queryResults: {
          vietnamUtility: queries[0][0],
          utcDate: queries[1][0],
          manualPlus7: queries[2][0],
          recommendation: 'Vietnam utility should be most accurate for Vietnam timezone'
        },
        recentSales: recentSales.map(sale => ({
          productName: sale.ProductName,
          soldDate: sale.SoldDate,
          soldDateOnly: sale.SoldDateOnly,
          soldHour: sale.SoldHour,
          salePrice: sale.SalePrice,
          dateCategory: sale.DateCategory,
          isVietnamTime: sale.SoldHour >= 7 ? 'LIKELY_VIETNAM' : 'MIGHT_BE_UTC'
        })),
        troubleshooting: {
          issue: 'Production shows different data than development',
          possibleCauses: [
            'Server timezone difference (Vercel runs UTC, local might be different)',
            'Database connection timezone settings',
            'Date calculation method differences',
            'Caching differences between environments'
          ],
          solution: 'Use Vietnam timezone utility consistently and verify database stores Vietnam time'
        }
      }
    });

  } catch (error) {
    console.error('Production comparison error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to compare production data'
    }, { status: 500 });
  }
}
