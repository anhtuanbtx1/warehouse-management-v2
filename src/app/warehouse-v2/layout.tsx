'use client';

import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/contexts/ToastContext';
import AuthGuard from '@/components/warehouse-v2/AuthGuard';

interface WarehouseV2LayoutProps {
  children: React.ReactNode;
}

const WarehouseV2Layout: React.FC<WarehouseV2LayoutProps> = ({ children }) => {
  const pathname = usePathname();
  const isLoginPage = pathname === '/warehouse-v2/login';

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  const handleLogout = () => {
    localStorage.removeItem('warehouse_auth_token');
    localStorage.removeItem('warehouse_user');
    window.location.href = '/warehouse-v2/login';
  };

  return (
    <AuthGuard>
      <ToastProvider>
        <div className="warehouse-v2 min-vh-100 bg-light">
        {/* Navigation - Hide on login page */}
        {!isLoginPage && (
          <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} href="/warehouse-v2" className="fw-bold">
            <span className="me-2">📱</span>
            <span className="fs-5">Hệ thống Quản lý Kho HTran</span>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="warehouse-navbar" />
          
          <Navbar.Collapse id="warehouse-navbar">
            <Nav className="me-auto">
              <Nav.Link
                as={Link}
                href="/warehouse-v2"
                className={`${isActive('/warehouse-v2')} px-3 py-2 fw-medium`}
              >
                <span className="me-2">📊</span>
                <span>Dashboard</span>
              </Nav.Link>

              <Nav.Link
                as={Link}
                href="/warehouse-v2/import"
                className={`${isActive('/warehouse-v2/import')} px-3 py-2 fw-medium`}
              >
                <span className="me-2">📦</span>
                <span>Nhập hàng</span>
              </Nav.Link>

              <Nav.Link
                as={Link}
                href="/warehouse-v2/sales"
                className={`${isActive('/warehouse-v2/sales')} px-3 py-2 fw-medium`}
              >
                <span className="me-2">🛒</span>
                <span>Bán hàng</span>
              </Nav.Link>

              <Nav.Link
                as={Link}
                href="/warehouse-v2/inventory"
                className={`${isActive('/warehouse-v2/inventory')} px-3 py-2 fw-medium`}
              >
                <span className="me-2">🏪</span>
                <span>Tồn kho</span>
              </Nav.Link>
            </Nav>
            
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="primary" className="px-3 py-2" bsPrefix="btn" data-bs-toggle="dropdown">
                  <span className="me-2">⚙️</span>
                  <span className="fw-medium">Cài đặt</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#categories" className="py-2">
                    <span className="me-3">🏷️</span>
                    <span className="fw-medium">Danh mục sản phẩm</span>
                  </Dropdown.Item>
                  <Dropdown.Item href="#users" className="py-2">
                    <span className="me-3">👥</span>
                    <span className="fw-medium">Quản lý người dùng</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="#backup" className="py-2">
                    <span className="me-3">💾</span>
                    <span className="fw-medium">Sao lưu dữ liệu</span>
                  </Dropdown.Item>
                  <Dropdown.Item href="#reports" className="py-2">
                    <span className="me-3">📊</span>
                    <span className="fw-medium">Xuất báo cáo</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Dropdown align="end" className="ms-3">
                <Dropdown.Toggle variant="success" className="px-3 py-2" bsPrefix="btn" data-bs-toggle="dropdown">
                  <span className="me-2">👤</span>
                  <span className="fw-medium">Quản trị viên</span>
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#profile" className="py-2">
                    <span className="me-3">✏️</span>
                    <span className="fw-medium">Thông tin cá nhân</span>
                  </Dropdown.Item>
                  <Dropdown.Item href="#change-password" className="py-2">
                    <span className="me-3">🔑</span>
                    <span className="fw-medium">Đổi mật khẩu</span>
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item onClick={handleLogout} className="text-danger py-2">
                    <span className="me-3">🚪</span>
                    <span className="fw-medium">Đăng xuất</span>
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
          </Navbar>
        )}

        {/* Main Content */}
        <main className={`flex-grow-1 ${isLoginPage ? 'login-page' : ''}`}>
          {children}
        </main>

        {/* Footer - Hide on login page */}
        {!isLoginPage && (
          <footer className="bg-dark text-light py-3 mt-auto">
            <Container fluid>
              <div className="row align-items-center">
                <div className="col-md-6">
                  <small>
                    © 2025 Hệ thống Quản lý Kho thiết kế bởi AT
                    <span className="text-muted ms-2">
                      Quản lý điện thoại theo IMEI
                    </span>
                  </small>
                </div>
                <div className="col-md-6 text-end">
                  <small className="text-muted">
                    Phiên bản 1.0.0
                  </small>
                </div>
              </div>
            </Container>
          </footer>
        )}



      {/* Custom Styles */}
      <style jsx global>{`
        /* Warehouse V2 Global Styles */
        .warehouse-v2 {
          font-size: 1.1rem;
          line-height: 1.6;
        }

        .warehouse-v2 h1 { font-size: 2.2rem; font-weight: 600; }
        .warehouse-v2 h2 { font-size: 1.9rem; font-weight: 600; }
        .warehouse-v2 h3 { font-size: 1.6rem; font-weight: 600; }
        .warehouse-v2 h4 { font-size: 1.4rem; font-weight: 600; }
        .warehouse-v2 h5 { font-size: 1.2rem; font-weight: 600; }
        .warehouse-v2 h6 { font-size: 1.1rem; font-weight: 600; }

        .warehouse-v2 .table { font-size: 1rem; }
        .warehouse-v2 .table th {
          font-size: 1rem;
          font-weight: 600;
          padding: 0.875rem 0.75rem;
        }
        .warehouse-v2 .table td {
          font-size: 1rem;
          padding: 0.875rem 0.75rem;
          vertical-align: middle;
        }

        .warehouse-v2 .btn {
          font-size: 1rem;
          font-weight: 500;
          padding: 0.5rem 1rem;
        }
        .warehouse-v2 .btn-sm {
          font-size: 0.9rem;
          padding: 0.375rem 0.75rem;
        }

        .warehouse-v2 .card-header {
          font-size: 1.1rem;
          padding: 1rem 1.25rem;
        }
        .warehouse-v2 .card-body {
          font-size: 1rem;
          padding: 1.25rem;
        }

        .warehouse-v2 .form-label {
          font-size: 1rem;
          font-weight: 600;
        }
        .warehouse-v2 .form-control, .warehouse-v2 .form-select {
          font-size: 1rem;
          padding: 0.5rem 0.75rem;
        }

        .warehouse-v2 .badge {
          font-size: 0.85rem;
          padding: 0.375rem 0.75rem;
        }

        .warehouse-v2 .action-buttons .btn {
          font-size: 0.85rem;
          font-weight: 500;
          white-space: nowrap;
          min-width: 80px;
        }

        .warehouse-v2 .action-buttons .btn i {
          font-size: 0.8rem;
        }

        /* Ensure normal buttons keep their icon spacing */
        .warehouse-v2 .btn:not(.action-buttons .btn) i {
          margin-right: 0.5rem !important;
        }

        .warehouse-v2 .btn:not(.action-buttons .btn) i:last-child {
          margin-right: 0 !important;
          margin-left: 0.5rem !important;
        }

        /* Specific classes for icon spacing */
        .warehouse-v2 .btn .me-1 {
          margin-right: 0.25rem !important;
        }

        .warehouse-v2 .btn .me-2 {
          margin-right: 0.5rem !important;
        }

        /* InputGroup button styling */
        .warehouse-v2 .input-group .btn {
          border-color: #ced4da;
          display: flex;
          align-items: center;
          justify-content: center;
          min-width: 45px;
        }

        .warehouse-v2 .input-group .btn i {
          font-size: 1rem;
          margin: 0;
        }

        .warehouse-v2 .input-group .btn:hover {
          border-color: #86b7fe;
        }

        /* Toast Notifications */
        .toast {
          backdrop-filter: blur(10px);
          border-radius: 12px !important;
          border: none !important;
        }

        .toast-header {
          background: rgba(255, 255, 255, 0.95) !important;
          border-bottom: 1px solid rgba(0, 0, 0, 0.1) !important;
          border-radius: 12px 12px 0 0 !important;
        }

        .toast.bg-success .toast-header {
          background: rgba(25, 135, 84, 0.95) !important;
          color: white !important;
        }

        .toast.bg-danger .toast-header {
          background: rgba(220, 53, 69, 0.95) !important;
          color: white !important;
        }

        .toast.bg-warning .toast-header {
          background: rgba(255, 193, 7, 0.95) !important;
          color: black !important;
        }

        .toast.bg-info .toast-header {
          background: rgba(13, 202, 240, 0.95) !important;
          color: white !important;
        }

        /* Force FontAwesome icons to display */
        .fas, .far, .fab, .fal, .fad, .fass, .fasr, .fasl {
          font-family: "Font Awesome 6 Free" !important;
          font-weight: 900 !important;
          display: inline-block !important;
          font-style: normal !important;
          font-variant: normal !important;
          text-rendering: auto !important;
          line-height: 1 !important;
          -webkit-font-smoothing: antialiased !important;
          -moz-osx-font-smoothing: grayscale !important;
        }

        /* Specific FontAwesome classes */
        .fa-cog:before { content: "\f013"; }
        .fa-user:before { content: "\f007"; }
        .fa-mobile-alt:before { content: "\f3cd"; }
        .fa-tachometer-alt:before { content: "\f3fd"; }
        .fa-arrow-down:before { content: "\f063"; }
        .fa-shopping-cart:before { content: "\f07a"; }
        .fa-warehouse:before { content: "\f494"; }
        .fa-tags:before { content: "\f02c"; }
        .fa-users:before { content: "\f0c0"; }
        .fa-download:before { content: "\f019"; }
        .fa-file-export:before { content: "\f56e"; }
        .fa-user-edit:before { content: "\f4ff"; }
        .fa-key:before { content: "\f084"; }
        .fa-sign-out-alt:before { content: "\f2f5"; }
        .fa-code:before { content: "\f121"; }
        .fa-database:before { content: "\f1c0"; }
        .fa-react:before { content: "\f41b"; }

        /* Navigation Links Styling */
        .navbar-nav .nav-link {
          font-size: 1rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          margin: 0 0.25rem !important;
        }

        .navbar-nav .nav-link.active {
          background-color: rgba(255, 255, 255, 0.15) !important;
          border-radius: 0.5rem !important;
          color: #fff !important;
        }

        .navbar-nav .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.1) !important;
          border-radius: 0.5rem !important;
          transform: translateY(-1px);
        }

        .navbar-nav .nav-link span {
          font-size: 1rem !important;
        }

        .navbar-brand {
          font-size: 1.25rem !important;
          font-weight: 700 !important;
        }

        /* Header Dropdown Buttons Styling */
        .navbar .dropdown-toggle {
          font-size: 1rem !important;
          font-weight: 500 !important;
          transition: all 0.3s ease !important;
          border-radius: 0.5rem !important;
          box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1) !important;
        }

        .navbar .dropdown-toggle:hover {
          transform: translateY(-1px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.15) !important;
        }

        .navbar .dropdown-toggle:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        }

        /* Primary button (Cài đặt) */
        .navbar .btn-primary {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
          color: white !important;
        }

        .navbar .btn-primary:hover {
          background-color: #0b5ed7 !important;
          border-color: #0a58ca !important;
        }

        /* Success button (Quản trị viên) */
        .navbar .btn-success {
          background-color: #198754 !important;
          border-color: #198754 !important;
          color: white !important;
        }

        .navbar .btn-success:hover {
          background-color: #157347 !important;
          border-color: #146c43 !important;
        }

        .navbar .dropdown-toggle span {
          font-size: 1rem !important;
        }

        .navbar .dropdown-toggle .fw-medium {
          font-weight: 600 !important;
        }

        /* Dropdown Menu Styling */
        .navbar .dropdown-menu {
          border: none !important;
          box-shadow: 0 0.5rem 1rem rgba(0, 0, 0, 0.15) !important;
          border-radius: 0.5rem !important;
          padding: 0.5rem !important;
          min-width: 200px !important;
        }

        .navbar .dropdown-item {
          font-size: 0.95rem !important;
          padding: 0.5rem 1rem !important;
          border-radius: 0.375rem !important;
          transition: all 0.2s ease !important;
        }

        .navbar .dropdown-item:hover {
          background-color: #f8f9fa !important;
          transform: translateX(2px);
        }

        .navbar .dropdown-item .fw-medium {
          font-weight: 500 !important;
        }

        .navbar .dropdown-item span:first-child {
          font-size: 1.1rem !important;
        }

        /* Hide dropdown caret/arrow */
        .navbar .dropdown-toggle::after {
          display: none !important;
        }

        .navbar .dropdown-toggle::before {
          display: none !important;
        }

        /* Sell Product Modal Styling */
        .sell-product-modal .modal-dialog {
          max-width: 900px !important;
        }

        .sell-product-modal .modal-header {
          padding: 1.5rem 2rem !important;
          background: linear-gradient(135deg, #28a745, #20c997) !important;
          color: white !important;
          border-bottom: none !important;
        }

        .sell-product-modal .modal-header .btn-close {
          filter: invert(1) !important;
        }

        .sell-product-modal .modal-body {
          padding: 2rem !important;
          font-size: 1.1rem !important;
        }

        .sell-product-modal .modal-footer {
          padding: 1.5rem 2rem !important;
          background-color: #f8f9fa !important;
          border-top: 1px solid #dee2e6 !important;
        }

        .sell-product-modal .card {
          border: none !important;
          box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.1) !important;
          border-radius: 0.75rem !important;
        }

        .sell-product-modal .card-header {
          background: linear-gradient(135deg, #f8f9fa, #e9ecef) !important;
          border-bottom: 1px solid #dee2e6 !important;
          border-radius: 0.75rem 0.75rem 0 0 !important;
        }

        .sell-product-modal .form-control,
        .sell-product-modal .form-select {
          border-radius: 0.5rem !important;
          border: 2px solid #e9ecef !important;
          transition: all 0.3s ease !important;
        }

        .sell-product-modal .form-control:focus,
        .sell-product-modal .form-select:focus {
          border-color: #28a745 !important;
          box-shadow: 0 0 0 0.25rem rgba(40, 167, 69, 0.25) !important;
        }

        .sell-product-modal .btn {
          border-radius: 0.5rem !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }

        .sell-product-modal .btn:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 0.25rem 0.5rem rgba(0, 0, 0, 0.15) !important;
        }

        /* Reset Button Styling for Sales Page */
        .warehouse-v2 .btn-outline-primary {
          border-width: 2px !important;
          font-weight: 600 !important;
          transition: all 0.3s ease !important;
        }

        .warehouse-v2 .btn-outline-primary:hover {
          background-color: #0d6efd !important;
          border-color: #0d6efd !important;
          color: white !important;
          transform: translateY(-1px) !important;
          box-shadow: 0 0.25rem 0.5rem rgba(13, 110, 253, 0.25) !important;
        }

        .warehouse-v2 .btn-outline-primary:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25) !important;
        }

        /* Action buttons with emoji styling */
        .warehouse-v2 .btn-group-sm .btn {
          min-width: 40px !important;
          height: 32px !important;
          display: flex !important;
          align-items: center !important;
          justify-content: center !important;
          border-radius: 0.375rem !important;
          transition: all 0.2s ease !important;
        }

        .warehouse-v2 .btn-group-sm .btn:hover {
          transform: scale(1.05) !important;
        }

        .warehouse-v2 .btn-group-sm .btn span {
          font-size: 14px !important;
        }

        /* Import Page Styling */
        .warehouse-v2 .import-page {
          font-size: 1.1rem !important;
        }

        .warehouse-v2 .import-page .breadcrumb {
          font-size: 1.1rem !important;
        }

        .warehouse-v2 .import-page h2 {
          font-size: 2rem !important;
          font-weight: 700 !important;
        }

        .warehouse-v2 .import-page .text-muted {
          font-size: 1.1rem !important;
        }

        .warehouse-v2 .import-page .nav-tabs .nav-link {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          padding: 0.75rem 1.5rem !important;
        }

        .warehouse-v2 .import-page .badge {
          font-size: 0.9rem !important;
        }

        .warehouse-v2 .import-page .bg-light {
          font-size: 1.05rem !important;
        }

        .warehouse-v2 .import-page .bg-light strong {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
        }

        .warehouse-v2 .import-page .text-primary,
        .warehouse-v2 .import-page .text-info,
        .warehouse-v2 .import-page .text-success {
          font-size: 1.1rem !important;
          font-weight: 500 !important;
        }

        /* Compact Reset and Add Product Buttons */
        .warehouse-v2 .btn-compact {
          padding: 0.375rem 0.75rem !important;
          font-size: 0.9rem !important;
          font-weight: 600 !important;
          border-radius: 0.375rem !important;
          min-width: auto !important;
          white-space: nowrap !important;
        }

        .warehouse-v2 .btn-compact span {
          font-size: 0.9rem !important;
        }

        .warehouse-v2 .btn-compact:hover {
          transform: translateY(-1px) !important;
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.15) !important;
        }

        /* Button group for reset and add product */
        .warehouse-v2 .btn-group-compact {
          gap: 0.5rem !important;
        }

        .warehouse-v2 .btn-group-compact .btn {
          flex: 0 0 auto !important;
        }

        /* Breadcrumb Styling Fix */
        .warehouse-v2 .breadcrumb {
          background-color: transparent !important;
          padding: 0.75rem 0 !important;
          margin-bottom: 1rem !important;
          font-size: 1rem !important;
        }

        .warehouse-v2 .breadcrumb-item {
          color: #6c757d !important;
          font-weight: 500 !important;
        }

        .warehouse-v2 .breadcrumb-item a {
          color: #0d6efd !important;
          text-decoration: none !important;
          transition: color 0.3s ease !important;
        }

        .warehouse-v2 .breadcrumb-item a:hover {
          color: #0b5ed7 !important;
          text-decoration: underline !important;
        }

        .warehouse-v2 .breadcrumb-item.active {
          color: #495057 !important;
          font-weight: 600 !important;
        }

        .warehouse-v2 .breadcrumb-item + .breadcrumb-item::before {
          content: "/" !important;
          color: #6c757d !important;
          font-weight: normal !important;
        }
        
        .min-vh-100 {
          min-height: 100vh;
          display: flex;
          flex-direction: column;
        }
        
        main {
          flex: 1;
        }
        
        .shadow-sm {
          box-shadow: 0 0.125rem 0.25rem rgba(0, 0, 0, 0.075) !important;
        }
        
        .card:hover {
          transition: transform 0.2s ease-in-out;
        }
        
        .btn-group-sm > .btn, .btn-sm {
          padding: 0.25rem 0.5rem;
          font-size: 0.875rem;
          border-radius: 0.2rem;
        }
        
        .table th {
          border-top: none;
          font-weight: 600;
          background-color: #f8f9fa;
        }
        
        .badge {
          font-size: 0.75em;
        }
        
        .text-truncate {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        
        .progress {
          height: 0.5rem;
        }
        
        .spinner-border-sm {
          width: 1rem;
          height: 1rem;
        }
        
        code {
          color: #e83e8c;
          background-color: #f8f9fa;
          padding: 0.2rem 0.4rem;
          border-radius: 0.25rem;
          font-size: 87.5%;
        }
        
        .alert {
          border: none;
          border-radius: 0.5rem;
        }
        
        .modal-header {
          border-bottom: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }
        
        .modal-footer {
          border-top: 1px solid #dee2e6;
          background-color: #f8f9fa;
        }
        
        .form-control:focus, .form-select:focus {
          border-color: #86b7fe;
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .btn:focus {
          box-shadow: 0 0 0 0.25rem rgba(13, 110, 253, 0.25);
        }
        
        .navbar-brand small {
          font-size: 0.75rem;
          font-weight: normal;
        }
        
        @media (max-width: 768px) {
          .warehouse-v2 { font-size: 1rem; }
          .warehouse-v2 h1 { font-size: 1.8rem; }
          .warehouse-v2 h2 { font-size: 1.6rem; }

          .warehouse-v2 .action-buttons .btn {
            font-size: 0.8rem;
            min-width: 70px;
          }

          .navbar-nav {
            padding-top: 0.5rem;
          }

          .navbar-nav .nav-link {
            padding: 0.5rem 1rem;
          }

          .table-responsive {
            font-size: 0.875rem;
          }

          .btn-group-sm > .btn, .btn-sm {
            padding: 0.125rem 0.25rem;
            font-size: 0.75rem;
          }
        }

        @media (max-width: 576px) {
          .warehouse-v2 { font-size: 0.95rem; }

          .warehouse-v2 .action-buttons .btn {
            font-size: 0.75rem;
            min-width: 60px;
            padding: 0.25rem 0.5rem;
          }

          .warehouse-v2 .action-buttons .btn span {
            display: none !important;
          }

          .warehouse-v2 .action-buttons .btn i {
            margin: 0 !important;
          }

          /* Ensure other buttons keep their icons on mobile */
          .warehouse-v2 .btn:not(.action-buttons .btn) i {
            margin-right: 0.5rem !important;
          }

          .warehouse-v2 .btn:not(.action-buttons .btn) span {
            display: inline !important;
          }
        }
      `}</style>
        </div>
      </ToastProvider>
    </AuthGuard>
  );
};

export default WarehouseV2Layout;
