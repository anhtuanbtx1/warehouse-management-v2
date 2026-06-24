'use client';

import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGuard from '@/components/warehouse-v2/AuthGuard';
import { useLayoutContext } from '@/contexts/useLayoutContext';
import { ThemeToggle } from '@/components/warehouse-v2/ThemeToggle';
import './globals.css';

interface WarehouseV2LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: '/warehouse-v2', label: 'Tổng quan', icon: 'fas fa-chart-pie', roles: ['admin', 'manager', 'staff'] },
  { href: '/warehouse-v2/import', label: 'Nhập hàng', icon: 'fas fa-box-open', roles: ['admin', 'manager'] },
  { href: '/warehouse-v2/sales', label: 'Bán hàng', icon: 'fas fa-cart-shopping', roles: ['admin', 'manager', 'staff'] },
  { href: '/warehouse-v2/invoices', label: 'Hóa đơn', icon: 'fas fa-receipt', roles: ['admin', 'manager'] },
  { href: '/warehouse-v2/inventory', label: 'Tồn kho', icon: 'fas fa-warehouse', roles: ['admin', 'manager'] },
  { href: '/warehouse-v2/categories', label: 'Danh mục', icon: 'fas fa-tags', roles: ['admin'] },
  { href: '/warehouse-v2/reports', label: 'Báo cáo', icon: 'fas fa-file-lines', roles: ['admin', 'manager'] },
  { href: '/warehouse-v2/activities', label: 'Hoạt động', icon: 'fas fa-clock-rotate-left', roles: ['admin', 'manager'] },
];

const STORAGE_KEY = '__REBACK_NEXT_CONFIG__';

