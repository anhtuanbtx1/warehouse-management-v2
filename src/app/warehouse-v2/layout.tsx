'use client';

import React, { useEffect, useState } from 'react';
import { Navbar, Nav, Container, Dropdown, Button } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGuard from '@/components/warehouse-v2/AuthGuard';
import './globals.css';

interface WarehouseV2LayoutProps {
  children: React.ReactNode;
}

const navigationItems = [
  { href: '/warehouse-v2', label: 'Tổng quan', icon: 'fas fa-chart-pie' },
  { href: '/warehouse-v2/import', label: 'Nhập hàng', icon: 'fas fa-box-open' },
  { href: '/warehouse-v2/sales', label: 'Bán hàng', icon: 'fas fa-cart-shopping' },
  { href: '/warehouse-v2/inventory', label: 'Tồn kho', icon: 'fas fa-warehouse' },
  { href: '/warehouse-v2/categories', label: 'Danh mục', icon: 'fas fa-tags' },
  { href: '/warehouse-v2/reports', label: 'Báo cáo', icon: 'fas fa-file-lines' },
];

const STORAGE_KEY = '__REBACK_NEXT_CONFIG__';

const WarehouseV2Layout: React.FC<WarehouseV2LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/warehouse-v2/login';
  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const html = document.documentElement;
    const currentTheme = html.getAttribute('data-bs-theme') || 'light';
    setIsDark(currentTheme === 'dark');
  }, []);

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  const handleThemeToggle = () => {
    const html = document.documentElement;
    const nextTheme = isDark ? 'light' : 'dark';

    html.setAttribute('data-bs-theme', nextTheme);
    setIsDark(nextTheme === 'dark');

    try {
      const rawSettings = localStorage.getItem(STORAGE_KEY);
      const settings = rawSettings ? JSON.parse(rawSettings) : {};
      localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          ...settings,
          theme: nextTheme,
        }),
      );
    } catch (error) {
      console.error('Error saving theme preference:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('warehouse_auth_token');
    localStorage.removeItem('warehouse_user');
    window.location.href = '/warehouse-v2/login';
  };

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="warehouse-v2 min-vh-100">
          {!isLoginPage && (
            <header className="warehouse-shell-header">
              {/* Top actions bar */}
              <div 
                className="d-flex justify-content-end align-items-center px-4 py-1" 
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
                    <Button
                      type="button"
                      variant="outline-primary"
                      className="warehouse-theme-toggle"
                      onClick={handleThemeToggle}
                      aria-label={isDark ? 'Chuyển sang giao diện sáng' : 'Chuyển sang giao diện tối'}
                    >
                      <i className={`fas ${isDark ? 'fa-sun' : 'fa-moon'}`} aria-hidden="true"></i>
                      <span>{isDark ? 'Light' : 'Dark'}</span>
                    </Button>
                    <div className="warehouse-status-chip">
                      <span className="warehouse-status-dot"></span>
                      Hệ thống hoạt động
                    </div>
                    <Dropdown align="end">
                      <Dropdown.Toggle className="warehouse-user-toggle" bsPrefix="btn">
                        <span className="warehouse-user-avatar">
                          <i className="fas fa-user-shield" aria-hidden="true"></i>
                        </span>
                        <span className="warehouse-user-meta">
                          <span className="warehouse-user-role">Quản trị viên</span>
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
                      <i className="fas fa-layer-group" aria-hidden="true"></i>
                    </span>
                    <span className="warehouse-brand-text">
                      <span className="warehouse-brand-title">Warehouse V2</span>
                      <span className="warehouse-brand-subtitle">Quản lý kho HTran</span>
                    </span>
                  </Navbar.Brand>

                  <Navbar.Toggle aria-controls="warehouse-navbar" className="warehouse-navbar-toggle" />

                  <Navbar.Collapse id="warehouse-navbar">
                    <Nav className="warehouse-nav me-auto">
                      {navigationItems.map((item) => (
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
                    </Nav>
                  </Navbar.Collapse>
                </Container>
              </Navbar>
            </header>
          )}

          <main className={`warehouse-main flex-grow-1 ${isLoginPage ? 'login-page' : ''}`}>
            {!isLoginPage ? <div className="warehouse-shell-container">{children}</div> : children}
          </main>

          {!isLoginPage && (
            <footer className="warehouse-footer mt-auto">
              <Container fluid className="warehouse-shell-container">
                <div className="warehouse-footer-content">
                  <div>
                    <div className="warehouse-footer-title">Hệ thống Quản lý Kho HTran</div>
                    <div className="warehouse-footer-subtitle">Theo dõi nhập hàng, bán hàng, tồn kho và báo cáo theo IMEI.</div>
                  </div>
                  <div className="warehouse-footer-meta">
                    <span>Phiên bản 2.0</span>
                    <span>© 2026</span>
                  </div>
                </div>
              </Container>
            </footer>
          )}
        </div>
      </ToastProvider>
    </AuthGuard>
  );
};

export default WarehouseV2Layout;
