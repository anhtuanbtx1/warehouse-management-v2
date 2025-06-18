'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Pagination } from 'react-bootstrap';
import { Product, PaginatedResponse, ApiResponse } from '@/types/warehouse';

interface ProductListProps {
  onEdit?: (product: Product) => void;
  onDelete?: (productId: number) => void;
}

const ProductList: React.FC<ProductListProps> = ({ onEdit, onDelete }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const fetchProducts = async (page: number = 1, search: string = '', categoryId: string = '') => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(search && { search }),
        ...(categoryId && { categoryId })
      });

      const response = await fetch(`/api/products?${params}`);
      const result: ApiResponse<PaginatedResponse<Product>> = await response.json();

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
  }, []);

  const handleSearch = () => {
    fetchProducts(1, searchTerm, categoryFilter);
  };

  const handlePageChange = (page: number) => {
    fetchProducts(page, searchTerm, categoryFilter);
  };

  const handleDelete = async (productId: number) => {
    if (window.confirm('Bạn có chắc chắn muốn xóa sản phẩm này?')) {
      try {
        const response = await fetch(`/api/products/${productId}`, {
          method: 'DELETE'
        });
        const result = await response.json();
        
        if (result.success) {
          alert(result.message);
          fetchProducts(currentPage, searchTerm, categoryFilter);
        } else {
          alert(result.error);
        }
      } catch (error) {
        console.error('Error deleting product:', error);
        alert('Có lỗi xảy ra khi xóa sản phẩm');
      }
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const getStockStatus = (currentStock: number, minStock: number, maxStock: number) => {
    if (currentStock <= minStock) {
      return <Badge bg="danger">Tồn kho thấp</Badge>;
    } else if (currentStock >= maxStock) {
      return <Badge bg="warning">Tồn kho cao</Badge>;
    } else {
      return <Badge bg="success">Bình thường</Badge>;
    }
  };

  return (
    <Card>
      <Card.Header>
        <h5 className="mb-0">Danh sách sản phẩm</h5>
      </Card.Header>
      
      <Card.Body>
        {/* Search and Filter */}
        <div className="row mb-3">
          <div className="col-md-6">
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm theo tên hoặc mã sản phẩm..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                title="Tìm kiếm"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '50px'
                }}
              >
                🔍
              </Button>
            </InputGroup>
          </div>
          <div className="col-md-4">
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
            <Button
              variant="outline-secondary"
              onClick={() => {
                setSearchTerm('');
                setCategoryFilter('');
                fetchProducts(1);
              }}
              title="Đặt lại bộ lọc"
              className="d-flex align-items-center"
            >
              <span className="me-2">🔄</span>
              Đặt lại
            </Button>
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
                  <th>Mã SP</th>
                  <th>Tên sản phẩm</th>
                  <th>Danh mục</th>
                  <th>Đơn vị</th>
                  <th>Giá vốn</th>
                  <th>Giá bán</th>
                  <th>Tồn kho</th>
                  <th>Trạng thái</th>
                  <th>Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="text-center py-4">
                      Không có dữ liệu
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.ProductID}>
                      <td>
                        <code>{product.ProductCode}</code>
                      </td>
                      <td>
                        <div>
                          <strong>{product.ProductName}</strong>
                          {product.Description && (
                            <small className="d-block text-muted">
                              {product.Description.substring(0, 50)}...
                            </small>
                          )}
                        </div>
                      </td>
                      <td>{product.Category?.CategoryName}</td>
                      <td>{product.Unit?.UnitName}</td>
                      <td>{formatCurrency(product.CostPrice)}</td>
                      <td>{formatCurrency(product.SalePrice)}</td>
                      <td>
                        <span className="fw-bold">0</span> {/* TODO: Get from inventory */}
                        <small className="d-block text-muted">
                          Min: {product.MinStock} | Max: {product.MaxStock}
                        </small>
                      </td>
                      <td>
                        {product.IsActive ? (
                          <Badge bg="success">Hoạt động</Badge>
                        ) : (
                          <Badge bg="secondary">Ngừng hoạt động</Badge>
                        )}
                      </td>
                      <td>
                        <div className="btn-group btn-group-sm">
                          {onEdit && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => onEdit(product)}
                              title="Chỉnh sửa"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          )}
                          <Button
                            variant="outline-danger"
                            size="sm"
                            onClick={() => handleDelete(product.ProductID)}
                            title="Xóa"
                          >
                            <i className="fas fa-trash"></i>
                          </Button>
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
    </Card>
  );
};

export default ProductList;