const WarehouseV2Layout: React.FC<WarehouseV2LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/warehouse-v2/login';
  const { themeMode, changeTheme } = useLayoutContext();
  const isDark = themeMode === 'dark';
  const [userRole, setUserRole] = useState<string>('');

  useEffect(() => {
    if (isLoginPage) {
      setUserRole('');
      return;
    }

    try {
      const userStr = localStorage.getItem('warehouse_user');
      if (userStr) {
        const user = JSON.parse(userStr);
        setUserRole(user.role || '');
      } else {
        setUserRole('');
      }
    } catch (error) {
      console.error('Error reading user role:', error);
      setUserRole('');
    }
  }, [isLoginPage, pathname]);

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  const getFilteredNavigationItems = () => {
    // Admin has access to all menus
    if (userRole === 'admin') {
      return navigationItems;
    }
    // Filter menu items based on user role
    return navigationItems.filter(item => item.roles.includes(userRole));
  };

  const handleThemeToggle = () => {
    changeTheme(isDark ? 'light' : 'dark');
  };

  const handleLogout = () => {
    localStorage.removeItem('warehouse_auth_token');
    localStorage.removeItem('warehouse_user');
    window.location.href = '/warehouse-v2/login';
  };

  const getUserRoleLabel = () => {
    switch (userRole) {
      case 'admin':
        return 'Quản trị viên';
      case 'manager':
        return 'Quản lý kho';
      case 'staff':
        return 'Nhân viên kho';
      default:
        return 'Người dùng';
    }
  };

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="warehouse-v2 min-vh-100">
          {!isLoginPage && (
            <header className="warehouse-shell-header">
              {/* Top actions bar */}
              <div 
                className="d-none d-lg-flex justify-content-end align-items-center px-4 py-1" 
                style={{ 
                  background: 'var(--warehouse-surface-muted)', 
                  borderBottom: '1px solid var(--warehouse-border)' 
                }}
              >
                <Container fluid className="warehouse-shell-container p-0 d-flex justify-content-end">
                  <div 
                    className="warehouse-header-actions mt-0 mb-0" 
                    style={{ transform: 'scale(0.85)', transformOrigin: 'right center' }}
                  >
                    <ThemeToggle
                      isDark={isDark}
                      onToggle={handleThemeToggle}
                      className="me-2"
                    />
                    <div className="warehouse-status-chip">
                      <span className="warehouse-status-dot"></span>
                      Hệ thống hoạt động
                    </div>
                    <Dropdown align="end">
                      <Dropdown.Toggle className="warehouse-user-toggle" bsPrefix="btn">
                        <span className="warehouse-user-avatar">
                          <i className={`fas ${userRole === 'admin' ? 'fa-user-shield' : userRole === 'manager' ? 'fa-user-tie' : 'fa-user'}`} aria-hidden="true"></i>
                        </span>
                        <span className="warehouse-user-meta">
                          <span className="warehouse-user-role">{getUserRoleLabel()}</span>
                          <span className="warehouse-user-caption">Điều hành kho</span>
                        </span>
                      </Dropdown.Toggle>
                      <Dropdown.Menu className="warehouse-user-menu">
                        <Dropdown.Item href="#profile">
                          <i className="fas fa-id-card" aria-hidden="true"></i>
                          <span>Thông tin cá nhân</span>
                        </Dropdown.Item>
                        <Dropdown.Item href="#change-password">
                          <i className="fas fa-key" aria-hidden="true"></i>
                          <span>Đổi mật khẩu</span>
                        </Dropdown.Item>
                        <Dropdown.Divider />
                        <Dropdown.Item onClick={handleLogout} className="text-danger">
                          <i className="fas fa-right-from-bracket" aria-hidden="true"></i>
                          <span>Đăng xuất</span>
                        </Dropdown.Item>
                      </Dropdown.Menu>
                    </Dropdown>
                  </div>
                </Container>
              </div>

              <Navbar expand="lg" className="warehouse-navbar py-2">
                <Container fluid className="warehouse-shell-container">
                  <Navbar.Brand as={Link} href="/warehouse-v2" className="warehouse-brand">
                    <span className="warehouse-brand-mark">
                      <i className="fas fa-mobile-screen-button" aria-hidden="true"></i>
                    </span>
                    <span className="warehouse-brand-text">
                      <span className="warehouse-brand-title">Phone Store</span>
                      <span className="warehouse-brand-subtitle">Hệ thống quản lý bán hàng</span>
                    </span>
                  </Navbar.Brand>

                  <Navbar.Toggle aria-controls="warehouse-navbar" className="warehouse-navbar-toggle" />

                  <Navbar.Collapse id="warehouse-navbar">
                    <Nav className="warehouse-nav me-auto w-100">
                      {getFilteredNavigationItems().map((item) => (
                        <Nav.Link
                          key={item.href}
                          as={Link}
                          href={item.href}
                          className={`warehouse-nav-link ${isActive(item.href)}`}
                        >
                          <i className={item.icon} aria-hidden="true"></i>
                          <span>{item.label}</span>
                        </Nav.Link>
                      ))}

                      {/* Mobile-only utilities inside collapse menu */}
                      <div className="d-lg-none mt-3 pt-3 border-top" style={{ borderColor: 'var(--warehouse-border)' }}>
                        <div className="d-flex flex-column gap-3">
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold" style={{ color: 'var(--warehouse-text)' }}>Giao diện</span>
                            <ThemeToggle
                              isDark={isDark}
                              onToggle={handleThemeToggle}
                            />
                          </div>
                          
                          <div className="d-flex justify-content-between align-items-center">
                            <span className="fw-semibold" style={{ color: 'var(--warehouse-text)' }}>Trạng thái</span>
                            <div className="warehouse-status-chip m-0">
                              <span className="warehouse-status-dot"></span>
                              Hệ thống hoạt động
                            </div>
                          </div>

                          <div className="border-top my-1" style={{ borderColor: 'var(--warehouse-border)' }}></div>

                          {/* Profile & actions on mobile */}
                          <div className="d-flex align-items-center gap-3">
                            <span className="warehouse-user-avatar">
                              <i className={`fas ${userRole === 'admin' ? 'fa-user-shield' : userRole === 'manager' ? 'fa-user-tie' : 'fa-user'}`} aria-hidden="true"></i>
                            </span>
                            <div className="d-flex flex-column">
                              <span className="fw-bold" style={{ color: 'var(--warehouse-heading)' }}>{getUserRoleLabel()}</span>
                              <span className="small" style={{ color: 'var(--warehouse-text-muted)' }}>Điều hành kho</span>
                            </div>
                          </div>

                          <div className="d-flex flex-column gap-2 mt-2">
                            <Button href="#profile" variant="outline-primary" size="sm" className="text-start d-flex align-items-center gap-2">
                              <i className="fas fa-id-card" aria-hidden="true"></i>
                              <span>Thông tin cá nhân</span>
                            </Button>
                            <Button href="#change-password" variant="outline-primary" size="sm" className="text-start d-flex align-items-center gap-2">
                              <i className="fas fa-key" aria-hidden="true"></i>
                              <span>Đổi mật khẩu</span>
                            </Button>
                            <Button onClick={handleLogout} variant="outline-danger" size="sm" className="text-start d-flex align-items-center gap-2">
                              <i className="fas fa-right-from-bracket" aria-hidden="true"></i>
                              <span>Đăng xuất</span>
                            </Button>
                          </div>
                        </div>
                      </div>
                    </Nav>
                  </Navbar.Collapse>
                </Container>
              </Navbar>
            </header>
          )}

          <main className={`warehouse-main flex-grow-1 ${isLoginPage ? 'login-page' : ''}`}>
            {!isLoginPage ? <div className="warehouse-shell-container">{children}</div> : children}
          </main>


        </div>
      </ToastProvider>
    </AuthGuard>
  );
};

export default WarehouseV2Layout;
