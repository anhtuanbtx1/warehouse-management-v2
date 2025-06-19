import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get Vietnam timezone date (UTC+7)
    const vietnamDate = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const today = vietnamDate.toISOString().split('T')[0];
    
    console.log('Simple Stats Debug - Today:', today);

    // Simple query to get today's sales from both tables
    const salesInvoicesQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(FinalAmount) as revenue
      FROM CRM_SalesInvoices 
      WHERE CAST(SaleDate AS DATE) = @today
    `;

    const productsQuery = `
      SELECT 
        COUNT(*) as count,
        SUM(SalePrice) as revenue
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL 
        AND CAST(SoldDate AS DATE) = @today
    `;

    const [salesInvoicesResult, productsResult] = await Promise.all([
      executeQuery(salesInvoicesQuery, { today }),
      executeQuery(productsQuery, { today })
    ]);

    return NextResponse.json({
      success: true,
      data: {
        today,
        vietnamDateTime: vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }),
        timestamp: new Date().toISOString(),
        salesInvoices: salesInvoicesResult[0],
        products: productsResult[0],
        message: "API working correctly - no cache"
      }
    });

  } catch (error) {
    console.error('Simple stats error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch simple stats'
    }, { status: 500 });
  }
}
