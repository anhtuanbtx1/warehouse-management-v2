import { NextRequest, NextResponse } from 'next/server';
import { executeQuery } from '@/lib/database';
import { ensureProductActivityTable } from '@/lib/product-activity-log';

export async function GET(request: NextRequest) {
  try {
    await ensureProductActivityTable();
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const actionType = searchParams.get('actionType');
    const offset = (page - 1) * limit;

    let whereClause = 'WHERE 1=1';
    const params: any = { offset, limit };

    if (actionType) {
      whereClause += ' AND ActionType = @actionType';
      params.actionType = actionType;
    }

    const totalResult = await executeQuery<{ total: number }>(
      `SELECT COUNT(*) as total FROM CRM_ProductActivityLogs ${whereClause}`,
      params
    );
    const total = totalResult[0]?.total || 0;

    const data = await executeQuery(
      `SELECT * FROM CRM_ProductActivityLogs ${whereClause} ORDER BY PerformedAt DESC OFFSET @offset ROWS FETCH NEXT @limit ROWS ONLY`,
      params
    );

    return NextResponse.json({
      success: true,
      data: {
        data,
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching product activities:', error);
    return NextResponse.json({ success: false, error: 'Failed to fetch product activities' }, { status: 500 });
  }
}
