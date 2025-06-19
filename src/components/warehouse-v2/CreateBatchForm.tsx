'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';

interface Category {
  CategoryID: number;
  CategoryName: string;
  Description?: string;
}

interface CreateBatchFormProps {
  show: boolean;
  onHide: () => void;
  onSuccess: () => void;
}

interface CreateBatchData {
  CategoryID: number;
  ImportDate: string;
  TotalQuantity: number;
  ImportPrice: number;
  TotalImportValue: number;
  Notes?: string;
}

const CreateBatchForm: React.FC<CreateBatchFormProps> = ({ show, onHide, onSuccess }) => {
  const [formData, setFormData] = useState<CreateBatchData>({
    CategoryID: 0,
    ImportDate: new Date().toISOString().split('T')[0], // Today's date
    TotalQuantity: 0,
    ImportPrice: 0,
    TotalImportValue: 0,
    Notes: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);
  const [formattedImportPrice, setFormattedImportPrice] = useState('');
  const [formattedImportValue, setFormattedImportValue] = useState('');

  useEffect(() => {
    if (show) {
      fetchCategories();
      // Reset form when modal opens
      setFormData({
        CategoryID: 0,
        ImportDate: new Date().toISOString().split('T')[0],
        TotalQuantity: 0,
        ImportPrice: 0,
        TotalImportValue: 0,
        Notes: ''
      });
      setFormattedImportPrice('');
      setFormattedImportValue('');
      setValidated(false);
      setError('');
    }
  }, [show]);

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories');
      const result = await response.json();
      if (result.success) {
        setCategories(result.data);
      }
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleInputChange = (field: keyof CreateBatchData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleImportValueChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const rawValue = parseFormattedNumber(inputValue);
    const formattedValue = formatNumber(rawValue);

    setFormattedImportValue(formattedValue);
    setFormData(prev => ({
      ...prev,
      TotalImportValue: parseInt(rawValue) || 0
    }));
  };

  const validateForm = () => {
    if (!formData.CategoryID) return false;
    if (!formData.ImportDate) return false;
    if (formData.TotalQuantity <= 0) return false;
    if (formData.TotalImportValue <= 0) return false;
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidated(true);
    setError('');

    if (!validateForm()) {
      setError('Vui lòng kiểm tra lại thông tin nhập vào');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/import-batches', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSuccess();
        onHide();
      } else {
        setError(result.error || 'Có lỗi xảy ra khi tạo lô hàng');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      setError('Có lỗi xảy ra khi tạo lô hàng');
    } finally {
      setLoading(false);
    }
  };

  const calculateAvgPrice = () => {
    if (formData.TotalQuantity > 0) {
      return formData.TotalImportValue / formData.TotalQuantity;
    }
    return 0;
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

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          <i className="fas fa-plus-circle me-2 text-primary"></i>
          Tạo lô hàng mới
        </Modal.Title>
      </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Danh mục sản phẩm <span className="text-danger">*</span>
                </Form.Label>
                <Form.Select
                  value={formData.CategoryID}
                  onChange={(e) => handleInputChange('CategoryID', parseInt(e.target.value))}
                  required
                >
                  <option value={0}>Chọn danh mục sản phẩm</option>
                  {categories.map(category => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                      {category.CategoryName}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Vui lòng chọn danh mục sản phẩm
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Ví dụ: iPhone 16, Samsung Galaxy S24
                </Form.Text>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Ngày nhập <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="date"
                  value={formData.ImportDate}
                  onChange={(e) => handleInputChange('ImportDate', e.target.value)}
                  required
                />
                <Form.Control.Feedback type="invalid">
                  Vui lòng chọn ngày nhập
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Số lượng nhập <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="number"
                  min="1"
                  value={formData.TotalQuantity}
                  onChange={(e) => handleInputChange('TotalQuantity', parseInt(e.target.value) || 0)}
                  required
                  placeholder="Nhập số lượng sản phẩm"
                />
                <Form.Control.Feedback type="invalid">
                  Số lượng phải lớn hơn 0
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>
                  Tổng giá trị nhập (VNĐ) <span className="text-danger">*</span>
                </Form.Label>
                <Form.Control
                  type="text"
                  value={formattedImportValue}
                  onChange={handleImportValueChange}
                  required
                  placeholder="Nhập tổng giá trị (VD: 100.000.000)"
                />
                <Form.Control.Feedback type="invalid">
                  Giá trị nhập phải lớn hơn 0
                </Form.Control.Feedback>
                <Form.Text className="text-muted">
                  Nhập số tiền, hệ thống sẽ tự động thêm dấu phân cách (VD: 100000000 → 100.000.000)
                </Form.Text>
              </Form.Group>
            </Col>
          </Row>

          {/* Calculated fields */}
          {formData.TotalQuantity > 0 && formData.TotalImportValue > 0 && (
            <Row>
              <Col md={12}>
                <div className="bg-light p-3 rounded mb-3">
                  <h6 className="text-muted mb-2">Thông tin tính toán:</h6>
                  <div className="row">
                    <div className="col-md-6">
                      <strong>Giá nhập trung bình:</strong>
                      <span className="text-primary ms-2">
                        {formatCurrency(calculateAvgPrice())}
                      </span>
                    </div>
                    <div className="col-md-6">
                      <strong>Mã lô hàng:</strong>
                      <span className="text-success ms-2">
                        Tự động tạo khi lưu
                      </span>
                    </div>
                  </div>
                </div>
              </Col>
            </Row>
          )}

          <Form.Group className="mb-3">
            <Form.Label>Ghi chú</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.Notes}
              onChange={(e) => handleInputChange('Notes', e.target.value)}
              placeholder="Nhập ghi chú về lô hàng (tùy chọn)"
            />
            <Form.Text className="text-muted">
              Ví dụ: Lô iPhone 16 Pro Max đầu tiên, nhập từ nhà cung cấp ABC
            </Form.Text>
          </Form.Group>

          <Alert variant="info" className="mb-0">
            <i className="fas fa-info-circle me-2"></i>
            <strong>Lưu ý:</strong> Sau khi tạo lô hàng, bạn sẽ cần thêm từng sản phẩm với mã IMEI cụ thể vào lô này.
          </Alert>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            <i className="fas fa-times me-1"></i>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang tạo...
              </>
            ) : (
              <>
                <i className="fas fa-save me-1"></i>
                Tạo lô hàng
              </>
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default CreateBatchForm;
