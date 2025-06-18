import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';

// Interface cho Inventory Report V2
interface InventoryReportV2 {
  BatchCode: string;
  ImportDate: string;
  CategoryName: string;
  TotalQuantity: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  AvgImportPrice: number;
  AvgSalePrice: number;
  ProfitLoss: number;
  ProfitMarginPercent: number;
  Status: string;
  CreatedAt: string;
}

interface BatchProductDetail {
  ProductID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  Status: string;
  SoldDate?: string;
  InvoiceNumber?: string;
  CustomerInfo?: string;
  CreatedAt: string;
  Profit: number;
}

// GET /api/inventory-v2 - Báo cáo tồn kho theo lô hàng
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const fromDate = searchParams.get('fromDate');
    const toDate = searchParams.get('toDate');
    const categoryId = searchParams.get('categoryId');
    
    // Gọi stored procedure để lấy báo cáo tồn kho
    const result = await executeProcedure<InventoryReportV2>('SP_CRM_GetInventoryReport', {
      FromDate: fromDate || null,
      ToDate: toDate || null,
      CategoryID: categoryId ? parseInt(categoryId) : null
    });
    
    // Tính toán thống kê tổng quan
    const summary = {
      totalBatches: result.length,
      totalImportValue: result.reduce((sum, item) => sum + item.TotalImportValue, 0),
      totalSoldValue: result.reduce((sum, item) => sum + item.TotalSoldValue, 0),
      totalProfitLoss: result.reduce((sum, item) => sum + item.ProfitLoss, 0),
      totalRemainingQuantity: result.reduce((sum, item) => sum + item.RemainingQuantity, 0),
      totalSoldQuantity: result.reduce((sum, item) => sum + item.TotalSoldQuantity, 0),
      avgProfitMargin: result.length > 0 
        ? result.reduce((sum, item) => sum + item.ProfitMarginPercent, 0) / result.length 
        : 0
    };
    
    const response: ApiResponse<any> = {
      success: true,
      data: {
        batches: result,
        summary
      }
    };
    
    return NextResponse.json(response);
  } catch (error) {
    console.error('Error fetching inventory report:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch inventory report' },
      { status: 500 }
    );
  }
}

// GET /api/inventory-v2/batch/[batchId] - Chi tiết sản phẩm trong lô hàng
export async function getBatchDetails(batchId: number) {
  try {
    const result = await executeProcedure<BatchProductDetail>('SP_CRM_GetBatchProductDetails', {
      BatchID: batchId
    });
    
    // Tính toán thống kê cho lô hàng này
    const batchInfo = await executeQuery(`
      SELECT 
        b.*,
        c.CategoryName
      FROM CRM_ImportBatches b
      LEFT JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
      WHERE b.BatchID = @batchId
    `, { batchId });
    
    if (batchInfo.length === 0) {
      return null;
    }
    
    const summary = {
      batchInfo: batchInfo[0],
      totalProducts: result.length,
      soldProducts: result.filter(p => p.Status === 'SOLD').length,
      inStockProducts: result.filter(p => p.Status === 'IN_STOCK').length,
      totalProfit: result.reduce((sum, item) => sum + item.Profit, 0),
      avgProfit: result.length > 0 
        ? result.reduce((sum, item) => sum + item.Profit, 0) / result.length 
        : 0
    };
    
    return {
      products: result,
      summary
    };
  } catch (error) {
    console.error('Error fetching batch details:', error);
    throw error;
  }
}

// GET /api/inventory-v2/stats - Thống kê tổng quan
export async function getInventoryStats() {
  try {
    // Thống kê tổng quan
    const statsQuery = `
      SELECT 
        COUNT(DISTINCT b.BatchID) as TotalBatches,
        COUNT(p.ProductID) as TotalProducts,
        SUM(CASE WHEN p.Status = 'IN_STOCK' THEN 1 ELSE 0 END) as InStockProducts,
        SUM(CASE WHEN p.Status = 'SOLD' THEN 1 ELSE 0 END) as SoldProducts,
        SUM(b.TotalImportValue) as TotalImportValue,
        SUM(b.TotalSoldValue) as TotalSoldValue,
        SUM(b.ProfitLoss) as TotalProfitLoss,
        AVG(CASE WHEN b.TotalImportValue > 0 THEN (b.ProfitLoss / b.TotalImportValue) * 100 ELSE 0 END) as AvgProfitMargin
      FROM CRM_ImportBatches b
      LEFT JOIN CRM_Products p ON b.BatchID = p.BatchID
    `;
    
    const stats = await executeQuery(statsQuery);
    
    // Thống kê theo danh mục
    const categoryStatsQuery = `
      SELECT 
        c.CategoryName,
        COUNT(DISTINCT b.BatchID) as BatchCount,
        COUNT(p.ProductID) as ProductCount,
        SUM(CASE WHEN p.Status = 'IN_STOCK' THEN 1 ELSE 0 END) as InStockCount,
        SUM(CASE WHEN p.Status = 'SOLD' THEN 1 ELSE 0 END) as SoldCount,
        SUM(b.TotalImportValue) as ImportValue,
        SUM(b.TotalSoldValue) as SoldValue,
        SUM(b.ProfitLoss) as ProfitLoss
      FROM CRM_Categories c
      LEFT JOIN CRM_ImportBatches b ON c.CategoryID = b.CategoryID
      LEFT JOIN CRM_Products p ON b.BatchID = p.BatchID
      WHERE c.IsActive = 1
      GROUP BY c.CategoryID, c.CategoryName
      ORDER BY SoldValue DESC
    `;
    
    const categoryStats = await executeQuery(categoryStatsQuery);
    
    // Thống kê bán hàng theo ngày (7 ngày gần nhất)
    const dailySalesQuery = `
      SELECT 
        CAST(i.SaleDate AS DATE) as SaleDate,
        COUNT(i.InvoiceID) as InvoiceCount,
        SUM(i.FinalAmount) as TotalSales,
        COUNT(d.ProductID) as ProductsSold
      FROM CRM_SalesInvoices i
      LEFT JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
      WHERE i.SaleDate >= DATEADD(day, -7, GETDATE())
      GROUP BY CAST(i.SaleDate AS DATE)
      ORDER BY SaleDate DESC
    `;
    
    const dailySales = await executeQuery(dailySalesQuery);
    
    return {
      overview: stats[0],
      categoryStats,
      dailySales
    };
  } catch (error) {
    console.error('Error fetching inventory stats:', error);
    throw error;
  }
}
