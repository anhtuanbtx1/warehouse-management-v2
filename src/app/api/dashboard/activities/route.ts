import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

interface Activity {
  id: string;
  type: 'SALE' | 'IMPORT' | 'BATCH_CREATE' | 'PRODUCT_ADD';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  icon: string;
  color: string;
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '20');

    // Recent Sales
    const recentSales = await executeQuery(`
      SELECT TOP ${Math.min(limit, 50)}
        'SALE_' + CAST(ProductID AS NVARCHAR) as id,
        'SALE' as type,
        ProductName,
        IMEI,
        SalePrice,
        SoldDate,
        InvoiceNumber
      FROM CRM_Products
      WHERE Status = 'SOLD' AND SoldDate IS NOT NULL
      ORDER BY SoldDate DESC
    `);

    // Recent Imports/Batches
    const recentBatches = await executeQuery(`
      SELECT TOP ${Math.min(limit, 50)}
        'BATCH_' + CAST(BatchID AS NVARCHAR) as id,
        'BATCH_CREATE' as type,
        BatchCode,
        CategoryName,
        TotalQuantity,
        TotalImportValue,
        ImportDate
      FROM CRM_ImportBatches ib
      LEFT JOIN CRM_Categories c ON ib.CategoryID = c.CategoryID
      ORDER BY ImportDate DESC
    `);

    // Recent Product Additions
    const recentProducts = await executeQuery(`
      SELECT TOP ${Math.min(limit, 50)}
        'PRODUCT_' + CAST(ProductID AS NVARCHAR) as id,
        'PRODUCT_ADD' as type,
        ProductName,
        IMEI,
        ImportPrice,
        CreatedAt
      FROM CRM_Products
      WHERE CreatedAt IS NOT NULL
      ORDER BY CreatedAt DESC
    `);

    // Combine and format activities
    const activities: Activity[] = [];

    // Add sales activities
    recentSales.forEach((sale: any) => {
      activities.push({
        id: sale.id,
        type: 'SALE',
        title: 'Bán hàng thành công',
        description: `${sale.ProductName} (${sale.IMEI}) - ${sale.InvoiceNumber}`,
        amount: sale.SalePrice,
        timestamp: sale.SoldDate,
        icon: '💰',
        color: 'success'
      });
    });

    // Add batch activities
    recentBatches.forEach((batch: any) => {
      activities.push({
        id: batch.id,
        type: 'BATCH_CREATE',
        title: 'Tạo lô hàng mới',
        description: `${batch.BatchCode} - ${batch.CategoryName} (${batch.TotalQuantity} sản phẩm)`,
        amount: batch.TotalImportValue,
        timestamp: batch.ImportDate,
        icon: '📦',
        color: 'primary'
      });
    });

    // Add product activities
    recentProducts.forEach((product: any) => {
      activities.push({
        id: product.id,
        type: 'PRODUCT_ADD',
        title: 'Thêm sản phẩm',
        description: `${product.ProductName} (${product.IMEI})`,
        amount: product.ImportPrice,
        timestamp: product.CreatedAt,
        icon: '📱',
        color: 'info'
      });
    });

    // Sort by timestamp and limit
    const sortedActivities = activities
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, limit);

    return NextResponse.json({
      success: true,
      data: sortedActivities
    });

  } catch (error) {
    console.error('Recent activities error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch recent activities'
    }, { status: 500 });
  }
}
