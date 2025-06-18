'use client';

import React, { useState, useEffect } from 'react';
import { Card, Table, Button, Form, Row, Col, Badge, Alert } from 'react-bootstrap';

interface InventoryReportV2 {
  BatchCode: string;
  ImportDate: string;
  CategoryName: string;
  TotalQuantity: number;
  TotalImportValue: number;
  TotalSoldQuantity: number;
  TotalSoldValue: number;
  RemainingQuantity: number;
  AvgImportPrice: number;
  AvgSalePrice: number;
  ProfitLoss: number;
  ProfitMarginPercent: number;
  Status: string;
  CreatedAt: string;
}

interface InventorySummary {
  totalBatches: number;
  totalImportValue: number;
  totalSoldValue: number;
  totalProfitLoss: number;
  totalRemainingQuantity: number;
  totalSoldQuantity: number;
  avgProfitMargin: number;
}

interface InventoryReportV2Props {
  onViewBatchDetails?: (batchCode: string) => void;
}

const InventoryReportV2: React.FC<InventoryReportV2Props> = ({ onViewBatchDetails }) => {
  const [reportData, setReportData] = useState<InventoryReportV2[]>([]);
  const [summary, setSummary] = useState<InventorySummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [categories, setCategories] = useState<any[]>([]);

  const fetchInventoryReport = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        ...(fromDate && { fromDate }),
        ...(toDate && { toDate }),
        ...(categoryFilter && { categoryId: categoryFilter })
      });

      const response = await fetch(`/api/inventory-v2?${params}`);
      const result = await response.json();

      if (result.success && result.data) {
        setReportData(result.data.batches);
        setSummary(result.data.summary);
      }
    } catch (error) {
      console.error('Error fetching inventory report:', error);
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
    fetchInventoryReport();
    fetchCategories();
  }, []);

  const handleFilter = () => {
    fetchInventoryReport();
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

  const getProgressBarColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 70) return 'bg-success';
    if (percentage > 30) return 'bg-warning';
    return 'bg-danger';
  };

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-primary">
              <Card.Body className="text-center">
                <i className="fas fa-boxes fa-2x text-primary mb-2"></i>
                <h4 className="text-primary">{summary.totalBatches}</h4>
                <small className="text-muted">Tổng số lô hàng</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-warning">
              <Card.Body className="text-center">
                <i className="fas fa-arrow-down fa-2x text-warning mb-2"></i>
                <h6 className="text-warning">{formatCurrency(summary.totalImportValue)}</h6>
                <small className="text-muted">Tổng giá trị nhập</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-success">
              <Card.Body className="text-center">
                <i className="fas fa-arrow-up fa-2x text-success mb-2"></i>
                <h6 className="text-success">{formatCurrency(summary.totalSoldValue)}</h6>
                <small className="text-muted">Tổng giá trị bán</small>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className={`border-${summary.totalProfitLoss >= 0 ? 'success' : 'danger'}`}>
              <Card.Body className="text-center">
                <i className={`fas fa-chart-line fa-2x ${summary.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'} mb-2`}></i>
                <h6 className={summary.totalProfitLoss >= 0 ? 'text-success' : 'text-danger'}>
                  {formatCurrency(summary.totalProfitLoss)}
                </h6>
                <small className="text-muted">
                  Tổng lãi/lỗ ({summary.avgProfitMargin.toFixed(1)}%)
                </small>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      {/* Main Report */}
      <Card>
        <Card.Header>
          <h5 className="mb-0">
            <i className="fas fa-warehouse me-2"></i>
            Báo cáo tồn kho theo lô hàng
          </h5>
        </Card.Header>
        
        <Card.Body>
          {/* Filters */}
          <Row className="mb-3">
            <Col md={3}>
              <Form.Group>
                <Form.Label>Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>Danh mục</Form.Label>
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
              </Form.Group>
            </Col>
            <Col md={2}>
              <Form.Group>
                <Form.Label>&nbsp;</Form.Label>
                <div>
                  <Button variant="primary" onClick={handleFilter} className="w-100">
                    <i className="fas fa-filter me-1"></i>
                    Lọc
                  </Button>
                </div>
              </Form.Group>
            </Col>
          </Row>

          {/* Report Table */}
          {loading ? (
            <div className="text-center py-4">
              <div className="spinner-border" role="status">
                <span className="visually-hidden">Loading...</span>
              </div>
            </div>
          ) : (
            <>
              {reportData.length === 0 ? (
                <Alert variant="info" className="text-center">
                  <i className="fas fa-info-circle me-2"></i>
                  Không có dữ liệu trong khoảng thời gian đã chọn
                </Alert>
              ) : (
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Mã lô hàng</th>
                      <th>Ngày nhập</th>
                      <th>Danh mục</th>
                      <th>SL nhập</th>
                      <th>SL bán</th>
                      <th>SL tồn</th>
                      <th>Tỷ lệ bán</th>
                      <th>Giá trị nhập</th>
                      <th>Giá trị bán</th>
                      <th>Lãi/Lỗ</th>
                      <th>Tỷ lệ lãi</th>
                      <th>Trạng thái</th>
                      <th>Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, index) => (
                      <tr key={index}>
                        <td>
                          <code className="text-primary">{item.BatchCode}</code>
                        </td>
                        <td>{formatDate(item.ImportDate)}</td>
                        <td>
                          <Badge bg="info">{item.CategoryName}</Badge>
                        </td>
                        <td>
                          <span className="fw-bold">{item.TotalQuantity}</span>
                        </td>
                        <td>
                          <span className="text-success">{item.TotalSoldQuantity}</span>
                        </td>
                        <td>
                          <span className="text-warning">{item.RemainingQuantity}</span>
                        </td>
                        <td>
                          <div className="progress" style={{ height: '20px' }}>
                            <div
                              className={`progress-bar ${getProgressBarColor(item.RemainingQuantity, item.TotalQuantity)}`}
                              style={{ 
                                width: `${((item.TotalQuantity - item.RemainingQuantity) / item.TotalQuantity) * 100}%` 
                              }}
                            >
                              {(((item.TotalQuantity - item.RemainingQuantity) / item.TotalQuantity) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </td>
                        <td>
                          <small>{formatCurrency(item.TotalImportValue)}</small>
                        </td>
                        <td>
                          <small className="text-success">
                            {formatCurrency(item.TotalSoldValue)}
                          </small>
                        </td>
                        <td>
                          <span className={getProfitLossColor(item.ProfitLoss)}>
                            <small>{formatCurrency(item.ProfitLoss)}</small>
                          </span>
                        </td>
                        <td>
                          <span className={getProfitLossColor(item.ProfitLoss)}>
                            <small>{item.ProfitMarginPercent.toFixed(1)}%</small>
                          </span>
                        </td>
                        <td>{getStatusBadge(item.Status)}</td>
                        <td>
                          {onViewBatchDetails && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => onViewBatchDetails(item.BatchCode)}
                              title="Xem chi tiết lô hàng"
                            >
                              <i className="fas fa-eye"></i>
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
              )}
            </>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default InventoryReportV2;
