'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Badge, Modal, Form, Row, Col, Alert, Spinner } from 'react-bootstrap';

interface Product {
  ProductID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice?: number;
  Status: string;
  SoldDate?: string;
  CustomerInfo?: string;
  Notes?: string;
  CreatedAt: string;
}

interface ProductListV2Props {
  batchId: number;
}

const ProductListV2: React.FC<ProductListV2Props> = ({ batchId }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSaleModal, setShowSaleModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [error, setError] = useState('');

  // Add product form states
  const [newProduct, setNewProduct] = useState({
    ProductName: '',
    IMEI: '',
    ImportPrice: '',
    Notes: ''
  });

  // Sale form states
  const [saleData, setSaleData] = useState({
    SalePrice: '',
    CustomerName: '',
    CustomerPhone: ''
  });

  useEffect(() => {
    if (batchId) {
      fetchProducts();
    }
  }, [batchId]);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`/api/products-by-batch/${batchId}`);
      const result = await response.json();
      
      if (result.success) {
        setProducts(result.data);
      } else {
        setError(result.error || 'Failed to fetch products');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error fetching products:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async () => {
    try {
      setError('');
      
      if (!newProduct.ProductName || !newProduct.IMEI || !newProduct.ImportPrice) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const response = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          BatchID: batchId,
          ProductName: newProduct.ProductName,
          IMEI: newProduct.IMEI,
          ImportPrice: parseFloat(newProduct.ImportPrice),
          Notes: newProduct.Notes
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowAddModal(false);
        setNewProduct({ ProductName: '', IMEI: '', ImportPrice: '', Notes: '' });
        fetchProducts(); // Refresh list
      } else {
        setError(result.error || 'Failed to add product');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error adding product:', err);
    }
  };

  const handleSellProduct = async () => {
    if (!selectedProduct) return;

    try {
      setError('');
      
      if (!saleData.SalePrice || !saleData.CustomerName) {
        setError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const response = await fetch('/api/sales', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ProductID: selectedProduct.ProductID,
          SalePrice: parseFloat(saleData.SalePrice),
          CustomerName: saleData.CustomerName,
          CustomerPhone: saleData.CustomerPhone
        }),
      });

      const result = await response.json();
      
      if (result.success) {
        setShowSaleModal(false);
        setSaleData({ SalePrice: '', CustomerName: '', CustomerPhone: '' });
        setSelectedProduct(null);
        fetchProducts(); // Refresh list
        alert('Bán hàng thành công!');
      } else {
        setError(result.error || 'Failed to sell product');
      }
    } catch (err) {
      setError('Network error occurred');
      console.error('Error selling product:', err);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge bg="success">Còn hàng</Badge>;
      case 'SOLD':
        return <Badge bg="secondary">Đã bán</Badge>;
      case 'RESERVED':
        return <Badge bg="warning">Đã đặt</Badge>;
      default:
        return <Badge bg="light">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  if (loading) {
    return (
      <Card>
        <Card.Body className="text-center py-5">
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Đang tải danh sách sản phẩm...</div>
        </Card.Body>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0">
            <i className="fas fa-mobile-alt me-2"></i>
            Sản phẩm trong lô ({products.length})
          </h5>
          <div className="d-flex gap-2">
            <Button variant="outline-primary" onClick={fetchProducts}>
              <i className="fas fa-sync-alt me-2"></i>
              Làm mới
            </Button>
          </div>
        </Card.Header>
        <Card.Body>
          {error && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {error}
            </Alert>
          )}

          {products.length === 0 ? (
            <div className="text-center py-5">
              <div className="mb-4">
                <i className="fas fa-mobile-alt fa-4x text-muted mb-3"></i>
                <h5 className="text-muted">Chưa có sản phẩm nào trong lô này</h5>
                <p className="text-muted">
                  Hãy thêm sản phẩm đầu tiên để bắt đầu quản lý lô hàng
                </p>
              </div>
              <div className="d-flex justify-content-center gap-2">
                <Button variant="success" size="lg" onClick={() => setShowAddModal(true)}>
                  <i className="fas fa-plus me-2"></i>
                  Thêm sản phẩm đầu tiên
                </Button>
                <Button variant="outline-secondary" onClick={fetchProducts}>
                  <i className="fas fa-sync-alt me-2"></i>
                  Làm mới
                </Button>
              </div>
            </div>
          ) : (
            <div className="table-responsive">
              <Table striped hover>
                <thead>
                  <tr>
                    <th>Tên sản phẩm</th>
                    <th>IMEI</th>
                    <th>Giá nhập</th>
                    <th>Giá bán</th>
                    <th>Trạng thái</th>
                    <th>Khách hàng</th>
                    <th style={{ minWidth: '120px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((product) => (
                    <tr key={product.ProductID}>
                      <td>
                        <strong>{product.ProductName}</strong>
                        {product.Notes && (
                          <div><small className="text-muted">{product.Notes}</small></div>
                        )}
                      </td>
                      <td>
                        <code className="text-primary">{product.IMEI}</code>
                      </td>
                      <td>{formatCurrency(product.ImportPrice)}</td>
                      <td>
                        {product.SalePrice ? formatCurrency(product.SalePrice) : '-'}
                      </td>
                      <td>{getStatusBadge(product.Status)}</td>
                      <td>
                        {product.CustomerInfo || '-'}
                        {product.SoldDate && (
                          <div><small className="text-muted">
                            {new Date(product.SoldDate).toLocaleDateString('vi-VN')}
                          </small></div>
                        )}
                      </td>
                      <td>
                        {product.Status === 'IN_STOCK' ? (
                          <Button
                            variant="success"
                            size="sm"
                            onClick={() => {
                              setSelectedProduct(product);
                              setSaleData({
                                SalePrice: product.ImportPrice.toString(),
                                CustomerName: '',
                                CustomerPhone: ''
                              });
                              setShowSaleModal(true);
                            }}
                            className="d-flex align-items-center"
                          >
                            <i className="fas fa-shopping-cart me-2"></i>
                            <span>Bán hàng</span>
                          </Button>
                        ) : (
                          <Badge bg="secondary">Đã bán</Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
            </div>
          )}
        </Card.Body>
      </Card>

      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-plus me-2"></i>
            Thêm sản phẩm vào lô
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên sản phẩm *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.ProductName}
                    onChange={(e) => setNewProduct({...newProduct, ProductName: e.target.value})}
                    placeholder="Nhập tên sản phẩm"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IMEI *</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.IMEI}
                    onChange={(e) => setNewProduct({...newProduct, IMEI: e.target.value})}
                    placeholder="Nhập mã IMEI"
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá nhập *</Form.Label>
                  <Form.Control
                    type="number"
                    value={newProduct.ImportPrice}
                    onChange={(e) => setNewProduct({...newProduct, ImportPrice: e.target.value})}
                    placeholder="Nhập giá nhập"
                    min="0"
                    step="1000"
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    type="text"
                    value={newProduct.Notes}
                    onChange={(e) => setNewProduct({...newProduct, Notes: e.target.value})}
                    placeholder="Ghi chú (tùy chọn)"
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowAddModal(false)}>
            Hủy
          </Button>
          <Button variant="primary" onClick={handleAddProduct}>
            <i className="fas fa-plus me-2"></i>
            Thêm sản phẩm
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Sale Product Modal */}
      <Modal show={showSaleModal} onHide={() => setShowSaleModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <i className="fas fa-shopping-cart me-2"></i>
            Bán sản phẩm
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {selectedProduct && (
            <>
              <div className="mb-3 p-3 bg-light rounded">
                <h6>Thông tin sản phẩm:</h6>
                <div><strong>Tên:</strong> {selectedProduct.ProductName}</div>
                <div><strong>IMEI:</strong> <code>{selectedProduct.IMEI}</code></div>
                <div><strong>Giá nhập:</strong> {formatCurrency(selectedProduct.ImportPrice)}</div>
              </div>

              <Form>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Giá bán *</Form.Label>
                      <Form.Control
                        type="number"
                        value={saleData.SalePrice}
                        onChange={(e) => setSaleData({...saleData, SalePrice: e.target.value})}
                        placeholder="Nhập giá bán"
                        min="0"
                        step="1000"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Tên khách hàng *</Form.Label>
                      <Form.Control
                        type="text"
                        value={saleData.CustomerName}
                        onChange={(e) => setSaleData({...saleData, CustomerName: e.target.value})}
                        placeholder="Nhập tên khách hàng"
                      />
                    </Form.Group>
                  </Col>
                </Row>
                <Row>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Số điện thoại</Form.Label>
                      <Form.Control
                        type="tel"
                        value={saleData.CustomerPhone}
                        onChange={(e) => setSaleData({...saleData, CustomerPhone: e.target.value})}
                        placeholder="Nhập số điện thoại"
                      />
                    </Form.Group>
                  </Col>
                  <Col md={6}>
                    <Form.Group className="mb-3">
                      <Form.Label>Lợi nhuận dự kiến</Form.Label>
                      <Form.Control
                        type="text"
                        value={saleData.SalePrice ? formatCurrency(parseFloat(saleData.SalePrice) - selectedProduct.ImportPrice) : '0 VNĐ'}
                        readOnly
                        className={parseFloat(saleData.SalePrice || '0') > selectedProduct.ImportPrice ? 'text-success' : 'text-danger'}
                      />
                    </Form.Group>
                  </Col>
                </Row>
              </Form>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowSaleModal(false)}>
            Hủy
          </Button>
          <Button variant="success" onClick={handleSellProduct}>
            <i className="fas fa-check me-2"></i>
            Xác nhận bán
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ProductListV2;
