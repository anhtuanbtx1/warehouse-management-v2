-- ============================================================
-- SEED DATA: 30 hóa đơn mẫu để test pagination
-- Chạy script này trực tiếp trên SQL Server (DB: PhoneStores)
-- ============================================================

USE PhoneStores;
GO

-- Lấy ProductID mẫu từ bảng CRM_Products
DECLARE @P1 INT, @P2 INT, @P3 INT, @P4 INT, @P5 INT;
DECLARE @PN1 NVARCHAR(255), @PN2 NVARCHAR(255), @PN3 NVARCHAR(255), @PN4 NVARCHAR(255), @PN5 NVARCHAR(255);
DECLARE @IP1 DECIMAL(18,2), @IP2 DECIMAL(18,2), @IP3 DECIMAL(18,2), @IP4 DECIMAL(18,2), @IP5 DECIMAL(18,2);

SELECT TOP 5
    @P1 = MAX(CASE WHEN rn = 1 THEN ProductID END),
    @P2 = MAX(CASE WHEN rn = 2 THEN ProductID END),
    @P3 = MAX(CASE WHEN rn = 3 THEN ProductID END),
    @P4 = MAX(CASE WHEN rn = 4 THEN ProductID END),
    @P5 = MAX(CASE WHEN rn = 5 THEN ProductID END),
    @PN1 = MAX(CASE WHEN rn = 1 THEN ProductName END),
    @PN2 = MAX(CASE WHEN rn = 2 THEN ProductName END),
    @PN3 = MAX(CASE WHEN rn = 3 THEN ProductName END),
    @PN4 = MAX(CASE WHEN rn = 4 THEN ProductName END),
    @PN5 = MAX(CASE WHEN rn = 5 THEN ProductName END),
    @IP1 = MAX(CASE WHEN rn = 1 THEN ISNULL(ImportPrice, 10000000) END),
    @IP2 = MAX(CASE WHEN rn = 2 THEN ISNULL(ImportPrice, 10000000) END),
    @IP3 = MAX(CASE WHEN rn = 3 THEN ISNULL(ImportPrice, 10000000) END),
    @IP4 = MAX(CASE WHEN rn = 4 THEN ISNULL(ImportPrice, 10000000) END),
    @IP5 = MAX(CASE WHEN rn = 5 THEN ISNULL(ImportPrice, 10000000) END)
FROM (
    SELECT ProductID, ProductName, ImportPrice,
           ROW_NUMBER() OVER (ORDER BY ProductID DESC) AS rn
    FROM CRM_Products
) t WHERE rn <= 5;

-- Fallback nếu không đủ 5 products
IF @P2 IS NULL SET @P2 = @P1; SET @PN2 = @PN1; SET @IP2 = @IP1;
IF @P3 IS NULL BEGIN SET @P3 = @P1; SET @PN3 = @PN1; SET @IP3 = @IP1; END
IF @P4 IS NULL BEGIN SET @P4 = @P1; SET @PN4 = @PN1; SET @IP4 = @IP1; END
IF @P5 IS NULL BEGIN SET @P5 = @P1; SET @PN5 = @PN1; SET @IP5 = @IP1; END

-- Đếm số hóa đơn hiện tại để tạo số không trùng
DECLARE @BaseCount INT;
SELECT @BaseCount = COUNT(*) + 1 FROM CRM_SalesInvoices;

DECLARE @BaseYear INT = YEAR(GETDATE());
DECLARE @Now DATETIME = GETDATE();

-- ============================================================
-- INSERT 30 hóa đơn mẫu
-- ============================================================
DECLARE @InvoiceTable TABLE (InvoiceID INT, Idx INT, ProductID INT, ProductName NVARCHAR(255), SalePrice DECIMAL(18,2));

