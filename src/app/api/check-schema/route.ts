import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Check actual columns in CRM_SalesInvoices table
    const columns = await executeQuery(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CRM_SalesInvoices'
      ORDER BY ORDINAL_POSITION
    `);
    
    // Check if table exists
    const tableExists = await executeQuery(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_NAME = 'CRM_SalesInvoices'
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        tableExists: tableExists[0]?.count > 0,
        columns: columns
      }
    });
  } catch (error) {
    console.error('Schema check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Schema check failed'
    }, { status: 500 });
  }
}
