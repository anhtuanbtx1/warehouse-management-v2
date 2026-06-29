import { NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export async function POST() {
  try {
    // Lấy 1 product để reference
    const products = await executeQuery<any>(`
      SELECT TOP 5 ProductID, ProductName, IMEI, ImportPrice
      FROM CRM_Products
      ORDER BY ProductID DESC
    `);

    if (products.length === 0) {
      return NextResponse.json({ success: false, error: 'Không có sản phẩm nào trong DB' }, { status: 400 });
    }

    // Lấy count hiện tại
    const countResult = await executeQuery<any>(`SELECT COUNT(*) as cnt FROM CRM_SalesInvoices`);
    const startIndex = (countResult[0]?.cnt || 0) + 1;

    const paymentMethods = ['CASH', 'CARD', 'TRANSFER'];
    const now = new Date();

    // Build bulk INSERT values cho 25 hóa đơn
    const invoiceRows: string[] = [];
    for (let i = 0; i < 25; i++) {
      const product = products[i % products.length];
      const pm = paymentMethods[i % 3];
      const salePrice = (product.ImportPrice || 10000000) + (i + 1) * 500000;
      const daysAgo = i * 5; // mỗi hóa đơn cách nhau 5 ngày
      const saleDate = new Date(now);
      saleDate.setDate(saleDate.getDate() - daysAgo);
      const saleDateStr = saleDate.toISOString().replace('T', ' ').substring(0, 19);
      const year = saleDate.getFullYear();
      const invoiceNumber = `HD${year}${(startIndex + i).toString().padStart(6, '0')}`;

      invoiceRows.push(
        `('${invoiceNumber}', '${saleDateStr}', ${salePrice}, ${salePrice}, '${pm}')`
      );
    }

    // Bulk insert tất cả hóa đơn 1 lần
    const bulkSql = `
      INSERT INTO CRM_SalesInvoices (InvoiceNumber, SaleDate, TotalAmount, FinalAmount, PaymentMethod)
      OUTPUT INSERTED.InvoiceID, INSERTED.InvoiceNumber
      VALUES ${invoiceRows.join(',\n')}
    `;

    const insertedInvoices = await executeQuery<any>(bulkSql);

    // Insert details cho từng hóa đơn (bulk cũng)
    const detailRows: string[] = [];
    insertedInvoices.forEach((inv: any, i: number) => {
      const product = products[i % products.length];
      const salePrice = (product.ImportPrice || 10000000) + (i + 1) * 500000;
      const imei = product.IMEI || `SAMPLE${String(i).padStart(8, '0')}`;
      const pname = (product.ProductName || 'Sản phẩm mẫu').replace(/'/g, "''");
      detailRows.push(
        `(${inv.InvoiceID}, ${product.ProductID}, N'${pname}', '${imei}', ${salePrice}, 1, ${salePrice})`
      );
    });

    if (detailRows.length > 0) {
      await executeQuery(`
        INSERT INTO CRM_SalesInvoiceDetails (InvoiceID, ProductID, ProductName, IMEI, SalePrice, Quantity, TotalPrice)
        VALUES ${detailRows.join(',\n')}
      `);
    }

    return NextResponse.json({
      success: true,
      message: `Đã insert ${insertedInvoices.length} hóa đơn mẫu`,
    });
  } catch (error) {
    console.error('Seed error:', error);
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 });
  }
}
