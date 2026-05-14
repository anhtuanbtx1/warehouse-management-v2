import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { getVietnamToday, getVietnamCurrentMonth } from '@/lib/timezone';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || 'week'; // 'week' | 'month'

    const today = getVietnamToday();
    const { year: thisYear, month: thisMonth } = getVietnamCurrentMonth();

    let dateFilter = '';
    if (period === 'week') {
      dateFilter = `AND CAST(i.SaleDate AS DATE) >= DATEADD(DAY, -6, CAST(@today AS DATE))`;
    } else {
      dateFilter = `AND YEAR(i.SaleDate) = @thisYear AND MONTH(i.SaleDate) = @thisMonth`;
    }

    const rows = await executeQuery(`
      SELECT TOP 10
        p.ProductName,
        p.IMEI,
        c.CategoryName,
        COUNT(d.InvoiceDetailID) as SoldCount,
        SUM(d.SalePrice) as TotalRevenue,
        AVG(d.SalePrice) as AvgPrice
      FROM CRM_SalesInvoiceDetails d
      INNER JOIN CRM_SalesInvoices i ON d.InvoiceID = i.InvoiceID
      INNER JOIN CRM_Products p ON d.ProductID = p.ProductID
      LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      WHERE i.SaleDate IS NOT NULL
      ${dateFilter}
      GROUP BY p.ProductName, p.IMEI, c.CategoryName
      ORDER BY SoldCount DESC, TotalRevenue DESC
    `, { today, thisYear, thisMonth });

    return NextResponse.json({ success: true, data: rows });
  } catch (error) {
    console.error('Error fetching top-selling products:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch top-selling products' }, { status: 500 });
  }
}
