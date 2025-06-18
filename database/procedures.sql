-- =============================================
-- STORED PROCEDURES & TRIGGERS
-- =============================================

-- Trigger cập nhật tồn kho khi có nhập hàng
CREATE TRIGGER TR_CRM_ImportOrderDetails_UpdateInventory
ON CRM_ImportOrderDetails
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Xử lý INSERT và UPDATE
    IF EXISTS(SELECT * FROM inserted)
    BEGIN
        MERGE CRM_Inventory AS target
        USING (
            SELECT
                i.ProductID,
                io.WarehouseID,
                SUM(i.Quantity) as ImportQuantity
            FROM inserted i
            INNER JOIN CRM_ImportOrders io ON i.ImportOrderID = io.ImportOrderID
            WHERE io.Status = 'COMPLETED'
            GROUP BY i.ProductID, io.WarehouseID
        ) AS source ON target.ProductID = source.ProductID AND target.WarehouseID = source.WarehouseID
        WHEN MATCHED THEN
            UPDATE SET
                CurrentStock = target.CurrentStock + source.ImportQuantity,
                LastUpdated = GETDATE()
        WHEN NOT MATCHED THEN
            INSERT (ProductID, WarehouseID, CurrentStock, LastUpdated)
            VALUES (source.ProductID, source.WarehouseID, source.ImportQuantity, GETDATE());

        -- Ghi lại lịch sử xuất nhập tồn
        INSERT INTO CRM_StockMovements (ProductID, WarehouseID, MovementType, ReferenceType, ReferenceID, Quantity, UnitPrice, MovementDate, CreatedBy)
        SELECT
            i.ProductID,
            io.WarehouseID,
            'IMPORT',
            'IMPORT_ORDER',
            i.ImportOrderID,
            i.Quantity,
            i.UnitPrice,
            GETDATE(),
            io.CreatedBy
        FROM inserted i
        INNER JOIN CRM_ImportOrders io ON i.ImportOrderID = io.ImportOrderID
        WHERE io.Status = 'COMPLETED';
    END

    -- Xử lý DELETE
    IF EXISTS(SELECT * FROM deleted) AND NOT EXISTS(SELECT * FROM inserted)
    BEGIN
        UPDATE inv SET
            CurrentStock = inv.CurrentStock - d.Quantity,
            LastUpdated = GETDATE()
        FROM CRM_Inventory inv
        INNER JOIN deleted d ON inv.ProductID = d.ProductID
        INNER JOIN CRM_ImportOrders io ON d.ImportOrderID = io.ImportOrderID AND inv.WarehouseID = io.WarehouseID
        WHERE io.Status = 'COMPLETED';
    END
END;

-- Trigger cập nhật tồn kho khi có xuất hàng
CREATE TRIGGER TR_CRM_ExportOrderDetails_UpdateInventory
ON CRM_ExportOrderDetails
AFTER INSERT, UPDATE, DELETE
AS
BEGIN
    SET NOCOUNT ON;

    -- Xử lý INSERT và UPDATE
    IF EXISTS(SELECT * FROM inserted)
    BEGIN
        UPDATE inv SET
            CurrentStock = inv.CurrentStock - i.Quantity,
            LastUpdated = GETDATE()
        FROM CRM_Inventory inv
        INNER JOIN inserted i ON inv.ProductID = i.ProductID
        INNER JOIN CRM_ExportOrders eo ON i.ExportOrderID = eo.ExportOrderID AND inv.WarehouseID = eo.WarehouseID
        WHERE eo.Status = 'COMPLETED';

        -- Ghi lại lịch sử xuất nhập tồn
        INSERT INTO CRM_StockMovements (ProductID, WarehouseID, MovementType, ReferenceType, ReferenceID, Quantity, UnitPrice, MovementDate, CreatedBy)
        SELECT
            i.ProductID,
            eo.WarehouseID,
            'EXPORT',
            'EXPORT_ORDER',
            i.ExportOrderID,
            -i.Quantity, -- Âm vì là xuất
            i.UnitPrice,
            GETDATE(),
            eo.CreatedBy
        FROM inserted i
        INNER JOIN CRM_ExportOrders eo ON i.ExportOrderID = eo.ExportOrderID
        WHERE eo.Status = 'COMPLETED';
    END

    -- Xử lý DELETE
    IF EXISTS(SELECT * FROM deleted) AND NOT EXISTS(SELECT * FROM inserted)
    BEGIN
        UPDATE inv SET
            CurrentStock = inv.CurrentStock + d.Quantity,
            LastUpdated = GETDATE()
        FROM CRM_Inventory inv
        INNER JOIN deleted d ON inv.ProductID = d.ProductID
        INNER JOIN CRM_ExportOrders eo ON d.ExportOrderID = eo.ExportOrderID AND inv.WarehouseID = eo.WarehouseID
        WHERE eo.Status = 'COMPLETED';
    END
END;

