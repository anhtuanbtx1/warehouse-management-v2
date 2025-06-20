'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Badge, Pagination, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';
import { useToast } from '@/contexts/ToastContext';

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
  ImportPrice?: number;
}

interface ImportBatchListProps {
  onCreateBatch?: () => void;
  onViewDetails?: (batch: ImportBatch) => void;
  onViewInvoice?: (batch: ImportBatch) => void;
  onEditBatch?: (batch: ImportBatch) => void;
}

const ImportBatchList: React.FC<ImportBatchListProps> = ({ 
  onCreateBatch, 
  onViewDetails, 
  onViewInvoice, 
  onEditBatch 
}) => {
  // Toast notifications using existing system
  const { showSuccess, showError } = useToast();

  const [batches, setBatches] = useState<ImportBatch[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  
  // Set default date range to 1 month (Vietnam timezone)
  const getDefaultDateRange = () => {
    const vietnamDate = new Date(new Date().getTime() + (7 * 60 * 60 * 1000));
    const toDate = vietnamDate.toISOString().split('T')[0];

    const fromDateObj = new Date(vietnamDate);
    fromDateObj.setMonth(fromDateObj.getMonth() - 1);
    const fromDate = fromDateObj.toISOString().split('T')[0];

    return { fromDate, toDate };
  };

  const defaultDates = getDefaultDateRange();

  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState(defaultDates.fromDate);
  const [toDate, setToDate] = useState(defaultDates.toDate);
  const [categories, setCategories] = useState<any[]>([]);

  // Edit batch modal states
  const [showEditModal, setShowEditModal] = useState(false);
  const [editingBatch, setEditingBatch] = useState<ImportBatch | null>(null);
  const [editLoading, setEditLoading] = useState(false);
  const [editForm, setEditForm] = useState({
    CategoryID: '',
    TotalQuantity: '',
    ImportPrice: '',
    Notes: ''
  });

  const fetchBatches = async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      });

      const response = await fetch(`/api/import-batches?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        setBatches(result.data.data);
        setTotalPages(result.data.totalPages);
        setCurrentPage(result.data.page);
      }
    } catch (error) {
      console.error('Error fetching batches:', error);
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
    fetchBatches();
    fetchCategories();
  }, []);

  const handleFilter = () => {
    fetchBatches(1);
  };

  const handlePageChange = (page: number) => {
    fetchBatches(page);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // Function to export Excel
  const exportToExcel = async () => {
    try {
      // Fetch all batches without pagination for export
      const params = new URLSearchParams({
        page: '1',
        limit: '1000', // Get all records
        ...(categoryFilter && { categoryId: categoryFilter }),
        ...(statusFilter && { status: statusFilter }),
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate })
      });

      const response = await fetch(`/api/import-batches?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        const exportData = result.data.data.map((batch: ImportBatch, index: number) => ({
          'STT': index + 1,
          'Mã lô hàng': batch.BatchCode,
          'Ngày nhập': formatDate(batch.ImportDate),
          'Danh mục': batch.CategoryName,
          'Tổng số lượng': batch.TotalQuantity,
          'Đã bán': batch.TotalSoldQuantity,
          'Còn lại': batch.RemainingQuantity,
          'Giá trị nhập': batch.TotalImportValue,
          'Giá trị bán': batch.TotalSoldValue,
          'Lãi/Lỗ': batch.ProfitLoss,
          'Ghi chú': batch.Notes || '',
          'Ngày tạo': formatDate(batch.CreatedAt)
        }));

        // Create workbook and worksheet
        const wb = XLSX.utils.book_new();
        const ws = XLSX.utils.json_to_sheet(exportData);

        // Set column widths
        const colWidths = [
          { wch: 5 },   // STT
          { wch: 15 },  // Mã lô hàng
          { wch: 12 },  // Ngày nhập
          { wch: 15 },  // Danh mục
          { wch: 12 },  // Tổng số lượng
          { wch: 10 },  // Đã bán
          { wch: 10 },  // Còn lại
          { wch: 18 },  // Giá trị nhập
          { wch: 18 },  // Giá trị bán
          { wch: 15 },  // Lãi/Lỗ
          { wch: 25 },  // Ghi chú
          { wch: 12 }   // Ngày tạo
        ];
        ws['!cols'] = colWidths;

        // Add worksheet to workbook
        XLSX.utils.book_append_sheet(wb, ws, 'Danh sách lô hàng');

        // Generate filename with current date
        const currentDate = new Date().toLocaleDateString('vi-VN').replace(/\//g, '-');
        const filename = `Danh_sach_lo_hang_${currentDate}.xlsx`;

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
      case 'COMPLETED':
        return <Badge bg="success">Hoàn thành</Badge>;
      case 'PARTIAL':
        return <Badge bg="primary">Đang hoạt động</Badge>;
      case 'CANCELLED':
        return <Badge bg="danger">Đã hủy</Badge>;
      default:
        return <Badge bg="secondary">{status}</Badge>;
    }
  };

  const getProfitLossColor = (profitLoss: number) => {
    if (profitLoss > 0) return 'text-success';
    if (profitLoss < 0) return 'text-danger';
    return 'text-muted';
  };

  // Handle edit batch
  const handleEditBatch = (batch: ImportBatch) => {
    setEditingBatch(batch);
    setEditForm({
      CategoryID: batch.CategoryID?.toString() || '',
      TotalQuantity: batch.TotalQuantity.toString(),
      ImportPrice: batch.TotalImportValue?.toString() || '',
      Notes: batch.Notes || ''
    });
    setShowEditModal(true);
  };

  // Format number with thousand separators
  const formatNumber = (value: string) => {
    if (!value) return '';
    const numStr = value.replace(/\D/g, ''); // Remove non-digits
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseFormattedNumber = (value: string) => {
    return value.replace(/\./g, '');
  };

  // Format currency for VND
  const formatCurrencyInput = (value: string) => {
    if (!value) return '';
    const numStr = value.replace(/\D/g, ''); // Remove non-digits
    return numStr.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  const parseCurrencyInput = (value: string) => {
    return value.replace(/\./g, '');
  };

  const handleSaveEdit = async () => {
    if (!editingBatch) return;

    try {
      setEditLoading(true);

      // Validation
      if (!editForm.CategoryID || !editForm.TotalQuantity || !editForm.ImportPrice) {
        showError('Lỗi validation', 'Vui lòng điền đầy đủ thông tin bắt buộc');
        return;
      }

      const totalQuantity = parseInt(parseFormattedNumber(editForm.TotalQuantity));
      if (isNaN(totalQuantity) || totalQuantity <= 0) {
        showError('Lỗi validation', 'Tổng số lượng phải là số dương');
        return;
      }

      const importPrice = parseFloat(parseFormattedNumber(editForm.ImportPrice));
      if (isNaN(importPrice) || importPrice <= 0) {
        showError('Lỗi validation', 'Giá nhập phải là số dương');
        return;
      }

      const response = await fetch(`/api/import-batches/${editingBatch.BatchID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          CategoryID: parseInt(editForm.CategoryID),
          TotalQuantity: totalQuantity,
          ImportPrice: importPrice,
          Notes: editForm.Notes
        }),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Cập nhật thành công!', 'Thông tin lô hàng đã được cập nhật');
        setShowEditModal(false);
        setEditingBatch(null);
        fetchBatches(currentPage); // Refresh list

        // Call parent callback if provided
        if (onEditBatch) {
          onEditBatch(editingBatch);
        }
      } else {
        showError('Lỗi cập nhật', result.error || 'Có lỗi xảy ra khi cập nhật lô hàng');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      showError('Lỗi kết nối', 'Không thể kết nối đến server');
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseEditModal = () => {
    setShowEditModal(false);
    setEditingBatch(null);
    setEditForm({
      CategoryID: '',
      TotalQuantity: '',
      ImportPrice: '',
      Notes: ''
    });
  };

  return (
    <>
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <h5 className="mb-0 fs-4">📦 Danh sách lô hàng</h5>
          <div className="d-flex gap-2">
            <Button
              variant="outline-success"
              onClick={exportToExcel}
              className="btn-compact"
              title="Xuất danh sách lô hàng ra Excel"
            >
              <span className="me-1">📄</span>
              Xuất Excel
            </Button>
            {onCreateBatch && (
              <Button variant="primary" onClick={onCreateBatch} className="btn-compact">
                <span className="me-1">➕</span>
                Tạo lô hàng mới
              </Button>
            )}
          </div>
        </Card.Header>

        <Card.Body>
          {/* Filters */}
          <div className="row mb-3">
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
            <div className="col-md-2">
              <Form.Select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="fs-6"
              >
                <option value="">Tất cả trạng thái</option>
                <option value="ACTIVE">Đang hoạt động</option>
                <option value="COMPLETED">Hoàn thành</option>
                <option value="CANCELLED">Đã hủy</option>
              </Form.Select>
            </div>
            <div className="col-md-2">
              <Form.Control
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                placeholder="Từ ngày"
                className="fs-6"
              />
            </div>
            <div className="col-md-2">
              <Form.Control
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                placeholder="Đến ngày"
                className="fs-6"
              />
            </div>
            <div className="col-md-3">
              <Button variant="outline-primary" onClick={handleFilter} className="btn-compact">
                <span className="me-1">🔍</span>
                Lọc
              </Button>
            </div>
          </div>

          {/* Batches Table */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              <Table responsive striped hover className="fs-6">
                <thead>
                  <tr>
                    <th className="fs-6 fw-bold">Mã lô hàng</th>
                    <th className="fs-6 fw-bold">Ngày nhập</th>
                    <th className="fs-6 fw-bold">Danh mục</th>
                    <th className="fs-6 fw-bold">SL nhập</th>
                    <th className="fs-6 fw-bold">SL bán</th>
                    <th className="fs-6 fw-bold">SL tồn</th>
                    <th className="fs-6 fw-bold">Giá trị nhập</th>
                    <th className="fs-6 fw-bold">Giá trị bán</th>
                    <th className="fs-6 fw-bold">Lãi/Lỗ</th>
                    <th className="fs-6 fw-bold">Trạng thái</th>
                    <th className="fs-6 fw-bold" style={{ minWidth: '200px' }}>Thao tác</th>
                  </tr>
                </thead>
                <tbody>
                  {batches.length === 0 ? (
                    <tr>
                      <td colSpan={11} className="text-center py-4">
                        Không có dữ liệu
                      </td>
                    </tr>
                  ) : (
                    batches.map(batch => (
                      <tr key={batch.BatchID}>
                        <td>
                          <code className="text-primary">{batch.BatchCode}</code>
                        </td>
                        <td>{formatDate(batch.ImportDate)}</td>
                        <td>
                          <Badge bg="info" className="me-1">
                            {batch.CategoryName}
                          </Badge>
                        </td>
                        <td>
                          <span className="fw-bold">{batch.TotalQuantity}</span>
                        </td>
                        <td>
                          <span className="text-success">{batch.TotalSoldQuantity}</span>
                        </td>
                        <td>
                          <span className="text-warning">{batch.RemainingQuantity}</span>
                        </td>
                        <td>
                          <small>{formatCurrency(batch.TotalImportValue)}</small>
                        </td>
                        <td>
                          <small className="text-success">
                            {formatCurrency(batch.TotalSoldValue)}
                          </small>
                        </td>
                        <td>
                          <span className={getProfitLossColor(batch.ProfitLoss)}>
                            <small>{formatCurrency(batch.ProfitLoss)}</small>
                          </span>
                        </td>
                        <td>{getStatusBadge(batch.Status)}</td>
                        <td>
                          <div className="d-flex btn-group-compact gap-1" style={{ minWidth: '200px' }}>
                            {onViewDetails && (
                              <Button
                                variant="primary"
                                onClick={() => onViewDetails(batch)}
                                className="btn-compact flex-fill"
                                title="Xem chi tiết lô hàng"
                              >
                                <span className="me-1">👁️</span>
                                Chi tiết
                              </Button>
                            )}
                            {onViewInvoice && (
                              <Button
                                variant="outline-success"
                                onClick={() => onViewInvoice(batch)}
                                className="btn-compact flex-fill"
                                title="Xem hóa đơn nhập hàng"
                              >
                                <span className="me-1">🧾</span>
                                Hóa đơn
                              </Button>
                            )}
                            <Button
                              variant="outline-info"
                              onClick={() => handleEditBatch(batch)}
                              title="Chỉnh sửa lô hàng"
                              className="btn-compact flex-fill"
                            >
                              <span className="me-1">✏️</span>
                              Sửa
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

      {/* Edit Batch Modal */}
      <Modal show={showEditModal} onHide={handleCloseEditModal} size="lg">
        <Modal.Header closeButton>
          <Modal.Title>
            <span className="me-2">✏️</span>
            Chỉnh sửa lô hàng
            {editingBatch && (
              <small className="text-muted ms-2">({editingBatch.BatchCode})</small>
            )}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {editingBatch && (
            <>
              <div className="row">
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Mã lô hàng <span className="text-muted">(không thể sửa)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={editingBatch.BatchCode}
                      disabled
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Ngày nhập <span className="text-muted">(không thể sửa)</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatDate(editingBatch.ImportDate)}
                      disabled
                      style={{ backgroundColor: '#f8f9fa' }}
                    />
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Danh mục <span className="text-danger">*</span>
                    </label>
                    <select
                      className="form-select"
                      value={editForm.CategoryID}
                      onChange={(e) => setEditForm({...editForm, CategoryID: e.target.value})}
                      style={{ fontSize: '1.1rem' }}
                    >
                      <option value="">Chọn danh mục</option>
                      {categories.map(category => (
                        <option key={category.CategoryID} value={category.CategoryID}>
                          {category.CategoryName}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                <div className="col-md-6">
                  <div className="mb-3">
                    <label className="form-label fw-bold">
                      Tổng số lượng <span className="text-danger">*</span>
                    </label>
                    <input
                      type="text"
                      className="form-control"
                      value={formatNumber(editForm.TotalQuantity)}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        TotalQuantity: parseFormattedNumber(e.target.value)
                      })}
                      placeholder="Nhập tổng số lượng"
                      style={{ fontSize: '1.1rem' }}
                    />
                    <small className="text-muted">
                      Hiện tại: {editingBatch.TotalQuantity} sản phẩm
                    </small>
                  </div>
                </div>
              </div>

              <div className="row">
              <div className="col-md-12">
                <div className="mb-3">
                  <label className="form-label fw-bold">
                    Giá nhập <span className="text-danger">*</span>
                  </label>
                  <div className="input-group">
                    <input
                      type="text"
                      className="form-control"
                      value={formatCurrencyInput(editForm.ImportPrice)}
                      onChange={(e) => setEditForm({
                        ...editForm,
                        ImportPrice: parseCurrencyInput(e.target.value)
                      })}
                      placeholder="Nhập giá nhập"
                      style={{ fontSize: '1.1rem' }}
                    />
                    <span className="input-group-text">VNĐ</span>
                  </div>
                  <small className="text-muted">
                    Hiện tại: {formatCurrency(editingBatch.TotalImportValue || 0)}
                  </small>
                </div>
              </div>

              <div className="col-12">
                <div className="mb-3">
                  <label className="form-label fw-bold">Ghi chú</label>
                  <textarea
                    className="form-control"
                    rows={3}
                    value={editForm.Notes}
                    onChange={(e) => setEditForm({...editForm, Notes: e.target.value})}
                    placeholder="Nhập ghi chú cho lô hàng..."
                    style={{ fontSize: '1.1rem' }}
                  />
                </div>
              </div>

              {/* Current Stats */}
              <div className="col-12">
                <div className="bg-light p-3 rounded">
                  <h6 className="fw-bold mb-2">📊 Thống kê hiện tại:</h6>
                  <div className="row">
                    <div className="col-md-3">
                      <small className="text-muted">Tổng nhập:</small>
                      <div className="fw-bold">{editingBatch.TotalQuantity}</div>
                    </div>
                    <div className="col-md-3">
                      <small className="text-muted">Đã bán:</small>
                      <div className="fw-bold text-success">{editingBatch.TotalSoldQuantity}</div>
                    </div>
                    <div className="col-md-3">
                      <small className="text-muted">Còn lại:</small>
                      <div className="fw-bold text-warning">{editingBatch.RemainingQuantity}</div>
                    </div>
                    <div className="col-md-3">
                      <small className="text-muted">Lãi/Lỗ:</small>
                      <div className={`fw-bold ${getProfitLossColor(editingBatch.ProfitLoss)}`}>
                        {formatCurrency(editingBatch.ProfitLoss)}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            </>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleCloseEditModal}>
            <span className="me-1">❌</span>
            Hủy
          </Button>
          <Button
            variant="primary"
            onClick={handleSaveEdit}
            disabled={editLoading}
          >
            {editLoading ? (
              <>
                <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                Đang lưu...
              </>
            ) : (
              <>
                <span className="me-1">💾</span>
                Lưu thay đổi
              </>
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
};

export default ImportBatchList;
