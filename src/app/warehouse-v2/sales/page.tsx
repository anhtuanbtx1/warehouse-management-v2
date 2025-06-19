'use client';

import React, { useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab, Card, Table, Badge } from 'react-bootstrap';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';
import SellProductForm from '@/components/warehouse-v2/SellProductForm';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';

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
  ImportPrice?: number;
  Profit?: number;
}

const SalesPage: React.FC = () => {
  const [showSellForm, setShowSellForm] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductV2 | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('available');
  const [recentSales, setRecentSales] = useState<SalesInvoice[]>([]);

  // Invoice states
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

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
    return new Date(dateString).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  const formatDateTime = (dateString: string) => {
    // Parse date string - nếu database trả về UTC time
    let date = new Date(dateString);

    // Nếu database trả về time không có timezone info và là UTC
    // thì cần thêm 7 giờ cho múi giờ VN
    if (!dateString.includes('Z') && !dateString.includes('+')) {
      // Giả sử database time là UTC, thêm 7 giờ
      date = new Date(date.getTime() + (7 * 60 * 60 * 1000));
    }

    return date.toLocaleString('vi-VN', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
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

  const handlePrintInvoice = (sale: SalesInvoice) => {
    // Use available data from the sales list to create invoice
    const estimatedImportPrice = Math.round((sale.ProductSalePrice || sale.FinalAmount) * 0.75);

    const invoice = {
      invoiceNumber: sale.InvoiceNumber,
      saleDate: sale.SaleDate,
      product: {
        ProductID: 0,
        ProductName: sale.ProductName || 'Sản phẩm',
        IMEI: sale.IMEI || '',
        ImportPrice: estimatedImportPrice,
        SalePrice: sale.ProductSalePrice || sale.FinalAmount,
        CategoryName: sale.ProductName?.includes('iPhone 16') ? 'iPhone 16' :
                     sale.ProductName?.includes('iPhone 15') ? 'iPhone 15' :
                     sale.ProductName?.includes('iPhone 14') ? 'iPhone 14' : 'iPhone'
      },
      customerInfo: sale.CustomerName ? {
        name: sale.CustomerName,
        phone: sale.CustomerPhone,
        address: ''
      } : undefined
    };

    setInvoiceData(invoice);
    setShowInvoice(true);
  };

  const handlePrintInvoiceFromProduct = (product: any) => {
    // Create invoice from product data
    const invoice = {
      invoiceNumber: product.InvoiceNumber || `HD${Date.now()}`,
      saleDate: product.SoldDate || new Date().toISOString(),
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        IMEI: product.IMEI,
        ImportPrice: product.ImportPrice,
        SalePrice: product.SalePrice || product.ImportPrice * 1.2,
        CategoryName: product.CategoryName
      },
      customerInfo: product.CustomerInfo ? {
        name: product.CustomerInfo,
        phone: '',
        address: ''
      } : undefined
    };

    setInvoiceData(invoice);
    setShowInvoice(true);
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
                onPrintInvoice={handlePrintInvoiceFromProduct}
                showAddButton={false}
                hideCategoryFilter={true}
                hideColumns={['salePrice', 'profit', 'saleDate']}
                hideResetButton={true}
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
                      <span className="fa-3x mb-3">🧾</span>
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
                          <th>Giá nhập</th>
                          <th>Giá bán</th>
                          <th>Lợi nhuận</th>
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
                              <span className="text-info">
                                {sale.ImportPrice ? formatCurrency(sale.ImportPrice) : '-'}
                              </span>
                            </td>
                            <td>
                              <span className="text-success fw-bold">
                                {formatCurrency(sale.ProductSalePrice || sale.FinalAmount)}
                              </span>
                            </td>
                            <td>
                              <span className={`fw-bold ${
                                sale.Profit && sale.Profit > 0 ? 'text-success' :
                                sale.Profit && sale.Profit < 0 ? 'text-danger' : 'text-muted'
                              }`}>
                                {sale.Profit ? formatCurrency(sale.Profit) : '-'}
                              </span>
                            </td>
                            <td>
                              <Badge bg="success">Hoàn thành</Badge>
                            </td>
                            <td>
                              <button
                                className="btn btn-outline-primary btn-sm"
                                title="In hóa đơn"
                                onClick={() => handlePrintInvoice(sale)}
                              >
                                <span>🖨️</span>
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  )}
                </Card.Body>
              </Card>
            </Tab>


          </Tabs>

          {/* Sell Product Form Modal */}
          <SellProductForm
            show={showSellForm}
            onHide={handleCloseSellForm}
            onSuccess={handleSellSuccess}
            product={selectedProduct}
          />

          {/* Invoice Print Modal */}
          <InvoicePrint
            show={showInvoice}
            onHide={() => setShowInvoice(false)}
            invoiceData={invoiceData}
          />
        </Col>
      </Row>
    </Container>
  );
};

export default SalesPage;
