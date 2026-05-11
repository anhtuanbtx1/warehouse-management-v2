'use client';

import React, { useState, useEffect } from 'react';
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

interface CableBatch {
  BatchID: number;
  BatchCode: string;
  ImportDate: string;
  TotalQuantity: number;
  AvailableProducts: number;
  AvgPrice: number;
  MinPrice: number;
  MaxPrice: number;
  CategoryName: string;
  Notes?: string;
}

interface SellProductData {
  ProductID: number;
  SalePrice: number;
  PaymentMethod: string;
  IncludeCable: boolean;
  CableBatchId?: number;
  CablePrice?: number;
  DiscountPercent: number;
  CustomerPayment: number;
}

const SellProductForm: React.FC<SellProductFormProps> = ({ show, onHide, onSuccess, product }) => {
  const { showSuccess, showError } = useToast();
  const [formData, setFormData] = useState<SellProductData>({
    ProductID: 0,
    SalePrice: 0,
    PaymentMethod: 'CASH',
    IncludeCable: false,
    DiscountPercent: 0,
    CustomerPayment: 0
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [cablePrice, setCablePrice] = useState(100000);
  const [cableBatches, setCableBatches] = useState<CableBatch[]>([]);
  const [selectedCableBatch, setSelectedCableBatch] = useState<CableBatch | null>(null);

  const [showInvoice, setShowInvoice] = useState(false);
  const [invoiceData, setInvoiceData] = useState<any>(null);

  useEffect(() => {
    const fetchCableBatches = async () => {
      try {
        const response = await fetch('/api/cable-batches');
        const result = await response.json();
        if (result.success && result.data) {
          setCableBatches(result.data);
          if (result.data.length > 0) {
            setCablePrice(result.data[0].AvgPrice);
          }
        }
      } catch (error) {
        console.error('Error fetching cable batches:', error);
      }
    };

    fetchCableBatches();
  }, []);

  React.useEffect(() => {
    if (show && product) {
      setFormData({
        ProductID: product.ProductID,
        SalePrice: 0,
        PaymentMethod: 'CASH',
        IncludeCable: false,
        CableBatchId: undefined,
        CablePrice: undefined,
        DiscountPercent: 0,
        CustomerPayment: 0
      });
      setValidated(false);
      setError('');
      setSelectedCableBatch(null);
    }
  }, [show, product]);

  const handleInputChange = (field: keyof SellProductData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleCableBatchChange = (batchId: string) => {
    const batch = cableBatches.find(b => b.BatchID.toString() === batchId);
    if (batch) {
      setSelectedCableBatch(batch);
      setCablePrice(batch.AvgPrice);
      setFormData(prev => ({
        ...prev,
        CableBatchId: batch.BatchID,
        CablePrice: batch.AvgPrice
      }));
    } else {
      setSelectedCableBatch(null);
      setFormData(prev => ({
        ...prev,
        CableBatchId: undefined,
        CablePrice: undefined
      }));
    }
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
      // Submit with final amount after discount
      const finalSalePrice = calculateAmountDue();
      
      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...formData,
          SalePrice: finalSalePrice // Send discounted price to API
        })
      });

      const result = await response.json();

      if (result.success) {
        showSuccess(
          'Bán hàng thành công!',
          `Đã bán "${product?.ProductName}" thành công`
        );

        const invoice = {
          invoiceNumber: result.data.InvoiceNumber || `INV${Date.now()}`,
          saleDate: new Date().toISOString(),
          product: {
            ...product,
            SalePrice: finalSalePrice
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

  const formatNumber = (value: string | number) => {
    if (!value) return '';
    const numStr = value.toString().replace(/\D/g, '');
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, '');
  };

  const calculateProfit = () => {
    if (product && formData.SalePrice > 0) {
      const cableCost = formData.IncludeCable ? (formData.CablePrice || cablePrice) : 0;
      const totalCost = product.ImportPrice + cableCost;
      const finalSalePrice = calculateAmountDue();
      return finalSalePrice - totalCost;
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
      const cableCost = formData.IncludeCable ? (formData.CablePrice || cablePrice) : 0;
      const totalCost = product.ImportPrice + cableCost;
      const finalSalePrice = calculateAmountDue();
      return ((finalSalePrice - totalCost) / totalCost) * 100;
    }
    return 0;
  };

  const calculateDiscountAmount = () => {
    if (formData.SalePrice > 0 && formData.DiscountPercent > 0) {
      return (formData.SalePrice * formData.DiscountPercent) / 100;
    }
    return 0;
  };

  const calculateAmountDue = () => {
    const amountDue = formData.SalePrice - calculateDiscountAmount();
    return amountDue > 0 ? amountDue : 0;
  };

  const calculateChange = () => {
    const amountDue = Number(calculateAmountDue()) || 0;
    const customerPayment = Number(formData.CustomerPayment) || 0;
    const change = customerPayment - amountDue;
    return change > 0 ? change : 0;
  };

  if (!product) return null;

  return (
    <>
      <Modal
        show={show}
        onHide={onHide}
        size="xl"
        scrollable
        dialogClassName="sell-product-modal-wide"
        className="sell-product-modal"
      >
        <Modal.Header closeButton className="flex-shrink-0">
          <Modal.Title className="fs-4">
            <span className="me-2">🛒</span>
            Bán sản phẩm
          </Modal.Title>
        </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <div className="d-flex flex-wrap gap-2 justify-content-between align-items-center rounded-4 border p-3 mb-3" style={{ backgroundColor: 'var(--bs-secondary-bg)' }}>
            <div>
              <div className="text-muted small text-uppercase mb-1">Thao tác nhanh</div>
              <div className="fw-bold">Thanh toán và in hóa đơn cho sản phẩm này</div>
            </div>
            <Button
              variant="success"
              type="submit"
              disabled={loading || !formData.SalePrice || formData.SalePrice <= 0}
              className="fs-5 px-4 py-2 text-nowrap"
            >
              {loading ? (
                <>
                  <span className="spinner-border spinner-border-sm me-2" />
                  Đang xử lý...
                </>
              ) : (
                <>
                  <span className="me-2">💳</span>
                  Thanh toán & In hóa đơn
                </>
              )}
            </Button>
          </div>

          <div className="rounded-4 border p-3 mb-4">
            <Row className="g-3 align-items-stretch">
              <Col md={5}>
                <div className="h-100 rounded-3 border p-3">
                  <div className="text-muted small text-uppercase mb-1">Sản phẩm</div>
                  <div className="fw-bold fs-5 text-primary mb-2">{product.ProductName}</div>
                  <code className="fs-6">IMEI: {product.IMEI}</code>
                </div>
              </Col>
              <Col md={3}>
                <div className="h-100 rounded-3 border p-3">
                  <div className="text-muted small text-uppercase mb-1">Danh mục</div>
                  <div className="fw-semibold fs-6 text-info">{product.CategoryName || 'Chưa phân loại'}</div>
                </div>
              </Col>
              <Col md={2}>
                <div className="h-100 rounded-3 border p-3">
                  <div className="text-muted small text-uppercase mb-1">Lô hàng</div>
                  <code className="fs-6">{product.BatchCode || 'N/A'}</code>
                </div>
              </Col>
              <Col md={2}>
                <div className="h-100 rounded-3 border p-3">
                  <div className="text-muted small text-uppercase mb-1">Thanh toán</div>
                  <div className="fw-bold fs-5 text-success">{formData.SalePrice > 0 ? formatCurrency(calculateAmountDue()) : '0 ₫'}</div>
                </div>
              </Col>
            </Row>
          </div>

          <Card className="border-0 shadow-sm mb-4">
            <Card.Body className="p-3 p-lg-4">
              <Row className="g-3">
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
                <Form.Label className="fs-5 fw-medium">Giảm giá (%)</Form.Label>
                <Form.Control
                  type="number"
                  className="fs-4 py-3"
                  value={formData.DiscountPercent === 0 ? '' : formData.DiscountPercent}
                  onChange={(e) => {
                    const numValue = parseFloat(e.target.value);
                    handleInputChange('DiscountPercent', isNaN(numValue) ? 0 : Math.min(100, Math.max(0, numValue)));
                  }}
                  placeholder="0"
                  min="0"
                  max="100"
                  step="0.1"
                />
                <Form.Text className="text-muted fs-6">
                  {formData.DiscountPercent > 0 && formData.SalePrice > 0
                    ? `Giảm: ${formatCurrency(calculateDiscountAmount())}`
                    : 'Nhập phần trăm giảm giá nếu có'}
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
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

            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fs-5 fw-medium">Số tiền khách cần trả</Form.Label>
                <Form.Control
                  type="text"
                  className="fs-4 py-3 fw-bold text-primary"
                  value={formData.SalePrice > 0 ? formatCurrency(calculateAmountDue()) : ''}
                  readOnly
                  placeholder="0 ₫"
                  style={{ backgroundColor: 'var(--bs-secondary-bg)' }}
                />
                <Form.Text className="text-muted fs-6">
                  Tự động tính từ giá bán trừ giảm giá
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fs-5 fw-medium">Khách hàng thanh toán (VNĐ)</Form.Label>
                <Form.Control
                  type="text"
                  className="fs-4 py-3"
                  value={formData.CustomerPayment === 0 ? '' : formatNumber(formData.CustomerPayment)}
                  onChange={(e) => {
                    const rawValue = parseFormattedNumber(e.target.value);
                    const numValue = parseFloat(rawValue);
                    handleInputChange('CustomerPayment', isNaN(numValue) ? 0 : numValue);
                  }}
                  placeholder="Nhập số tiền khách đưa"
                />
                <Form.Text className="text-muted fs-6">
                  Nhập số tiền thực tế khách thanh toán
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-4">
                <Form.Label className="fs-5 fw-medium">Tiền thừa trả khách</Form.Label>
                <Form.Control
                  type="text"
                  className={`fs-4 py-3 fw-bold ${calculateChange() > 0 ? 'text-success' : 'text-muted'}`}
                  value={formatCurrency(calculateChange())}
                  readOnly
                  placeholder="0 ₫"
                  style={{ backgroundColor: calculateChange() > 0 ? 'rgba(25, 135, 84, 0.1)' : 'var(--bs-secondary-bg)' }}
                />
                <Form.Text className="text-muted fs-6">
                  Tự động tính khi số tiền khách đưa lớn hơn số tiền cần trả
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>
            </Card.Body>
          </Card>

          {/* Cable Gift Option */}
          <Row className="mb-4">
            <Col md={12}>
              <Card className="border-warning">
                <Card.Body className="py-3">
                  <Form.Check
                    type="checkbox"
                    id="includeCable"
                    className="fs-5"
                    checked={formData.IncludeCable}
                    onChange={(e) => handleInputChange('IncludeCable', e.target.checked)}
                    label={
                      <span>
                        <span className="me-2">🔌</span>
                        <strong>Bán kèm cáp sạc</strong>
                        <span className="text-muted ms-2">
                          (+ {formatCurrency(formData.CablePrice || cablePrice)} vào giá nhập để tính lãi/lỗ)
                        </span>
                      </span>
                    }
                  />

                  {formData.IncludeCable && (
                    <div className="mt-3">
                      <Row className="g-3 align-items-start">
                        <Col lg={8}>
                          <Form.Group>
                            <Form.Label className="fs-6 fw-medium">Chọn lô cáp sạc:</Form.Label>
                            <Form.Select
                              className="fs-6"
                              value={selectedCableBatch?.BatchID || ''}
                              onChange={(e) => handleCableBatchChange(e.target.value)}
                            >
                              <option value="">-- Chọn lô cáp sạc --</option>
                              {cableBatches.map(batch => (
                                <option key={batch.BatchID} value={batch.BatchID}>
                                  {batch.BatchCode} - {batch.AvailableProducts} sản phẩm - {formatCurrency(batch.AvgPrice)}/cái
                                  {batch.Notes && ` (${batch.Notes})`}
                                </option>
                              ))}
                            </Form.Select>
                          </Form.Group>
                        </Col>
                        <Col lg={4}>
                          <div className="rounded-3 border p-3 h-100">
                            <div className="small text-muted mb-1">Giá cộng thêm</div>
                            <div className="fw-bold text-warning fs-5">{formatCurrency(formData.CablePrice || cablePrice)}</div>
                            <div className="small text-muted mt-2">Tổng vốn tạm tính</div>
                            <div className="fw-semibold">{formatCurrency(product.ImportPrice + (formData.CablePrice || cablePrice))}</div>
                          </div>
                        </Col>
                      </Row>

                      {selectedCableBatch && (
                        <div className="mt-3 rounded-3 border p-3">
                          <div className="d-flex flex-wrap gap-3 small">
                            <span><strong>Lô:</strong> {selectedCableBatch.BatchCode}</span>
                            <span><strong>Còn lại:</strong> {selectedCableBatch.AvailableProducts}</span>
                            <span><strong>Khoảng giá:</strong> {formatCurrency(selectedCableBatch.MinPrice)} - {formatCurrency(selectedCableBatch.MaxPrice)}</span>
                            <span><strong>Trung bình:</strong> {formatCurrency(selectedCableBatch.AvgPrice)}</span>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </Card.Body>
              </Card>
            </Col>
          </Row>

          {/* Profit Calculation - temporarily hidden */}
          {false && formData.SalePrice > 0 && (
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
                      <div className="text-muted fs-5 mb-2">
                        Giá nhập {formData.IncludeCable && '(+ cáp sạc)'}
                      </div>
                      <div className="h3 text-info fw-bold">
                        {formatCurrency((product?.ImportPrice || 0) + (formData.IncludeCable ? (formData.CablePrice || cablePrice) : 0))}
                      </div>
                      {formData.IncludeCable && (
                        <div className="text-muted fs-6">
                          {formatCurrency(product?.ImportPrice || 0)} + {formatCurrency(formData.CablePrice || cablePrice)}
                          {selectedCableBatch && (
                            <div className="text-info">
                              (Lô {selectedCableBatch?.BatchCode})
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="text-center">
                      <div className="text-muted fs-5 mb-2">Giá bán (sau giảm)</div>
                      <div className="h3 text-primary fw-bold">
                        {formatCurrency(calculateAmountDue())}
                      </div>
                      {formData.DiscountPercent > 0 && (
                        <div className="text-muted fs-6">
                          Gốc: {formatCurrency(formData.SalePrice)}<br/>
                          Giảm {formData.DiscountPercent}%: -{formatCurrency(calculateDiscountAmount())}
                        </div>
                      )}
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
      </Form>
    </Modal>

    <InvoicePrint
      show={showInvoice}
      onHide={() => setShowInvoice(false)}
      invoiceData={invoiceData}
    />
  </>
  );
};

export default SellProductForm;
