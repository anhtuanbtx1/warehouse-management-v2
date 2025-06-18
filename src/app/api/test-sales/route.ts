import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Get a sample product to test with
    const products = await executeQuery(`
      SELECT TOP 1 ProductID, ProductName, IMEI, ImportPrice, Status
      FROM CRM_Products 
      WHERE Status = 'IN_STOCK'
      ORDER BY ProductID
    `);
    
    if (products.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No products available for testing'
      });
    }
    
    const product = products[0];
    
    return NextResponse.json({
      success: true,
      data: {
        message: 'Sample product for testing sales API',
        product: product,
        testPayload: {
          ProductID: product.ProductID,
          SalePrice: product.ImportPrice + 1000000, // Add 1M profit
          PaymentMethod: 'CASH'
        }
      }
    });
  } catch (error) {
    console.error('Test sales error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Test the sales API with the provided data
    const salesResponse = await fetch(`${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/api/sales`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(body)
    });
    
    const result = await salesResponse.json();
    
    return NextResponse.json({
      success: true,
      data: {
        statusCode: salesResponse.status,
        response: result
      }
    });
  } catch (error) {
    console.error('Test sales POST error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 });
  }
}
