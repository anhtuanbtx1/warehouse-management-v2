import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ApiResponse } from '@/types/warehouse';

export const dynamic = 'force-dynamic';

interface RevenueChartData {
  date?: string;
  month?: number;
  revenue: number;
  profit: number;
  orders: number;
}

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const days = searchParams.get('days');
    const year = searchParams.get('year');
    
    if (year) {
      // Lấy dữ liệu doanh thu theo tháng trong năm
      const yearNum = parseInt(year);
      
      const query = `
        WITH MonthSeries AS (
          SELECT 1 AS Month
          UNION ALL
          SELECT Month + 1 FROM MonthSeries WHERE Month < 12
        ),
        MonthlyRevenue AS (
          SELECT 
            MONTH(i.SaleDate) as MonthNum,
            SUM(i.FinalAmount) as MonthlyRevenue,
            SUM(d.SalePrice - p.ImportPrice) as MonthlyProfit,
            COUNT(DISTINCT i.InvoiceID) as MonthlyOrders
          FROM CRM_SalesInvoices i
          INNER JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
          INNER JOIN CRM_Products p ON d.ProductID = p.ProductID
          WHERE YEAR(i.SaleDate) = @year
          GROUP BY MONTH(i.SaleDate)
        )
        SELECT 
          ms.Month as month,
          ISNULL(mr.MonthlyRevenue, 0) as revenue,
          ISNULL(mr.MonthlyProfit, 0) as profit,
          ISNULL(mr.MonthlyOrders, 0) as orders
        FROM MonthSeries ms
        LEFT JOIN MonthlyRevenue mr ON ms.Month = mr.MonthNum
        ORDER BY ms.Month
      `;

      const result = await executeQuery<RevenueChartData>(query, { year: yearNum });

      const response: ApiResponse<RevenueChartData[]> = {
        success: true,
        data: result
      };

      return NextResponse.json(response);
    } else {
      // Lấy dữ liệu doanh thu theo ngày
      const daysNum = parseInt(days || '30');
      
      const query = `
        WITH DateRange AS (
          SELECT CAST(DATEADD(day, -@days + 1, GETDATE()) AS DATE) AS StartDate,
                 CAST(GETDATE() AS DATE) AS EndDate
        ),
        DateSeries AS (
          SELECT StartDate AS Date
          FROM DateRange
          UNION ALL
          SELECT DATEADD(day, 1, Date)
          FROM DateSeries
          WHERE Date < (SELECT EndDate FROM DateRange)
        ),
        DailyRevenue AS (
          SELECT 
            CAST(i.SaleDate AS DATE) as SaleDate,
            SUM(i.FinalAmount) as DailyRevenue,
            SUM(d.SalePrice - p.ImportPrice) as DailyProfit,
            COUNT(DISTINCT i.InvoiceID) as DailyOrders
          FROM CRM_SalesInvoices i
          INNER JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
          INNER JOIN CRM_Products p ON d.ProductID = p.ProductID
          WHERE i.SaleDate >= DATEADD(day, -@days + 1, GETDATE())
            AND i.SaleDate < DATEADD(day, 1, CAST(GETDATE() AS DATE))
          GROUP BY CAST(i.SaleDate AS DATE)
        )
        SELECT 
          FORMAT(ds.Date, 'yyyy-MM-dd') as date,
          ISNULL(dr.DailyRevenue, 0) as revenue,
          ISNULL(dr.DailyProfit, 0) as profit,
          ISNULL(dr.DailyOrders, 0) as orders
        FROM DateSeries ds
        LEFT JOIN DailyRevenue dr ON ds.Date = dr.SaleDate
        ORDER BY ds.Date
        OPTION (MAXRECURSION 100)
      `;

      const result = await executeQuery<RevenueChartData>(query, { days: daysNum });

      const response: ApiResponse<RevenueChartData[]> = {
        success: true,
        data: result
      };

      return NextResponse.json(response);
    }
  } catch (error) {
    console.error('Error fetching revenue chart data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch revenue chart data' },
      { status: 500 }
    );
  }
}
