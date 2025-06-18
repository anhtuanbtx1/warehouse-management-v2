'use client';

import React, { useState, useEffect } from 'react';
import { Container, Card, Button, Row, Col, Table, Badge, Alert } from 'react-bootstrap';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';

interface SalesInvoice {
  InvoiceID: number;
  InvoiceNumber: string;
  SaleDate: string;
  TotalAmount: number;
  FinalAmount: number;
  PaymentMethod: string;
  Status: string;
  ProductName: string;
  IMEI: string;
  ProductSalePrice: number;
  CustomerName?: string;
  CustomerPhone?: string;
}

const TestSalesInvoicePage = () => {
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);
  const [recentSales, setRecentSales] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRecentSales();
  }, []);

  const fetchRecentSales = async () => {
    try {
      const response = await fetch('/api/sales?limit=10');
      const result = await response.json();
      
      if (result.success) {
        setRecentSales(result.data.data);
      }
    } catch (error) {
      console.error('Error fetching sales:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePrintInvoice = (sale: SalesInvoice) => {
    // Estimate import price based on typical profit margins (20-30%)
    const estimatedImportPrice = Math.round((sale.ProductSalePrice || sale.FinalAmount) * 0.75);
    
    const invoice = {
      invoiceNumber: sale.InvoiceNumber,
      saleDate: sale.SaleDate,
      product: {
        ProductID: sale.InvoiceID,
        ProductName: sale.ProductName || 'Sản phẩm',
        IMEI: sale.IMEI || '',
        ImportPrice: estimatedImportPrice,
        SalePrice: sale.ProductSalePrice || sale.FinalAmount,
        CategoryName: sale.ProductName?.includes('iPhone 16') ? 'iPhone 16' :
                     sale.ProductName?.includes('iPhone 15') ? 'iPhone 15' :
                     sale.ProductName?.includes('iPhone 14') ? 'iPhone 14' : 'iPhone',
        BatchCode: `LOT${sale.InvoiceNumber.replace('HD', '')}`
      },
      customerInfo: sale.CustomerName ? {
        name: sale.CustomerName,
        phone: sale.CustomerPhone,
        address: ''
      } : undefined,
      profit: (sale.ProductSalePrice || sale.FinalAmount) - estimatedImportPrice,
      profitMargin: estimatedImportPrice ? 
        (((sale.ProductSalePrice || sale.FinalAmount) - estimatedImportPrice) / estimatedImportPrice) * 100 : 0
    };
    
    setInvoiceData(invoice);
    setShowInvoice(true);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
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
        return <Badge bg="secondary">Không xác định</Badge>;
    }
  };

  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Đang tải dữ liệu...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-receipt me-2"></i>
            Test Tính Năng In Hóa Đơn - Dữ Liệu Thực
          </h4>
        </Card.Header>
        <Card.Body>
          <Alert variant="info">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Hướng dẫn:</strong> Click vào nút "In hóa đơn" trong cột "Thao tác" để xem và in hóa đơn cho giao dịch đó.
          </Alert>

          {recentSales.length === 0 ? (
            <Alert variant="warning">
              <i className="fas fa-exclamation-triangle me-2"></i>
              Không có giao dịch nào để hiển thị. Hãy thực hiện một vài giao dịch bán hàng trước.
            </Alert>
          ) : (
            <div className="table-responsive">
              <Table striped bordered hover>
                <thead className="table-dark">
                  <tr>
                    <th>Số HĐ</th>
                    <th>Ngày bán</th>
                    <th>Sản phẩm</th>
                    <th>IMEI</th>
                    <th>Giá bán</th>
                    <th>Khách hàng</th>
                    <th>Trạng thái</th>
                    <th>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {recentSales.map((sale) => (
                    <tr key={sale.InvoiceID}>
                      <td className="font-monospace">{sale.InvoiceNumber}</td>
                      <td>{formatDate(sale.SaleDate)}</td>
                      <td>
                        <div className="fw-bold">{sale.ProductName}</div>
                      </td>
                      <td className="font-monospace">{sale.IMEI}</td>
                      <td className="text-end fw-bold text-success">
                        {formatCurrency(sale.ProductSalePrice || sale.FinalAmount)}
                      </td>
                      <td>
                        {sale.CustomerName ? (
                          <div>
                            <div className="fw-bold">{sale.CustomerName}</div>
                            <small className="text-muted">{sale.CustomerPhone}</small>
                          </div>
                        ) : (
                          <span className="text-muted">Khách lẻ</span>
                        )}
                      </td>
                      <td>
                        <Badge bg="success">Hoàn thành</Badge>
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          <Button
                            variant="outline-primary"
                            size="sm"
                            title="In hóa đơn"
                            onClick={() => handlePrintInvoice(sale)}
                          >
                            <i className="fas fa-print"></i>
                          </Button>
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="Xem chi tiết"
                          >
                            <i className="fas fa-eye"></i>
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}

          <div className="mt-4 p-3 bg-light rounded">
            <h6><i className="fas fa-info-circle me-2"></i>Thông tin test:</h6>
            <ul className="mb-0">
              <li><strong>Dữ liệu:</strong> Sử dụng dữ liệu thực từ database</li>
              <li><strong>Giá nhập:</strong> Ước tính 75% giá bán (do không có dữ liệu thực)</li>
              <li><strong>Lợi nhuận:</strong> Tự động tính toán dựa trên giá ước tính</li>
              <li><strong>Hóa đơn:</strong> Hiển thị đầy đủ thông tin như hóa đơn thực</li>
              <li><strong>In ấn:</strong> Tối ưu cho giấy A4, có thể lưu PDF</li>
            </ul>
          </div>
        </Card.Body>
      </Card>

      {/* Invoice Print Modal */}
      <InvoicePrint
        show={showInvoice}
        onHide={() => setShowInvoice(false)}
        invoiceData={invoiceData}
      />
    </Container>
  );
};

export default TestSalesInvoicePage;
