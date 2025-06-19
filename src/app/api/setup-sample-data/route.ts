import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// POST /api/setup-sample-data - Setup sample data for testing
export async function POST(request: NextRequest) {
  try {
    console.log('Setting up sample data...');
    
    // First, create missing tables if needed
    const existingTables = await executeQuery(`
      SELECT TABLE_NAME 
      FROM INFORMATION_SCHEMA.TABLES 
      WHERE TABLE_TYPE = 'BASE TABLE' 
      AND TABLE_NAME LIKE 'CRM_%'
    `);
    
    const tableNames = existingTables.map(t => t.TABLE_NAME);
    console.log('Existing tables:', tableNames);
    
    // Create CRM_SalesInvoices if not exists
    if (!tableNames.includes('CRM_SalesInvoices')) {
      await executeQuery(`
        CREATE TABLE CRM_SalesInvoices (
          InvoiceID INT IDENTITY(1,1) PRIMARY KEY,
          InvoiceNumber NVARCHAR(50) UNIQUE NOT NULL,
          CustomerID INT NULL,
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
        )
      `);
      console.log('Created CRM_SalesInvoices table');
    }
    
    // Create CRM_SalesInvoiceDetails if not exists
    if (!tableNames.includes('CRM_SalesInvoiceDetails')) {
      await executeQuery(`
        CREATE TABLE CRM_SalesInvoiceDetails (
          InvoiceDetailID INT IDENTITY(1,1) PRIMARY KEY,
          InvoiceID INT FOREIGN KEY REFERENCES CRM_SalesInvoices(InvoiceID),
          ProductID INT FOREIGN KEY REFERENCES CRM_Products(ProductID),
          ProductName NVARCHAR(200),
          IMEI NVARCHAR(50),
          SalePrice DECIMAL(18,2) NOT NULL,
          Quantity INT DEFAULT 1,
          TotalPrice DECIMAL(18,2) NOT NULL
        )
      `);
      console.log('Created CRM_SalesInvoiceDetails table');
    }
    
    // Check if we already have sample data
    const existingProducts = await executeQuery(`SELECT COUNT(*) as count FROM CRM_Products`);
    if (existingProducts[0].count > 0) {
      return NextResponse.json({
        success: true,
        message: 'Sample data already exists',
        productsCount: existingProducts[0].count
      });
    }
    
    // Insert sample categories if not exist
    const existingCategories = await executeQuery(`SELECT COUNT(*) as count FROM CRM_Categories`);
    if (existingCategories[0].count === 0) {
      const categories = [
        "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('iPhone 16', 'Dòng iPhone 16 series')",
        "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('iPhone 15', 'Dòng iPhone 15 series')",
        "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('Samsung Galaxy S24', 'Dòng Samsung Galaxy S24 series')",
        "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('Xiaomi 14', 'Dòng Xiaomi 14 series')",
        "INSERT INTO CRM_Categories (CategoryName, Description) VALUES ('OPPO Find X7', 'Dòng OPPO Find X7 series')"
      ];
      
      for (const query of categories) {
        await executeQuery(query);
      }
      console.log('Inserted sample categories');
    }
    
    // Get category IDs
    const categories = await executeQuery(`SELECT CategoryID, CategoryName FROM CRM_Categories`);
    const categoryMap: { [key: string]: number } = {};
    categories.forEach((cat: any) => {
      categoryMap[cat.CategoryName] = cat.CategoryID;
    });
    
    // Insert sample import batches
    const batches = [
      {
        BatchCode: 'LOT20240618001',
        ImportDate: '2024-06-18',
        CategoryID: categoryMap['iPhone 16'],
        TotalQuantity: 3,
        TotalImportValue: 75000000,
        Notes: 'Lô iPhone 16 Pro Max đầu tiên'
      },
      {
        BatchCode: 'LOT20240618002', 
        ImportDate: '2024-06-18',
        CategoryID: categoryMap['Samsung Galaxy S24'],
        TotalQuantity: 2,
        TotalImportValue: 36000000,
        Notes: 'Lô Samsung Galaxy S24 Ultra'
      },
      {
        BatchCode: 'LOT20240618003',
        ImportDate: '2024-06-18', 
        CategoryID: categoryMap['iPhone 15'],
        TotalQuantity: 2,
        TotalImportValue: 40000000,
        Notes: 'Lô iPhone 15 Pro'
      }
    ];
    
    const batchIds = [];
    for (const batch of batches) {
      const result = await executeQuery(`
        INSERT INTO CRM_ImportBatches (BatchCode, ImportDate, CategoryID, TotalQuantity, TotalImportValue, Notes, CreatedBy)
        OUTPUT INSERTED.BatchID
        VALUES (@batchCode, @importDate, @categoryId, @totalQuantity, @totalImportValue, @notes, 'system')
      `, {
        batchCode: batch.BatchCode,
        importDate: batch.ImportDate,
        categoryId: batch.CategoryID,
        totalQuantity: batch.TotalQuantity,
        totalImportValue: batch.TotalImportValue,
        notes: batch.Notes
      });
      batchIds.push(result[0].BatchID);
    }
    console.log('Inserted sample import batches:', batchIds);
    
    // Insert sample products
    const products = [
      // iPhone 16 batch
      { BatchID: batchIds[0], CategoryID: categoryMap['iPhone 16'], ProductName: 'iPhone 16 Pro Max 256GB Natural Titanium', IMEI: '356789012345671', ImportPrice: 25000000 },
      { BatchID: batchIds[0], CategoryID: categoryMap['iPhone 16'], ProductName: 'iPhone 16 Pro Max 512GB Blue Titanium', IMEI: '356789012345672', ImportPrice: 27000000 },
      { BatchID: batchIds[0], CategoryID: categoryMap['iPhone 16'], ProductName: 'iPhone 16 Pro 128GB Black Titanium', IMEI: '356789012345673', ImportPrice: 23000000 },
      
      // Samsung batch
      { BatchID: batchIds[1], CategoryID: categoryMap['Samsung Galaxy S24'], ProductName: 'Samsung Galaxy S24 Ultra 256GB Titanium Gray', IMEI: '356789012345674', ImportPrice: 18000000 },
      { BatchID: batchIds[1], CategoryID: categoryMap['Samsung Galaxy S24'], ProductName: 'Samsung Galaxy S24 Ultra 512GB Titanium Black', IMEI: '356789012345675', ImportPrice: 20000000 },
      
      // iPhone 15 batch  
      { BatchID: batchIds[2], CategoryID: categoryMap['iPhone 15'], ProductName: 'iPhone 15 Pro 128GB Natural Titanium', IMEI: '356789012345676', ImportPrice: 19000000 },
      { BatchID: batchIds[2], CategoryID: categoryMap['iPhone 15'], ProductName: 'iPhone 15 Pro 256GB Blue Titanium', IMEI: '356789012345677', ImportPrice: 21000000 }
    ];
    
    for (const product of products) {
      await executeQuery(`
        INSERT INTO CRM_Products (BatchID, CategoryID, ProductName, IMEI, ImportPrice, Status, CreatedAt)
        VALUES (@batchId, @categoryId, @productName, @imei, @importPrice, 'IN_STOCK', GETDATE())
      `, {
        batchId: product.BatchID,
        categoryId: product.CategoryID,
        productName: product.ProductName,
        imei: product.IMEI,
        importPrice: product.ImportPrice
      });
    }
    console.log('Inserted sample products:', products.length);
    
    return NextResponse.json({
      success: true,
      message: 'Sample data setup completed successfully',
      data: {
        categoriesCount: categories.length,
        batchesCount: batches.length,
        productsCount: products.length,
        batchIds: batchIds
      }
    });
    
  } catch (error) {
    console.error('Error setting up sample data:', error);
    return NextResponse.json({
      success: false,
      error: 'Failed to setup sample data',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}
