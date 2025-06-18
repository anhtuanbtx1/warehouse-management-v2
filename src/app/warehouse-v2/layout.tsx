'use client';

import React from 'react';
import { Navbar, Nav, Container, Dropdown } from 'react-bootstrap';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ToastProvider } from '@/contexts/ToastContext';

interface WarehouseV2LayoutProps {
  children: React.ReactNode;
}

const WarehouseV2Layout: React.FC<WarehouseV2LayoutProps> = ({ children }) => {
  const pathname = usePathname();

  const isActive = (path: string) => {
    return pathname === path ? 'active' : '';
  };

  return (
    <ToastProvider>
      <div className="warehouse-v2 min-vh-100 bg-light">
      {/* Navigation */}
      <Navbar bg="dark" variant="dark" expand="lg" className="shadow-sm">
        <Container fluid>
          <Navbar.Brand as={Link} href="/warehouse-v2">
            <i className="fas fa-mobile-alt me-2"></i>
            Warehouse V2
            <small className="ms-2 text-muted">Phone Management</small>
          </Navbar.Brand>
          
          <Navbar.Toggle aria-controls="warehouse-navbar" />
          
          <Navbar.Collapse id="warehouse-navbar">
            <Nav className="me-auto">
              <Nav.Link 
                as={Link} 
                href="/warehouse-v2" 
                className={isActive('/warehouse-v2')}
              >
                <i className="fas fa-tachometer-alt me-1"></i>
                Dashboard
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                href="/warehouse-v2/import" 
                className={isActive('/warehouse-v2/import')}
              >
                <i className="fas fa-arrow-down me-1"></i>
                Nhập hàng
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                href="/warehouse-v2/sales" 
                className={isActive('/warehouse-v2/sales')}
              >
                <i className="fas fa-shopping-cart me-1"></i>
                Bán hàng
              </Nav.Link>
              
              <Nav.Link 
                as={Link} 
                href="/warehouse-v2/inventory" 
                className={isActive('/warehouse-v2/inventory')}
              >
                <i className="fas fa-warehouse me-1"></i>
                Tồn kho
              </Nav.Link>
            </Nav>
            
            <Nav>
              <Dropdown align="end">
                <Dropdown.Toggle variant="outline-light" size="sm">
                  <i className="fas fa-cog me-1"></i>
                  Cài đặt
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#categories">
                    <i className="fas fa-tags me-2"></i>
                    Danh mục sản phẩm
                  </Dropdown.Item>
                  <Dropdown.Item href="#users">
                    <i className="fas fa-users me-2"></i>
                    Quản lý người dùng
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="#backup">
                    <i className="fas fa-download me-2"></i>
                    Sao lưu dữ liệu
                  </Dropdown.Item>
                  <Dropdown.Item href="#reports">
                    <i className="fas fa-file-export me-2"></i>
                    Xuất báo cáo
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              
              <Dropdown align="end" className="ms-2">
                <Dropdown.Toggle variant="outline-light" size="sm">
                  <i className="fas fa-user me-1"></i>
                  Admin
                </Dropdown.Toggle>
                <Dropdown.Menu>
                  <Dropdown.Item href="#profile">
                    <i className="fas fa-user-edit me-2"></i>
                    Thông tin cá nhân
                  </Dropdown.Item>
                  <Dropdown.Item href="#change-password">
                    <i className="fas fa-key me-2"></i>
                    Đổi mật khẩu
                  </Dropdown.Item>
                  <Dropdown.Divider />
                  <Dropdown.Item href="#logout" className="text-danger">
                    <i className="fas fa-sign-out-alt me-2"></i>
                    Đăng xuất
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>

      {/* Main Content */}
      <main className="flex-grow-1">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-dark text-light py-3 mt-auto">
        <Container fluid>
          <div className="row align-items-center">
            <div className="col-md-6">
              <small>
                © 2024 Warehouse Management System V2. 
                <span className="text-muted ms-2">
                  Chuyên biệt cho quản lý điện thoại theo IMEI
                </span>
              </small>
            </div>
            <div className="col-md-6 text-end">
              <small className="text-muted">
                <i className="fas fa-code me-1"></i>
                Phiên bản 2.0.0
                <span className="ms-3">
                  <i className="fas fa-database me-1"></i>
                  SQL Server
                </span>
                <span className="ms-3">
                  <i className="fab fa-react me-1"></i>
                  Next.js 14
                </span>
              </small>
            </div>
          </div>
        </Container>
      </footer>

      {/* FontAwesome CDN */}
      <link
        rel="stylesheet"
        href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        integrity="sha512-iecdLmaskl7CVkqkXNQ/ZH/XLlvWZOJyj7Yy7tcenmpD1ypASozpmT/E0iPtmFIB46ZmdtAc9eNBvH0H/ZpiBw=="
        crossOrigin="anonymous"
        referrerPolicy="no-referrer"
      />

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
        }

        .navbar-nav .nav-link.active {
          background-color: rgba(255, 255, 255, 0.1);
          border-radius: 0.375rem;
        }

        .navbar-nav .nav-link:hover {
          background-color: rgba(255, 255, 255, 0.05);
          border-radius: 0.375rem;
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
  );
};

export default WarehouseV2Layout;
