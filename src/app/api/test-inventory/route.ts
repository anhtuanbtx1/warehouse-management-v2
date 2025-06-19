import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function GET(request: NextRequest) {
  try {
    // Test inventory calculation
    
    // 1. Get total quantity from all batches
    const batchTotals = await executeQuery(`
      SELECT 
        BatchID,
        BatchCode,
        TotalQuantity,
        TotalImportValue
      FROM CRM_ImportBatches
      ORDER BY ImportDate DESC
    `);
    
    // 2. Get actual products count per batch
    const productCounts = await executeQuery(`
      SELECT 
        p.BatchID,
        ib.BatchCode,
        ib.TotalQuantity as ExpectedQuantity,
        COUNT(p.ProductID) as ActualProductCount,
        SUM(CASE WHEN p.Status = 'IN_STOCK' THEN 1 ELSE 0 END) as InStockCount,
        SUM(CASE WHEN p.Status = 'SOLD' THEN 1 ELSE 0 END) as SoldCount
      FROM CRM_ImportBatches ib
      LEFT JOIN CRM_Products p ON ib.BatchID = p.BatchID
      GROUP BY p.BatchID, ib.BatchCode, ib.TotalQuantity
      ORDER BY ib.ImportDate DESC
    `);
    
    // 3. Get direct product counts
    const directCounts = await executeQuery(`
      SELECT
        COUNT(CASE WHEN Status = 'IN_STOCK' THEN 1 END) as availableProducts,
        COUNT(CASE WHEN Status = 'SOLD' THEN 1 END) as soldProducts,
        COUNT(*) as totalProducts
      FROM CRM_Products
    `);

    // 4. Calculate totals
    const summary = {
      totalBatches: batchTotals.length,
      totalImported: batchTotals.reduce((sum, batch) => sum + (batch.TotalQuantity || 0), 0),
      availableProducts: directCounts[0]?.availableProducts || 0,
      soldProducts: directCounts[0]?.soldProducts || 0,
      totalProducts: directCounts[0]?.totalProducts || 0,
      totalImportValue: batchTotals.reduce((sum, batch) => sum + (batch.TotalImportValue || 0), 0),
      totalStock: 0
    };

    // 5. Calculate stock (Tồn kho = Nhập - Bán)
    summary.totalStock = summary.totalImported - summary.soldProducts;
    
    return NextResponse.json({
      success: true,
      data: {
        summary,
        batchDetails: productCounts,
        calculation: {
          method: 'Phân biệt: Sản phẩm có sẵn vs Tồn kho',
          formulas: {
            availableProducts: `COUNT(Products WHERE Status = 'IN_STOCK') = ${summary.availableProducts}`,
            totalStock: `${summary.totalImported} (nhập) - ${summary.soldProducts} (bán) = ${summary.totalStock}`,
          },
          explanation: {
            availableProducts: 'Số sản phẩm có Status = IN_STOCK (có thể bán ngay)',
            totalStock: 'Tổng tồn kho = Tổng nhập từ lô hàng - Tổng đã bán'
          }
        }
      }
    });
    
  } catch (error) {
    console.error('Test inventory error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Test failed'
    }, { status: 500 });
  }
}
