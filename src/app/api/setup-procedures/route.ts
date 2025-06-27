import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

// POST /api/setup-procedures - Tạo stored procedures
export async function POST(request: NextRequest) {
  try {
    // Tạo stored procedure SP_CRM_GetAvailableProducts
    const createProcedureQuery = `
      IF EXISTS (SELECT * FROM sys.objects WHERE type = 'P' AND name = 'SP_CRM_GetAvailableProducts')
        DROP PROCEDURE SP_CRM_GetAvailableProducts;
      
      EXEC('
      CREATE PROCEDURE SP_CRM_GetAvailableProducts
          @CategoryID INT = NULL,
          @SearchTerm NVARCHAR(255) = NULL
      AS
      BEGIN
          SET NOCOUNT ON;
          
          SELECT 
              p.ProductID,
              p.BatchID,
              p.CategoryID,
              p.ProductName,
              p.IMEI,
              p.ImportPrice,
              p.SalePrice,
              p.Status,
              p.SoldDate,
              p.InvoiceNumber,
              p.CustomerInfo,
              p.Notes,
              p.CreatedAt,
              p.UpdatedAt,
              c.CategoryName,
              b.BatchCode,
              b.ImportDate
          FROM CRM_Products p
          INNER JOIN CRM_Categories c ON p.CategoryID = c.CategoryID
          INNER JOIN CRM_ImportBatches b ON p.BatchID = b.BatchID
          WHERE 
              p.Status = ''IN_STOCK''
              -- Loại trừ danh mục cáp sạc vì chỉ bán kèm
              AND c.CategoryName NOT LIKE ''%cáp%''
              AND c.CategoryName NOT LIKE ''%cap%''
              AND c.CategoryName NOT LIKE ''%Cáp%''
              AND (@CategoryID IS NULL OR p.CategoryID = @CategoryID)
              AND (@SearchTerm IS NULL OR 
                   p.ProductName LIKE ''%'' + @SearchTerm + ''%'' OR 
                   p.IMEI LIKE ''%'' + @SearchTerm + ''%'')
          ORDER BY p.CreatedAt DESC;
      END
      ')
    `;

    await executeQuery(createProcedureQuery);

    return NextResponse.json({
      success: true,
      message: 'Stored procedure SP_CRM_GetAvailableProducts created successfully'
    });

  } catch (error) {
    console.error('Error creating stored procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create stored procedure' },
      { status: 500 }
    );
  }
}

// GET /api/setup-procedures - Kiểm tra stored procedures
export async function GET(request: NextRequest) {
  try {
    const checkQuery = `
      SELECT 
        name,
        create_date,
        modify_date
      FROM sys.objects 
      WHERE type = 'P' AND name = 'SP_CRM_GetAvailableProducts'
    `;

    const result = await executeQuery(checkQuery);

    return NextResponse.json({
      success: true,
      data: result,
      exists: result.length > 0
    });

  } catch (error) {
    console.error('Error checking stored procedure:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to check stored procedure' },
      { status: 500 }
    );
  }
}
