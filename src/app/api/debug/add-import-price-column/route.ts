import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Adding ImportPrice column to CRM_ImportBatches table...');

    // Check if column already exists
    const columnExists = await executeQuery(`
      SELECT COUNT(*) as count
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CRM_ImportBatches' 
        AND COLUMN_NAME = 'ImportPrice'
    `);

    if (columnExists[0].count > 0) {
      return NextResponse.json({
        success: true,
        message: 'ImportPrice column already exists',
        data: { columnExists: true }
      });
    }

    // Add ImportPrice column
    await executeQuery(`
      ALTER TABLE CRM_ImportBatches 
      ADD ImportPrice DECIMAL(18,2) NULL
    `);

    console.log('ImportPrice column added successfully');

    // Calculate and update ImportPrice for existing batches
    // ImportPrice = TotalImportValue / TotalQuantity
    await executeQuery(`
      UPDATE CRM_ImportBatches 
      SET ImportPrice = CASE 
        WHEN TotalQuantity > 0 THEN TotalImportValue / TotalQuantity 
        ELSE 0 
      END
      WHERE ImportPrice IS NULL
    `);

    console.log('ImportPrice values calculated and updated for existing batches');

    // Get updated table structure
    const columns = await executeQuery(`
      SELECT 
        COLUMN_NAME,
        DATA_TYPE,
        IS_NULLABLE,
        COLUMN_DEFAULT
      FROM INFORMATION_SCHEMA.COLUMNS 
      WHERE TABLE_NAME = 'CRM_ImportBatches'
      ORDER BY ORDINAL_POSITION
    `);

    // Get sample data with new column
    const sampleData = await executeQuery(`
      SELECT TOP 3 
        BatchID,
        BatchCode,
        TotalQuantity,
        TotalImportValue,
        ImportPrice,
        (TotalImportValue / NULLIF(TotalQuantity, 0)) as CalculatedImportPrice
      FROM CRM_ImportBatches
      ORDER BY BatchID DESC
    `);

    return NextResponse.json({
      success: true,
      message: 'ImportPrice column added and populated successfully',
      data: {
        columnAdded: true,
        tableStructure: columns,
        sampleData: sampleData,
        summary: {
          action: 'Added ImportPrice column to CRM_ImportBatches',
          calculation: 'ImportPrice = TotalImportValue / TotalQuantity',
          dataType: 'DECIMAL(18,2) NULL'
        }
      }
    });

  } catch (error) {
    console.error('Error adding ImportPrice column:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to add ImportPrice column'
    }, { status: 500 });
  }
}
