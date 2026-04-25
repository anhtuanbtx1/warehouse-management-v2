'use client';

import React, { useCallback, useState } from 'react';
import { Container, Row, Col, Breadcrumb, Tabs, Tab, Card, Table, Badge } from 'react-bootstrap';
import ProductListV2 from '@/components/warehouse-v2/ProductListV2';
import SellProductForm from '@/components/warehouse-v2/SellProductForm';
import QrImeiPaymentSubmenu from '@/components/warehouse-v2/QrImeiPaymentSubmenu';
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
  const [showQrImeiSubmenu, setShowQrImeiSubmenu] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<ProductV2 | null>(null);
  const [refreshKey, setRefreshKey] = useState(0);
  const [activeTab, setActiveTab] = useState('available');
  const [recentSales, setRecentSales] = useState<SalesInvoice[]>([]);
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

  const fetchRecentSales = useCallback(async () => {
    try {
      const response = await fetch('/api/sales?limit=10');
      const result = await response.json();
      if (result.success) {
        setRecentSales(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching recent sales:', error);
    }
  }, []);

  const handleSellSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setShowSellForm(false);
    setSelectedProduct(null);
    fetchRecentSales();
  };

  const handleProductFound = useCallback((product: any) => {
    setSelectedProduct(product);
    setShowQrImeiSubmenu(false);
    setShowSellForm(true);
  }, []);

  React.useEffect(() => {
    fetchRecentSales();
  }, [fetchRecentSales]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const isoString = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
      const [datePart, timePart] = isoString.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes] = timePart.split(':');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    } catch (error) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}`;
    }
  };

  const handlePrintInvoice = (sale: SalesInvoice) => {
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
        CategoryName: sale.ProductName?.includes('iPhone 16')
          ? 'iPhone 16'
          : sale.ProductName?.includes('iPhone 15')
            ? 'iPhone 15'
            : sale.ProductName?.includes('iPhone 14')
              ? 'iPhone 14'
              : 'iPhone',
      },
      customerInfo: sale.CustomerName
        ? {
            name: sale.CustomerName,
            phone: sale.CustomerPhone,
            address: '',
          }
        : undefined,
    };

    setInvoiceData(invoice);
    setShowInvoice(true);
  };

  const handlePrintInvoiceFromProduct = (product: any) => {
    const invoice = {
      invoiceNumber: product.InvoiceNumber || `HD${Date.now()}`,
      saleDate: product.SoldDate || new Date().toISOString(),
      product: {
        ProductID: product.ProductID,
        ProductName: product.ProductName,
        IMEI: product.IMEI,
        ImportPrice: product.ImportPrice,
        SalePrice: product.SalePrice || product.ImportPrice * 1.2,
        CategoryName: product.CategoryName,
      },
      customerInfo: product.CustomerInfo
        ? {
            name: product.CustomerInfo,
            phone: '',
            address: '',
          }
        : undefined,
    };

    setInvoiceData(invoice);
    setShowInvoice(true);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Bán hàng</Breadcrumb.Item>
          </Breadcrumb>

          <section className="warehouse-page-header">
            <div className="warehouse-page-title">
              <span className="warehouse-page-title-icon">
                <i className="fas fa-cart-shopping" aria-hidden="true"></i>
              </span>
              <div>
                <h2 className="mb-1">Quản lý bán hàng</h2>
                <p>Bán sản phẩm đang có sẵn và theo dõi giao dịch gần đây trong cùng một màn hình.</p>
              </div>
            </div>
            <div className="d-flex flex-wrap gap-2 mt-3 mt-lg-0">
              <button
                type="button"
                className="btn btn-outline-primary"
                onClick={() => setShowQrImeiSubmenu(true)}
              >
                <i className="fas fa-qrcode me-2" aria-hidden="true"></i>
                Thanh toán IMEI QR
              </button>
            </div>
          </section>

          <Tabs activeKey={activeTab} onSelect={(k) => setActiveTab(k || 'available')} className="mb-3">
            <Tab
              eventKey="available"
              title={
                <span>
                  <i className="fas fa-mobile-screen-button me-2" aria-hidden="true"></i>
                  Sản phẩm có thể bán
                </span>
              }
            >
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

            <Tab
              eventKey="recent-sales"
              title={
                <span>
                  <i className="fas fa-receipt me-2" aria-hidden="true"></i>
                  Giao dịch gần đây
                </span>
              }
            >
              <Card>
                <Card.Header>
                  <h5 className="mb-0">Giao dịch bán hàng gần đây</h5>
                </Card.Header>
                <Card.Body>
                  {recentSales.length === 0 ? (
                    <div className="warehouse-empty-state">
                      <i className="fas fa-file-circle-xmark"></i>
                      <div>Chưa có giao dịch nào.</div>
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
                              <strong>{sale.ProductName}</strong>
                            </td>
                            <td>
                              <code>{sale.IMEI}</code>
                            </td>
                            <td>
                              <div>
                                {sale.CustomerName || 'Khách lẻ'}
                                {sale.CustomerPhone && <small className="d-block text-muted">{sale.CustomerPhone}</small>}
                              </div>
                            </td>
                            <td>
                              <span className="text-info">{sale.ImportPrice ? formatCurrency(sale.ImportPrice) : '-'}</span>
                            </td>
                            <td>
                              <span className="text-success fw-bold">{formatCurrency(sale.ProductSalePrice || sale.FinalAmount)}</span>
                            </td>
                            <td>
                              <span
                                className={`fw-bold ${
                                  sale.Profit && sale.Profit > 0 ? 'text-success' : sale.Profit && sale.Profit < 0 ? 'text-danger' : 'text-muted'
                                }`}
                              >
                                {sale.Profit ? formatCurrency(sale.Profit) : '-'}
                              </span>
                            </td>
                            <td>
                              <Badge bg="success">Hoàn thành</Badge>
                            </td>
                            <td>
                              <button className="btn btn-outline-primary btn-sm" title="In hóa đơn" onClick={() => handlePrintInvoice(sale)}>
                                <i className="fas fa-print" aria-hidden="true"></i>
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

          <SellProductForm show={showSellForm} onHide={handleCloseSellForm} onSuccess={handleSellSuccess} product={selectedProduct} />

          <QrImeiPaymentSubmenu
            isOpen={showQrImeiSubmenu}
            onClose={() => setShowQrImeiSubmenu(false)}
            onProductFound={handleProductFound}
          />

          <InvoicePrint show={showInvoice} onHide={() => setShowInvoice(false)} invoiceData={invoiceData} />
        </Col>
      </Row>
    </Container>
  );
};

export default SalesPage;
