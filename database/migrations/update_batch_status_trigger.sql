-- Migration: Update batch status trigger to automatically set COMPLETED when remainingQuantity = 0
-- Date: 2025-06-20
-- Description: Enhance TR_CRM_Products_UpdateBatchStats trigger to automatically update batch status

-- Drop existing trigger
IF EXISTS (SELECT * FROM sys.triggers WHERE name = 'TR_CRM_Products_UpdateBatchStats')
BEGIN
    DROP TRIGGER TR_CRM_Products_UpdateBatchStats;
    PRINT 'Dropped existing trigger TR_CRM_Products_UpdateBatchStats';
END

-- Create enhanced trigger with automatic status updates
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
                WHEN (
                    SELECT COUNT(*) 
                    FROM CRM_Products p 
                    WHERE p.BatchID = b.BatchID AND p.Status = 'SOLD'
                ) > 0 THEN 'PARTIAL'
                ELSE 'ACTIVE'
            END,
            UpdatedAt = GETDATE()
        FROM CRM_ImportBatches b
        INNER JOIN inserted i ON b.BatchID = i.BatchID;
        
        -- Log status changes for debugging
        DECLARE @BatchesUpdated TABLE (
            BatchID INT,
            OldStatus NVARCHAR(20),
            NewStatus NVARCHAR(20),
            SoldQuantity INT,
            TotalQuantity INT
        );
        
        INSERT INTO @BatchesUpdated
        SELECT 
            b.BatchID,
            'UNKNOWN' as OldStatus, -- We don't have old status in this context
            b.Status as NewStatus,
            b.TotalSoldQuantity,
            b.TotalQuantity
        FROM CRM_ImportBatches b
        INNER JOIN inserted i ON b.BatchID = i.BatchID;
        
        -- Print debug information (will appear in SQL Server logs)
        DECLARE @DebugMsg NVARCHAR(500);
        SELECT @DebugMsg = 'Batch Status Update: BatchID=' + CAST(BatchID AS NVARCHAR) + 
                          ', Status=' + NewStatus + 
                          ', Sold=' + CAST(SoldQuantity AS NVARCHAR) + 
                          '/' + CAST(TotalQuantity AS NVARCHAR)
        FROM @BatchesUpdated;
        
        IF @DebugMsg IS NOT NULL
            PRINT @DebugMsg;
    END
END;

PRINT 'Successfully created enhanced TR_CRM_Products_UpdateBatchStats trigger';

-- Test the trigger by updating existing batches to correct status
UPDATE CRM_ImportBatches 
SET Status = CASE 
    WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
    WHEN TotalSoldQuantity > 0 THEN 'PARTIAL'
    ELSE 'ACTIVE'
END
WHERE Status != CASE 
    WHEN TotalSoldQuantity = TotalQuantity THEN 'COMPLETED'
    WHEN TotalSoldQuantity > 0 THEN 'PARTIAL'
    ELSE 'ACTIVE'
END;

PRINT 'Updated existing batch statuses to match current sold quantities';

-- Verify the results
SELECT 
    BatchID,
    BatchCode,
    TotalQuantity,
    TotalSoldQuantity,
    (TotalQuantity - TotalSoldQuantity) as RemainingQuantity,
    Status,
    CASE 
        WHEN TotalSoldQuantity = TotalQuantity THEN 'Should be COMPLETED'
        WHEN TotalSoldQuantity > 0 THEN 'Should be PARTIAL'
        ELSE 'Should be ACTIVE'
    END as ExpectedStatus
FROM CRM_ImportBatches
ORDER BY ImportDate DESC;

PRINT 'Migration completed successfully!';
