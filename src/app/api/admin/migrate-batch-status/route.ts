import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    console.log('Starting batch status migration...');

    // Step 1: Drop existing trigger
    await executeQuery(`
      IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_CRM_Products_UpdateBatchStats')
      BEGIN
          DROP TRIGGER TR_CRM_Products_UpdateBatchStats;
      END
    `);
    console.log('Dropped existing trigger');

    // Step 2: Create enhanced trigger with automatic status updates
    await executeQuery(`
      CREATE TRIGGER TR_CRM_Products_UpdateBatchStats
      ON CRM_Products
      AFTER UPDATE
      AS
      BEGIN
          SET NOCOUNT ON;
          
          -- Cập nhật thống kê lô hàng khi sản phẩm được bán
          IF UPDATE(Status) OR UPDATE(SalePrice)
          BEGIN
              UPDATE b SET
                  TotalSoldQuantity = (
                      SELECT COUNT(*) 
                      FROM CRM_Products p 
                      WHERE p.BatchID = b.BatchID AND p.Status = 'SOLD'
                  ),
                  TotalSoldValue = (
                      SELECT ISNULL(SUM(p.SalePrice), 0)
                      FROM CRM_Products p 
                      WHERE p.BatchID = b.BatchID AND p.Status = 'SOLD'
                  ),
                  -- Tự động cập nhật Status thành COMPLETED khi tất cả sản phẩm đã bán
                  Status = CASE
                      WHEN (
                          SELECT COUNT(*)
                          FROM CRM_Products p
                          WHERE p.BatchID = b.BatchID AND p.Status = 'SOLD'
                      ) = b.TotalQuantity THEN 'COMPLETED'
                      ELSE 'ACTIVE'
                  END,
                  UpdatedAt = GETDATE()
              FROM CRM_ImportBatches b
              INNER JOIN inserted i ON b.BatchID = i.BatchID;
          END
      END;
    `);
    console.log('Created enhanced trigger');

    // Step 3: Update existing batches to correct status
    const updateResult = await executeQuery(`
      UPDATE CRM_ImportBatches
      SET Status = CASE
          WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
          ELSE 'ACTIVE'
      END,
      UpdatedAt = GETDATE()
      WHERE Status != CASE
          WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
          ELSE 'ACTIVE'
      END
    `);
    console.log('Updated existing batch statuses');

    // Step 4: Get verification data
    const verificationData = await executeQuery(`
      SELECT 
          BatchID,
          BatchCode,
          TotalQuantity,
          TotalSoldQuantity,
          (TotalQuantity - TotalSoldQuantity) as RemainingQuantity,
          Status,
          CASE
              WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
              ELSE 'ACTIVE'
          END as ExpectedStatus,
          CASE
              WHEN Status = CASE
                  WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
                  ELSE 'ACTIVE'
              END THEN 'CORRECT'
              ELSE 'MISMATCH'
          END as StatusCheck
      FROM CRM_ImportBatches
      ORDER BY ImportDate DESC
    `);

    // Count status distribution
    const statusCounts = await executeQuery(`
      SELECT 
          Status,
          COUNT(*) as Count
      FROM CRM_ImportBatches
      GROUP BY Status
      ORDER BY Status
    `);

    // Count completed batches (remainingQuantity = 0)
    const completedBatches = verificationData.filter((batch: any) => 
      batch.RemainingQuantity === 0 && batch.Status === 'COMPLETED'
    );

    const response = {
      success: true,
      message: 'Batch status migration completed successfully',
      data: {
        triggerUpdated: true,
        batchesUpdated: updateResult,
        statusDistribution: statusCounts,
        completedBatches: completedBatches.length,
        totalBatches: verificationData.length,
        verification: verificationData.slice(0, 10), // Show first 10 for verification
        summary: {
          totalBatches: verificationData.length,
          activeBatches: verificationData.filter((b: any) => b.Status === 'ACTIVE').length,
          completedBatches: verificationData.filter((b: any) => b.Status === 'COMPLETED').length,
          correctStatuses: verificationData.filter((b: any) => b.StatusCheck === 'CORRECT').length,
          mismatches: verificationData.filter((b: any) => b.StatusCheck === 'MISMATCH').length
        }
      }
    };

    console.log('Migration completed:', response.data.summary);

    return NextResponse.json(response);

  } catch (error) {
    console.error('Migration error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Migration failed',
      details: 'Failed to update batch status trigger and existing data'
    }, { status: 500 });
  }
}

// GET endpoint to check current status without making changes
export async function GET(request: NextRequest) {
  try {
    // Check if trigger exists
    const triggerExists = await executeQuery(`
      SELECT COUNT(*) as count
      FROM sys.triggers 
      WHERE name = 'TR_CRM_Products_UpdateBatchStats'
    `);

    // Get current batch status distribution
    const statusCounts = await executeQuery(`
      SELECT 
          Status,
          COUNT(*) as Count
      FROM CRM_ImportBatches
      GROUP BY Status
      ORDER BY Status
    `);

    // Get batches with potential status mismatches
    const statusCheck = await executeQuery(`
      SELECT 
          BatchID,
          BatchCode,
          TotalQuantity,
          TotalSoldQuantity,
          (TotalQuantity - TotalSoldQuantity) as RemainingQuantity,
          Status,
          CASE
              WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
              ELSE 'ACTIVE'
          END as ExpectedStatus
      FROM CRM_ImportBatches
      WHERE Status != CASE
          WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
          ELSE 'ACTIVE'
      END
      ORDER BY ImportDate DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        triggerExists: triggerExists[0]?.count > 0,
        statusDistribution: statusCounts,
        mismatches: statusCheck,
        needsMigration: statusCheck.length > 0,
        summary: {
          totalMismatches: statusCheck.length,
          batchesNeedingCompletion: statusCheck.filter((b: any) => 
            b.RemainingQuantity === 0 && b.Status !== 'COMPLETED'
          ).length
        }
      }
    });

  } catch (error) {
    console.error('Status check error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Status check failed'
    }, { status: 500 });
  }
}
