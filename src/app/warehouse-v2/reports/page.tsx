'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Breadcrumb, Card, Table, Button, Form, Badge, Pagination, InputGroup } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';
import * as XLSX from 'xlsx';

interface SoldProduct {
  ProductID: number;
  ProductName: string;
  IMEI: string;
  CategoryName: string;
  BatchCode: string;
  ImportDate: string;
  ImportPrice: number;
  SalePrice: number;
  Profit: number;
  SoldDate: string;
  InvoiceNumber: string;
  CustomerInfo: string;
  Notes: string;
  CreatedBy: string;
}

const ReportsPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [soldProducts, setSoldProducts] = useState<SoldProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalRecords, setTotalRecords] = useState(0);
  
  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // Statistics
  const [stats, setStats] = useState({
    totalSold: 0,
    totalRevenue: 0,
    totalProfit: 0,
    totalCost: 0
  });

  useEffect(() => {
    fetchSoldProducts();
    fetchCategories();
    
    // Set default date range (current month)
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    
    setFromDate(firstDay.toISOString().split('T')[0]);
    setToDate(lastDay.toISOString().split('T')[0]);
  }, []);

  const fetchSoldProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        status: 'SOLD',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      });

      const response = await fetch(`/api/products-v2?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        setSoldProducts(result.data.data);
        setTotalPages(result.data.totalPages);
        setCurrentPage(result.data.page);
        setTotalRecords(result.data.total);
        
        // Calculate statistics
        calculateStats(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching sold products:', error);
      showError('Lỗi tải dữ liệu', 'Không thể tải danh sách sản phẩm đã bán');
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const calculateStats = (products: SoldProduct[]) => {
    const totalSold = products.length;
    const totalRevenue = products.reduce((sum, product) => sum + product.SalePrice, 0);
    const totalCost = products.reduce((sum, product) => sum + product.ImportPrice, 0);
    const totalProfit = totalRevenue - totalCost;

    setStats({
      totalSold,
      totalRevenue,
      totalProfit,
      totalCost
    });
  };

  const handleSearch = () => {
    fetchSoldProducts(1);
  };

  const handlePageChange = (page: number) => {
    fetchSoldProducts(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString('vi-VN');
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-success';
    if (profit < 0) return 'text-danger';
    return 'text-muted';
  };

  const exportToExcel = async () => {
    try {
      setLoading(true);
      
      // Fetch all sold products for export (without pagination)
      const params = new URLSearchParams({
        page: '1',
        limit: '10000',
        status: 'SOLD',
        ...(searchTerm && { search: searchTerm }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      });

      const response = await fetch(`/api/products-v2?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        const exportData = result.data.data.map((product: SoldProduct, index: number) => ({
          'STT': index + 1,
          'Tên sản phẩm': product.ProductName,
          'IMEI': product.IMEI,
          'Danh mục': product.CategoryName,
          'Mã lô hàng': product.BatchCode,
          'Ngày nhập': formatDate(product.ImportDate),
          'Giá nhập (VNĐ)': product.ImportPrice,
          'Giá bán (VNĐ)': product.SalePrice,
          'Lợi nhuận (VNĐ)': product.SalePrice - product.ImportPrice,
          'Tỷ lệ lợi nhuận (%)': ((product.SalePrice - product.ImportPrice) / product.ImportPrice * 100).toFixed(2),
          'Ngày bán': formatDateTime(product.SoldDate),
          'Số hóa đơn': product.InvoiceNumber || '',
          'Thông tin khách hàng': product.CustomerInfo || '',
          'Ghi chú': product.Notes || '',
          'Người tạo': product.CreatedBy || ''
        }));

        // Add summary row
        const summaryRow = {
          'STT': '',
          'Tên sản phẩm': 'TỔNG CỘNG',
          'IMEI': '',
          'Danh mục': '',
          'Mã lô hàng': '',
          'Ngày nhập': '',
          'Giá nhập (VNĐ)': result.data.data.reduce((sum: number, p: SoldProduct) => sum + p.ImportPrice, 0),
          'Giá bán (VNĐ)': result.data.data.reduce((sum: number, p: SoldProduct) => sum + p.SalePrice, 0),
          'Lợi nhuận (VNĐ)': result.data.data.reduce((sum: number, p: SoldProduct) => sum + (p.SalePrice - p.ImportPrice), 0),
          'Tỷ lệ lợi nhuận (%)': '',
          'Ngày bán': '',
          'Số hóa đơn': '',
          'Thông tin khách hàng': '',
          'Ghi chú': `Tổng ${result.data.data.length} sản phẩm`,
          'Người tạo': ''
        };

        exportData.push(summaryRow);

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = [
          { wch: 5 },   // STT
          { wch: 25 },  // Tên sản phẩm
          { wch: 18 },  // IMEI
          { wch: 15 },  // Danh mục
          { wch: 15 },  // Mã lô hàng
          { wch: 12 },  // Ngày nhập
          { wch: 15 },  // Giá nhập
          { wch: 15 },  // Giá bán
          { wch: 15 },  // Lợi nhuận
          { wch: 12 },  // Tỷ lệ lợi nhuận
          { wch: 18 },  // Ngày bán
          { wch: 15 },  // Số hóa đơn
          { wch: 25 },  // Thông tin khách hàng
          { wch: 20 },  // Ghi chú
          { wch: 15 }   // Người tạo
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Báo cáo bán hàng');

        // Generate filename with date range
        const fromDateStr = fromDate ? new Date(fromDate).toLocaleDateString('vi-VN').replace(/\//g, '-') : '';
        const toDateStr = toDate ? new Date(toDate).toLocaleDateString('vi-VN').replace(/\//g, '-') : '';
        const dateRange = fromDateStr && toDateStr ? `_${fromDateStr}_den_${toDateStr}` : '';
        const filename = `Bao_cao_ban_hang${dateRange}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);

        showSuccess('Xuất Excel thành công!', `File ${filename} đã được tải xuống`);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Có lỗi xảy ra khi xuất Excel!', 'Vui lòng thử lại sau');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container fluid>
      <Row>
        <Col>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-3">
            <Breadcrumb.Item href="/warehouse-v2">Warehouse</Breadcrumb.Item>
            <Breadcrumb.Item active>Báo cáo bán hàng</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <span className="me-2">📊</span>
              Báo cáo bán hàng
            </h2>
          </div>

          {/* Statistics Cards */}
          <Row className="mb-4">
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-primary">{stats.totalSold}</h5>
                  <small className="text-muted">Sản phẩm đã bán</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-success">{formatCurrency(stats.totalRevenue)}</h5>
                  <small className="text-muted">Tổng doanh thu</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className="text-info">{formatCurrency(stats.totalCost)}</h5>
                  <small className="text-muted">Tổng chi phí</small>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="text-center">
                <Card.Body>
                  <h5 className={getProfitColor(stats.totalProfit)}>{formatCurrency(stats.totalProfit)}</h5>
                  <small className="text-muted">Tổng lợi nhuận</small>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Filters and Export */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <span className="me-2">🔍</span>
                Bộ lọc và xuất báo cáo
              </h5>
            </Card.Header>
            <Card.Body>
              <Row className="mb-3">
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Từ ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={fromDate}
                      onChange={(e) => setFromDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Đến ngày</Form.Label>
                    <Form.Control
                      type="date"
                      value={toDate}
                      onChange={(e) => setToDate(e.target.value)}
                    />
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Danh mục</Form.Label>
                    <Form.Select
                      value={categoryFilter}
                      onChange={(e) => setCategoryFilter(e.target.value)}
                    >
                      <option value="">Tất cả danh mục</option>
                      {categories.map(category => (
                        <option key={category.CategoryID} value={category.CategoryID}>
                          {category.CategoryName}
                        </option>
                      ))}
                    </Form.Select>
                  </Form.Group>
                </Col>
                <Col md={3}>
                  <Form.Group>
                    <Form.Label>Tìm kiếm</Form.Label>
                    <InputGroup>
                      <Form.Control
                        type="text"
                        placeholder="Tên sản phẩm, IMEI..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      />
                      <Button
                        variant="primary"
                        onClick={handleSearch}
                        title="Tìm kiếm"
                      >
                        🔍
                      </Button>
                    </InputGroup>
                  </Form.Group>
                </Col>
              </Row>

              <div className="d-flex gap-2">
                <Button
                  variant="outline-primary"
                  onClick={() => {
                    setSearchTerm('');
                    setCategoryFilter('');
                    setFromDate('');
                    setToDate('');
                    fetchSoldProducts(1);
                  }}
                  title="Đặt lại bộ lọc"
                >
                  <span className="me-1">🔄</span>
                  Đặt lại
                </Button>
                <Button
                  variant="success"
                  onClick={exportToExcel}
                  disabled={loading}
                  title="Xuất báo cáo Excel"
                >
                  {loading ? (
                    <>
                      <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                      Đang xuất...
                    </>
                  ) : (
                    <>
                      <span className="me-1">📊</span>
                      Xuất Excel
                    </>
                  )}
                </Button>
              </div>
            </Card.Body>
          </Card>

          {/* Products Table */}
          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center">
              <h5 className="mb-0">
                <span className="me-2">📋</span>
                Danh sách sản phẩm đã bán
                <Badge bg="info" className="ms-2">{totalRecords} sản phẩm</Badge>
              </h5>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : (
                <>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>STT</th>
                        <th>Sản phẩm</th>
                        <th>IMEI</th>
                        <th>Danh mục</th>
                        <th>Lô hàng</th>
                        <th>Giá nhập</th>
                        <th>Giá bán</th>
                        <th>Lợi nhuận</th>
                        <th>Ngày bán</th>
                        <th>Hóa đơn</th>
                        <th>Khách hàng</th>
                      </tr>
                    </thead>
                    <tbody>
                      {soldProducts.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="text-center py-4">
                            Không có dữ liệu sản phẩm đã bán
                          </td>
                        </tr>
                      ) : (
                        soldProducts.map((product, index) => (
                          <tr key={product.ProductID}>
                            <td>{(currentPage - 1) * 20 + index + 1}</td>
                            <td>
                              <div>
                                <strong>{product.ProductName}</strong>
                                {product.Notes && (
                                  <small className="d-block text-muted">
                                    {product.Notes}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <code className="text-primary">{product.IMEI}</code>
                            </td>
                            <td>
                              <Badge bg="info">{product.CategoryName}</Badge>
                            </td>
                            <td>
                              <small>
                                <code>{product.BatchCode}</code>
                                <div className="text-muted">
                                  {formatDate(product.ImportDate)}
                                </div>
                              </small>
                            </td>
                            <td>{formatCurrency(product.ImportPrice)}</td>
                            <td>
                              <span className="text-success">
                                {formatCurrency(product.SalePrice)}
                              </span>
                            </td>
                            <td>
                              <span className={getProfitColor(product.SalePrice - product.ImportPrice)}>
                                {formatCurrency(product.SalePrice - product.ImportPrice)}
                              </span>
                            </td>
                            <td>
                              <div>
                                <small>{formatDateTime(product.SoldDate)}</small>
                              </div>
                            </td>
                            <td>
                              {product.InvoiceNumber && (
                                <small>
                                  <code>{product.InvoiceNumber}</code>
                                </small>
                              )}
                            </td>
                            <td>
                              {product.CustomerInfo && (
                                <small className="text-muted">
                                  {product.CustomerInfo}
                                </small>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </Table>

                  {/* Pagination */}
                  {totalPages > 1 && (
                    <div className="d-flex justify-content-center">
                      <Pagination>
                        <Pagination.Prev
                          disabled={currentPage === 1}
                          onClick={() => handlePageChange(currentPage - 1)}
                        />
                        {Array.from({ length: Math.min(totalPages, 10) }, (_, i) => {
                          const page = i + 1;
                          return (
                            <Pagination.Item
                              key={page}
                              active={page === currentPage}
                              onClick={() => handlePageChange(page)}
                            >
                              {page}
                            </Pagination.Item>
                          );
                        })}
                        <Pagination.Next
                          disabled={currentPage === totalPages}
                          onClick={() => handlePageChange(currentPage + 1)}
                        />
                      </Pagination>
                    </div>
                  )}
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ReportsPage;
