-- =============================================
-- WAREHOUSE MANAGEMENT SYSTEM DATABASE SCHEMA V2
-- Thiết kế cho sản phẩm có IMEI (điện thoại)
-- =============================================

-- Bảng danh mục sản phẩm
CREATE TABLE CRM_Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL, -- VD: iPhone 16, Samsung Galaxy S24
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng phiếu nhập kho (Lô hàng)
CREATE TABLE CRM_ImportBatches (
    BatchID INT IDENTITY(1,1) PRIMARY KEY,
    BatchCode NVARCHAR(50) UNIQUE NOT NULL, -- Tự động generate: LOT + YYYYMMDDHHMMSS
    ImportDate DATE NOT NULL, -- Ngày nhập
    CategoryID INT FOREIGN KEY REFERENCES CRM_Categories(CategoryID),
    TotalQuantity INT NOT NULL DEFAULT 0, -- Tổng số lượng nhập
    TotalImportValue DECIMAL(18,2) NOT NULL DEFAULT 0, -- Tổng giá trị nhập
    TotalSoldQuantity INT DEFAULT 0, -- Tổng số lượng đã bán
    TotalSoldValue DECIMAL(18,2) DEFAULT 0, -- Tổng giá trị đã bán
    RemainingQuantity AS (TotalQuantity - TotalSoldQuantity), -- Số lượng tồn
    ProfitLoss AS (TotalSoldValue - (TotalSoldQuantity * (TotalImportValue / NULLIF(TotalQuantity, 0)))), -- Lãi/lỗ
    Status NVARCHAR(20) DEFAULT 'ACTIVE', -- ACTIVE, COMPLETED, CANCELLED
    Notes NVARCHAR(1000),
    CreatedBy NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng sản phẩm (từng máy cụ thể)
CREATE TABLE CRM_Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    BatchID INT FOREIGN KEY REFERENCES CRM_ImportBatches(BatchID), -- Thuộc lô hàng nào
    CategoryID INT FOREIGN KEY REFERENCES CRM_Categories(CategoryID),
    ProductName NVARCHAR(200) NOT NULL, -- VD: iPhone 16 Pro Max 256GB
    IMEI NVARCHAR(50) UNIQUE NOT NULL, -- Mã máy IMEI
    ImportPrice DECIMAL(18,2) NOT NULL, -- Giá nhập
    SalePrice DECIMAL(18,2) DEFAULT 0, -- Giá bán (0 ban đầu)
    Status NVARCHAR(20) DEFAULT 'IN_STOCK', -- IN_STOCK, SOLD, DAMAGED, RETURNED
    SoldDate DATETIME2 NULL, -- Ngày bán
    InvoiceNumber NVARCHAR(50) NULL, -- Số hóa đơn khi bán
    CustomerInfo NVARCHAR(500) NULL, -- Thông tin khách hàng khi bán
    Notes NVARCHAR(500),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng khách hàng (đơn giản hóa)
CREATE TABLE CRM_Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerName NVARCHAR(200) NOT NULL,
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng hóa đơn bán hàng
CREATE TABLE CRM_SalesInvoices (
    InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceNumber NVARCHAR(50) UNIQUE NOT NULL, -- Số hóa đơn tự động
    CustomerID INT FOREIGN KEY REFERENCES CRM_Customers(CustomerID) NULL,
    CustomerName NVARCHAR(200), -- Có thể khách lẻ không lưu vào bảng customers
    CustomerPhone NVARCHAR(20),
    SaleDate DATETIME2 NOT NULL,
    TotalAmount DECIMAL(18,2) NOT NULL,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    FinalAmount DECIMAL(18,2) NOT NULL,
    PaymentMethod NVARCHAR(50), -- CASH, CARD, TRANSFER
    Status NVARCHAR(20) DEFAULT 'COMPLETED', -- COMPLETED, CANCELLED, REFUNDED
    Notes NVARCHAR(500),
    CreatedBy NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng chi tiết hóa đơn
CREATE TABLE CRM_SalesInvoiceDetails (
    InvoiceDetailID INT IDENTITY(1,1) PRIMARY KEY,
    InvoiceID INT FOREIGN KEY REFERENCES CRM_SalesInvoices(InvoiceID),
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    ProductName NVARCHAR(200),
    IMEI NVARCHAR(50),
    SalePrice DECIMAL(18,2) NOT NULL,
    Quantity INT DEFAULT 1, -- Luôn là 1 cho sản phẩm có IMEI
    TotalPrice DECIMAL(18,2) NOT NULL
);

-- Bảng người dùng
CREATE TABLE CRM_Users (
    UserID INT IDENTITY(1,1) PRIMARY KEY,
    Username NVARCHAR(50) UNIQUE NOT NULL,
    Email NVARCHAR(100) UNIQUE NOT NULL,
    PasswordHash NVARCHAR(255) NOT NULL,
    FullName NVARCHAR(100) NOT NULL,
    Role NVARCHAR(20) DEFAULT 'USER', -- ADMIN, MANAGER, USER
    IsActive BIT DEFAULT 1,
    LastLogin DATETIME2,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng cấu hình hệ thống
CREATE TABLE CRM_SystemSettings (
    SettingID INT IDENTITY(1,1) PRIMARY KEY,
    SettingKey NVARCHAR(100) UNIQUE NOT NULL,
    SettingValue NVARCHAR(1000),
    Description NVARCHAR(500),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng lịch sử thay đổi trạng thái sản phẩm
CREATE TABLE CRM_ProductStatusHistory (
    HistoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    OldStatus NVARCHAR(20),
    NewStatus NVARCHAR(20),
    ChangeReason NVARCHAR(500),
    ChangedBy NVARCHAR(100),
    ChangedAt DATETIME2 DEFAULT GETDATE()
);

-- Indexes để tối ưu performance
CREATE INDEX IX_CRM_Products_BatchID ON CRM_Products(BatchID);
CREATE INDEX IX_CRM_Products_IMEI ON CRM_Products(IMEI);
CREATE INDEX IX_CRM_Products_Status ON CRM_Products(Status);
CREATE INDEX IX_CRM_Products_CategoryID ON CRM_Products(CategoryID);
CREATE INDEX IX_CRM_ImportBatches_ImportDate ON CRM_ImportBatches(ImportDate);
CREATE INDEX IX_CRM_ImportBatches_CategoryID ON CRM_ImportBatches(CategoryID);
CREATE INDEX IX_CRM_SalesInvoices_SaleDate ON CRM_SalesInvoices(SaleDate);
CREATE INDEX IX_CRM_SalesInvoices_InvoiceNumber ON CRM_SalesInvoices(InvoiceNumber);

-- Constraints
ALTER TABLE CRM_Products ADD CONSTRAINT CK_CRM_Products_ImportPrice CHECK (ImportPrice > 0);
ALTER TABLE CRM_Products ADD CONSTRAINT CK_CRM_Products_SalePrice CHECK (SalePrice >= 0);
ALTER TABLE CRM_ImportBatches ADD CONSTRAINT CK_CRM_ImportBatches_TotalQuantity CHECK (TotalQuantity > 0);
ALTER TABLE CRM_ImportBatches ADD CONSTRAINT CK_CRM_ImportBatches_TotalImportValue CHECK (TotalImportValue > 0);
ALTER TABLE CRM_SalesInvoices ADD CONSTRAINT CK_CRM_SalesInvoices_FinalAmount CHECK (FinalAmount >= 0);

-- Triggers để tự động cập nhật thống kê lô hàng
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
            UpdatedAt = GETDATE()
        FROM CRM_ImportBatches b
        INNER JOIN inserted i ON b.BatchID = i.BatchID;
    END
END;

-- Trigger để ghi lại lịch sử thay đổi trạng thái
CREATE TRIGGER TR_CRM_Products_StatusHistory
ON CRM_Products
AFTER UPDATE
AS
BEGIN
    SET NOCOUNT ON;
    
    IF UPDATE(Status)
    BEGIN
        INSERT INTO CRM_ProductStatusHistory (ProductID, OldStatus, NewStatus, ChangeReason, ChangedBy)
        SELECT 
            i.ProductID,
            d.Status,
            i.Status,
            'Status changed via system',
            SYSTEM_USER
        FROM inserted i
        INNER JOIN deleted d ON i.ProductID = d.ProductID
        WHERE i.Status != d.Status;
    END
END;
