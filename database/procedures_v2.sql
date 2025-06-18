-- =============================================
-- STORED PROCEDURES FOR WAREHOUSE MANAGEMENT V2
-- =============================================

-- Function: Tạo mã lô hàng tự động
CREATE FUNCTION FN_CRM_GenerateBatchCode()
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @BatchCode NVARCHAR(50);
    DECLARE @DateTime NVARCHAR(20);
    
    SET @DateTime = FORMAT(GETDATE(), 'yyyyMMddHHmmss');
    SET @BatchCode = 'LOT' + @DateTime;
    
    RETURN @BatchCode;
END;

-- Function: Tạo số hóa đơn tự động
CREATE FUNCTION FN_CRM_GenerateInvoiceNumber()
RETURNS NVARCHAR(50)
AS
BEGIN
    DECLARE @InvoiceNumber NVARCHAR(50);
    DECLARE @Count INT;
    DECLARE @Today NVARCHAR(8);
    
    SET @Today = FORMAT(GETDATE(), 'yyyyMMdd');
    
    SELECT @Count = COUNT(*) + 1
    FROM CRM_SalesInvoices 
    WHERE FORMAT(CreatedAt, 'yyyyMMdd') = @Today;
    
    SET @InvoiceNumber = 'HD' + @Today + RIGHT('000' + CAST(@Count AS NVARCHAR), 3);
    
    RETURN @InvoiceNumber;
END;

-- Stored Procedure: Tạo phiếu nhập kho (lô hàng)
CREATE PROCEDURE SP_CRM_CreateImportBatch
    @CategoryID INT,
    @ImportDate DATE,
    @TotalQuantity INT,
    @TotalImportValue DECIMAL(18,2),
    @Notes NVARCHAR(1000) = NULL,
    @CreatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @BatchCode NVARCHAR(50);
    DECLARE @BatchID INT;
    
    -- Tạo mã lô hàng tự động
    SET @BatchCode = dbo.FN_CRM_GenerateBatchCode();
    
    -- Kiểm tra mã lô có trùng không (rất hiếm)
    WHILE EXISTS(SELECT 1 FROM CRM_ImportBatches WHERE BatchCode = @BatchCode)
    BEGIN
        WAITFOR DELAY '00:00:01'; -- Đợi 1 giây
        SET @BatchCode = dbo.FN_CRM_GenerateBatchCode();
    END
    
    -- Tạo lô hàng
    INSERT INTO CRM_ImportBatches (
        BatchCode, ImportDate, CategoryID, TotalQuantity, 
        TotalImportValue, Notes, CreatedBy
    )
    VALUES (
        @BatchCode, @ImportDate, @CategoryID, @TotalQuantity,
        @TotalImportValue, @Notes, @CreatedBy
    );
    
    SET @BatchID = SCOPE_IDENTITY();
    
    -- Trả về thông tin lô hàng vừa tạo
    SELECT 
        b.*,
        c.CategoryName
    FROM CRM_ImportBatches b
    LEFT JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
    WHERE b.BatchID = @BatchID;
END;

-- Stored Procedure: Thêm sản phẩm vào lô hàng
CREATE PROCEDURE SP_CRM_AddProductToBatch
    @BatchID INT,
    @ProductName NVARCHAR(200),
    @IMEI NVARCHAR(50),
    @ImportPrice DECIMAL(18,2),
    @Notes NVARCHAR(500) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    DECLARE @CategoryID INT;
    
    -- Lấy CategoryID từ lô hàng
    SELECT @CategoryID = CategoryID 
    FROM CRM_ImportBatches 
    WHERE BatchID = @BatchID;
    
    IF @CategoryID IS NULL
    BEGIN
        RAISERROR('Lô hàng không tồn tại', 16, 1);
        RETURN;
    END
    
    -- Kiểm tra IMEI đã tồn tại chưa
    IF EXISTS(SELECT 1 FROM CRM_Products WHERE IMEI = @IMEI)
    BEGIN
        RAISERROR('IMEI đã tồn tại trong hệ thống', 16, 1);
        RETURN;
    END
    
    -- Thêm sản phẩm
    INSERT INTO CRM_Products (
        BatchID, CategoryID, ProductName, IMEI, ImportPrice, Notes
    )
    VALUES (
        @BatchID, @CategoryID, @ProductName, @IMEI, @ImportPrice, @Notes
    );
    
    -- Trả về thông tin sản phẩm vừa tạo
    SELECT * FROM CRM_Products WHERE ProductID = SCOPE_IDENTITY();
END;

-- Stored Procedure: Lấy danh sách sản phẩm còn hàng để bán
CREATE PROCEDURE SP_CRM_GetAvailableProducts
    @CategoryID INT = NULL,
    @SearchTerm NVARCHAR(200) = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        p.ProductID,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        p.SalePrice,
        p.Status,
        p.CreatedAt,
        c.CategoryName,
        b.BatchCode,
        b.ImportDate
    FROM CRM_Products p
    INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
    INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
    WHERE 
        p.Status = 'IN_STOCK'
        AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
        AND (@SearchTerm IS NULL OR 
             p.ProductName LIKE '%' + @SearchTerm + '%' OR 
             p.IMEI LIKE '%' + @SearchTerm + '%')
    ORDER BY p.CreatedAt DESC;