INSERT INTO CRM_SalesInvoices (InvoiceNumber, SaleDate, TotalAmount, FinalAmount, PaymentMethod)
OUTPUT INSERTED.InvoiceID INTO @InvoiceTable(InvoiceID)
VALUES
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  0), 6)), DATEADD(DAY,  -0, @Now), @IP1 + 500000,  @IP1 + 500000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  1), 6)), DATEADD(DAY,  -3, @Now), @IP2 + 1000000, @IP2 + 1000000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  2), 6)), DATEADD(DAY,  -5, @Now), @IP3 + 800000,  @IP3 + 800000,  'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  3), 6)), DATEADD(DAY,  -7, @Now), @IP4 + 1500000, @IP4 + 1500000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  4), 6)), DATEADD(DAY, -10, @Now), @IP5 + 2000000, @IP5 + 2000000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  5), 6)), DATEADD(DAY, -12, @Now), @IP1 + 600000,  @IP1 + 600000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  6), 6)), DATEADD(DAY, -15, @Now), @IP2 + 1200000, @IP2 + 1200000, 'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  7), 6)), DATEADD(DAY, -18, @Now), @IP3 + 900000,  @IP3 + 900000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  8), 6)), DATEADD(DAY, -20, @Now), @IP4 + 1800000, @IP4 + 1800000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount +  9), 6)), DATEADD(DAY, -22, @Now), @IP5 + 2500000, @IP5 + 2500000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 10), 6)), DATEADD(DAY, -25, @Now), @IP1 + 700000,  @IP1 + 700000,  'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 11), 6)), DATEADD(DAY, -28, @Now), @IP2 + 1100000, @IP2 + 1100000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 12), 6)), DATEADD(DAY, -30, @Now), @IP3 + 750000,  @IP3 + 750000,  'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 13), 6)), DATEADD(DAY, -33, @Now), @IP4 + 1600000, @IP4 + 1600000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 14), 6)), DATEADD(DAY, -35, @Now), @IP5 + 2200000, @IP5 + 2200000, 'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 15), 6)), DATEADD(DAY, -38, @Now), @IP1 + 550000,  @IP1 + 550000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 16), 6)), DATEADD(DAY, -40, @Now), @IP2 + 1300000, @IP2 + 1300000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 17), 6)), DATEADD(DAY, -42, @Now), @IP3 + 850000,  @IP3 + 850000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 18), 6)), DATEADD(DAY, -45, @Now), @IP4 + 1700000, @IP4 + 1700000, 'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 19), 6)), DATEADD(DAY, -48, @Now), @IP5 + 2300000, @IP5 + 2300000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 20), 6)), DATEADD(DAY, -50, @Now), @IP1 + 650000,  @IP1 + 650000,  'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 21), 6)), DATEADD(DAY, -53, @Now), @IP2 + 1400000, @IP2 + 1400000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 22), 6)), DATEADD(DAY, -55, @Now), @IP3 + 950000,  @IP3 + 950000,  'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 23), 6)), DATEADD(DAY, -58, @Now), @IP4 + 1900000, @IP4 + 1900000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 24), 6)), DATEADD(DAY, -60, @Now), @IP5 + 2100000, @IP5 + 2100000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 25), 6)), DATEADD(DAY, -63, @Now), @IP1 + 450000,  @IP1 + 450000,  'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 26), 6)), DATEADD(DAY, -65, @Now), @IP2 + 950000,  @IP2 + 950000,  'CARD'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 27), 6)), DATEADD(DAY, -68, @Now), @IP3 + 1050000, @IP3 + 1050000, 'CASH'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 28), 6)), DATEADD(DAY, -70, @Now), @IP4 + 2000000, @IP4 + 2000000, 'TRANSFER'),
  (CONCAT('HD', @BaseYear, RIGHT(CONCAT('000000', @BaseCount + 29), 6)), DATEADD(DAY, -72, @Now), @IP5 + 2400000, @IP5 + 2400000, 'CASH');

-- Cập nhật index và product info vào temp table
UPDATE t SET
    Idx = rn - 1,
    ProductID = CASE ((rn-1) % 5)
        WHEN 0 THEN @P1 WHEN 1 THEN @P2 WHEN 2 THEN @P3 WHEN 3 THEN @P4 ELSE @P5 END,
    ProductName = CASE ((rn-1) % 5)
        WHEN 0 THEN @PN1 WHEN 1 THEN @PN2 WHEN 2 THEN @PN3 WHEN 3 THEN @PN4 ELSE @PN5 END,
    SalePrice = CASE ((rn-1) % 5)
        WHEN 0 THEN @IP1 + 500000*(rn) WHEN 1 THEN @IP2 + 500000*(rn)
        WHEN 2 THEN @IP3 + 500000*(rn) WHEN 3 THEN @IP4 + 500000*(rn)
        ELSE @IP5 + 500000*(rn) END
FROM @InvoiceTable t
CROSS APPLY (SELECT ROW_NUMBER() OVER (ORDER BY InvoiceID) AS rn FROM @InvoiceTable WHERE InvoiceID = t.InvoiceID) x;

-- Insert details
INSERT INTO CRM_SalesInvoiceDetails (InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice)
SELECT
    InvoiceID,
    ProductID,
    ProductName,
    CONCAT('IMEI-SAMPLE-', RIGHT(CONCAT('00000000', InvoiceID), 8)),
    SalePrice,
    1,
    SalePrice
FROM @InvoiceTable;

-- Kiểm tra kết quả
SELECT COUNT(*) AS TotalInvoices FROM CRM_SalesInvoices;
SELECT TOP 5 InvoiceNumber, SaleDate, FinalAmount, PaymentMethod FROM CRM_SalesInvoices ORDER BY InvoiceID DESC;
GO
