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
    
    let result: InventoryReportV2[];

    try {
      // Gọi stored procedure để lấy báo cáo tồn kho
      result = await executeProcedure<InventoryReportV2>('SP_CRM_GetInventoryReport', {
        FromDate: fromDate || null,
        ToDate: toDate || null,
        CategoryID: categoryId ? parseInt(categoryId) : null
      });
    } catch (procError) {
      console.error('SP_CRM_GetInventoryReport failed, attempting to create procedure:', procError);

      try {
        await executeQuery(`
          IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_GetInventoryReport')
          DROP PROCEDURE SP_CRM_GetInventoryReport
        `);

        await executeQuery(`
          CREATE PROCEDURE SP_CRM_GetInventoryReport
            @FromDate DATE = NULL,
            @ToDate DATE = NULL,
            @CategoryID INT = NULL
          AS
          BEGIN
            SET NOCOUNT ON;

            SELECT
              b.BatchCode,
              b.ImportDate,
              c.CategoryName,
              b.TotalQuantity,
              b.TotalImportValue,
              b.TotalSoldQuantity,
              b.TotalSoldValue,
              b.RemainingQuantity,
              b.TotalImportValue / NULLIF(b.TotalQuantity, 0) as AvgImportPrice,
              CASE
                WHEN b.TotalSoldQuantity > 0
                THEN b.TotalSoldValue / b.TotalSoldQuantity
                ELSE 0
              END as AvgSalePrice,
              b.ProfitLoss,
              CASE
                WHEN b.TotalImportValue > 0
                THEN (b.ProfitLoss / b.TotalImportValue) * 100
                ELSE 0
              END as ProfitMarginPercent,
              b.Status,
              b.CreatedAt
            FROM CRM_ImportBatches b
            INNER JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
            WHERE
              (@FromDate IS NULL OR b.ImportDate >= @FromDate)
              AND (@ToDate IS NULL OR b.ImportDate <= @ToDate)
              AND (@CategoryID IS NULL OR b.CategoryID = @CategoryID)
            ORDER BY b.ImportDate DESC, b.CreatedAt DESC;
          END
        `);

        console.log('SP_CRM_GetInventoryReport created successfully, retrying...');

        result = await executeProcedure<InventoryReportV2>('SP_CRM_GetInventoryReport', {
          FromDate: fromDate || null,
          ToDate: toDate || null,
          CategoryID: categoryId ? parseInt(categoryId) : null
        });
      } catch (updateError) {
        console.error('Failed to create SP_CRM_GetInventoryReport, fallback to direct query:', updateError);

        let whereClause = 'WHERE 1=1';
        const params: any = {};

        if (fromDate) {
          whereClause += ' AND b.ImportDate >= @fromDate';
          params.fromDate = fromDate;
        }

        if (toDate) {
          whereClause += ' AND b.ImportDate <= @toDate';
          params.toDate = toDate;
        }

        if (categoryId) {
          whereClause += ' AND b.CategoryID = @categoryId';
          params.categoryId = parseInt(categoryId);
        }

        result = await executeQuery<InventoryReportV2>(`
          SELECT
            b.BatchCode,
            b.ImportDate,
            c.CategoryName,
            b.TotalQuantity,
            b.TotalImportValue,
            b.TotalSoldQuantity,
            b.TotalSoldValue,
            b.RemainingQuantity,
            b.TotalImportValue / NULLIF(b.TotalQuantity, 0) as AvgImportPrice,
            CASE
              WHEN b.TotalSoldQuantity > 0
              THEN b.TotalSoldValue / b.TotalSoldQuantity
              ELSE 0
            END as AvgSalePrice,
            b.ProfitLoss,
            CASE
              WHEN b.TotalImportValue > 0
              THEN (b.ProfitLoss / b.TotalImportValue) * 100
              ELSE 0
            END as ProfitMarginPercent,
            b.Status,
            b.CreatedAt
          FROM CRM_ImportBatches b
          INNER JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
          ${whereClause}
          ORDER BY b.ImportDate DESC, b.CreatedAt DESC
        `, params);
      }
    }
    
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

    const errorDetails = {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    };

    console.error('Inventory report error details:', JSON.stringify(errorDetails, null, 2));

    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch inventory report',
        details: errorDetails.message,
        errorType: errorDetails.name
      },
      { status: 500 }
    );
  }
}




