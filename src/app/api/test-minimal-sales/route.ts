import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    // Test absolute minimal sales flow
    const body = await request.json();
    
    // Generate invoice number
    const invoiceNumber = `HD${new Date().getFullYear()}${String(Date.now()).slice(-8)}`;
    
    // Step 1: Test minimal invoice insert
    console.log('Testing minimal invoice insert...');
    const invoiceResult = await executeQuery(`
      INSERT INTO CRM_SalesInvoices (InvoiceNumber, SaleDate, TotalAmount, FinalAmount)
      OUTPUT INSERTED.InvoiceID
      VALUES (@invoiceNumber, @saleDate, @totalAmount, @finalAmount)
    `, {
      invoiceNumber,
      saleDate: new Date().toISOString(),
      totalAmount: body.SalePrice || 1000000,
      finalAmount: body.SalePrice || 1000000
    });
    
    const invoiceId = invoiceResult[0]?.InvoiceID;
    console.log('Invoice created with ID:', invoiceId);
    
    // Step 2: Test invoice details insert
    console.log('Testing invoice details insert...');
    await executeQuery(`
      INSERT INTO CRM_SalesInvoiceDetails (
        InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice
      )
      VALUES (@invoiceId, @productId, @productName, @imei, @salePrice, 1, @totalPrice)
    `, {
      invoiceId,
      productId: body.ProductID || 1,
      productName: 'Test Product',
      imei: 'TEST123456789',
      salePrice: body.SalePrice || 1000000,
      totalPrice: body.SalePrice || 1000000
    });
    
    // Step 3: Test product update
    console.log('Testing product update...');
    await executeQuery(`
      UPDATE CRM_Products SET
        SalePrice = @salePrice,
        Status = 'SOLD',
        SoldDate = GETDATE(),
        InvoiceNumber = @invoiceNumber
      WHERE ProductID = @productId
    `, {
      salePrice: body.SalePrice || 1000000,
      invoiceNumber,
      productId: body.ProductID || 1
    });
    
    return NextResponse.json({
      success: true,
      data: {
        InvoiceID: invoiceId,
        InvoiceNumber: invoiceNumber,
        message: 'Minimal sales flow completed successfully'
      }
    });
    
  } catch (error) {
    console.error('Minimal sales test error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack?.split('\n').slice(0, 5).join('\n'), // First 5 lines of stack
        name: error.name
      } : null
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get available products for testing
    const products = await executeQuery(`
      SELECT TOP 3 ProductID, ProductName, IMEI, ImportPrice, Status
      FROM CRM_Products 
      WHERE Status = 'IN_STOCK'
      ORDER BY ProductID
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Available products for testing',
        products,
        testPayload: products.length > 0 ? {
          ProductID: products[0].ProductID,
          SalePrice: (products[0].ImportPrice || 1000000) + 500000
        } : {
          ProductID: 1,
          SalePrice: 1500000
        }
      }
    });
  } catch (error) {
    console.error('Get test data error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to get test data'
    }, { status: 500 });
  }
}
