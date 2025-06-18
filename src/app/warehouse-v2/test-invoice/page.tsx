'use client';

import React, { useState } from 'react';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';
import InvoicePrint from '@/components/warehouse-v2/InvoicePrint';

const TestInvoicePage = () => {
  const [showInvoice, setShowInvoice] = useState(false);

  const sampleInvoiceData = {
    invoiceNumber: 'HD2025000010',
    saleDate: new Date().toISOString(),
    product: {
      ProductID: 5,
      ProductName: 'iPhone 15 Pro 256GB Black Titanium',
      IMEI: '356789012345686',
      ImportPrice: 20000000,
      SalePrice: 25000000,
      CategoryName: 'iPhone 15',
      BatchCode: 'LOT20250618085416'
    },
    customerInfo: {
      name: 'Nguyễn Văn A',
      phone: '0123456789',
      address: '123 Đường ABC, Quận 1, TP.HCM'
    },
    profit: 5000000,
    profitMargin: 25.0
  };

  const sampleInvoiceDataNoCustomer = {
    invoiceNumber: 'HD2025000011',
    saleDate: new Date().toISOString(),
    product: {
      ProductID: 12,
      ProductName: 'iPhone 14 Pro Max 512GB Deep Purple',
      IMEI: '123454646',
      ImportPrice: 15000000,
      SalePrice: 22000000,
      CategoryName: 'iPhone 14',
      BatchCode: 'LOT20250618100326'
    },
    profit: 7000000,
    profitMargin: 46.7
  };

  return (
    <Container fluid className="py-4">
      <Card>
        <Card.Header>
          <h4 className="mb-0">
            <i className="fas fa-receipt me-2"></i>
            Test Tính Năng In Hóa Đơn
          </h4>
        </Card.Header>
        <Card.Body>
          <p className="text-muted mb-4">
            Trang này để test tính năng in hóa đơn với dữ liệu mẫu.
          </p>

          <Row>
            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h6 className="mb-0">Hóa đơn có thông tin khách hàng</h6>
                </Card.Header>
                <Card.Body>
                  <p><strong>Sản phẩm:</strong> {sampleInvoiceData.product.ProductName}</p>
                  <p><strong>IMEI:</strong> {sampleInvoiceData.product.IMEI}</p>
                  <p><strong>Giá bán:</strong> {sampleInvoiceData.product.SalePrice.toLocaleString('vi-VN')} VNĐ</p>
                  <p><strong>Khách hàng:</strong> {sampleInvoiceData.customerInfo?.name}</p>
                  <p><strong>SĐT:</strong> {sampleInvoiceData.customerInfo?.phone}</p>
                  
                  <Button 
                    variant="primary" 
                    onClick={() => {
                      setShowInvoice(true);
                    }}
                    className="w-100"
                  >
                    <i className="fas fa-print me-2"></i>
                    Xem hóa đơn có khách hàng
                  </Button>
                </Card.Body>
              </Card>
            </Col>

            <Col md={6}>
              <Card className="h-100">
                <Card.Header>
                  <h6 className="mb-0">Hóa đơn khách lẻ</h6>
                </Card.Header>
                <Card.Body>
                  <p><strong>Sản phẩm:</strong> {sampleInvoiceDataNoCustomer.product.ProductName}</p>
                  <p><strong>IMEI:</strong> {sampleInvoiceDataNoCustomer.product.IMEI}</p>
                  <p><strong>Giá bán:</strong> {sampleInvoiceDataNoCustomer.product.SalePrice.toLocaleString('vi-VN')} VNĐ</p>
                  <p><strong>Khách hàng:</strong> Khách lẻ</p>
                  <p><strong>Lợi nhuận:</strong> {sampleInvoiceDataNoCustomer.profit.toLocaleString('vi-VN')} VNĐ</p>
                  
                  <Button 
                    variant="success" 
                    onClick={() => {
                      setShowInvoice(true);
                    }}
                    className="w-100"
                  >
                    <i className="fas fa-print me-2"></i>
                    Xem hóa đơn khách lẻ
                  </Button>
                </Card.Body>
              </Card>
            </Col>
          </Row>

          <div className="mt-4 p-3 bg-light rounded">
            <h6><i className="fas fa-info-circle me-2"></i>Hướng dẫn test:</h6>
            <ol>
              <li>Click vào một trong hai nút trên để mở modal hóa đơn</li>
              <li>Trong modal, click nút "In hóa đơn" để mở chế độ in</li>
              <li>Trong chế độ in, bạn có thể:
                <ul>
                  <li>Xem preview hóa đơn</li>
                  <li>In thực tế (Ctrl+P)</li>
                  <li>Lưu thành PDF</li>
                </ul>
              </li>
              <li>Hóa đơn sẽ được format đẹp cho việc in trên giấy A4</li>
            </ol>
          </div>
        </Card.Body>
      </Card>

      {/* Invoice Print Modal */}
      <InvoicePrint
        show={showInvoice}
        onHide={() => setShowInvoice(false)}
        invoiceData={sampleInvoiceData}
      />
    </Container>
  );
};

export default TestInvoicePage;