END;

-- Stored Procedure: Bán sản phẩm và tạo hóa đơn
CREATE PROCEDURE SP_CRM_SellProduct
    @ProductID INT,
    @SalePrice DECIMAL(18,2),
    @CustomerName NVARCHAR(200) = NULL,
    @CustomerPhone NVARCHAR(20) = NULL,
    @PaymentMethod NVARCHAR(50) = 'CASH',
    @CreatedBy NVARCHAR(100)
AS
BEGIN
    SET NOCOUNT ON;
    BEGIN TRANSACTION;
    
    DECLARE @InvoiceNumber NVARCHAR(50);
    DECLARE @InvoiceID INT;
    DECLARE @ProductName NVARCHAR(200);
    DECLARE @IMEI NVARCHAR(50);
    
    TRY
        -- Kiểm tra sản phẩm có thể bán không
        IF NOT EXISTS(SELECT 1 FROM CRM_Products WHERE ProductID = @ProductID AND Status = 'IN_STOCK')
        BEGIN
            RAISERROR('Sản phẩm không có sẵn để bán', 16, 1);
            RETURN;
        END
        
        -- Lấy thông tin sản phẩm
        SELECT @ProductName = ProductName, @IMEI = IMEI
        FROM CRM_Products 
        WHERE ProductID = @ProductID;
        
        -- Tạo số hóa đơn
        SET @InvoiceNumber = dbo.FN_CRM_GenerateInvoiceNumber();
        
        -- Tạo hóa đơn
        INSERT INTO CRM_SalesInvoices (
            InvoiceNumber, CustomerName, CustomerPhone, SaleDate,
            TotalAmount, FinalAmount, PaymentMethod, CreatedBy
        )
        VALUES (
            @InvoiceNumber, @CustomerName, @CustomerPhone, GETDATE(),
            @SalePrice, @SalePrice, @PaymentMethod, @CreatedBy
        );
        
        SET @InvoiceID = SCOPE_IDENTITY();
        
        -- Tạo chi tiết hóa đơn
        INSERT INTO CRM_SalesInvoiceDetails (
            InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice
        )
        VALUES (
            @InvoiceID, @ProductID, @ProductName, @IMEI, @SalePrice, 1, @SalePrice
        );
        
        -- Cập nhật sản phẩm
        UPDATE CRM_Products SET
            SalePrice = @SalePrice,
            Status = 'SOLD',
            SoldDate = GETDATE(),
            InvoiceNumber = @InvoiceNumber,
            CustomerInfo = @CustomerName + ' - ' + ISNULL(@CustomerPhone, ''),
            UpdatedAt = GETDATE()
        WHERE ProductID = @ProductID;
        
        COMMIT TRANSACTION;
        
        -- Trả về thông tin hóa đơn
        SELECT 
            i.*,
            d.ProductName,
            d.IMEI,
            d.SalePrice
        FROM CRM_SalesInvoices i
        INNER JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
        WHERE i.InvoiceID = @InvoiceID;
        
    CATCH
        ROLLBACK TRANSACTION;
        THROW;
    END CATCH
END;

-- Stored Procedure: Báo cáo tồn kho theo lô hàng
CREATE PROCEDURE SP_CRM_GetInventoryReport
    @FromDate DATE = NULL,
    @ToDate DATE = NULL,
    @CategoryID INT = NULL
AS
BEGIN
    SET NOCOUNT ON;
    
    SELECT 
        b.BatchCode,
        b.ImportDate,
        c.CategoryName,
        b.TotalQuantity,
        b.TotalImportValue,
        b.TotalSoldQuantity,
        b.TotalSoldValue,
        b.RemainingQuantity,
        b.TotalImportValue / NULLIF(b.TotalQuantity, 0) as AvgImportPrice,
        CASE 
            WHEN b.TotalSoldQuantity > 0 
            THEN b.TotalSoldValue / b.TotalSoldQuantity 
            ELSE 0 
        END as AvgSalePrice,
        b.ProfitLoss,
        CASE 
            WHEN b.TotalImportValue > 0 
            THEN (b.ProfitLoss / b.TotalImportValue) * 100 
            ELSE 0 
        END as ProfitMarginPercent,
        b.Status,
        b.CreatedAt
    FROM CRM_ImportBatches b
    INNER JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
    WHERE 
        (@FromDate IS NULL OR b.ImportDate >= @FromDate)
        AND (@ToDate IS NULL OR b.ImportDate <= @ToDate)
        AND (@CategoryID IS NULL OR b.CategoryID = @CategoryID)
    ORDER BY b.ImportDate DESC, b.CreatedAt DESC;
END;

-- Stored Procedure: Chi tiết sản phẩm trong lô hàng
CREATE PROCEDURE SP_CRM_GetBatchProductDetails
    @BatchID INT
AS
BEGIN
    SET NOCOUNT ON;
    
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
        p.CreatedAt,
        CASE 
            WHEN p.Status = 'SOLD' THEN p.SalePrice - p.ImportPrice
            ELSE 0
        END as Profit
    FROM CRM_Products p
    WHERE p.BatchID = @BatchID
    ORDER BY p.Status, p.CreatedAt;
END;
