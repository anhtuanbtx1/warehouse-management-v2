import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test with absolute minimal insert
    const testQuery = `
      INSERT INTO CRM_SalesInvoices (InvoiceNumber, SaleDate, TotalAmount, FinalAmount)
      OUTPUT INSERTED.InvoiceID, INSERTED.InvoiceNumber
      VALUES ('TEST' + CAST(NEWID() AS NVARCHAR(36)), GETDATE(), 1000000, 1000000)
    `;
    
    const result = await executeQuery(testQuery);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Test insert successful',
        result: result[0]
      }
    });
  } catch (error) {
    console.error('Test insert error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test insert failed',
      details: error instanceof Error ? {
        message: error.message,
        stack: error.stack,
        name: error.name
      } : null
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    // Just check if we can select from the table
    const result = await executeQuery(`
      SELECT TOP 1 * FROM CRM_SalesInvoices ORDER BY InvoiceID DESC
    `);
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Table accessible',
        lastRecord: result[0] || null
      }
    });
  } catch (error) {
    console.error('Test select error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test select failed'
    }, { status: 500 });
  }
}
