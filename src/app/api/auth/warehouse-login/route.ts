import { NextRequest, NextResponse } from 'next/server';
import jwt from 'jsonwebtoken';

// Demo users - In production, this should be from database
const DEMO_USERS = [
  {
    id: 1,
    username: 'admin',
    password: 'admin',
    role: 'admin',
    fullName: 'Quản trị viên',
    permissions: ['all']
  },
  {
    id: 2,
    username: 'huyentran',
    password: 'Huyentran@123',
    role: 'manager',
    fullName: 'Quản lý kho',
    permissions: ['dashboard', 'import', 'sales', 'inventory', 'reports']
  },
  {
    id: 3,
    username: 'staff',
    password: 'staff123',
    role: 'staff',
    fullName: 'Nhân viên kho',
    permissions: ['dashboard', 'import', 'sales']
  }
];

const JWT_SECRET = process.env.JWT_SECRET || 'warehouse-secret-key-2024';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return NextResponse.json({
        success: false,
        error: 'Vui lòng nhập đầy đủ tên đăng nhập và mật khẩu'
      }, { status: 400 });
    }

    // Find user
    const user = DEMO_USERS.find(u => u.username === username && u.password === password);

    if (!user) {
      return NextResponse.json({
        success: false,
        error: 'Tên đăng nhập hoặc mật khẩu không đúng'
      }, { status: 401 });
    }

    // Generate JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        username: user.username,
        role: user.role,
        permissions: user.permissions
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Return success response
    return NextResponse.json({
      success: true,
      token,
      user: {
        id: user.id,
        username: user.username,
        fullName: user.fullName,
        role: user.role,
        permissions: user.permissions
      }
    });

  } catch (error) {
    console.error('Warehouse login error:', error);
    return NextResponse.json({
      success: false,
      error: 'Có lỗi xảy ra khi đăng nhập'
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    success: false,
    error: 'Method not allowed'
  }, { status: 405 });
}
