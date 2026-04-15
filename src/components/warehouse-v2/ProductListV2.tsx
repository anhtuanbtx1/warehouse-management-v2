'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Pagination, Modal, Row, Col, Alert } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';
import * as XLSX from 'xlsx';

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
  onPrintInvoice?: (product: ProductV2) => void;
  availableOnly?: boolean;
  batchId?: number;
  batchCode?: string; // Thêm hỗ trợ filter theo batchCode
  onProductCountChange?: () => void;
  showAddButton?: boolean; // Điều khiển hiển thị nút thêm sản phẩm
  hideCategoryFilter?: boolean; // Ẩn tìm kiếm theo danh mục
  hideColumns?: string[]; // Ẩn các cột cụ thể
  hideResetButton?: boolean; // Ẩn button đặt lại
  batchInfo?: {
    totalQuantity: number; // Tổng số lượng dự kiến của lô
    currentCount: number;  // Số lượng hiện tại trong lô
  };
}

const ProductListV2: React.FC<ProductListV2Props> = ({
  onSellProduct,
  onPrintInvoice,
  availableOnly = false,
  batchId,
  batchCode,
  onProductCountChange,
  showAddButton = true, // Mặc định hiển thị nút thêm
  hideCategoryFilter = false, // Mặc định hiển thị filter danh mục
  hideColumns = [], // Mặc định không ẩn cột nào
  hideResetButton = false, // Mặc định hiển thị button đặt lại
  batchInfo
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

  // Check if batch is full (không cho thêm sản phẩm nữa)
  const isBatchFull = batchInfo && batchInfo.currentCount >= batchInfo.totalQuantity;
  const canAddProduct = showAddButton && !isBatchFull;

  // Add product modal states (chỉ khi showAddButton = true)
  const [showAddModal, setShowAddModal] = useState(false);
  const [addProductLoading, setAddProductLoading] = useState(false);
  const [addProductError, setAddProductError] = useState('');
  const [newProduct, setNewProduct] = useState({
    ProductName: '',
    IMEI: '',
    ImportPrice: '',
    Notes: ''
  });



  // Edit product modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editProductLoading, setEditProductLoading] = useState(false);
  const [editProductError, setEditProductError] = useState('');
  const [editingProduct, setEditingProduct] = useState<ProductV2 | null>(null);
  const [editProduct, setEditProduct] = useState({
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
        ...(batchCode && { batchCode: batchCode }),
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
      // Loại trừ danh mục cáp sạc vì chỉ bán kèm, không bán riêng lẻ
      const response = await fetch('/api/categories?excludeCables=true');
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
  }, [batchId, batchCode, availableOnly]);

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



  const handleShowEditModal = (product: ProductV2) => {
    setEditingProduct(product);
    setEditProduct({
      ProductName: product.ProductName,
      IMEI: product.IMEI,
      ImportPrice: product.ImportPrice.toString(),
      Notes: product.Notes || ''
    });
    setEditProductError('');
    setShowEditModal(true);
  };

  const handleEditProduct = async () => {
    if (!editingProduct) return;

    try {
      setEditProductLoading(true);
      setEditProductError('');

      // Validation
      if (!editProduct.ProductName || !editProduct.IMEI || !editProduct.ImportPrice) {
        setEditProductError('Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      if (isNaN(parseFloat(editProduct.ImportPrice)) || parseFloat(editProduct.ImportPrice) <= 0) {
        setEditProductError('Giá nhập phải là số dương');
        return;
      }

      const response = await fetch(`/api/products-v2/${editingProduct.ProductID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ProductName: editProduct.ProductName,
          IMEI: editProduct.IMEI,
          ImportPrice: parseFloat(editProduct.ImportPrice),
          Notes: editProduct.Notes
        }),
      });

      const result = await response.json();

      if (result.success) {
        // Reset form
        setEditingProduct(null);
        setEditProduct({
          ProductName: '',
          IMEI: '',
          ImportPrice: '',
          Notes: ''
        });
        setShowEditModal(false);

        // Refresh product list
        fetchProducts(currentPage);

        // Show success toast
        showSuccess(
          'Cập nhật sản phẩm thành công!',
          `Đã cập nhật "${editProduct.ProductName}"`
        );
      } else {
        const errorMsg = result.error || 'Có lỗi xảy ra khi cập nhật sản phẩm';
        setEditProductError(errorMsg);
        showError('Lỗi cập nhật sản phẩm', errorMsg);
      }
    } catch (error) {
      console.error('Error updating product:', error);
      const errorMsg = 'Lỗi kết nối. Vui lòng thử lại.';
      setEditProductError(errorMsg);
      showError('Lỗi kết nối', errorMsg);
    } finally {
      setEditProductLoading(false);
    }
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

  const formatDate = (dateString?: string) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('vi-VN');
  };

  // Function to export Excel
  const exportToExcel = async () => {
    try {
      // Fetch all products without pagination for export
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Get all records
        ...(searchTerm && { search: searchTerm }),
        ...(statusFilter && { status: statusFilter }),
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(batchId && { batchId: batchId.toString() }),
        ...(batchCode && { batchCode: batchCode }),
        ...(availableOnly && { availableOnly: 'true' })
      });

      const response = await fetch(`/api/products-v2?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        const exportData = result.data.data.map((product: ProductV2, index: number) => ({
          'STT': index + 1,
          'Tên sản phẩm': product.ProductName,
          'IMEI': product.IMEI,
          'Danh mục': product.CategoryName,
          'Mã lô hàng': product.BatchCode,
          'Ngày nhập': formatDate(product.ImportDate),
          'Giá nhập': product.ImportPrice,
          'Giá bán': product.SalePrice || 0,
          'Lãi/Lỗ': getProfit(product),
          'Trạng thái': product.Status === 'IN_STOCK' ? 'Còn hàng' :
                      product.Status === 'SOLD' ? 'Đã bán' :
                      product.Status === 'DAMAGED' ? 'Hỏng' : 'Trả lại',
          'Thông tin khách hàng': product.CustomerInfo || '',
          'Ngày bán': formatDate(product.SoldDate),
          'Ghi chú': product.Notes || '',
          'Ngày tạo': formatDate(product.CreatedAt)
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = [
          { wch: 5 },   // STT
          { wch: 20 },  // Tên sản phẩm
          { wch: 18 },  // IMEI
          { wch: 15 },  // Danh mục
          { wch: 15 },  // Mã lô hàng
          { wch: 12 },  // Ngày nhập
          { wch: 15 },  // Giá nhập
          { wch: 15 },  // Giá bán
          { wch: 12 },  // Lãi/Lỗ
          { wch: 12 },  // Trạng thái
          { wch: 20 },  // Thông tin khách hàng
          { wch: 12 },  // Ngày bán
          { wch: 25 },  // Ghi chú
          { wch: 12 }   // Ngày tạo
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách sản phẩm');

        // Generate filename with current date
        const currentDate = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        const filename = `Danh_sach_san_pham_${currentDate}.xlsx`;

        // Save file
        XLSX.writeFile(wb, filename);

        // Show success toast
        showSuccess('Xuất Excel thành công!', `File ${filename} đã được tải xuống`);
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      showError('Có lỗi xảy ra khi xuất Excel!', 'Vui lòng thử lại sau');
    }
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
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <span className="me-2">📱</span>
          {availableOnly ? 'Sản phẩm có thể bán' : 'Danh sách sản phẩm'}
          {(batchId || batchCode) && <small className="text-muted ms-2">(Lô hàng cụ thể)</small>}
          {batchInfo && (
            <span className={`badge ms-2 ${isBatchFull ? 'bg-danger' : 'bg-info'}`}>
              {batchInfo.currentCount}/{batchInfo.totalQuantity}
              {isBatchFull && ' - Đã đủ'}
            </span>
          )}
        </h5>
        <div className="d-flex gap-2">
          <Button
            variant="outline-success"
            onClick={exportToExcel}
            className="btn-compact"
            title="Xuất danh sách sản phẩm ra Excel"
          >
            <span className="me-1">📄</span>
            Xuất Excel
          </Button>
        </div>
      </Card.Header>

      <Card.Body>
        {/* Search and Filter */}
        <div className="row mb-3">
          <div className={
            hideCategoryFilter && hideResetButton ? "col-md-6" :
            hideCategoryFilter ? "col-md-6" :
            hideResetButton ? "col-md-7" : "col-md-4"
          }>
            <InputGroup>
              <Form.Control
                type="text"
                placeholder="Tìm kiếm theo tên hoặc IMEI..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
              <Button
                variant="primary"
                onClick={handleSearch}
                title="Tìm kiếm"
                className="px-3 d-flex align-items-center justify-content-center"
              >
                <i className="fas fa-search"></i>
              </Button>
            </InputGroup>
          </div>

          {!availableOnly && (
            <div className={
              hideCategoryFilter && hideResetButton ? "col-md-6" :
              hideCategoryFilter ? "col-md-4" :
              hideResetButton ? "col-md-5" : "col-md-3"
            }>

            </div>
          )}

          {!hideCategoryFilter && (
            <div className="col-md-3">
              <Form.Select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="fs-6"
              >
                <option value="">Tất cả danh mục</option>
                {categories.map(category => (
                  <option key={category.CategoryID} value={category.CategoryID}>
                    {category.CategoryName}
                  </option>
                ))}
              </Form.Select>
            </div>
          )}

          {!hideResetButton && (
            <div className="col-md-2">
              <div className="d-flex btn-group-compact">

                {showAddButton && (
                  <Button
                    variant={isBatchFull ? "secondary" : "success"}
                    onClick={handleShowAddModal}
                    title={isBatchFull ? "Lô hàng đã đủ số lượng" : "Thêm sản phẩm mới"}
                    className="btn-compact"
                    disabled={isBatchFull}
                  >
                    <span className="me-1">{isBatchFull ? "🚫" : "➕"}</span>
                    {isBatchFull ? "Đã đủ" : "Thêm SP"}
                  </Button>
                )}
              </div>
            </div>
          )}

          {hideResetButton && showAddButton && (
            <div className="col-md-2">
              <Button
                variant={isBatchFull ? "secondary" : "success"}
                onClick={handleShowAddModal}
                title={isBatchFull ? "Lô hàng đã đủ số lượng" : "Thêm sản phẩm mới"}
                className="btn-compact w-100"
                disabled={isBatchFull}
              >
                <span className="me-1">{isBatchFull ? "🚫" : "➕"}</span>
                {isBatchFull ? "Đã đủ" : "Thêm SP"}
              </Button>
            </div>
          )}
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
                  <th className="text-nowrap">Tên sản phẩm</th>
                  <th className="text-nowrap">IMEI</th>
                  <th className="text-nowrap text-center">Danh mục</th>
                  <th className="text-nowrap">Lô hàng</th>
                  <th className="text-nowrap text-end">Giá nhập</th>
                  {!hideColumns.includes('salePrice') && <th className="text-nowrap text-end">Giá bán</th>}
                  {!hideColumns.includes('profit') && <th className="text-nowrap text-end">Lãi/Lỗ</th>}
                  <th className="text-nowrap text-center">Trạng thái</th>
                  {!hideColumns.includes('saleDate') && <th className="text-nowrap text-center">Ngày bán</th>}
                  <th className="text-nowrap text-center">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {products.length === 0 ? (
                  <tr>
                    <td colSpan={hideColumns.length === 3 ? 7 : 10} className="text-center py-4">
                      {availableOnly ? 'Không có sản phẩm nào có thể bán' : 'Không có dữ liệu'}
                    </td>
                  </tr>
                ) : (
                  products.map(product => (
                    <tr key={product.ProductID} className="align-middle">
                      <td>
                        <div>
                          <strong className="text-dark">{product.ProductName}</strong>
                          {product.Notes && (
                            <small className="d-block text-muted">
                              {product.Notes}
                            </small>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="text-primary fw-medium font-monospace">{product.IMEI}</span>
                      </td>
                      <td className="text-center">
                        <Badge bg="info" className="fw-normal bg-opacity-75">{product.CategoryName}</Badge>
                      </td>
                      <td>
                        <div className="d-flex flex-column">
                          <Badge bg="light" text="primary" className="border border-primary-subtle px-2 py-1 mb-1 align-self-start">
                            {product.BatchCode}
                          </Badge>
                          <small className="text-muted">
                            {formatDate(product.ImportDate)}
                          </small>
                        </div>
                      </td>
                      <td className="text-end fw-medium">{formatCurrency(product.ImportPrice)}</td>
                      {!hideColumns.includes('salePrice') && (
                        <td className="text-end">
                          {product.SalePrice > 0 ? (
                            <span className="text-success fw-bold">
                              {formatCurrency(product.SalePrice)}
                            </span>
                          ) : (
                            <span className="text-muted fst-italic">Chưa bán</span>
                          )}
                        </td>
                      )}
                      {!hideColumns.includes('profit') && (
                        <td className="text-end">
                          <span className={`${getProfitColor(getProfit(product))} fw-bold`}>
                            {getProfit(product) !== 0 ? formatCurrency(getProfit(product)) : '-'}
                          </span>
                        </td>
                      )}
                      <td className="text-center">{getStatusBadge(product.Status)}</td>
                      {!hideColumns.includes('saleDate') && (
                        <td className="text-center">
                          {product.SoldDate ? (
                            <div>
                              <small className="fw-medium">{formatDate(product.SoldDate)}</small>
                              {product.InvoiceNumber && (
                                <div className="text-muted">
                                  <small>HĐ: {product.InvoiceNumber}</small>
                                </div>
                              )}
                            </div>
                          ) : (
                            <span className="text-muted fst-italic">-</span>
                          )}
                        </td>
                      )}
                      <td className="text-center">
                        <div className="d-flex justify-content-center gap-1">
                          {product.Status === 'IN_STOCK' && (
                            <Button
                              variant="outline-warning"
                              size="sm"
                              onClick={() => handleShowEditModal(product)}
                              title="Chỉnh sửa sản phẩm"
                              className="d-flex align-items-center justify-content-center"
                            >
                              <i className="fas fa-edit"></i>
                            </Button>
                          )}
                          {product.Status === 'IN_STOCK' && onSellProduct && (
                            <Button
                              variant="outline-success"
                              size="sm"
                              onClick={() => onSellProduct(product)}
                              title="Bán sản phẩm"
                              className="d-flex align-items-center justify-content-center"
                            >
                              <i className="fas fa-shopping-cart"></i>
                            </Button>
                          )}
                          {product.InvoiceNumber && onPrintInvoice && (
                            <Button
                              variant="outline-info"
                              size="sm"
                              onClick={() => onPrintInvoice(product)}
                              title="In hóa đơn"
                              className="d-flex align-items-center justify-content-center"
                            >
                              <i className="fas fa-print"></i>
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

      {/* Add Product Modal - chỉ hiển thị khi showAddButton = true */}
      {showAddButton && (
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
                        type="text"
                        value={formatNumber(newProduct.ImportPrice)}
                        onChange={(e) => {
                          const rawValue = parseFormattedNumber(e.target.value);
                          setNewProduct({...newProduct, ImportPrice: rawValue});
                        }}
                        placeholder="Nhập giá nhập (VD: 100.000)"
                        disabled={addProductLoading}
                      />
                      <InputGroup.Text>VNĐ</InputGroup.Text>
                    </InputGroup>
                    <Form.Text className="text-muted">
                      Nhập số tiền, hệ thống sẽ tự động thêm dấu phân cách
                    </Form.Text>
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
      )}

      {/* Edit Product Modal */}
      <Modal show={showEditModal} onHide={() => setShowEditModal(false)} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">✏️</span>
            Chỉnh sửa sản phẩm
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editProductError && (
            <Alert variant="danger">
              <i className="fas fa-exclamation-triangle me-2"></i>
              {editProductError}
            </Alert>
          )}

          <Form>
            <Row>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Tên sản phẩm *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editProduct.ProductName}
                    onChange={(e) => setEditProduct({...editProduct, ProductName: e.target.value})}
                    placeholder="Nhập tên sản phẩm"
                    disabled={editProductLoading}
                  />
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>IMEI *</Form.Label>
                  <Form.Control
                    type="text"
                    value={editProduct.IMEI}
                    onChange={(e) => setEditProduct({...editProduct, IMEI: e.target.value})}
                    placeholder="Nhập mã IMEI"
                    disabled={editProductLoading}
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
                      type="text"
                      value={formatNumber(editProduct.ImportPrice)}
                      onChange={(e) => {
                        const rawValue = parseFormattedNumber(e.target.value);
                        setEditProduct({...editProduct, ImportPrice: rawValue});
                      }}
                      placeholder="Nhập giá nhập (VD: 100.000)"
                      disabled={editProductLoading}
                    />
                    <InputGroup.Text>VNĐ</InputGroup.Text>
                  </InputGroup>
                  <Form.Text className="text-muted">
                    Nhập số tiền, hệ thống sẽ tự động thêm dấu phân cách
                  </Form.Text>
                </Form.Group>
              </Col>
              <Col md={6}>
                <Form.Group className="mb-3">
                  <Form.Label>Ghi chú</Form.Label>
                  <Form.Control
                    type="text"
                    value={editProduct.Notes}
                    onChange={(e) => setEditProduct({...editProduct, Notes: e.target.value})}
                    placeholder="Ghi chú (tùy chọn)"
                    disabled={editProductLoading}
                  />
                </Form.Group>
              </Col>
            </Row>
          </Form>

          {editingProduct && (
            <div className="bg-light p-3 rounded mt-3">
              <h6 className="mb-2">
                <i className="fas fa-info-circle me-2"></i>
                Thông tin sản phẩm hiện tại:
              </h6>
              <div className="row">
                <div className="col-md-6">
                  <small className="text-muted">Product ID: <strong>{editingProduct.ProductID}</strong></small>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Trạng thái: <strong className="text-success">IN_STOCK</strong></small>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Lô hàng: <strong>{editingProduct.BatchCode}</strong></small>
                </div>
                <div className="col-md-6">
                  <small className="text-muted">Danh mục: <strong>{editingProduct.CategoryName}</strong></small>
                </div>
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowEditModal(false)}
            disabled={editProductLoading}
          >
            Hủy
          </Button>
          <Button
            variant="warning"
            onClick={handleEditProduct}
            disabled={editProductLoading || !editProduct.ProductName || !editProduct.IMEI || !editProduct.ImportPrice}
          >
            {editProductLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang cập nhật...
              </>
            ) : (
              <>
                <span className="me-2">✏️</span>
                Cập nhật sản phẩm
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </Card>
  );
};

export default ProductListV2;
