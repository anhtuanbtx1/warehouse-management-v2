import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get Vietnam timezone date using proper timezone conversion
    const now = new Date();
    const vietnamDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const today = `${vietnamDate.getFullYear()}-${String(vietnamDate.getMonth() + 1).padStart(2, '0')}-${String(vietnamDate.getDate()).padStart(2, '0')}`;
    
    console.log('Debug Sales Today - Vietnam Date:', {
      today,
      vietnamDateTime: vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
    });

    // Check sales today
    const salesToday = await executeQuery(`
      SELECT 
        ProductID,
        ProductName,
        IMEI,
        SalePrice,
        ImportPrice,
        (SalePrice - ImportPrice) as Profit,
        SoldDate,
        CAST(SoldDate AS DATE) as SoldDateOnly,
        FORMAT(SoldDate, 'dd/MM/yyyy HH:mm:ss') as SoldDateFormatted
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND CAST(SoldDate AS DATE) = @today
      ORDER BY SoldDate DESC
    `, { today });

    // Get total revenue today
    const revenueToday = await executeQuery(`
      SELECT 
        COUNT(*) as TotalSales,
        ISNULL(SUM(SalePrice), 0) as TotalRevenue,
        ISNULL(SUM(SalePrice - ImportPrice), 0) as TotalProfit
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND CAST(SoldDate AS DATE) = @today
    `, { today });

    return NextResponse.json({
      success: true,
      data: {
        today,
        vietnamDateTime: vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        salesToday,
        summary: revenueToday[0]
      }
    });

  } catch (error) {
    console.error('Debug sales today error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch sales today'
    }, { status: 500 });
  }
}
