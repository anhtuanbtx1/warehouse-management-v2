'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, InputGroup, Badge, Pagination, Modal } from 'react-bootstrap';

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
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
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
    return new Date(dateString).toLocaleDateString('vi-VN');
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
          <h5 className="mb-0">Danh sách lô hàng</h5>
          {onCreateBatch && (
            <Button variant="primary" onClick={onCreateBatch}>
              <i className="fas fa-plus me-2"></i>
              Tạo lô hàng mới
            </Button>
          )}
        </Card.Header>
      
      <Card.Body>
        {/* Filters */}
        <div className="row mb-3">
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
            <Form.Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
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
            />
          </div>
          <div className="col-md-2">
            <Form.Control
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              placeholder="Đến ngày"
            />
          </div>
          <div className="col-md-3">
            <div className="d-flex gap-2">
              <Button variant="outline-primary" onClick={handleFilter}>
                <i className="fas fa-search me-1"></i>
                Lọc
              </Button>
              <Button variant="outline-secondary" onClick={() => {
                setCategoryFilter('');
                setStatusFilter('');
                setFromDate('');
                setToDate('');
                fetchBatches(1);
              }}>
                <i className="fas fa-redo me-1"></i>
                Đặt lại
              </Button>
            </div>
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
            <Table responsive striped hover>
              <thead>
                <tr>
                  <th>Mã lô hàng</th>
                  <th>Ngày nhập</th>
                  <th>Danh mục</th>
                  <th>SL nhập</th>
                  <th>SL bán</th>
                  <th>SL tồn</th>
                  <th>Giá trị nhập</th>
                  <th>Giá trị bán</th>
                  <th>Lãi/Lỗ</th>
                  <th>Trạng thái</th>
                  <th style={{ minWidth: '180px' }}>Thao tác</th>
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
                        <div className="action-buttons d-flex gap-1" style={{ minWidth: '180px' }}>
                          {onViewDetails && (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => onViewDetails(batch)}
                              className="flex-fill d-flex align-items-center justify-content-center"
                              style={{ fontSize: '0.8rem', padding: '0.375rem 0.5rem' }}
                            >
                              <i className="fas fa-eye me-1"></i>
                              <span>Chi tiết</span>
                            </Button>
                          )}
                          <Button
                            variant="outline-info"
                            size="sm"
                            title="Chỉnh sửa lô hàng"
                            className="flex-fill d-flex align-items-center justify-content-center"
                            style={{ fontSize: '0.8rem', padding: '0.375rem 0.5rem' }}
                          >
                            <i className="fas fa-edit me-1"></i>
                            <span>Sửa</span>
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
