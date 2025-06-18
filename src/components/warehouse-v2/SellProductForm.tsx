'use client';

import React, { useState } from 'react';
import { Modal, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';

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
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-shopping-cart me-2 text-success"></i>
          Bán sản phẩm
        </Modal.Title>
      </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          {/* Product Information */}
          <Card className="mb-4">
            <Card.Header>
              <h6 className="mb-0">
                <i className="fas fa-mobile-alt me-2"></i>
                Thông tin sản phẩm
              </h6>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={6}>
                  <div className="mb-2">
                    <strong>Tên sản phẩm:</strong>
                    <div className="text-primary">{product.ProductName}</div>
                  </div>
                  <div className="mb-2">
                    <strong>IMEI:</strong>
                    <div><code>{product.IMEI}</code></div>
                  </div>
                </Col>
                <Col md={6}>
                  <div className="mb-2">
                    <strong>Danh mục:</strong>
                    <div className="text-info">{product.CategoryName}</div>
                  </div>
                  <div className="mb-2">
                    <strong>Lô hàng:</strong>
                    <div><code>{product.BatchCode}</code></div>
                  </div>
                </Col>
              </Row>
              <Row>
                <Col md={12}>
                  <div className="bg-light p-2 rounded">
                    <strong>Giá nhập:</strong>
                    <span className="text-warning ms-2 fw-bold">
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
              <Form.Group className="mb-3">
                <Form.Label>
                  Giá bán (VNĐ) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  step="1000"
                  value={formData.SalePrice === 0 ? '' : formData.SalePrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    const numValue = parseFloat(value);
                    handleInputChange('SalePrice', isNaN(numValue) ? 0 : numValue);
                  }}
                  required
                  placeholder="Nhập giá bán"
                  autoFocus
                />
                <Form.Control.Feedback type="invalid">
                  Giá bán phải lớn hơn 0
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Phương thức thanh toán</Form.Label>
                <Form.Select
                  value={formData.PaymentMethod}
                  onChange={(e) => handleInputChange('PaymentMethod', e.target.value)}
                >
                  <option value="CASH">Tiền mặt</option>
                  <option value="CARD">Thẻ</option>
                  <option value="TRANSFER">Chuyển khoản</option>
                </Form.Select>
              </Form.Group>
            </Col>
          </Row>



          {/* Profit Calculation */}
          {formData.SalePrice > 0 && (
            <Card className="border-success">
              <Card.Header className="bg-light">
                <h6 className="mb-0">
                  <i className="fas fa-calculator me-2"></i>
                  Tính toán lãi/lỗ
                </h6>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted">Giá nhập</div>
                      <div className="h5 text-warning">
                        {formatCurrency(product.ImportPrice)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted">Giá bán</div>
                      <div className="h5 text-primary">
                        {formatCurrency(formData.SalePrice)}
                      </div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted">Lãi/Lỗ</div>
                      <div className={`h5 ${getProfitColor()}`}>
                        {formatCurrency(calculateProfit())}
                      </div>
                      <small className={getProfitColor()}>
                        ({getProfitPercentage().toFixed(1)}%)
                      </small>
                    </div>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}

          <Alert variant="info" className="mt-3 mb-0">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Lưu ý:</strong> Sau khi bán, hệ thống sẽ tự động tạo hóa đơn và cập nhật trạng thái sản phẩm thành "Đã bán".
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            <i className="fas fa-times me-1"></i>
            Hủy
          </Button>
          <Button
            variant="success"
            type="submit"
            disabled={loading || !formData.SalePrice || formData.SalePrice <= 0}
          >
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang xử lý...
              </>
            ) : (
              <>
                <i className="fas fa-shopping-cart me-1"></i>
                Bán & In hóa đơn
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default SellProductForm;
