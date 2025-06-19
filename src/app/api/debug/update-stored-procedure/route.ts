import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function POST(request: NextRequest) {
  try {
    console.log('Updating SP_CRM_CreateImportBatch to support ImportPrice...');

    // Drop existing procedure
    await executeQuery(`
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_CreateImportBatch')
      DROP PROCEDURE SP_CRM_CreateImportBatch
    `);

    // Create updated procedure with ImportPrice support
    await executeQuery(`
      CREATE PROCEDURE SP_CRM_CreateImportBatch
        @CategoryID INT,
        @ImportDate DATE,
        @TotalQuantity INT,
        @ImportPrice DECIMAL(18,2) = NULL,
        @TotalImportValue DECIMAL(18,2),
        @Notes NVARCHAR(1000) = NULL,
        @CreatedBy NVARCHAR(100) = 'system'
      AS
      BEGIN
        SET NOCOUNT ON;
        
        DECLARE @BatchCode NVARCHAR(50);
        DECLARE @BatchID INT;
        
        -- Generate unique batch code
        SET @BatchCode = 'LOT' + FORMAT(GETDATE(), 'yyyyMMddHHmmss');
        
        -- Calculate ImportPrice if not provided
        IF @ImportPrice IS NULL AND @TotalQuantity > 0
        BEGIN
          SET @ImportPrice = @TotalImportValue / @TotalQuantity;
        END
        
        -- Insert new batch (excluding computed columns)
        INSERT INTO CRM_ImportBatches (
          BatchCode,
          ImportDate,
          CategoryID,
          TotalQuantity,
          ImportPrice,
          TotalImportValue,
          TotalSoldQuantity,
          TotalSoldValue,
          Status,
          Notes,
          CreatedBy,
          CreatedAt,
          UpdatedAt
        )
        VALUES (
          @BatchCode,
          @ImportDate,
          @CategoryID,
          @TotalQuantity,
          @ImportPrice,
          @TotalImportValue,
          0, -- TotalSoldQuantity
          0, -- TotalSoldValue
          'ACTIVE',
          @Notes,
          @CreatedBy,
          GETDATE(),
          GETDATE()
        );
        
        SET @BatchID = SCOPE_IDENTITY();
        
        -- Return the created batch
        SELECT 
          b.BatchID,
          b.BatchCode,
          b.ImportDate,
          b.CategoryID,
          b.TotalQuantity,
          b.ImportPrice,
          b.TotalImportValue,
          b.TotalSoldQuantity,
          b.TotalSoldValue,
          b.RemainingQuantity,
          b.ProfitLoss,
          b.Status,
          b.Notes,
          b.CreatedBy,
          b.CreatedAt,
          b.UpdatedAt,
          c.CategoryName
        FROM CRM_ImportBatches b
        LEFT JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
        WHERE b.BatchID = @BatchID;
      END
    `);

    console.log('Stored procedure updated successfully');

    // Test the procedure
    const testResult = await executeQuery(`
      EXEC SP_CRM_CreateImportBatch 
        @CategoryID = 1,
        @ImportDate = '2025-06-19',
        @TotalQuantity = 1,
        @TotalImportValue = 15000000,
        @Notes = 'Test batch with ImportPrice support'
    `);

    return NextResponse.json({
      success: true,
      message: 'Stored procedure updated successfully',
      data: {
        procedureUpdated: true,
        testResult: testResult[0],
        changes: [
          'Added @ImportPrice parameter to stored procedure',
          'Auto-calculate ImportPrice if not provided',
          'ImportPrice = TotalImportValue / TotalQuantity',
          'Updated INSERT statement to include ImportPrice column'
        ]
      }
    });

  } catch (error) {
    console.error('Error updating stored procedure:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update stored procedure'
    }, { status: 500 });
  }
}
