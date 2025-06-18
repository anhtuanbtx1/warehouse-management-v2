import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/dashboard - Get dashboard statistics
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching dashboard statistics...');
    
    // Get total batches
    const batchesResult = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM CRM_ImportBatches
    `);
    
    // Get total products
    const productsResult = await executeQuery<{ count: number }>(`
      SELECT COUNT(*) as count FROM CRM_Products
    `);
    
    // Get products by status
    const statusResult = await executeQuery<{ Status: string; count: number }>(`
      SELECT Status, COUNT(*) as count 
      FROM CRM_Products 
      GROUP BY Status
    `);
    
    // Get sales statistics (mock for now since we don't have sales data yet)
    const salesStats = {
      totalSoldValue: 0,
      soldProducts: 0,
      totalProfitLoss: 0,
      avgProfitMargin: 0
    };
    
    // Calculate stats
    const totalBatches = batchesResult[0]?.count || 0;
    const totalProducts = productsResult[0]?.count || 0;
    
    let inStockProducts = 0;
    let soldProducts = 0;
    
    statusResult.forEach(item => {
      if (item.Status === 'IN_STOCK') {
        inStockProducts = item.count;
      } else if (item.Status === 'SOLD') {
        soldProducts = item.count;
      }
    });
    
    const stats = {
      totalBatches,
      totalProducts,
      inStockProducts,
      soldProducts,
      totalSoldValue: salesStats.totalSoldValue,
      totalProfitLoss: salesStats.totalProfitLoss,
      avgProfitMargin: salesStats.avgProfitMargin
    };
    
    console.log('Dashboard stats:', stats);
    
    return NextResponse.json({
      success: true,
      data: stats,
      message: 'Dashboard statistics retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching dashboard statistics:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch dashboard statistics',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
