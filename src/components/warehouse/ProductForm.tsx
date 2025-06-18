'use client';

import React, { useState, useEffect } from 'react';
import { Modal, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Product, ProductForm as ProductFormData, Category, Unit } from '@/types/warehouse';

interface ProductFormProps {
  show: boolean;
  onHide: () => void;
  onSave: () => void;
  product?: Product | null;
}

const ProductForm: React.FC<ProductFormProps> = ({ show, onHide, onSave, product }) => {
  const [formData, setFormData] = useState<ProductFormData>({
    ProductCode: '',
    ProductName: '',
    CategoryID: 0,
    UnitID: 0,
    Description: '',
    CostPrice: 0,
    SalePrice: 0,
    MinStock: 0,
    MaxStock: 0,
    ImageUrl: '',
    Barcode: ''
  });

  const [categories, setCategories] = useState<Category[]>([]);
  const [units, setUnits] = useState<Unit[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [validated, setValidated] = useState(false);

  useEffect(() => {
    if (show) {
      fetchCategories();
      fetchUnits();
      
      if (product) {
        // Edit mode
        setFormData({
          ProductCode: product.ProductCode,
          ProductName: product.ProductName,
          CategoryID: product.CategoryID,
          UnitID: product.UnitID,
          Description: product.Description || '',
          CostPrice: product.CostPrice,
          SalePrice: product.SalePrice,
          MinStock: product.MinStock,
          MaxStock: product.MaxStock,
          ImageUrl: product.ImageUrl || '',
          Barcode: product.Barcode || ''
        });
      } else {
        // Add mode
        resetForm();
      }
    }
  }, [show, product]);

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

  const fetchUnits = async () => {
    try {
      const response = await fetch('/api/units');
      const result = await response.json();
      if (result.success) {
        setUnits(result.data);
      }
    } catch (error) {
      console.error('Error fetching units:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      ProductCode: '',
      ProductName: '',
      CategoryID: 0,
      UnitID: 0,
      Description: '',
      CostPrice: 0,
      SalePrice: 0,
      MinStock: 0,
      MaxStock: 0,
      ImageUrl: '',
      Barcode: ''
    });
    setValidated(false);
    setError('');
  };

  const handleInputChange = (field: keyof ProductFormData, value: any) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const validateForm = () => {
    if (!formData.ProductCode.trim()) return false;
    if (!formData.ProductName.trim()) return false;
    if (!formData.CategoryID) return false;
    if (!formData.UnitID) return false;
    if (formData.CostPrice < 0) return false;
    if (formData.SalePrice < 0) return false;
    if (formData.MinStock < 0) return false;
    if (formData.MaxStock < formData.MinStock) return false;
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
      const url = product ? `/api/products/${product.ProductID}` : '/api/products';
      const method = product ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const result = await response.json();

      if (result.success) {
        onSave();
        onHide();
      } else {
        setError(result.error || 'Có lỗi xảy ra');
      }
    } catch (error) {
      console.error('Error saving product:', error);
      setError('Có lỗi xảy ra khi lưu sản phẩm');
    } finally {
      setLoading(false);
    }
  };

  const generateProductCode = () => {
    const timestamp = Date.now().toString().slice(-6);
    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    const code = `SP${timestamp}${randomNum}`;
    handleInputChange('ProductCode', code);
  };

  return (
    <Modal show={show} onHide={onHide} size="lg">
      <Modal.Header closeButton>
        <Modal.Title>
          {product ? 'Chỉnh sửa sản phẩm' : 'Thêm sản phẩm mới'}
        </Modal.Title>
      </Modal.Header>

      <Form noValidate validated={validated} onSubmit={handleSubmit}>
        <Modal.Body>
          {error && <Alert variant="danger">{error}</Alert>}

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mã sản phẩm <span className="text-danger">*</span></Form.Label>
                <div className="d-flex">
                  <Form.Control
                    type="text"
                    value={formData.ProductCode}
                    onChange={(e) => handleInputChange('ProductCode', e.target.value)}
                    required
                    placeholder="Nhập mã sản phẩm"
                  />
                  <Button
                    variant="outline-secondary"
                    className="ms-2"
                    onClick={generateProductCode}
                    type="button"
                  >
                    Tạo mã
                  </Button>
                </div>
                <Form.Control.Feedback type="invalid">
                  Vui lòng nhập mã sản phẩm
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tên sản phẩm <span className="text-danger">*</span></Form.Label>
                <Form.Control
                  type="text"
                  value={formData.ProductName}
                  onChange={(e) => handleInputChange('ProductName', e.target.value)}
                  required
                  placeholder="Nhập tên sản phẩm"
                />
                <Form.Control.Feedback type="invalid">
                  Vui lòng nhập tên sản phẩm
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Danh mục <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.CategoryID}
                  onChange={(e) => handleInputChange('CategoryID', parseInt(e.target.value))}
                  required
                >
                  <option value={0}>Chọn danh mục</option>
                  {categories.map(category => (
                    <option key={category.CategoryID} value={category.CategoryID}>
                      {category.CategoryName}
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Vui lòng chọn danh mục
                </Form.Control.Feedback>
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Đơn vị tính <span className="text-danger">*</span></Form.Label>
                <Form.Select
                  value={formData.UnitID}
                  onChange={(e) => handleInputChange('UnitID', parseInt(e.target.value))}
                  required
                >
                  <option value={0}>Chọn đơn vị tính</option>
                  {units.map(unit => (
                    <option key={unit.UnitID} value={unit.UnitID}>
                      {unit.UnitName} ({unit.UnitSymbol})
                    </option>
                  ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                  Vui lòng chọn đơn vị tính
                </Form.Control.Feedback>
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Giá vốn (VNĐ)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.CostPrice}
                  onChange={(e) => handleInputChange('CostPrice', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Giá bán (VNĐ)</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  step="1000"
                  value={formData.SalePrice}
                  onChange={(e) => handleInputChange('SalePrice', parseFloat(e.target.value) || 0)}
                  placeholder="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tồn kho tối thiểu</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.MinStock}
                  onChange={(e) => handleInputChange('MinStock', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Tồn kho tối đa</Form.Label>
                <Form.Control
                  type="number"
                  min="0"
                  value={formData.MaxStock}
                  onChange={(e) => handleInputChange('MaxStock', parseInt(e.target.value) || 0)}
                  placeholder="0"
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mã vạch</Form.Label>
                <Form.Control
                  type="text"
                  value={formData.Barcode}
                  onChange={(e) => handleInputChange('Barcode', e.target.value)}
                  placeholder="Nhập mã vạch"
                />
              </Form.Group>
            </Col>

            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Hình ảnh (URL)</Form.Label>
                <Form.Control
                  type="url"
                  value={formData.ImageUrl}
                  onChange={(e) => handleInputChange('ImageUrl', e.target.value)}
                  placeholder="https://example.com/image.jpg"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Mô tả</Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              value={formData.Description}
              onChange={(e) => handleInputChange('Description', e.target.value)}
              placeholder="Nhập mô tả sản phẩm"
            />
          </Form.Group>
        </Modal.Body>

        <Modal.Footer>
          <Button variant="secondary" onClick={onHide} disabled={loading}>
            Hủy
          </Button>
          <Button variant="primary" type="submit" disabled={loading}>
            {loading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" />
                Đang lưu...
              </>
            ) : (
              product ? 'Cập nhật' : 'Thêm mới'
            )}
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
};

export default ProductForm;
