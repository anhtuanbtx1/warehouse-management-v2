import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

// GET /api/products-available - Get available products for sale
export async function GET(request: NextRequest) {
  try {
    console.log('Fetching available products...');
    
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    
    // Get available products with category and batch info
    const products = await executeQuery(`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        p.Status,
        c.CategoryName,
        b.BatchCode
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      WHERE p.Status = 'IN_STOCK'
      ORDER BY p.CreatedAt DESC
      OFFSET 0 ROWS
      FETCH NEXT @limit ROWS ONLY
    `, { limit });
    
    console.log('Available products found:', products.length);
    
    return NextResponse.json({
      success: true,
      data: products,
      message: 'Available products retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching available products:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch available products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
