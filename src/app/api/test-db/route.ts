import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test basic connection
    const result = await executeQuery('SELECT 1 as test');
    
    // Test if tables exist
    const tables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME IN ('CRM_Products', 'CRM_SalesInvoices', 'CRM_SalesInvoiceDetails')
      ORDER BY TABLE_NAME
    `);
    
    // Test if we have any products
    const productCount = await executeQuery(`
      SELECT COUNT(*) as count FROM CRM_Products WHERE Status = 'IN_STOCK'
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        connection: 'OK',
        tables: tables,
        availableProducts: productCount[0]?.count || 0
      }
    });
  } catch (error) {
    console.error('Database test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Database connection failed'
    }, { status: 500 });
  }
}
