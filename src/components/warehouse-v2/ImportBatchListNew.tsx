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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return React.createElement(Badge, { bg: "success" }, "Đang hoạt động");
      case 'COMPLETED':
        return React.createElement(Badge, { bg: "primary" }, "Hoàn thành");
      case 'CANCELLED':
        return React.createElement(Badge, { bg: "danger" }, "Đã hủy");
      default:
        return React.createElement(Badge, { bg: "secondary" }, status);
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

  const handleSaveEdit = async () => {
    if (!editingBatch) return;

    try {
      setEditLoading(true);

      const updateData = {
        CategoryID: parseInt(editForm.CategoryID),
        TotalQuantity: parseInt(editForm.TotalQuantity),
        ImportPrice: parseFloat(editForm.ImportPrice),
        Notes: editForm.Notes
      };

      const response = await fetch(`/api/import-batches/${editingBatch.BatchID}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      const result = await response.json();

      if (result.success) {
        showSuccess('Thành công', 'Cập nhật lô hàng thành công!');
        handleCloseEditModal();
        fetchBatches(currentPage);
      } else {
        showError('Lỗi', result.message || 'Có lỗi xảy ra khi cập nhật lô hàng');
      }
    } catch (error) {
      console.error('Error updating batch:', error);
      showError('Lỗi', 'Có lỗi xảy ra khi cập nhật lô hàng');
    } finally {
      setEditLoading(false);
    }
  };

  // Format currency input
  const formatCurrencyInput = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseFloat(value.replace(/[^\d]/g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('vi-VN');
  };

  const parseCurrencyInput = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  // Format number input
  const formatNumber = (value: string | number) => {
    if (!value) return '';
    const numValue = typeof value === 'string' ? parseInt(value.replace(/[^\d]/g, '')) : value;
    if (isNaN(numValue)) return '';
    return numValue.toLocaleString('vi-VN');
  };

  const parseFormattedNumber = (value: string) => {
    return value.replace(/[^\d]/g, '');
  };

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(
      Card,
      null,
      React.createElement(
        Card.Header,
        { className: "d-flex justify-content-between align-items-center" },
        React.createElement("h5", { className: "mb-0 fs-4" }, "📦 Danh sách lô hàng"),
        React.createElement(
          "div",
          { className: "d-flex gap-2" },
          onCreateBatch && React.createElement(
            Button,
            { variant: "primary", onClick: onCreateBatch, className: "btn-compact" },
            React.createElement("span", { className: "me-1" }, "➕"),
            "Tạo lô hàng mới"
          )
        )
      ),
      React.createElement(
        Card.Body,
        null,
        React.createElement(
          "div",
          { className: "row mb-3" },
          React.createElement(
            "div",
            { className: "col-md-3" },
            React.createElement(
              Form.Select,
              {
                value: categoryFilter,
                onChange: (e: any) => setCategoryFilter(e.target.value),
                className: "fs-6"
              },
              React.createElement("option", { value: "" }, "Tất cả danh mục"),
              categories.map(category => 
                React.createElement("option", { 
                  key: category.CategoryID, 
                  value: category.CategoryID 
                }, category.CategoryName)
              )
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-3" },
            React.createElement(
              Button,
              { variant: "outline-primary", onClick: handleFilter, className: "btn-compact" },
              React.createElement("span", { className: "me-1" }, "🔍"),
              "Lọc"
            )
          )
        ),
        loading ? React.createElement(
          "div",
          { className: "text-center py-4" },
          React.createElement(
            "div",
            { className: "spinner-border", role: "status" },
            React.createElement("span", { className: "visually-hidden" }, "Loading...")
          )
        ) : React.createElement(
          Table,
          { responsive: true, striped: true, hover: true, className: "fs-6" },
          React.createElement(
            "thead",
            null,
            React.createElement(
              "tr",
              null,
              React.createElement("th", { className: "fs-6 fw-bold" }, "Mã lô hàng"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Ngày nhập"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Danh mục"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "SL nhập"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "SL bán"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "SL tồn"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Giá trị nhập"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Giá trị bán"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Lãi/Lỗ"),
              React.createElement("th", { className: "fs-6 fw-bold" }, "Trạng thái"),
              React.createElement("th", { className: "fs-6 fw-bold", style: { minWidth: '200px' } }, "Thao tác")
            )
          ),
          React.createElement(
            "tbody",
            null,
            batches.length === 0 ? React.createElement(
              "tr",
              null,
              React.createElement("td", { colSpan: 11, className: "text-center py-4" }, "Không có dữ liệu")
            ) : batches.map(batch => 
              React.createElement(
                "tr",
                { key: batch.BatchID },
                React.createElement(
                  "td",
                  null,
                  React.createElement("code", { className: "text-primary" }, batch.BatchCode)
                ),
                React.createElement("td", null, formatDate(batch.ImportDate)),
                React.createElement(
                  "td",
                  null,
                  React.createElement(Badge, { bg: "info", className: "me-1" }, batch.CategoryName)
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement("span", { className: "fw-bold" }, batch.TotalQuantity)
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement("span", { className: "text-success" }, batch.TotalSoldQuantity)
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement("span", { className: "text-warning" }, batch.RemainingQuantity)
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement("small", null, formatCurrency(batch.TotalImportValue))
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement("small", { className: "text-success" }, formatCurrency(batch.TotalSoldValue))
                ),
                React.createElement(
                  "td",
                  null,
                  React.createElement(
                    "span",
                    { className: getProfitLossColor(batch.ProfitLoss) },
                    React.createElement("small", null, formatCurrency(batch.ProfitLoss))
                  )
                ),
                React.createElement("td", null, getStatusBadge(batch.Status)),
                React.createElement(
                  "td",
                  null,
                  React.createElement(
                    "div",
                    { className: "d-flex btn-group-compact gap-1", style: { minWidth: '200px' } },
                    onViewDetails && React.createElement(
                      Button,
                      {
                        variant: "primary",
                        onClick: () => onViewDetails(batch),
                        className: "btn-compact flex-fill",
                        title: "Xem chi tiết lô hàng"
                      },
                      React.createElement("span", { className: "me-1" }, "👁️"),
                      "Chi tiết"
                    ),
                    React.createElement(
                      Button,
                      {
                        variant: "outline-info",
                        onClick: () => handleEditBatch(batch),
                        title: "Chỉnh sửa lô hàng",
                        className: "btn-compact flex-fill"
                      },
                      React.createElement("span", { className: "me-1" }, "✏️"),
                      "Sửa"
                    )
                  )
                )
              )
            )
          )
        )
      )
    ),
    // Edit Batch Modal
    React.createElement(
      Modal,
      { show: showEditModal, onHide: handleCloseEditModal, size: "lg" },
      React.createElement(
        Modal.Header,
        { closeButton: true },
        React.createElement(
          Modal.Title,
          null,
          React.createElement("span", { className: "me-2" }, "✏️"),
          "Chỉnh sửa lô hàng",
          editingBatch && React.createElement("small", { className: "text-muted ms-2" }, `(${editingBatch.BatchCode})`)
        )
      ),
      React.createElement(
        Modal.Body,
        null,
        editingBatch && React.createElement(
          "div",
          { className: "row" },
          React.createElement(
            "div",
            { className: "col-md-6" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement(
                "label",
                { className: "form-label fw-bold" },
                "Mã lô hàng ",
                React.createElement("span", { className: "text-muted" }, "(không thể sửa)")
              ),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                value: editingBatch.BatchCode,
                disabled: true,
                style: { backgroundColor: '#f8f9fa' }
              })
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-6" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement(
                "label",
                { className: "form-label fw-bold" },
                "Ngày nhập ",
                React.createElement("span", { className: "text-muted" }, "(không thể sửa)")
              ),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                value: formatDate(editingBatch.ImportDate),
                disabled: true,
                style: { backgroundColor: '#f8f9fa' }
              })
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-6" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement(
                "label",
                { className: "form-label fw-bold" },
                "Danh mục ",
                React.createElement("span", { className: "text-danger" }, "*")
              ),
              React.createElement(
                "select",
                {
                  className: "form-select",
                  value: editForm.CategoryID,
                  onChange: (e: any) => setEditForm({...editForm, CategoryID: e.target.value}),
                  style: { fontSize: '1.1rem' }
                },
                React.createElement("option", { value: "" }, "Chọn danh mục"),
                categories.map(category =>
                  React.createElement("option", {
                    key: category.CategoryID,
                    value: category.CategoryID
                  }, category.CategoryName)
                )
              )
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-6" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement(
                "label",
                { className: "form-label fw-bold" },
                "Tổng số lượng ",
                React.createElement("span", { className: "text-danger" }, "*")
              ),
              React.createElement("input", {
                type: "text",
                className: "form-control",
                value: formatNumber(editForm.TotalQuantity),
                onChange: (e: any) => setEditForm({
                  ...editForm,
                  TotalQuantity: parseFormattedNumber(e.target.value)
                }),
                placeholder: "Nhập tổng số lượng",
                style: { fontSize: '1.1rem' }
              }),
              React.createElement("small", { className: "text-muted" }, `Hiện tại: ${editingBatch.TotalQuantity} sản phẩm`)
            )
          ),
          React.createElement(
            "div",
            { className: "col-md-12" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement(
                "label",
                { className: "form-label fw-bold" },
                "Giá nhập ",
                React.createElement("span", { className: "text-danger" }, "*")
              ),
              React.createElement(
                "div",
                { className: "input-group" },
                React.createElement("input", {
                  type: "text",
                  className: "form-control",
                  value: formatCurrencyInput(editForm.ImportPrice),
                  onChange: (e: any) => setEditForm({
                    ...editForm,
                    ImportPrice: parseCurrencyInput(e.target.value)
                  }),
                  placeholder: "Nhập giá nhập",
                  style: { fontSize: '1.1rem' }
                }),
                React.createElement("span", { className: "input-group-text" }, "VNĐ")
              ),
              React.createElement("small", { className: "text-muted" }, `Hiện tại: ${formatCurrency(editingBatch.TotalImportValue || 0)}`)
            )
          ),
          React.createElement(
            "div",
            { className: "col-12" },
            React.createElement(
              "div",
              { className: "mb-3" },
              React.createElement("label", { className: "form-label fw-bold" }, "Ghi chú"),
              React.createElement("textarea", {
                className: "form-control",
                rows: 3,
                value: editForm.Notes,
                onChange: (e: any) => setEditForm({...editForm, Notes: e.target.value}),
                placeholder: "Nhập ghi chú cho lô hàng...",
                style: { fontSize: '1.1rem' }
              })
            )
          )
        )
      ),
      React.createElement(
        Modal.Footer,
        null,
        React.createElement(
          Button,
          { variant: "secondary", onClick: handleCloseEditModal },
          React.createElement("span", { className: "me-1" }, "❌"),
          "Hủy"
        ),
        React.createElement(
          Button,
          {
            variant: "primary",
            onClick: handleSaveEdit,
            disabled: editLoading
          },
          editLoading ? React.createElement(
            React.Fragment,
            null,
            React.createElement("span", {
              className: "spinner-border spinner-border-sm me-2",
              role: "status",
              "aria-hidden": "true"
            }),
            "Đang lưu..."
          ) : React.createElement(
            React.Fragment,
            null,
            React.createElement("span", { className: "me-1" }, "💾"),
            "Lưu thay đổi"
          )
        )
      )
    )
  );
};

export default ImportBatchList;
