import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/cable-batches - Lấy danh sách lô cáp sạc có sản phẩm còn hàng
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeProducts = searchParams.get('includeProducts') === 'true';

    // Lấy danh sách lô cáp sạc có sản phẩm còn hàng
    const cableBatchesQuery = `
      SELECT
        b.BatchID,
        b.BatchCode,
        b.ImportDate,
        b.TotalQuantity,
        b.TotalImportValue,
        b.Notes,
        c.CategoryName,
        COUNT(p.ProductID) as AvailableProducts,
        AVG(CAST(p.ImportPrice as FLOAT)) as AvgPrice,
        MIN(p.ImportPrice) as MinPrice,
        MAX(p.ImportPrice) as MaxPrice
      FROM CRM_ImportBatches b
      INNER JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
      INNER JOIN CRM_Products p ON b.BatchID = p.BatchID
      WHERE (c.CategoryName LIKE '%cáp%'
        OR c.CategoryName LIKE '%cap%'
        OR c.CategoryName LIKE '%Cáp%')
        AND p.Status = 'IN_STOCK'
      GROUP BY b.BatchID, b.BatchCode, b.ImportDate, b.TotalQuantity,
               b.TotalImportValue, b.Notes, c.CategoryName
      HAVING COUNT(p.ProductID) > 0
      ORDER BY b.ImportDate DESC
    `;

    const batches = await executeQuery(cableBatchesQuery);

    // Nếu cần thông tin chi tiết sản phẩm
    if (includeProducts && batches.length > 0) {
      for (let batch of batches) {
        const productsQuery = `
          SELECT
            p.ProductID,
            p.ProductName,
            p.IMEI,
            p.ImportPrice,
            p.Status,
            p.CreatedAt
          FROM CRM_Products p
          WHERE p.BatchID = @batchId AND p.Status = 'IN_STOCK'
          ORDER BY p.ImportPrice ASC, p.CreatedAt ASC
        `;

        const products = await executeQuery(productsQuery, { batchId: batch.BatchID });
        batch.Products = products;
      }
    }

    return NextResponse.json({
      success: true,
      data: batches,
      total: batches.length,
      message: 'Cable batches retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting cable batches:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cable batches' },
      { status: 500 }
    );
  }
}

// GET /api/cable-batches/[batchId]/products - Lấy sản phẩm cáp sạc trong lô cụ thể
export async function POST(request: NextRequest) {
  try {
    const { batchId } = await request.json();

    if (!batchId) {
      return NextResponse.json(
        { success: false, error: 'BatchID is required' },
        { status: 400 }
      );
    }

    const productsQuery = `
      SELECT
        p.ProductID,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        p.Status,
        p.CreatedAt,
        b.BatchCode,
        c.CategoryName
      FROM CRM_Products p
      INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      INNER JOIN CRM_Categories c ON b.CategoryID = c.CategoryID
      WHERE p.BatchID = @batchId
        AND p.Status = 'IN_STOCK'
        AND (c.CategoryName LIKE '%cáp%'
          OR c.CategoryName LIKE '%cap%'
          OR c.CategoryName LIKE '%Cáp%')
      ORDER BY p.ImportPrice ASC, p.CreatedAt ASC
    `;

    const products = await executeQuery(productsQuery, { batchId });

    return NextResponse.json({
      success: true,
      data: products,
      total: products.length,
      message: 'Cable products retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting cable products:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cable products' },
      { status: 500 }
    );
  }
}
