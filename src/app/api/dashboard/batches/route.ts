import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

interface BatchSummary {
  batchId: number;
  batchCode: string;
  categoryName: string;
  totalQuantity: number;
  soldQuantity: number;
  remainingQuantity: number;
  totalImportValue: number;
  totalSalesValue: number;
  profit: number;
  profitMargin: number;
  importDate: string;
  status: 'ACTIVE' | 'COMPLETED' | 'PARTIAL';
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const status = searchParams.get('status') || 'all';

    // Get batch summary with product counts and sales data
    const batchQuery = `
      SELECT 
        ib.BatchID,
        ib.BatchCode,
        ib.CategoryID,
        c.CategoryName,
        ib.TotalQuantity,
        ib.TotalImportValue,
        ib.ImportDate,
        ib.Notes,
        COUNT(p.ProductID) as ActualQuantity,
        SUM(CASE WHEN p.Status = 'SOLD' THEN 1 ELSE 0 END) as SoldQuantity,
        SUM(CASE WHEN p.Status = 'IN_STOCK' THEN 1 ELSE 0 END) as RemainingQuantity,
        SUM(CASE WHEN p.Status = 'SOLD' THEN p.SalePrice ELSE 0 END) as TotalSalesValue,
        SUM(CASE WHEN p.Status = 'SOLD' THEN (p.SalePrice - p.ImportPrice) ELSE 0 END) as TotalProfit
      FROM CRM_ImportBatches ib
      LEFT JOIN CRM_Categories c ON ib.CategoryID = c.CategoryID
      LEFT JOIN CRM_Products p ON ib.BatchID = p.BatchID
      GROUP BY ib.BatchID, ib.BatchCode, ib.CategoryID, c.CategoryName, 
               ib.TotalQuantity, ib.TotalImportValue, ib.ImportDate, ib.Notes
      ORDER BY ib.ImportDate DESC
    `;

    const batches = await executeQuery(batchQuery);

    const batchSummaries: BatchSummary[] = batches.map((batch: any) => {
      const soldQuantity = batch.SoldQuantity || 0;
      const remainingQuantity = batch.RemainingQuantity || 0;
      const totalSalesValue = batch.TotalSalesValue || 0;
      const totalProfit = batch.TotalProfit || 0;
      const profitMargin = totalSalesValue > 0 ? (totalProfit / totalSalesValue * 100) : 0;

      let batchStatus: 'ACTIVE' | 'COMPLETED' | 'PARTIAL' = 'ACTIVE';
      if (soldQuantity === batch.TotalQuantity) {
        batchStatus = 'COMPLETED';
      } else if (soldQuantity > 0) {
        batchStatus = 'PARTIAL';
      }

      return {
        batchId: batch.BatchID,
        batchCode: batch.BatchCode,
        categoryName: batch.CategoryName || 'Chưa phân loại',
        totalQuantity: batch.TotalQuantity || 0,
        soldQuantity,
        remainingQuantity,
        totalImportValue: batch.TotalImportValue || 0,
        totalSalesValue,
        profit: totalProfit,
        profitMargin: Math.round(profitMargin * 100) / 100,
        importDate: batch.ImportDate,
        status: batchStatus
      };
    });

    // Filter by status if specified
    let filteredBatches = batchSummaries;
    if (status !== 'all') {
      filteredBatches = batchSummaries.filter(batch => 
        batch.status.toLowerCase() === status.toLowerCase()
      );
    }

    // Limit results
    const limitedBatches = filteredBatches.slice(0, limit);

    // Calculate summary statistics
    const summary = {
      totalBatches: batchSummaries.length,
      activeBatches: batchSummaries.filter(b => b.status === 'ACTIVE').length,
      completedBatches: batchSummaries.filter(b => b.status === 'COMPLETED').length,
      partialBatches: batchSummaries.filter(b => b.status === 'PARTIAL').length,
      totalValue: batchSummaries.reduce((sum, b) => sum + b.totalImportValue, 0),
      totalProfit: batchSummaries.reduce((sum, b) => sum + b.profit, 0),
      avgProfitMargin: batchSummaries.length > 0 
        ? batchSummaries.reduce((sum, b) => sum + b.profitMargin, 0) / batchSummaries.length 
        : 0
    };

    return NextResponse.json({
      success: true,
      data: {
        batches: limitedBatches,
        summary: {
          ...summary,
          avgProfitMargin: Math.round(summary.avgProfitMargin * 100) / 100
        }
      }
    });

  } catch (error) {
    console.error('Batch management error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch batch data'
    }, { status: 500 });
  }
}
