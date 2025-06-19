'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Pagination, Modal } from 'react-bootstrap';
import * as XLSX from 'xlsx';

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
}

interface ImportBatchListProps {
  onCreateBatch?: () => void;
  onViewDetails?: (batch: ImportBatch) => void;
}

const ImportBatchList: React.FC<ImportBatchListProps> = ({ onCreateBatch, onViewDetails }) => {
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

        // Show success message
        alert('Xuất Excel thành công!');
      }
    } catch (error) {
      console.error('Error exporting to Excel:', error);
      alert('Có lỗi xảy ra khi xuất Excel!');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'ACTIVE':
        return <Badge bg="success">Đang hoạt động</Badge>;
      case 'COMPLETED':
        return <Badge bg="primary">Hoàn thành</Badge>;
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

  return (
    <>
      <style jsx>{`
        .action-buttons .btn {
          font-size: 0.875rem;
          font-weight: 500;
          white-space: nowrap;
        }
        .action-buttons .btn i {
          font-size: 0.875rem;
        }
      `}</style>

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
                  <th className="fs-6 fw-bold" style={{ minWidth: '160px' }}>Thao tác</th>
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
                        <div className="d-flex btn-group-compact" style={{ minWidth: '160px' }}>
                          {onViewDetails && (
                            <Button
                              variant="primary"
                              onClick={() => onViewDetails(batch)}
                              className="btn-compact flex-fill"
                            >
                              <span className="me-1">👁️</span>
                              Chi tiết
                            </Button>
                          )}
                          <Button
                            variant="outline-info"
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
    </>
  );
};

export default ImportBatchList;