-- Stored Procedure: Lấy báo cáo tồn kho
CREATE PROCEDURE SP_CRM_GetInventoryReport
    @WarehouseID INT = NULL,
    @CategoryID INT = NULL,
    @LowStockOnly BIT = 0
AS
BEGIN
    SELECT
        p.ProductCode,
        p.ProductName,
        c.CategoryName,
        u.UnitName,
        w.WarehouseName,
        i.CurrentStock,
        i.ReservedStock,
        i.AvailableStock,
        p.MinStock,
        p.MaxStock,
        CASE
            WHEN i.CurrentStock <= p.MinStock THEN 'LOW_STOCK'
            WHEN i.CurrentStock >= p.MaxStock THEN 'OVER_STOCK'
            ELSE 'NORMAL'
        END as StockStatus,
        i.LastUpdated
    FROM CRM_Inventory i
    INNER JOIN CRM_Products p ON i.ProductID = p.ProductID
    INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN CRM_Units u ON p.UnitID = u.UnitID
    INNER JOIN CRM_Warehouses w ON i.WarehouseID = w.WarehouseID
    WHERE
        (@WarehouseID IS NULL OR i.WarehouseID = @WarehouseID)
        AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
        AND (@LowStockOnly = 0 OR i.CurrentStock <= p.MinStock)
        AND p.IsActive = 1
    ORDER BY p.ProductName;
END;

-- Stored Procedure: Báo cáo doanh thu theo thời gian
CREATE PROCEDURE SP_CRM_GetRevenueReport
    @FromDate DATETIME2,
    @ToDate DATETIME2,
    @WarehouseID INT = NULL
AS
BEGIN
    SELECT
        CAST(eo.ExportDate AS DATE) as ExportDate,
        COUNT(eo.ExportOrderID) as TotalOrders,
        SUM(eo.TotalAmount) as TotalRevenue,
        SUM(eo.FinalAmount) as FinalRevenue,
        SUM(eod.Quantity * (eod.UnitPrice - p.CostPrice)) as GrossProfit
    FROM CRM_ExportOrders eo
    INNER JOIN CRM_ExportOrderDetails eod ON eo.ExportOrderID = eod.ExportOrderID
    INNER JOIN CRM_Products p ON eod.ProductID = p.ProductID
    WHERE
        eo.ExportDate BETWEEN @FromDate AND @ToDate
        AND eo.Status = 'COMPLETED'
        AND (@WarehouseID IS NULL OR eo.WarehouseID = @WarehouseID)
    GROUP BY CAST(eo.ExportDate AS DATE)
    ORDER BY ExportDate;
END;

-- Stored Procedure: Top sản phẩm bán chạy
CREATE PROCEDURE SP_CRM_GetTopSellingProducts
    @FromDate DATETIME2,
    @ToDate DATETIME2,
    @TopCount INT = 10
AS
BEGIN
    SELECT TOP (@TopCount)
        p.ProductCode,
        p.ProductName,
        c.CategoryName,
        SUM(eod.Quantity) as TotalSold,
        SUM(eod.TotalPrice) as TotalRevenue,
        COUNT(DISTINCT eo.ExportOrderID) as OrderCount
    FROM CRM_ExportOrderDetails eod
    INNER JOIN CRM_ExportOrders eo ON eod.ExportOrderID = eo.ExportOrderID
    INNER JOIN CRM_Products p ON eod.ProductID = p.ProductID
    INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
    WHERE
        eo.ExportDate BETWEEN @FromDate AND @ToDate
        AND eo.Status = 'COMPLETED'
    GROUP BY p.ProductID, p.ProductCode, p.ProductName, c.CategoryName
    ORDER BY TotalSold DESC;
END;

-- Function: Tính tồn kho có thể bán
CREATE FUNCTION FN_CRM_GetAvailableStock(@ProductID INT, @WarehouseID INT)
RETURNS INT
AS
BEGIN
    DECLARE @AvailableStock INT = 0;

    SELECT @AvailableStock = ISNULL(CurrentStock - ReservedStock, 0)
    FROM CRM_Inventory
    WHERE ProductID = @ProductID AND WarehouseID = @WarehouseID;

    RETURN ISNULL(@AvailableStock, 0);
END;

-- Stored Procedure: Kiểm tra và cảnh báo tồn kho thấp
CREATE PROCEDURE SP_CRM_GetLowStockAlert
AS
BEGIN
    SELECT
        p.ProductCode,
        p.ProductName,
        w.WarehouseName,
        i.CurrentStock,
        p.MinStock,
        (p.MinStock - i.CurrentStock) as ShortageQuantity
    FROM CRM_Inventory i
    INNER JOIN CRM_Products p ON i.ProductID = p.ProductID
    INNER JOIN CRM_Warehouses w ON i.WarehouseID = w.WarehouseID
    WHERE
        i.CurrentStock <= p.MinStock
        AND p.IsActive = 1
        AND w.IsActive = 1
    ORDER BY (p.MinStock - i.CurrentStock) DESC;
END;
