import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    // Get Vietnam timezone date using proper timezone conversion
    const now = new Date();
    const vietnamDate = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Ho_Chi_Minh" }));
    const today = `${vietnamDate.getFullYear()}-${String(vietnamDate.getMonth() + 1).padStart(2, '0')}-${String(vietnamDate.getDate()).padStart(2, '0')}`;
    
    console.log('Debug Sales Comparison - Today:', today);
    console.log('Vietnam DateTime:', vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' }));

    // 1. Check CRM_SalesInvoices data for today
    const salesInvoicesData = await executeQuery(`
      SELECT 
        COUNT(*) as totalInvoices,
        SUM(FinalAmount) as totalRevenue,
        MIN(SaleDate) as earliestSale,
        MAX(SaleDate) as latestSale
      FROM CRM_SalesInvoices 
      WHERE CAST(SaleDate AS DATE) = @today
    `, { today });

    // 2. Check CRM_Products data for today
    const productsData = await executeQuery(`
      SELECT 
        COUNT(*) as totalSold,
        SUM(SalePrice) as totalRevenue,
        MIN(SoldDate) as earliestSale,
        MAX(SoldDate) as latestSale
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL 
        AND CAST(SoldDate AS DATE) = @today
    `, { today });

    // 3. Get all sales invoices for today with details
    const todayInvoices = await executeQuery(`
      SELECT
        InvoiceID,
        InvoiceNumber,
        SaleDate,
        FinalAmount,
        Status
      FROM CRM_SalesInvoices
      WHERE CAST(SaleDate AS DATE) = @today
      ORDER BY SaleDate DESC
    `, { today });

    // 4. Get all sold products for today with details
    const todayProducts = await executeQuery(`
      SELECT 
        ProductID,
        ProductName,
        IMEI,
        SoldDate,
        SalePrice,
        Status,
        InvoiceNumber
      FROM CRM_Products 
      WHERE Status = 'SOLD' 
        AND SoldDate IS NOT NULL 
        AND CAST(SoldDate AS DATE) = @today
      ORDER BY SoldDate DESC
    `, { today });

    // 5. Check for data inconsistencies
    const inconsistencies = await executeQuery(`
      SELECT 
        'Missing in Products' as issue,
        si.InvoiceNumber,
        si.SaleDate,
        si.FinalAmount
      FROM CRM_SalesInvoices si
      LEFT JOIN CRM_Products p ON si.InvoiceNumber = p.InvoiceNumber
      WHERE CAST(si.SaleDate AS DATE) = @today
        AND p.ProductID IS NULL
      
      UNION ALL
      
      SELECT 
        'Missing in SalesInvoices' as issue,
        p.InvoiceNumber,
        p.SoldDate,
        p.SalePrice
      FROM CRM_Products p
      LEFT JOIN CRM_SalesInvoices si ON p.InvoiceNumber = si.InvoiceNumber
      WHERE p.Status = 'SOLD' 
        AND p.SoldDate IS NOT NULL 
        AND CAST(p.SoldDate AS DATE) = @today
        AND si.InvoiceID IS NULL
    `, { today });

    return NextResponse.json({
      success: true,
      data: {
        debugInfo: {
          today,
          vietnamDateTime: vietnamDate.toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })
        },
        salesInvoices: {
          summary: salesInvoicesData[0],
          details: todayInvoices
        },
        products: {
          summary: productsData[0],
          details: todayProducts
        },
        inconsistencies: inconsistencies,
        comparison: {
          invoiceCount: salesInvoicesData[0]?.totalInvoices || 0,
          productCount: productsData[0]?.totalSold || 0,
          invoiceRevenue: salesInvoicesData[0]?.totalRevenue || 0,
          productRevenue: productsData[0]?.totalRevenue || 0,
          revenueMatch: (salesInvoicesData[0]?.totalRevenue || 0) === (productsData[0]?.totalRevenue || 0),
          countMatch: (salesInvoicesData[0]?.totalInvoices || 0) === (productsData[0]?.totalSold || 0)
        }
      }
    });

  } catch (error) {
    console.error('Debug sales comparison error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to debug sales comparison'
    }, { status: 500 });
  }
}
