'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Pagination, Modal, Row, Col, Alert } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';

interface ProductV2 {
  ProductID: number;
  BatchID: number;
  CategoryID: number;
  ProductName: string;
  IMEI: string;
  ImportPrice: number;
  SalePrice: number;
  Status: 'IN_STOCK' | 'SOLD' | 'DAMAGED' | 'RETURNED';
  SoldDate?: string;
  InvoiceNumber?: string;
  CustomerInfo?: string;
  Notes?: string;
  CreatedAt: string;
  UpdatedAt: string;
  CategoryName?: string;
  BatchCode?: string;
  ImportDate?: string;
}

interface ProductListV2Props {
  onSellProduct?: (product: ProductV2) => void;
  availableOnly?: boolean;
  batchId?: number;
  onProductCountChange?: () => void;
}

const ProductListV2: React.FC<ProductListV2Props> = ({
  onSellProduct,
  availableOnly = false,
  batchId,
  onProductCountChange
}) => {
  const { showSuccess, showError } = useToast();
  const [products, setProducts] = useState<ProductV2[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  // Add product modal states
  const [showAddModal, setShowAddModal] = useState(false);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [addProductError, setAddProductError] = useState('');
  const [newProduct, setNewProduct] = useState({
    ProductName: '',
    IMEI: '',
    ImportPrice: '',
    Notes: ''
  });

  const fetchProducts = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(batchId && { batchId: batchId.toString() }),
        ...(availableOnly && { availableOnly: 'true' })
      });

      const response = await fetch(`/api/products-v2?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        setProducts(result.data.data);
        setTotalPages(result.data.totalPages);
        setCurrentPage(result.data.page);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

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

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [batchId, availableOnly]);

  const handleSearch = () => {
    fetchProducts(1);
  };

  const handleAddProduct = async () => {
    try {
      setAddProductLoading(true);
      setAddProductError('');

      // Validation
      if (!newProduct.ProductName || !newProduct.IMEI || !newProduct.ImportPrice) {
        setAddProductError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      if (isNaN(parseFloat(newProduct.ImportPrice)) || parseFloat(newProduct.ImportPrice) <= 0) {
        setAddProductError('Giá nhập phải là số dương');
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
        // Reset form
        setNewProduct({
          ProductName: '',
          IMEI: '',
          ImportPrice: '',
          Notes: ''
        });
        setShowAddModal(false);

        // Refresh product list
        fetchProducts(currentPage);

        // Update product count in parent
        if (onProductCountChange) {
          onProductCountChange();
        }

        // Show success toast
        showSuccess(
          'Thêm sản phẩm thành công!',
          `Đã thêm "${newProduct.ProductName}" vào lô hàng`
        );
      } else {
        const errorMsg = result.error || 'Có lỗi xảy ra khi thêm sản phẩm';
        setAddProductError(errorMsg);
        showError('Lỗi thêm sản phẩm', errorMsg);
      }
    } catch (error) {
      console.error('Error adding product:', error);
      const errorMsg = 'Lỗi kết nối. Vui lòng thử lại.';
      setAddProductError(errorMsg);
      showError('Lỗi kết nối', errorMsg);
    } finally {
      setAddProductLoading(false);
    }
  };

  const handleShowAddModal = () => {
    setNewProduct({
      ProductName: '',
      IMEI: '',
      ImportPrice: '',
      Notes: ''
    });
    setAddProductError('');
    setShowAddModal(true);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'IN_STOCK':
        return <Badge bg="success">Còn hàng</Badge>;
      case 'SOLD':
        return <Badge bg="primary">Đã bán</Badge>;
      case 'DAMAGED':
        return <Badge bg="danger">Hỏng</Badge>;
      case 'RETURNED':
        return <Badge bg="warning">Trả lại</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getProfit = (product: ProductV2) => {
    if (product.Status === 'SOLD' && product.SalePrice > 0) {
      return product.SalePrice - product.ImportPrice;
    }
    return 0;
  };

  const getProfitColor = (profit: number) => {
    if (profit > 0) return 'text-success';
    if (profit < 0) return 'text-danger';
    return 'text-muted';
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">
          {availableOnly ? 'Sản phẩm có thể bán' : 'Danh sách sản phẩm'}
          {batchId && <small className="text-muted ms-2">(Lô hàng cụ thể)</small>}
        </h5>
      </Card.Header>
      
      <Card.Body>
        {/* Search and Filter */}
        <div className="row mb-3">
          <div className="col-md-4">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm theo tên hoặc IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                title="Tìm kiếm"
                style={{
                  backgroundColor: '#0d6efd',
                  borderColor: '#0d6efd',
                  color: 'white',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '50px',
                  fontWeight: 'bold',
                  fontSize: '16px'
                }}
              >
                🔍
              </Button>
            </InputGroup>
          </div>
          
          {!availableOnly && (
            <div className="col-md-3">
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Tất cả trạng thái</option>
                <option value="IN_STOCK">Còn hàng</option>
                <option value="SOLD">Đã bán</option>
                <option value="DAMAGED">Hỏng</option>
                <option value="RETURNED">Trả lại</option>
              </Form.Select>
            </div>
          )}
          
          <div className="col-md-3">
            <Form.Select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">Tất cả danh mục</option>
              {categories.map(category => (
                <option key={category.CategoryID} value={category.CategoryID}>
                  {category.CategoryName}
                </option>
              ))}
            </Form.Select>
          </div>
          
          <div className="col-md-2">
            <div className="d-flex gap-2">
              <Button
                variant="outline-secondary"
                onClick={() => {
                  setSearchTerm('');
                  setStatusFilter('');
                  setCategoryFilter('');
                  fetchProducts(1);
                }}
                title="Đặt lại bộ lọc"
                className="d-flex align-items-center"
                style={{ flex: '1' }}
              >
                <span className="me-2">🔄</span>
                Đặt lại
              </Button>
              <Button
                variant="success"
                onClick={handleShowAddModal}
                title="Thêm sản phẩm mới"
                className="d-flex align-items-center"
                style={{ whiteSpace: 'nowrap' }}
              >
                <span className="me-1">➕</span>
                Thêm SP
              </Button>
            </div>
          </div>
        </div>

        {/* Products Table */}
        {loading ? (
          <div className="text-center py-4">
            <div className="spinner-border" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        ) : (
          <>
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Tên sản phẩm</th>
                  <th>IMEI</th>
                  <th>Danh mục</th>
                  <th>Lô hàng</th>
                  <th>Giá nhập</th>
                  <th>Giá bán</th>
                  <th>Lãi/Lỗ</th>
                  <th>Trạng thái</th>
                  <th>Ngày bán</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="text-center py-4">
                      {availableOnly ? 'Không có sản phẩm nào có thể bán' : 'Không có dữ liệu'}
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.ProductID}>
                      <td>
                        <div>
                          <strong>{product.ProductName}</strong>
                          {product.Notes && (
                            <small className="d-block text-muted">
                              {product.Notes}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <code className="text-primary">{product.IMEI}</code>
                      </td>
                      <td>
                        <Badge bg="info">{product.CategoryName}</Badge>
                      </td>
                      <td>
                        <small>
                          <code>{product.BatchCode}</code>
                          <div className="text-muted">
                            {formatDate(product.ImportDate)}
                          </div>
                        </small>
                      </td>
                      <td>{formatCurrency(product.ImportPrice)}</td>
                      <td>
                        {product.SalePrice > 0 ? (
                          <span className="text-success">
                            {formatCurrency(product.SalePrice)}
                          </span>
                        ) : (
                          <span className="text-muted">Chưa bán</span>
                        )}
                      </td>
                      <td>
                        <span className={getProfitColor(getProfit(product))}>
                          {getProfit(product) !== 0 ? formatCurrency(getProfit(product)) : '-'}
                        </span>
                      </td>
                      <td>{getStatusBadge(product.Status)}</td>
                      <td>
                        {product.SoldDate ? (
                          <div>
                            <small>{formatDate(product.SoldDate)}</small>
                            {product.InvoiceNumber && (
                              <div className="text-muted">
                                <small>HĐ: {product.InvoiceNumber}</small>
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted">-</span>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {product.Status === 'IN_STOCK' && onSellProduct && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => onSellProduct(product)}
                              title="Bán sản phẩm"
                            >
                              <i className="fas fa-shopping-cart"></i>
                            </Button>
                          )}
                          {product.InvoiceNumber && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              title="Xem hóa đơn"
                            >
                              <i className="fas fa-receipt"></i>
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </Table>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="d-flex justify-content-center">
                <Pagination>
                  <Pagination.Prev
                    disabled={currentPage === 1}
                    onClick={() => handlePageChange(currentPage - 1)}
                  />
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => (
                    <Pagination.Item
                      key={page}
                      active={page === currentPage}
                      onClick={() => handlePageChange(page)}
                    >
                      {page}
                    </Pagination.Item>
                  ))}
                  <Pagination.Next
                    disabled={currentPage === totalPages}
                    onClick={() => handlePageChange(currentPage + 1)}
                  />
                </Pagination>
              </div>
            )}
          </>
        )}
      </Card.Body>

      {/* Add Product Modal */}
      <Modal show={showAddModal} onHide={() => setShowAddModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">➕</span>
            Thêm sản phẩm vào lô
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {addProductError && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {addProductError}
            </Alert>
          )}

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
                    disabled={addProductLoading}
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
                    disabled={addProductLoading}
                  />
                </Form.Group>
              </Col>
            </Row>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Giá nhập *</Form.Label>
                  <InputGroup>
                    <Form.Control
                      type="number"
                      value={newProduct.ImportPrice}
                      onChange={(e) => setNewProduct({...newProduct, ImportPrice: e.target.value})}
                      placeholder="Nhập giá nhập"
                      min="0"
                      step="1000"
                      disabled={addProductLoading}
                    />
                    <InputGroup.Text>VNĐ</InputGroup.Text>
                  </InputGroup>
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
                    disabled={addProductLoading}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>

          <div className="bg-light p-3 rounded mt-3">
            <h6 className="mb-2">
              <i className="fas fa-info-circle me-2"></i>
              Thông tin lô hàng:
            </h6>
            <div className="row">
              <div className="col-md-6">
                <small className="text-muted">Batch ID: <strong>{batchId}</strong></small>
              </div>
              <div className="col-md-6">
                <small className="text-muted">Sản phẩm sẽ được thêm vào lô này</small>
              </div>
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowAddModal(false)}
            disabled={addProductLoading}
          >
            Hủy
          </Button>
          <Button
            variant="success"
            onClick={handleAddProduct}
            disabled={addProductLoading || !newProduct.ProductName || !newProduct.IMEI || !newProduct.ImportPrice}
          >
            {addProductLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang thêm...
              </>
            ) : (
              <>
                <span className="me-2">➕</span>
                Thêm sản phẩm
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ProductListV2;
