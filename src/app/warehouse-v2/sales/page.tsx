'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab, Card, Table, Badge } from 'react-bootstrap';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';
import SellProductForm from '@/components/warehouse-v2/SellProductForm';

interface ProductV2 {
  ProductID: number;
  BatchID: number;
  CategoryID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  Status: 'IN_STOCK' | 'SOLD' | 'DAMAGED' | 'RETURNED';
  SoldDate?: string;
  InvoiceNumber?: string;
  CustomerInfo?: string;
  Notes?: string;
  CreatedAt: string;
  UpdatedAt: string;
  CategoryName?: string;
  BatchCode?: string;
  ImportDate?: string;
}

interface SalesInvoice {
  InvoiceID: number;
  InvoiceNumber: string;
  CustomerName?: string;
  CustomerPhone?: string;
  SaleDate: string;
  TotalAmount: number;
  FinalAmount: number;
  PaymentMethod: string;
  Status: string;
  ProductName?: string;
  IMEI?: string;
  ProductSalePrice?: number;
}

const SalesPage: React.FC = () => {
  const [showSellForm, setShowSellForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductV2 | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('available');
  const [recentSales, setRecentSales] = useState<SalesInvoice[]>([]);

  const handleSellProduct = (product: ProductV2) => {
    setSelectedProduct(product);
    setShowSellForm(true);
  };

  const handleCloseSellForm = () => {
    setShowSellForm(false);
    setSelectedProduct(null);
  };

  const handleSellSuccess = () => {
    setRefreshKey(prev => prev + 1);
    setShowSellForm(false);
    setSelectedProduct(null);
    fetchRecentSales();
  };

  const fetchRecentSales = async () => {
    try {
      const response = await fetch('/api/sales?limit=10');
      const result = await response.json();
      if (result.success) {
        setRecentSales(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent sales:', error);
    }
  };

  React.useEffect(() => {
    fetchRecentSales();
  }, []);

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

  const getPaymentMethodBadge = (method: string) => {
    switch (method) {
      case 'CASH':
        return <Badge bg="success">Tiền mặt</Badge>;
      case 'CARD':
        return <Badge bg="primary">Thẻ</Badge>;
      case 'TRANSFER':
        return <Badge bg="info">Chuyển khoản</Badge>;
      default:
        return <Badge bg="secondary">{method}</Badge>;
    }
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          {/* Breadcrumb */}
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Bán hàng</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <div>
              <h2 className="mb-1">
                <i className="fas fa-shopping-cart text-success me-2"></i>
                Quản lý bán hàng
              </h2>
              <p className="text-muted mb-0">
                Bán sản phẩm và quản lý hóa đơn
              </p>
            </div>
          </div>

          {/* Main Content */}
          <Tabs
            activeKey={activeTab}
            onSelect={(k) => setActiveTab(k || 'available')}
            className="mb-3"
          >
            <Tab eventKey="available" title={
              <span>
                <i className="fas fa-mobile-alt me-2"></i>
                Sản phẩm có thể bán
              </span>
            }>
              <ProductListV2
                key={refreshKey}
                availableOnly={true}
                onSellProduct={handleSellProduct}
              />
            </Tab>

            <Tab eventKey="recent-sales" title={
              <span>
                <i className="fas fa-receipt me-2"></i>
                Giao dịch gần đây
              </span>
            }>
              <Card>
                <Card.Header>
                  <h5 className="mb-0">
                    <i className="fas fa-history me-2"></i>
                    Giao dịch bán hàng gần đây
                  </h5>
                </Card.Header>
                <Card.Body>
                  {recentSales.length === 0 ? (
                    <div className="text-center py-4 text-muted">
                      <i className="fas fa-receipt fa-3x mb-3"></i>
                      <div>Chưa có giao dịch nào</div>
                    </div>
                  ) : (
                    <Table responsive striped hover>
                      <thead>
                        <tr>
                          <th>Số hóa đơn</th>
                          <th>Ngày bán</th>
                          <th>Sản phẩm</th>
                          <th>IMEI</th>
                          <th>Khách hàng</th>
                          <th>Giá bán</th>
                          <th>Thanh toán</th>
                          <th>Trạng thái</th>
                          <th>Thao tác</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentSales.map((sale) => (
                          <tr key={sale.InvoiceID}>
                            <td>
                              <code className="text-primary">{sale.InvoiceNumber}</code>
                            </td>
                            <td>{formatDateTime(sale.SaleDate)}</td>
                            <td>
                              <div>
                                <strong>{sale.ProductName}</strong>
                              </div>
                            </td>
                            <td>
                              <code>{sale.IMEI}</code>
                            </td>
                            <td>
                              <div>
                                {sale.CustomerName || 'Khách lẻ'}
                                {sale.CustomerPhone && (
                                  <small className="d-block text-muted">
                                    {sale.CustomerPhone}
                                  </small>
                                )}
                              </div>
                            </td>
                            <td>
                              <span className="text-success fw-bold">
                                {formatCurrency(sale.ProductSalePrice || sale.FinalAmount)}
                              </span>
                            </td>
                            <td>{getPaymentMethodBadge(sale.PaymentMethod)}</td>
                            <td>
                              <Badge bg="success">Hoàn thành</Badge>
                            </td>
                            <td>
                              <div className="btn-group btn-group-sm">
                                <button
                                  className="btn btn-outline-primary btn-sm"
                                  title="In hóa đơn"
                                >
                                  <i className="fas fa-print"></i>
                                </button>
                                <button
                                  className="btn btn-outline-info btn-sm"
                                  title="Xem chi tiết"
                                >
                                  <i className="fas fa-eye"></i>
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>

            <Tab eventKey="statistics" title={
              <span>
                <i className="fas fa-chart-bar me-2"></i>
                Thống kê bán hàng
              </span>
            }>
              <Row>
                <Col md={3}>
                  <Card className="border-success">
                    <Card.Body className="text-center">
                      <i className="fas fa-shopping-cart fa-2x text-success mb-2"></i>
                      <h4 className="text-success">{recentSales.length}</h4>
                      <small className="text-muted">Giao dịch hôm nay</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-primary">
                    <Card.Body className="text-center">
                      <i className="fas fa-money-bill-wave fa-2x text-primary mb-2"></i>
                      <h6 className="text-primary">
                        {formatCurrency(
                          recentSales.reduce((sum, sale) => sum + (sale.ProductSalePrice || sale.FinalAmount), 0)
                        )}
                      </h6>
                      <small className="text-muted">Doanh thu hôm nay</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-warning">
                    <Card.Body className="text-center">
                      <i className="fas fa-mobile-alt fa-2x text-warning mb-2"></i>
                      <h4 className="text-warning">{recentSales.length}</h4>
                      <small className="text-muted">Sản phẩm đã bán</small>
                    </Card.Body>
                  </Card>
                </Col>
                <Col md={3}>
                  <Card className="border-info">
                    <Card.Body className="text-center">
                      <i className="fas fa-percentage fa-2x text-info mb-2"></i>
                      <h4 className="text-info">
                        {recentSales.length > 0 
                          ? (recentSales.filter(s => s.PaymentMethod === 'CASH').length / recentSales.length * 100).toFixed(0)
                          : 0}%
                      </h4>
                      <small className="text-muted">Thanh toán tiền mặt</small>
                    </Card.Body>
                  </Card>
                </Col>
              </Row>
            </Tab>
          </Tabs>

          {/* Sell Product Form Modal */}
          <SellProductForm
            show={showSellForm}
            onHide={handleCloseSellForm}
            onSuccess={handleSellSuccess}
            product={selectedProduct}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default SalesPage;
