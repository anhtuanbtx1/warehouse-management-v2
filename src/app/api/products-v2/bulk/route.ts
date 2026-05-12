import { NextRequest, NextResponse } from 'next/server';
import { getConnection } from '@/lib/database';
import sql from 'mssql';

interface BulkDeleteRequest {
  ids: number[];
}

export async function DELETE(request: NextRequest) {
  try {
    const body: BulkDeleteRequest = await request.json();

    if (!body.ids || !Array.isArray(body.ids) || body.ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Danh sách ID không hợp lệ' },
        { status: 400 }
      );
    }

    const ids = body.ids.filter(id => Number.isInteger(id) && id > 0);

    if (ids.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không có ID sản phẩm hợp lệ để xóa' },
        { status: 400 }
      );
    }

    const pool = await getConnection();

    // Kiểm tra các sản phẩm có tồn tại và trạng thái là IN_STOCK
    const idParams = ids.map((_, index) => `@id${index}`).join(', ');
    const checkRequest = pool.request();
    ids.forEach((id, index) => {
      checkRequest.input(`id${index}`, sql.Int, id);
    });

    const checkResult = await checkRequest.query(`
      SELECT ProductID, ProductName, Status
      FROM CRM_Products
      WHERE ProductID IN (${idParams})
    `);

    if (checkResult.recordset.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Không tìm thấy sản phẩm nào để xóa' },
        { status: 404 }
      );
    }

    const invalidProducts = checkResult.recordset.filter(product => product.Status !== 'IN_STOCK');
    if (invalidProducts.length > 0) {
      return NextResponse.json(
        {
          success: false,
          error: `Chỉ có thể xóa sản phẩm có trạng thái "Còn hàng". Có ${invalidProducts.length} sản phẩm không hợp lệ.`
        },
        { status: 400 }
      );
    }

    const deleteRequest = pool.request();
    ids.forEach((id, index) => {
      deleteRequest.input(`id${index}`, sql.Int, id);
    });

    const deleteResult = await deleteRequest.query(`
      DELETE FROM CRM_Products
      WHERE ProductID IN (${idParams})
    `);

    return NextResponse.json({
      success: true,
      message: `Đã xóa thành công ${deleteResult.rowsAffected[0]} sản phẩm`,
      data: {
        deletedCount: deleteResult.rowsAffected[0]
      }
    });

  } catch (error) {
    console.error('Error bulk deleting products:', error);
    return NextResponse.json(
      { success: false, error: 'Lỗi server khi xóa nhiều sản phẩm' },
      { status: 500 }
    );
  }
}
