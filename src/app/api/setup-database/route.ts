import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// POST /api/setup-database - Setup database schema
export async function POST(request: NextRequest) {
  try {
    console.log('Starting database setup...');
    
    // Check if tables already exist
    const existingTables = await executeQuery(`
      SELECT TABLE_NAME
      FROM INFORMATION_SCHEMA.TABLES
      WHERE TABLE_TYPE = 'BASE TABLE'
      AND TABLE_NAME LIKE 'CRM_%'
    `);

    console.log('Existing tables:', existingTables.map(t => t.TABLE_NAME));
    
    // Create missing tables
    const createTablesQueries = [];

    // Check and create Categories table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_Categories')) {
      createTablesQueries.push(`CREATE TABLE CRM_Categories (
        CategoryID INT IDENTITY(1,1) PRIMARY KEY,
        CategoryName NVARCHAR(100) NOT NULL,
        Description NVARCHAR(500),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create Import Batches table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_ImportBatches')) {
      createTablesQueries.push(`CREATE TABLE CRM_ImportBatches (
        BatchID INT IDENTITY(1,1) PRIMARY KEY,
        BatchCode NVARCHAR(50) UNIQUE NOT NULL,
        ImportDate DATE NOT NULL,
        CategoryID INT FOREIGN KEY REFERENCES CRM_Categories(CategoryID),
        TotalQuantity INT NOT NULL DEFAULT 0,
        TotalImportValue DECIMAL(18,2) NOT NULL DEFAULT 0,
        TotalSoldQuantity INT DEFAULT 0,
        TotalSoldValue DECIMAL(18,2) DEFAULT 0,
        RemainingQuantity AS (TotalQuantity - TotalSoldQuantity),
        ProfitLoss AS (TotalSoldValue - (TotalSoldQuantity * (TotalImportValue / NULLIF(TotalQuantity, 0)))),
        Status NVARCHAR(20) DEFAULT 'ACTIVE',
        Notes NVARCHAR(1000),
        CreatedBy NVARCHAR(100),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create Products table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_Products')) {
      createTablesQueries.push(`CREATE TABLE CRM_Products (
        ProductID INT IDENTITY(1,1) PRIMARY KEY,
        BatchID INT FOREIGN KEY REFERENCES CRM_ImportBatches(BatchID),
        CategoryID INT FOREIGN KEY REFERENCES CRM_Categories(CategoryID),
        ProductName NVARCHAR(200) NOT NULL,
        IMEI NVARCHAR(50) UNIQUE NOT NULL,
        ImportPrice DECIMAL(18,2) NOT NULL,
        SalePrice DECIMAL(18,2) DEFAULT 0,
        Status NVARCHAR(20) DEFAULT 'IN_STOCK',
        SoldDate DATETIME2 NULL,
        InvoiceNumber NVARCHAR(50) NULL,
        CustomerInfo NVARCHAR(500) NULL,
        Notes NVARCHAR(500),
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create Customers table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_Customers')) {
      createTablesQueries.push(`CREATE TABLE CRM_Customers (
        CustomerID INT IDENTITY(1,1) PRIMARY KEY,
        CustomerName NVARCHAR(200) NOT NULL,
        Phone NVARCHAR(20),
        Email NVARCHAR(100),
        Address NVARCHAR(500),
        IsActive BIT DEFAULT 1,
        CreatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create Sales Invoices table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_SalesInvoices')) {
      createTablesQueries.push(`CREATE TABLE CRM_SalesInvoices (
        InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceNumber NVARCHAR(50) UNIQUE NOT NULL,
        CustomerID INT FOREIGN KEY REFERENCES CRM_Customers(CustomerID) NULL,
        CustomerName NVARCHAR(200),
        CustomerPhone NVARCHAR(20),
        SaleDate DATETIME2 NOT NULL,
        TotalAmount DECIMAL(18,2) NOT NULL,
        TaxAmount DECIMAL(18,2) DEFAULT 0,
        DiscountAmount DECIMAL(18,2) DEFAULT 0,
        FinalAmount DECIMAL(18,2) NOT NULL,
        PaymentMethod NVARCHAR(50),
        Status NVARCHAR(20) DEFAULT 'COMPLETED',
        Notes NVARCHAR(500),
        CreatedBy NVARCHAR(100),
        CreatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create Sales Invoice Details table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_SalesInvoiceDetails')) {
      createTablesQueries.push(`CREATE TABLE CRM_SalesInvoiceDetails (
        InvoiceDetailID INT IDENTITY(1,1) PRIMARY KEY,
        InvoiceID INT FOREIGN KEY REFERENCES CRM_SalesInvoices(InvoiceID),
        ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
        ProductName NVARCHAR(200),
        IMEI NVARCHAR(50),
        SalePrice DECIMAL(18,2) NOT NULL,
        Quantity INT DEFAULT 1,
        TotalPrice DECIMAL(18,2) NOT NULL
      )`);
    }

    // Check and create Users table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_Users')) {
      createTablesQueries.push(`CREATE TABLE CRM_Users (
        UserID INT IDENTITY(1,1) PRIMARY KEY,
        Username NVARCHAR(50) UNIQUE NOT NULL,
        Email NVARCHAR(100) UNIQUE NOT NULL,
        PasswordHash NVARCHAR(255) NOT NULL,
        FullName NVARCHAR(100) NOT NULL,
        Role NVARCHAR(20) DEFAULT 'USER',
        IsActive BIT DEFAULT 1,
        LastLogin DATETIME2,
        CreatedAt DATETIME2 DEFAULT GETDATE(),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }

    // Check and create System Settings table if not exists
    if (!existingTables.find(t => t.TABLE_NAME === 'CRM_SystemSettings')) {
      createTablesQueries.push(`CREATE TABLE CRM_SystemSettings (
        SettingID INT IDENTITY(1,1) PRIMARY KEY,
        SettingKey NVARCHAR(100) UNIQUE NOT NULL,
        SettingValue NVARCHAR(1000),
        Description NVARCHAR(500),
        UpdatedAt DATETIME2 DEFAULT GETDATE()
      )`);
    }
    
    // Execute table creation queries
    for (let i = 0; i < createTablesQueries.length; i++) {
      console.log(`Creating table ${i + 1}/${createTablesQueries.length}...`);
      await executeQuery(createTablesQueries[i]);
    }
    
    // Insert sample categories
    const sampleCategories = [
      "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('iPhone 16', 'Dòng iPhone 16 series')",
      "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('iPhone 15', 'Dòng iPhone 15 series')",
      "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('Samsung Galaxy S24', 'Dòng Samsung Galaxy S24 series')",
      "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('Xiaomi 14', 'Dòng Xiaomi 14 series')",
      "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('OPPO Find X7', 'Dòng OPPO Find X7 series')"
    ];
    
    for (const query of sampleCategories) {
      await executeQuery(query);
    }
    
    // Insert sample user
    await executeQuery(`
      INSERT INTO CRM_Users (Username, Email, PasswordHash, FullName, Role) 
      VALUES ('admin', 'admin@phonestore.com', '$2b$10$hash_here', 'Quản trị viên', 'ADMIN')
    `);
    
    console.log('Database setup completed successfully');
    
    return NextResponse.json({
      success: true,
      message: 'Database setup completed successfully',
      tablesCreated: createTablesQueries.length,
      categoriesInserted: sampleCategories.length
    });
    
  } catch (error) {
    console.error('Database setup error:', error);
    return NextResponse.json({
      success: false,
      error: 'Database setup failed',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
