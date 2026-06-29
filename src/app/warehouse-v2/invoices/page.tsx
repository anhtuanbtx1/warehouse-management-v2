'use client';

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Container, Row, Col, Breadcrumb, Card, Table, Badge, Form, Button } from 'react-bootstrap';
import AntPagination from '@/components/ui/pagination-ant';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';

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

const InvoicesPage: React.FC = () => {
  const getDefaultDateRange = () => {
    const vietnamDate = new Date(new Date().getTime() + 7 * 60 * 60 * 1000);
    const toDate = vietnamDate.toISOString().split('T')[0];

    const fromDateObj = new Date(vietnamDate);
    fromDateObj.setMonth(fromDateObj.getMonth() - 1);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    return { fromDate, toDate };
  };

  const defaultDates = useMemo(() => getDefaultDateRange(), []);
  const [invoices, setInvoices] = useState<SalesInvoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const [invoiceNumber, setInvoiceNumber] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  const fetchInvoices = useCallback(
    async (page: number = 1) => {
      try {
        setLoading(true);
        const params = new URLSearchParams({
          page: page.toString(),
          limit: '10',
          ...(invoiceNumber && { invoiceNumber }),
          ...(paymentMethod && { paymentMethod }),
          ...(fromDate && { fromDate }),
          ...(toDate && { toDate }),
        });

        const response = await fetch(`/api/sales?${params.toString()}`);
        const result = await response.json();

        if (result.success && result.data) {
          setInvoices(result.data.data || []);
          setCurrentPage(result.data.page || 1);
          setTotalPages(result.data.totalPages || 1);
          setTotalItems(result.data.total ?? (result.data.totalPages || 1) * 10);
        } else {
          setInvoices([]);
          setCurrentPage(1);
          setTotalPages(1);
        }
      } catch (error) {
        console.error('Error fetching invoices:', error);
        setInvoices([]);
        setCurrentPage(1);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    },
    [invoiceNumber, paymentMethod, fromDate, toDate]
  );

  useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount || 0);
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

  const handleSearch = () => {
    fetchInvoices(1);
  };

  const handlePageChange = (page: number) => {
    fetchInvoices(page);
  };

  const handleReset = () => {
    setInvoiceNumber('');
    setPaymentMethod('');
    setFromDate(defaultDates.fromDate);
    setToDate(defaultDates.toDate);
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
        ImportPrice: sale.ImportPrice || estimatedImportPrice,
        SalePrice: sale.ProductSalePrice || sale.FinalAmount,
        CategoryName: sale.ProductName?.includes('iPhone 16')
          ? 'iPhone 16'
          : sale.ProductName?.includes('iPhone 15')
            ? 'iPhone 15'
            : sale.ProductName?.includes('iPhone 14')
              ? 'iPhone 14'
              : 'Điện thoại',
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

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Hóa đơn</Breadcrumb.Item>
          </Breadcrumb>



          <Card>
            <Card.Header>
              <h5 className="mb-0">Danh sách sản phẩm đã bán có hóa đơn</h5>
            </Card.Header>
            <Card.Body>
              <Row className="g-3 mb-3">
                <Col md={3}>
                  <Form.Control
                    type="text"
                    placeholder="Tìm số hóa đơn..."
                    value={invoiceNumber}
                    onChange={(e) => setInvoiceNumber(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  />
                </Col>
                <Col md={3}>
                  <Form.Select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                  >
                    <option value="">Tất cả phương thức</option>
                    <option value="CASH">Tiền mặt</option>
                    <option value="CARD">Thẻ</option>
                    <option value="TRANSFER">Chuyển khoản</option>
                  </Form.Select>
                </Col>
                <Col md={2}>
                  <Form.Control type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} />
                </Col>
                <Col md={2}>
                  <Form.Control type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} />
                </Col>
                <Col md={2}>
                  <div className="d-flex gap-2">
                    <Button variant="primary" className="w-100" onClick={handleSearch}>
                      <i className="fas fa-search me-2" aria-hidden="true"></i>
                      Tìm
                    </Button>
                    <Button variant="outline-secondary" onClick={handleReset} title="Đặt lại bộ lọc">
                      <i className="fas fa-rotate-left" aria-hidden="true"></i>
                    </Button>
                  </div>
                </Col>
              </Row>

              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : invoices.length === 0 ? (
                <div className="warehouse-empty-state">
                  <i className="fas fa-file-circle-xmark"></i>
                  <div>Chưa có hóa đơn phù hợp với bộ lọc hiện tại.</div>
                </div>
              ) : (
                <>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Số hóa đơn</th>
                        <th>Ngày bán</th>
                        <th>Sản phẩm</th>
                        <th>IMEI</th>
                        <th>Khách hàng</th>
                        <th>Thanh toán</th>
                        <th>Giá nhập</th>
                        <th>Giá bán</th>
                        <th>Lợi nhuận</th>
                        <th>Trạng thái</th>
                        <th>Thao tác</th>
                      </tr>
                    </thead>
                    <tbody>
                      {invoices.map((sale) => (
                        <tr key={`${sale.InvoiceID}-${sale.IMEI || sale.ProductName || 'item'}`}>
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
                            {sale.PaymentMethod === 'CASH' ? (
                              <Badge bg="success">Tiền mặt</Badge>
                            ) : sale.PaymentMethod === 'CARD' ? (
                              <Badge bg="primary">Thẻ</Badge>
                            ) : sale.PaymentMethod === 'TRANSFER' ? (
                              <Badge bg="info">Chuyển khoản</Badge>
                            ) : (
                              <Badge bg="secondary">{sale.PaymentMethod || 'N/A'}</Badge>
                            )}
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
                              {typeof sale.Profit === 'number' ? formatCurrency(sale.Profit) : '-'}
                            </span>
                          </td>
                          <td>
                            <Badge bg={sale.Status === 'COMPLETED' ? 'success' : 'secondary'}>
                              {sale.Status === 'COMPLETED' ? 'Hoàn thành' : sale.Status}
                            </Badge>
                          </td>
                          <td>
                            <Button variant="outline-primary" size="sm" title="In hóa đơn" onClick={() => handlePrintInvoice(sale)}>
                              <i className="fas fa-print" aria-hidden="true"></i>
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>

                  <AntPagination
                    current={currentPage}
                    total={totalItems}
                    pageSize={10}
                    onChange={(page) => handlePageChange(page)}
                  />
                </>
              )}
            </Card.Body>
          </Card>

          <InvoicePrint show={showInvoice} onHide={() => setShowInvoice(false)} invoiceData={invoiceData} />
        </Col>
      </Row>
    </Container>
  );
};

export default InvoicesPage;
