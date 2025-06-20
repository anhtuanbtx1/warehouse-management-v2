'use client';

import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';
import InvoicePrint from './InvoicePrint';

interface ProductV2 {
  ProductID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  Status: string;
  CategoryName?: string;
  BatchCode?: string;
}

interface SellProductFormProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
  product: ProductV2 | null;
}

interface SellProductData {
  ProductID: number;
  SalePrice: number;
  PaymentMethod: string;
}

const SellProductForm: React.FC<SellProductFormProps> = ({ show, onHide, onSuccess, product }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<SellProductData>({
    ProductID: 0,
    SalePrice: 0,
    PaymentMethod: 'CASH'
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);

  // Invoice states
  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  React.useEffect(() => {
    if (show && product) {
      setFormData({
        ProductID: product.ProductID,
        SalePrice: 0, // Start with 0, user must enter sale price
        PaymentMethod: 'CASH'
      });
      setValidated(false);
      setError('');
    }
  }, [show, product]);

  const handleInputChange = (field: keyof SellProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.SalePrice || formData.SalePrice <= 0) {
      setError('Giá bán phải lớn hơn 0');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(
          'Bán hàng thành công!',
          `Đã bán "${product?.ProductName}" thành công`
        );

        // Prepare invoice data
        const invoice = {
          invoiceNumber: result.data.InvoiceNumber || `INV${Date.now()}`,
          saleDate: new Date().toISOString(),
          product: {
            ...product,
            SalePrice: formData.SalePrice
          },
          profit: calculateProfit(),
          profitMargin: getProfitPercentage()
        };

        setInvoiceData(invoice);
        setShowInvoice(true);
        onSuccess();
        onHide();
      } else {
        const errorMsg = result.error || 'Có lỗi xảy ra khi bán sản phẩm';
        setError(errorMsg);
        showError('Lỗi bán hàng', errorMsg);
      }
    } catch (error) {
      console.error('Error selling product:', error);
      const errorMsg = 'Có lỗi xảy ra khi bán sản phẩm';
      setError(errorMsg);
      showError('Lỗi kết nối', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  // Format number with thousand separators (100000 -> 100.000)
  const formatNumber = (value: string | number) => {
    if (!value) return '';
    const numStr = value.toString().replace(/\D/g, ''); // Remove non-digits
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Parse formatted number back to plain number (100.000 -> 100000)
  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, '');
  };

  const calculateProfit = () => {
    if (product && formData.SalePrice > 0) {
      return formData.SalePrice - product.ImportPrice;
    }
    return 0;
  };

  const getProfitColor = () => {
    const profit = calculateProfit();
    if (profit > 0) return 'text-success';
    if (profit < 0) return 'text-danger';
    return 'text-muted';
  };

  const getProfitPercentage = () => {
    if (product && formData.SalePrice > 0) {
      return ((formData.SalePrice - product.ImportPrice) / product.ImportPrice) * 100;
    }
    return 0;
  };

  if (!product) return null;

  return (
    <>
      <Modal show={show} onHide={onHide} size="lg" className="sell-product-modal">
        <Modal.Header closeButton>
          <Modal.Title className="fs-4">
            <span className="me-2">🛒</span>
            Bán sản phẩm
          </Modal.Title>
        </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Product Information */}
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0 fs-5">
                <span className="me-2">📱</span>
                Thông tin sản phẩm
              </h5>
            </Card.Header>
            <Card.Body className="fs-5">
              <Row>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className="fs-5">Tên sản phẩm:</strong>
                    <div className="text-primary fs-5 fw-medium">{product.ProductName}</div>
                  </div>
                  <div className="mb-3">
                    <strong className="fs-5">IMEI:</strong>
                    <div className="fs-5"><code className="fs-5">{product.IMEI}</code></div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-3">
                    <strong className="fs-5">Danh mục:</strong>
                    <div className="text-info fs-5 fw-medium">{product.CategoryName}</div>
                  </div>
                  <div className="mb-3">
                    <strong className="fs-5">Lô hàng:</strong>
                    <div className="fs-5"><code className="fs-5">{product.BatchCode}</code></div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="bg-light p-3 rounded">
                    <strong className="fs-4">Giá nhập:</strong>
                    <span className="text-succcess ms-2 fw-bold fs-4">
                      {formatCurrency(product.ImportPrice)}
                    </span>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>

          {/* Sale Information */}
          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fs-5 fw-medium">
                  Giá bán (VNĐ) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  className="fs-4 py-3"
                  value={formData.SalePrice === 0 ? '' : formatNumber(formData.SalePrice)}
                  onChange={(e) => {
                    const rawValue = parseFormattedNumber(e.target.value);
                    const numValue = parseFloat(rawValue);
                    handleInputChange('SalePrice', isNaN(numValue) ? 0 : numValue);
                  }}
                  required
                  placeholder="Nhập giá bán (VD: 25.000.000)"
                  autoFocus
                />
                <Form.Control.Feedback type="invalid" className="fs-6">
                  Giá bán phải lớn hơn 0
                </Form.Control.Feedback>
                <Form.Text className="text-muted fs-6">
                  Nhập số tiền, hệ thống sẽ tự động thêm dấu phân cách
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fs-5 fw-medium">Phương thức thanh toán</Form.Label>
                <Form.Select
                  className="fs-5 py-3"
                  value={formData.PaymentMethod}
                  onChange={(e) => handleInputChange('PaymentMethod', e.target.value)}
                >
                  <option value="CASH">💵 Tiền mặt</option>
                  <option value="CARD">💳 Thẻ</option>
                  <option value="TRANSFER">🏦 Chuyển khoản</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>



          {/* Profit Calculation */}
          {formData.SalePrice > 0 && (
            <Card className="border-success">
              <Card.Header className="bg-light">
                <h5 className="mb-0 fs-4">
                  <span className="me-2">🧮</span>
                  Tính toán lãi/lỗ
                </h5>
              </Card.Header>
              <Card.Body className="py-4">
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted fs-5 mb-2">Giá nhập</div>
                      <div className="h3 text-success fw-bold">
                        {formatCurrency(product.ImportPrice)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted fs-5 mb-2">Giá bán</div>
                      <div className="h3 text-primary fw-bold">
                        {formatCurrency(formData.SalePrice)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted fs-5 mb-2">Lãi/Lỗ</div>
                      <div className={`h3 fw-bold ${getProfitColor()}`}>
                        {formatCurrency(calculateProfit())}
                      </div>
                      <div className={`fs-5 ${getProfitColor()}`}>
                        ({getProfitPercentage().toFixed(1)}%)
                      </div>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Alert variant="info" className="mt-4 mb-0 fs-5">
            <span className="me-2">ℹ️</span>
            <strong>Lưu ý:</strong> Sau khi bán, hệ thống sẽ tự động tạo hóa đơn và cập nhật trạng thái sản phẩm thành &quot;Đã bán&quot;.
          </Alert>
        </Modal.Body>

        <Modal.Footer className="py-3">
          <Button variant="secondary" onClick={onHide} disabled={loading} className="fs-5 px-4 py-2">
            <span className="me-2">❌</span>
            Hủy
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={loading || !formData.SalePrice || formData.SalePrice <= 0}
            className="fs-5 px-4 py-2"
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <span className="me-2">🛒</span>
                Bán & In hóa đơn
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>

    {/* Invoice Print Modal */}
    <InvoicePrint
      show={showInvoice}
      onHide={() => setShowInvoice(false)}
      invoiceData={invoiceData}
    />
  </>
  );
};

export default SellProductForm;
