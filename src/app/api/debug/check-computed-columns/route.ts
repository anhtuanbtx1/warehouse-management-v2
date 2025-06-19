import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table') || 'CRM_ImportBatches';
    
    console.log('Checking computed columns for:', tableName);

    // Get computed columns
    const computedColumns = await executeQuery(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsComputed') as IsComputed
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
        AND COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsComputed') = 1
      ORDER BY ORDINAL_POSITION
    `, { tableName });

    // Get all columns with computed info
    const allColumns = await executeQuery(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT,
        COLUMNPROPERTY(OBJECT_ID(TABLE_SCHEMA + '.' + TABLE_NAME), COLUMN_NAME, 'IsComputed') as IsComputed
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = @tableName
      ORDER BY ORDINAL_POSITION
    `, { tableName });

    return NextResponse.json({
      success: true,
      data: {
        tableName,
        computedColumns,
        allColumns,
        computedColumnCount: computedColumns.length
      }
    });

  } catch (error) {
    console.error('Error checking computed columns:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to check computed columns'
    }, { status: 500 });
  }
}
