import { NextRequest, NextResponse } from 'next/server';
import { executeProcedure, executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';

export const dynamic = 'force-dynamic';

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




