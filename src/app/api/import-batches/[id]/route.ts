import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';

export const dynamic = 'force-dynamic';

// GET single batch
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = parseInt(params.id);
    
    if (isNaN(batchId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch ID'
      }, { status: 400 });
    }

    const batch = await executeQuery(`
      SELECT 
        ib.*,
        c.CategoryName,
        -- Calculate sold quantities and values
        ISNULL((
          SELECT COUNT(*) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) as TotalSoldQuantity,
        
        ISNULL((
          SELECT SUM(p.SalePrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) as TotalSoldValue,
        
        -- Calculate remaining quantity
        (ib.TotalQuantity - ISNULL((
          SELECT COUNT(*) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0)) as RemainingQuantity,
        
        -- Calculate profit/loss
        (ISNULL((
          SELECT SUM(p.SalePrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) - ISNULL((
          SELECT SUM(p.ImportPrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0)) as ProfitLoss
        
      FROM CRM_ImportBatches ib
      LEFT JOIN CRM_Categories c ON ib.CategoryID = c.CategoryID
      WHERE ib.BatchID = @batchId
    `, { batchId });

    if (batch.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Batch not found'
      }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      data: batch[0]
    });

  } catch (error) {
    console.error('Error fetching batch:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to fetch batch'
    }, { status: 500 });
  }
}

// PUT update batch
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = parseInt(params.id);
    
    if (isNaN(batchId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch ID'
      }, { status: 400 });
    }

    const body = await request.json();
    const { CategoryID, TotalQuantity, ImportPrice, Notes } = body;

    // Validation
    if (!CategoryID || !TotalQuantity || !ImportPrice) {
      return NextResponse.json({
        success: false,
        error: 'CategoryID, TotalQuantity, and ImportPrice are required'
      }, { status: 400 });
    }

    if (isNaN(parseInt(CategoryID)) || isNaN(parseInt(TotalQuantity)) || isNaN(parseFloat(ImportPrice))) {
      return NextResponse.json({
        success: false,
        error: 'CategoryID, TotalQuantity, and ImportPrice must be valid numbers'
      }, { status: 400 });
    }

    if (parseInt(TotalQuantity) <= 0) {
      return NextResponse.json({
        success: false,
        error: 'TotalQuantity must be greater than 0'
      }, { status: 400 });
    }

    if (parseFloat(ImportPrice) <= 0) {
      return NextResponse.json({
        success: false,
        error: 'ImportPrice must be greater than 0'
      }, { status: 400 });
    }

    // Calculate ImportPrice per unit from TotalImportValue
    const totalImportValue = parseFloat(ImportPrice); // This is actually TotalImportValue from frontend
    const totalQuantity = parseInt(TotalQuantity);
    const importPricePerUnit = totalImportValue / totalQuantity;

    // Check if batch exists
    const existingBatch = await executeQuery(`
      SELECT BatchID, TotalQuantity 
      FROM CRM_ImportBatches 
      WHERE BatchID = @batchId
    `, { batchId });

    if (existingBatch.length === 0) {
      return NextResponse.json({
        success: false,
        error: 'Batch not found'
      }, { status: 404 });
    }

    // Check if new quantity is valid (must be >= current product count)
    const currentProductCount = await executeQuery(`
      SELECT COUNT(*) as productCount
      FROM CRM_Products 
      WHERE BatchID = @batchId
    `, { batchId });

    const productCount = currentProductCount[0]?.productCount || 0;
    
    if (parseInt(TotalQuantity) < productCount) {
      return NextResponse.json({
        success: false,
        error: `Không thể giảm số lượng xuống dưới ${productCount} (số sản phẩm hiện có trong lô)`
      }, { status: 400 });
    }

    // Update batch
    await executeQuery(`
      UPDATE CRM_ImportBatches
      SET
        CategoryID = @CategoryID,
        TotalQuantity = @TotalQuantity,
        TotalImportValue = @TotalImportValue,
        ImportPrice = @ImportPricePerUnit,
        Notes = @Notes,
        UpdatedAt = GETDATE()
      WHERE BatchID = @batchId
    `, {
      batchId,
      CategoryID: parseInt(CategoryID),
      TotalQuantity: totalQuantity,
      TotalImportValue: totalImportValue,
      ImportPricePerUnit: importPricePerUnit,
      Notes: Notes || null
    });

    // Update ImportPrice for all products in this batch
    await executeQuery(`
      UPDATE CRM_Products
      SET ImportPrice = @ImportPricePerUnit
      WHERE BatchID = @batchId
    `, {
      batchId,
      ImportPricePerUnit: importPricePerUnit
    });

    // Get updated batch data
    const updatedBatch = await executeQuery(`
      SELECT 
        ib.*,
        c.CategoryName,
        -- Calculate sold quantities and values
        ISNULL((
          SELECT COUNT(*) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) as TotalSoldQuantity,
        
        ISNULL((
          SELECT SUM(p.SalePrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) as TotalSoldValue,
        
        -- Calculate remaining quantity
        (ib.TotalQuantity - ISNULL((
          SELECT COUNT(*) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0)) as RemainingQuantity,
        
        -- Calculate profit/loss
        (ISNULL((
          SELECT SUM(p.SalePrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0) - ISNULL((
          SELECT SUM(p.ImportPrice) 
          FROM CRM_Products p 
          WHERE p.BatchID = ib.BatchID AND p.Status = 'SOLD'
        ), 0)) as ProfitLoss
        
      FROM CRM_ImportBatches ib
      LEFT JOIN CRM_Categories c ON ib.CategoryID = c.CategoryID
      WHERE ib.BatchID = @batchId
    `, { batchId });

    return NextResponse.json({
      success: true,
      message: 'Batch updated successfully',
      data: updatedBatch[0]
    });

  } catch (error) {
    console.error('Error updating batch:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to update batch'
    }, { status: 500 });
  }
}

// DELETE batch
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const batchId = parseInt(params.id);
    
    if (isNaN(batchId)) {
      return NextResponse.json({
        success: false,
        error: 'Invalid batch ID'
      }, { status: 400 });
    }

    // Check if batch has products
    const products = await executeQuery(`
      SELECT COUNT(*) as productCount
      FROM CRM_Products 
      WHERE BatchID = @batchId
    `, { batchId });

    const productCount = products[0]?.productCount || 0;
    
    if (productCount > 0) {
      return NextResponse.json({
        success: false,
        error: `Không thể xóa lô hàng có ${productCount} sản phẩm. Vui lòng xóa tất cả sản phẩm trước.`
      }, { status: 400 });
    }

    // Delete batch
    await executeQuery(`
      DELETE FROM CRM_ImportBatches 
      WHERE BatchID = @batchId
    `, { batchId });

    return NextResponse.json({
      success: true,
      message: 'Batch deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting batch:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Failed to delete batch'
    }, { status: 500 });
  }
}
