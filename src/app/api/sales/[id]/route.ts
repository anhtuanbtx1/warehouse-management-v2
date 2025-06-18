import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import sql from 'mssql';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const invoiceId = parseInt(params.id);
    if (isNaN(invoiceId)) {
      return NextResponse.json(
        { success: false, error: 'ID hóa đơn không hợp lệ' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Get detailed invoice information with product details
    const result = await pool.request()
      .input('InvoiceID', sql.Int, invoiceId)
      .query(`
        SELECT
          i.InvoiceID,
          i.InvoiceNumber,
          i.CustomerName,
          i.CustomerPhone,
          i.SaleDate,
          i.TotalAmount,
          i.FinalAmount,
          i.PaymentMethod,
          i.Status,
          d.ProductID,
          d.ProductName,
          d.IMEI,
          d.SalePrice as ProductSalePrice,
          p.ImportPrice,
          c.CategoryName,
          b.BatchCode,
          b.ImportDate
        FROM CRM_SalesInvoices i
        LEFT JOIN CRM_SalesInvoiceDetails d ON i.InvoiceID = d.InvoiceID
        LEFT JOIN CRM_Products p ON d.ProductID = p.ProductID
        LEFT JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
        LEFT JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
        WHERE i.InvoiceID = @InvoiceID
      `);

    if (result.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy hóa đơn' },
        { status: 404 }
      );
    }

    const invoice = result.recordset[0];

    return NextResponse.json({
      success: true,
      data: {
        InvoiceID: invoice.InvoiceID,
        InvoiceNumber: invoice.InvoiceNumber,
        CustomerName: invoice.CustomerName,
        CustomerPhone: invoice.CustomerPhone,
        SaleDate: invoice.SaleDate,
        TotalAmount: invoice.TotalAmount,
        FinalAmount: invoice.FinalAmount,
        PaymentMethod: invoice.PaymentMethod,
        Status: invoice.Status,
        ProductID: invoice.ProductID,
        ProductName: invoice.ProductName,
        IMEI: invoice.IMEI,
        ImportPrice: invoice.ImportPrice,
        ProductSalePrice: invoice.ProductSalePrice,
        CategoryName: invoice.CategoryName,
        BatchCode: invoice.BatchCode,
        ImportDate: invoice.ImportDate,
        Profit: (invoice.ProductSalePrice || invoice.FinalAmount) - (invoice.ImportPrice || 0),
        ProfitMargin: invoice.ImportPrice ? 
          (((invoice.ProductSalePrice || invoice.FinalAmount) - invoice.ImportPrice) / invoice.ImportPrice) * 100 : 0
      }
    });

  } catch (error) {
    console.error('Error fetching invoice details:', error);
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    });
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi lấy chi tiết hóa đơn' },
      { status: 500 }
    );
  }
}
