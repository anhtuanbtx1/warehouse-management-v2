-- =============================================
-- WAREHOUSE MANAGEMENT SYSTEM DATABASE SCHEMA
-- =============================================

-- Bảng danh mục sản phẩm
CREATE TABLE CRM_Categories (
    CategoryID INT IDENTITY(1,1) PRIMARY KEY,
    CategoryName NVARCHAR(100) NOT NULL,
    Description NVARCHAR(500),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng đơn vị tính
CREATE TABLE CRM_Units (
    UnitID INT IDENTITY(1,1) PRIMARY KEY,
    UnitName NVARCHAR(50) NOT NULL,
    UnitSymbol NVARCHAR(10) NOT NULL,
    IsActive BIT DEFAULT 1
);

-- Bảng sản phẩm
CREATE TABLE CRM_Products (
    ProductID INT IDENTITY(1,1) PRIMARY KEY,
    ProductCode NVARCHAR(50) UNIQUE NOT NULL,
    ProductName NVARCHAR(200) NOT NULL,
    CategoryID INT FOREIGN KEY REFERENCES CRM_Categories(CategoryID),
    UnitID INT FOREIGN KEY REFERENCES CRM_Units(UnitID),
    Description NVARCHAR(1000),
    CostPrice DECIMAL(18,2) DEFAULT 0,
    SalePrice DECIMAL(18,2) DEFAULT 0,
    MinStock INT DEFAULT 0,
    MaxStock INT DEFAULT 0,
    ImageUrl NVARCHAR(500),
    Barcode NVARCHAR(100),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng nhà cung cấp
CREATE TABLE CRM_Suppliers (
    SupplierID INT IDENTITY(1,1) PRIMARY KEY,
    SupplierCode NVARCHAR(50) UNIQUE NOT NULL,
    SupplierName NVARCHAR(200) NOT NULL,
    ContactPerson NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    TaxCode NVARCHAR(50),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng khách hàng
CREATE TABLE CRM_Customers (
    CustomerID INT IDENTITY(1,1) PRIMARY KEY,
    CustomerCode NVARCHAR(50) UNIQUE NOT NULL,
    CustomerName NVARCHAR(200) NOT NULL,
    ContactPerson NVARCHAR(100),
    Phone NVARCHAR(20),
    Email NVARCHAR(100),
    Address NVARCHAR(500),
    TaxCode NVARCHAR(50),
    CustomerType NVARCHAR(20) DEFAULT 'RETAIL', -- RETAIL, WHOLESALE
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng kho
CREATE TABLE CRM_Warehouses (
    WarehouseID INT IDENTITY(1,1) PRIMARY KEY,
    WarehouseCode NVARCHAR(50) UNIQUE NOT NULL,
    WarehouseName NVARCHAR(200) NOT NULL,
    Address NVARCHAR(500),
    ManagerName NVARCHAR(100),
    Phone NVARCHAR(20),
    IsActive BIT DEFAULT 1,
    CreatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng phiếu nhập hàng
CREATE TABLE CRM_ImportOrders (
    ImportOrderID INT IDENTITY(1,1) PRIMARY KEY,
    ImportOrderCode NVARCHAR(50) UNIQUE NOT NULL,
    SupplierID INT FOREIGN KEY REFERENCES CRM_Suppliers(SupplierID),
    WarehouseID INT FOREIGN KEY REFERENCES CRM_Warehouses(WarehouseID),
    ImportDate DATETIME2 NOT NULL,
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    FinalAmount DECIMAL(18,2) DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    Notes NVARCHAR(1000),
    CreatedBy NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng chi tiết phiếu nhập
CREATE TABLE CRM_ImportOrderDetails (
    ImportOrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    ImportOrderID INT FOREIGN KEY REFERENCES CRM_ImportOrders(ImportOrderID),
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    TotalPrice DECIMAL(18,2) NOT NULL,
    ExpiryDate DATETIME2,
    BatchNumber NVARCHAR(50),
    Notes NVARCHAR(500)
);

-- Bảng phiếu xuất hàng
CREATE TABLE CRM_ExportOrders (
    ExportOrderID INT IDENTITY(1,1) PRIMARY KEY,
    ExportOrderCode NVARCHAR(50) UNIQUE NOT NULL,
    CustomerID INT FOREIGN KEY REFERENCES CRM_Customers(CustomerID),
    WarehouseID INT FOREIGN KEY REFERENCES CRM_Warehouses(WarehouseID),
    ExportDate DATETIME2 NOT NULL,
    TotalAmount DECIMAL(18,2) DEFAULT 0,
    TaxAmount DECIMAL(18,2) DEFAULT 0,
    DiscountAmount DECIMAL(18,2) DEFAULT 0,
    FinalAmount DECIMAL(18,2) DEFAULT 0,
    Status NVARCHAR(20) DEFAULT 'PENDING', -- PENDING, COMPLETED, CANCELLED
    PaymentStatus NVARCHAR(20) DEFAULT 'UNPAID', -- PAID, UNPAID, PARTIAL
    Notes NVARCHAR(1000),
    CreatedBy NVARCHAR(100),
    CreatedAt DATETIME2 DEFAULT GETDATE(),
    UpdatedAt DATETIME2 DEFAULT GETDATE()
);

-- Bảng chi tiết phiếu xuất
CREATE TABLE CRM_ExportOrderDetails (
    ExportOrderDetailID INT IDENTITY(1,1) PRIMARY KEY,
    ExportOrderID INT FOREIGN KEY REFERENCES CRM_ExportOrders(ExportOrderID),
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    Quantity INT NOT NULL,
    UnitPrice DECIMAL(18,2) NOT NULL,
    TotalPrice DECIMAL(18,2) NOT NULL,
    BatchNumber NVARCHAR(50),
    Notes NVARCHAR(500)
);

-- Bảng tồn kho
CREATE TABLE CRM_Inventory (
    InventoryID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    WarehouseID INT FOREIGN KEY REFERENCES CRM_Warehouses(WarehouseID),
    CurrentStock INT DEFAULT 0,
    ReservedStock INT DEFAULT 0, -- Hàng đã đặt nhưng chưa xuất
    AvailableStock AS (CurrentStock - ReservedStock),
    LastUpdated DATETIME2 DEFAULT GETDATE(),
    UNIQUE(ProductID, WarehouseID)
);

-- Bảng lịch sử xuất nhập tồn
CREATE TABLE CRM_StockMovements (
    MovementID INT IDENTITY(1,1) PRIMARY KEY,
    ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
    WarehouseID INT FOREIGN KEY REFERENCES CRM_Warehouses(WarehouseID),
    MovementType NVARCHAR(20) NOT NULL, -- IMPORT, EXPORT, ADJUSTMENT
    ReferenceType NVARCHAR(20), -- IMPORT_ORDER, EXPORT_ORDER, ADJUSTMENT
    ReferenceID INT,
    Quantity INT NOT NULL, -- Dương: nhập, Âm: xuất
    UnitPrice DECIMAL(18,2),
    PreviousStock INT,
    NewStock INT,
    MovementDate DATETIME2 DEFAULT GETDATE(),
    Notes NVARCHAR(500),
    CreatedBy NVARCHAR(100)
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

-- Indexes để tối ưu performance
CREATE INDEX IX_CRM_Products_CategoryID ON CRM_Products(CategoryID);
CREATE INDEX IX_CRM_Products_ProductCode ON CRM_Products(ProductCode);
CREATE INDEX IX_CRM_ImportOrders_SupplierID ON CRM_ImportOrders(SupplierID);
CREATE INDEX IX_CRM_ImportOrders_ImportDate ON CRM_ImportOrders(ImportDate);
CREATE INDEX IX_CRM_ExportOrders_CustomerID ON CRM_ExportOrders(CustomerID);
CREATE INDEX IX_CRM_ExportOrders_ExportDate ON CRM_ExportOrders(ExportDate);
CREATE INDEX IX_CRM_Inventory_ProductID ON CRM_Inventory(ProductID);
CREATE INDEX IX_CRM_StockMovements_ProductID ON CRM_StockMovements(ProductID);
CREATE INDEX IX_CRM_StockMovements_MovementDate ON CRM_StockMovements(MovementDate);
