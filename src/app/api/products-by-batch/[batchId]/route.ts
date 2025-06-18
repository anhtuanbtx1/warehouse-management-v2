import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/products-by-batch/[batchId] - Get products by batch ID
export async function GET(
  request: NextRequest,
  { params }: { params: { batchId: string } }
) {
  try {
    const batchId = parseInt(params.batchId);
    
    if (isNaN(batchId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch ID'
      }, { status: 400 });
    }

    console.log('Fetching products for batch:', batchId);
    
    // Get products in the batch
    const products = await executeQuery(`
      SELECT 
        p.ProductID,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        p.SalePrice,
        p.Status,
        p.SoldDate,
        p.InvoiceNumber,
        p.CustomerInfo,
        p.Notes,
        p.CreatedAt,
        p.UpdatedAt,
        c.CategoryName,
        b.BatchCode
      FROM CRM_Products p
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      WHERE p.BatchID = @batchId
      ORDER BY p.CreatedAt DESC
    `, { batchId });
    
    console.log('Products found:', products.length);
    
    return NextResponse.json({
      success: true,
      data: products,
      message: 'Products retrieved successfully'
    });
    
  } catch (error) {
    console.error('Error fetching products by batch:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to fetch products',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
