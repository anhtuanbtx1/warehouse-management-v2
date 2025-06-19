'use client';

import React from 'react';
import { Modal, Button, Row, Col, Table } from 'react-bootstrap';

interface ImportBatch {
  BatchID: number;
  BatchCode: string;
  ImportDate: string;
  CategoryID: number;
  CategoryName: string;
  TotalQuantity: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  ProfitLoss: number;
  Status: string;
  Notes?: string;
  CreatedBy: string;
  CreatedAt: string;
}

interface ImportInvoicePrintProps {
  show: boolean;
  onHide: () => void;
  batchData: ImportBatch | null;
}

const ImportInvoicePrint: React.FC<ImportInvoicePrintProps> = ({ show, onHide, batchData }) => {
  if (!batchData) return null;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const handlePrint = () => {
    window.print();
  };

  const averagePrice = batchData.TotalQuantity > 0 ? batchData.TotalImportValue / batchData.TotalQuantity : 0;

  return (
    <Modal show={show} onHide={onHide} size="lg" className="invoice-modal">
      <Modal.Header closeButton>
        <Modal.Title>
          <span className="me-2">🧾</span>
          Hóa đơn nhập hàng - {batchData.BatchCode}
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <div className="invoice-content p-4" style={{ backgroundColor: 'white' }}>
          {/* Header */}
          <div className="text-center mb-4">
            <h2 className="text-primary mb-1">HÓA ĐƠN NHẬP HÀNG</h2>
            <p className="text-muted mb-0">Phiếu nhập kho</p>
          </div>

          {/* Invoice Info */}
          <Row className="mb-4">
            <Col md={6}>
              <h6 className="text-primary mb-3">
                <i className="fas fa-info-circle me-2"></i>
                Thông tin phiếu nhập
              </h6>
              <p className="mb-2">
                <strong>Mã lô hàng:</strong> <code className="text-primary">{batchData.BatchCode}</code>
              </p>
              <p className="mb-2">
                <strong>Ngày nhập:</strong> {formatDate(batchData.ImportDate)}
              </p>
              <p className="mb-2">
                <strong>Danh mục:</strong> <span className="badge bg-info">{batchData.CategoryName}</span>
              </p>
              <p className="mb-2">
                <strong>Người tạo:</strong> {batchData.CreatedBy}
              </p>
              <p className="mb-0">
                <strong>Ngày tạo:</strong> {formatDate(batchData.CreatedAt)}
              </p>
            </Col>
            <Col md={6}>
              <h6 className="text-primary mb-3">
                <i className="fas fa-building me-2"></i>
                Thông tin công ty
              </h6>
              <p className="mb-2">
                <strong>Công ty:</strong> Warehouse Management System
              </p>
              <p className="mb-2">
                <strong>Địa chỉ:</strong> Việt Nam
              </p>
              <p className="mb-2">
                <strong>Điện thoại:</strong> +84 xxx xxx xxx
              </p>
              <p className="mb-0">
                <strong>Email:</strong> info@warehouse.com
              </p>
            </Col>
          </Row>

          {/* Import Details */}
          <div className="mb-4">
            <h6 className="text-primary mb-3">
              <i className="fas fa-list me-2"></i>
              Chi tiết nhập hàng
            </h6>
            <Table bordered className="mb-0">
              <thead className="table-light">
                <tr>
                  <th>STT</th>
                  <th>Danh mục sản phẩm</th>
                  <th>Mã lô hàng</th>
                  <th className="text-center">Số lượng</th>
                  <th className="text-end">Đơn giá TB</th>
                  <th className="text-end">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td>1</td>
                  <td>{batchData.CategoryName}</td>
                  <td className="font-monospace">{batchData.BatchCode}</td>
                  <td className="text-center fw-bold">{batchData.TotalQuantity}</td>
                  <td className="text-end">{formatCurrency(averagePrice)}</td>
                  <td className="text-end fw-bold">{formatCurrency(batchData.TotalImportValue)}</td>
                </tr>
              </tbody>
            </Table>
          </div>

          {/* Summary */}
          <Row className="mb-4">
            <Col md={12}>
              <div className="border rounded p-3 bg-light">
                <Row>
                  <Col md={6}>
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-calculator me-2"></i>
                      Tổng kết nhập hàng
                    </h6>
                    <p className="mb-2">
                      <strong>Tổng số lượng:</strong> <span className="text-primary">{batchData.TotalQuantity} sản phẩm</span>
                    </p>
                    <p className="mb-2">
                      <strong>Đơn giá trung bình:</strong> <span className="text-info">{formatCurrency(averagePrice)}</span>
                    </p>
                    <p className="mb-0">
                      <strong>Tổng giá trị:</strong> <span className="text-success fs-5 fw-bold">{formatCurrency(batchData.TotalImportValue)}</span>
                    </p>
                  </Col>
                  <Col md={6}>
                    <h6 className="text-primary mb-3">
                      <i className="fas fa-chart-bar me-2"></i>
                      Tình trạng hiện tại
                    </h6>
                    <p className="mb-2">
                      <strong>Đã bán:</strong> <span className="text-success">{batchData.TotalSoldQuantity} sản phẩm</span>
                    </p>
                    <p className="mb-2">
                      <strong>Còn lại:</strong> <span className="text-warning">{batchData.RemainingQuantity} sản phẩm</span>
                    </p>
                    <p className="mb-0">
                      <strong>Lãi/Lỗ:</strong> 
                      <span className={`fw-bold ms-1 ${batchData.ProfitLoss >= 0 ? 'text-success' : 'text-danger'}`}>
                        {formatCurrency(batchData.ProfitLoss)}
                      </span>
                    </p>
                  </Col>
                </Row>
              </div>
            </Col>
          </Row>

          {/* Notes */}
          {batchData.Notes && (
            <div className="mb-4">
              <h6 className="text-primary mb-3">
                <i className="fas fa-sticky-note me-2"></i>
                Ghi chú
              </h6>
              <div className="border rounded p-3 bg-light">
                <p className="mb-0">{batchData.Notes}</p>
              </div>
            </div>
          )}

          {/* Footer */}
          <div className="text-center mt-4 pt-3 border-top">
            <p className="text-muted mb-1">
              <small>Hóa đơn được tạo tự động bởi Warehouse Management System</small>
            </p>
            <p className="text-muted mb-0">
              <small>Ngày in: {new Date().toLocaleDateString('vi-VN')} - {new Date().toLocaleTimeString('vi-VN')}</small>
            </p>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="outline-secondary" onClick={onHide}>
          Đóng
        </Button>
        <Button variant="primary" onClick={handlePrint}>
          <i className="fas fa-print me-2"></i>
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
          .modal-footer {
            display: none !important;
          }
          .modal-body {
            padding: 0 !important;
          }
          .invoice-content {
            background: white !important;
            color: black !important;
          }
          .btn, .modal-header, .modal-footer {
            display: none !important;
          }
        }
      `}</style>
    </Modal>
  );
};

export default ImportInvoicePrint;
