'use client';

import React from 'react';
import { Modal, Button, Row, Col, Table } from 'react-bootstrap';
import '../../styles/invoice-print.css';

interface Product {
  ProductID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  CategoryName: string;
}

interface InvoiceData {
  invoiceNumber: string;
  saleDate: string;
  product: Product;
  customerInfo?: {
    name?: string;
    phone?: string;
    address?: string;
  };
}

interface InvoicePrintProps {
  show: boolean;
  onHide: () => void;
  invoiceData: InvoiceData | null;
}

const InvoicePrint: React.FC<InvoicePrintProps> = ({ show, onHide, invoiceData }) => {
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
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handlePrint = () => {
    window.print();
  };

  const convertNumberToWords = (num: number): string => {
    if (num === 0) return 'không';

    const ones = ['', 'một', 'hai', 'ba', 'bốn', 'năm', 'sáu', 'bảy', 'tám', 'chín'];
    const tens = ['', '', 'hai mươi', 'ba mươi', 'bốn mươi', 'năm mươi', 'sáu mươi', 'bảy mươi', 'tám mươi', 'chín mươi'];
    const scales = ['', 'nghìn', 'triệu', 'tỷ'];

    const convertHundreds = (n: number): string => {
      let result = '';
      const hundred = Math.floor(n / 100);
      const remainder = n % 100;

      if (hundred > 0) {
        result += ones[hundred] + ' trăm';
      }

      if (remainder > 0) {
        if (result) result += ' ';
        if (remainder < 10) {
          result += ones[remainder];
        } else if (remainder < 20) {
          result += 'mười';
          if (remainder > 10) result += ' ' + ones[remainder - 10];
        } else {
          const ten = Math.floor(remainder / 10);
          const one = remainder % 10;
          result += tens[ten];
          if (one > 0) result += ' ' + ones[one];
        }
      }

      return result;
    };

    let result = '';
    let scaleIndex = 0;

    while (num > 0) {
      const chunk = num % 1000;
      if (chunk > 0) {
        const chunkWords = convertHundreds(chunk);
        if (scaleIndex > 0) {
          result = chunkWords + ' ' + scales[scaleIndex] + (result ? ' ' + result : '');
        } else {
          result = chunkWords;
        }
      }
      num = Math.floor(num / 1000);
      scaleIndex++;
    }

    return result.charAt(0).toUpperCase() + result.slice(1);
  };

  if (!invoiceData) return null;

  return (
    <Modal show={show} onHide={onHide} size="lg" centered>
      <Modal.Header closeButton className="bg-primary text-white">
        <Modal.Title>
          <i className="fas fa-receipt me-2"></i>
          Hóa đơn bán hàng
        </Modal.Title>
      </Modal.Header>

      <Modal.Body className="p-0">
        <div id="invoice-content" className="p-4">
          {/* Header */}
          <div className="invoice-header text-center mb-4 border-bottom pb-3">
            <h2 className="text-primary mb-1">
              <i className="fas fa-store me-2"></i>
              CỬA HÀNG ĐIỆN THOẠI ZenStore
            </h2>
            <h4 className="text-muted mb-2">HÓA ĐƠN BÁN HÀNG</h4>
            <div className="company-info">
              <p className="mb-1">
                <i className="fas fa-map-marker-alt me-1"></i>
                <strong>Địa chỉ:</strong> 123 Đường ABC, Phường XYZ, Quận 1, TP.HCM
              </p>
              <p className="mb-1">
                <i className="fas fa-phone me-1"></i>
                <strong>Hotline:</strong> 0777999908-0865508888 |
                <i className="fas fa-envelope ms-2 me-1"></i>
                <strong>Email:</strong> info@zenstores.com.vn
              </p>
              <p className="mb-0">
                <strong>MST:</strong> 0123456789 |
                <strong>Website:</strong> www.zenstores.com.vn
              </p>
            </div>
          </div>

          {/* Invoice Info */}
          <Row className="mb-4">
            <Col md={6}>
              <div className="border rounded p-3 h-100">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-file-invoice me-2"></i>
                  Thông tin hóa đơn
                </h6>
                <p className="mb-2">
                  <strong>Số hóa đơn:</strong> {invoiceData.invoiceNumber}
                </p>
                <p className="mb-2">
                  <strong>Ngày bán:</strong> {formatDate(invoiceData.saleDate)}
                </p>
                <p className="mb-0">
                  <strong>Nhân viên:</strong> Admin
                </p>
              </div>
            </Col>
            <Col md={6}>
              <div className="border rounded p-3 h-100">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-user me-2"></i>
                  Thông tin khách hàng
                </h6>
                {invoiceData.customerInfo?.name ? (
                  <>
                    <p className="mb-2">
                      <strong>Tên:</strong> {invoiceData.customerInfo.name}
                    </p>
                    <p className="mb-2">
                      <strong>SĐT:</strong> {invoiceData.customerInfo.phone || 'Không có'}
                    </p>
                    <p className="mb-0">
                      <strong>Địa chỉ:</strong> {invoiceData.customerInfo.address || 'Không có'}
                    </p>
                  </>
                ) : (
                  <p className="text-muted mb-0">Khách lẻ</p>
                )}
              </div>
            </Col>
          </Row>

          {/* Product Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">
              <i className="fas fa-mobile-alt me-2"></i>
              Chi tiết sản phẩm
            </h6>
            <Table bordered className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>STT</th>
                  <th>Tên sản phẩm</th>
                  <th>IMEI</th>
                  <th>Loại</th>
                  <th className="text-end">Đơn giá</th>
                  <th className="text-center">SL</th>
                  <th className="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{invoiceData.product.ProductName}</td>
                  <td className="font-monospace">{invoiceData.product.IMEI}</td>
                  <td>{invoiceData.product.CategoryName}</td>
                  <td className="text-end">{formatCurrency(invoiceData.product.SalePrice)}</td>
                  <td className="text-center">1</td>
                  <td className="text-end fw-bold">{formatCurrency(invoiceData.product.SalePrice)}</td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Summary */}
          <Row className="mb-4">
            <Col md={12}>
              <div className="invoice-summary border rounded p-3 bg-light">
                <h6 className="text-primary mb-3">
                  <i className="fas fa-calculator me-2"></i>
                  Tổng thanh toán
                </h6>
                <div className="d-flex justify-content-between mb-2">
                  <span>Tổng tiền hàng:</span>
                  <span>{formatCurrency(invoiceData.product.SalePrice)}</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Thuế VAT (0%):</span>
                  <span>0 VNĐ</span>
                </div>
                <div className="d-flex justify-content-between mb-2">
                  <span>Giảm giá:</span>
                  <span>0 VNĐ</span>
                </div>
                <hr style={{border: '1px solid #000'}} />
                <div className="d-flex justify-content-between">
                  <strong className="fs-5">TỔNG THANH TOÁN:</strong>
                  <strong className="fs-5 text-danger total-amount">
                    {formatCurrency(invoiceData.product.SalePrice)}
                  </strong>
                </div>
                <div className="text-center mt-2">
                  <small className="text-muted">
                    (Bằng chữ: {convertNumberToWords(invoiceData.product.SalePrice)} đồng)
                  </small>
                </div>
              </div>
            </Col>
          </Row>

          {/* Footer */}
          <div className="border-top pt-4 mt-4">
            <div className="text-center mt-2 border-top pt-3">
              <p className="mb-2">
                <strong>🎉 Cảm ơn quý khách đã mua hàng! 🎉</strong>
              </p>
              <p className="mb-2 text-muted">
                ✅ Sản phẩm được bảo hành theo chính sách của nhà sản xuất<br/>
                ✅ Quý khách vui lòng kiểm tra kỹ sản phẩm trước khi nhận hàng<br/>
                ✅ Mọi thắc mắc xin liên hệ hotline: 0777999908-0865508888
              </p>
              <p className="mb-0 text-muted small">
                📅 Hóa đơn được in lúc: {formatDate(new Date().toISOString())}
              </p>
            </div>
          </div>
        </div>
      </Modal.Body>

      <Modal.Footer className="d-print-none">
        <Button variant="secondary" onClick={onHide}>
          <i className="fas fa-times me-1"></i>
          Đóng
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <i className="fas fa-print me-1"></i>
          In hóa đơn
        </Button>
      </Modal.Footer>

      {/* Print Styles */}
      <style jsx>{`
        @media print {
          .modal {
            position: static !important;
            z-index: auto !important;
          }
          
          .modal-dialog {
            margin: 0 !important;
            max-width: none !important;
            width: auto !important;
          }
          
          .modal-content {
            border: none !important;
            box-shadow: none !important;
          }
          
          .modal-header,
          .modal-footer,
          .d-print-none {
            display: none !important;
          }
          
          .modal-body {
            padding: 0 !important;
          }
          
          #invoice-content {
            padding: 20px !important;
          }
          
          body {
            font-size: 12px !important;
          }
          
          .table {
            font-size: 11px !important;
          }
          
          .border {
            border: 1px solid #000 !important;
          }
          
          .text-primary {
            color: #000 !important;
          }
          
          .text-muted {
            color: #666 !important;
          }
          
          .bg-light {
            background-color: #f8f9fa !important;
          }
        }
      `}</style>
    </Modal>
  );
};

export default InvoicePrint;
