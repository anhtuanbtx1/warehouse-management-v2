import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'CRM_ImportBatches';
    
    console.log('Checking table structure for:', tableName);

    // Get table structure
    const columns = await executeQuery(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        CHARACTER_MAXIMUM_LENGTH
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `, { tableName });

    // Get sample data
    const sampleData = await executeQuery(`
      SELECT TOP 1 * FROM ${tableName}
    `);

    return NextResponse.json({
      success: true,
      data: {
        tableName,
        columns,
        sampleData: sampleData[0] || null,
        columnCount: columns.length
      }
    });

  } catch (error) {
    console.error('Error checking table structure:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check table structure'
    }, { status: 500 });
  }
}
