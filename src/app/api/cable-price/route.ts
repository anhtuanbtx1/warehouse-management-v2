import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// GET /api/cable-price - Lấy giá cáp sạc trung bình
export async function GET(request: NextRequest) {
  try {
    // Lấy giá cáp sạc trung bình từ các sản phẩm cáp sạc còn hàng
    const cablePriceQuery = `
      SELECT 
        AVG(p.ImportPrice) as AvgCablePrice,
        MIN(p.ImportPrice) as MinCablePrice,
        MAX(p.ImportPrice) as MaxCablePrice,
        COUNT(*) as TotalCables
      FROM CRM_Products p
      INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      WHERE c.CategoryName LIKE '%cáp%' 
        OR c.CategoryName LIKE '%cap%'
        OR c.CategoryName LIKE '%Cáp%'
    `;

    const result = await executeQuery(cablePriceQuery);
    
    if (result.length === 0 || !result[0].AvgCablePrice) {
      // Nếu không có cáp sạc nào, trả về giá mặc định
      return NextResponse.json({
        success: true,
        data: {
          AvgCablePrice: 100000, // Giá mặc định 100k
          MinCablePrice: 100000,
          MaxCablePrice: 100000,
          TotalCables: 0,
          isDefault: true
        },
        message: 'No cables found, using default price'
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        AvgCablePrice: Math.round(result[0].AvgCablePrice),
        MinCablePrice: result[0].MinCablePrice,
        MaxCablePrice: result[0].MaxCablePrice,
        TotalCables: result[0].TotalCables,
        isDefault: false
      },
      message: 'Cable price retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting cable price:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get cable price' },
      { status: 500 }
    );
  }
}

// GET /api/cable-price/available - Lấy danh sách cáp sạc có sẵn
export async function POST(request: NextRequest) {
  try {
    const availableCablesQuery = `
      SELECT 
        p.ProductID,
        p.ProductName,
        p.IMEI,
        p.ImportPrice,
        p.Status,
        c.CategoryName,
        b.BatchCode
      FROM CRM_Products p
      INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
      INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
      WHERE (c.CategoryName LIKE '%cáp%' 
        OR c.CategoryName LIKE '%cap%'
        OR c.CategoryName LIKE '%Cáp%')
        AND p.Status = 'IN_STOCK'
      ORDER BY p.ImportPrice ASC, p.CreatedAt DESC
    `;

    const cables = await executeQuery(availableCablesQuery);

    return NextResponse.json({
      success: true,
      data: cables,
      total: cables.length,
      message: 'Available cables retrieved successfully'
    });

  } catch (error) {
    console.error('Error getting available cables:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to get available cables' },
      { status: 500 }
    );
  }
}
