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
        case 'COMPLETED':
          return <Badge bg="success">Hoàn thành</Badge>;
        case 'PARTIAL':
          return <Badge bg="primary">Đang hoạt động</Badge>;
        case 'ACTIVE':
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

  const getProgressBarColor = (remaining: number, total: number) => {
    const percentage = (remaining / total) * 100;
    if (percentage > 70) return 'bg-danger';
    if (percentage > 30) return 'bg-warning';
    return 'bg-success';
  };

  return (
    <div>
      {/* Summary Cards */}
      {summary && (
        <Row className="mb-4 g-3">
          <Col md={3}>
            <Card className="border-primary border-opacity-50 shadow-sm h-100">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                <div className="rounded-circle bg-primary bg-opacity-10 d-flex align-items-center justify-content-center mb-2" style={{ width: '48px', height: '48px' }}>
                  <i className="fas fa-boxes text-primary" style={{ fontSize: '1.25rem' }}></i>
                </div>
                <h5 className="text-primary fw-bold mb-1">{summary.totalBatches}</h5>
                <span className="text-muted small">Tổng số lô hàng</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-warning border-opacity-50 shadow-sm h-100">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                <div className="rounded-circle bg-warning bg-opacity-10 d-flex align-items-center justify-content-center mb-2" style={{ width: '48px', height: '48px' }}>
                  <i className="fas fa-arrow-down text-warning" style={{ fontSize: '1.25rem' }}></i>
                </div>
                <h5 className="text-warning fw-bold mb-1">{formatCurrency(summary.totalImportValue)}</h5>
                <span className="text-muted small">Tổng giá trị nhập</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-success border-opacity-50 shadow-sm h-100">
              <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                <div className="rounded-circle bg-success bg-opacity-10 d-flex align-items-center justify-content-center mb-2" style={{ width: '48px', height: '48px' }}>
                  <i className="fas fa-arrow-up text-success" style={{ fontSize: '1.25rem' }}></i>
                </div>
                <h5 className="text-success fw-bold mb-1">{formatCurrency(summary.totalSoldValue)}</h5>
                <span className="text-muted small">Tổng giá trị bán</span>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className={`border-${summary.totalProfitLoss >= 0 ? 'success' : 'danger'} border-opacity-50 shadow-sm h-100`}>
              <Card.Body className="d-flex flex-column align-items-center justify-content-center p-3">
                <div className={`rounded-circle bg-${summary.totalProfitLoss >= 0 ? 'success' : 'danger'} bg-opacity-10 d-flex align-items-center justify-content-center mb-2`} style={{ width: '48px', height: '48px' }}>
                  <i className={`fas fa-chart-line text-${summary.totalProfitLoss >= 0 ? 'success' : 'danger'}`} style={{ fontSize: '1.25rem' }}></i>
                </div>
                <h5 className={`fw-bold mb-1 text-${summary.totalProfitLoss >= 0 ? 'success' : 'danger'}`}>
                  {formatCurrency(summary.totalProfitLoss)}
                </h5>
                <span className="text-muted small">
                  Tổng lãi/lỗ ({summary.avgProfitMargin.toFixed(1)}%)
                </span>
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
          <Row className="mb-4 g-2 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted mb-1">Từ ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={fromDate}
                  onChange={(e) => setFromDate(e.target.value)}
                  className="shadow-none border-secondary-subtle"
                />
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted mb-1">Đến ngày</Form.Label>
                <Form.Control
                  type="date"
                  value={toDate}
                  onChange={(e) => setToDate(e.target.value)}
                  className="shadow-none border-secondary-subtle"
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label className="small fw-medium text-muted mb-1">Danh mục</Form.Label>
                <Form.Select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="shadow-none border-secondary-subtle"
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
              <Button 
                variant="primary" 
                onClick={handleFilter} 
                className="w-100 d-flex align-items-center justify-content-center shadow-sm"
                style={{ height: '38px' }}
              >
                <i className="fas fa-search me-2"></i> Lọc dữ liệu
              </Button>
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
                      <th className="text-nowrap">Mã lô hàng</th>
                      <th className="text-nowrap">Ngày nhập</th>
                      <th className="text-nowrap">Danh mục</th>
                      <th className="text-nowrap text-center">SL nhập</th>
                      <th className="text-nowrap text-center">SL bán</th>
                      <th className="text-nowrap text-center">SL tồn</th>
                      <th className="text-nowrap" style={{ minWidth: '120px' }}>Tỷ lệ bán</th>
                      <th className="text-nowrap text-end">Giá trị nhập</th>
                      <th className="text-nowrap text-end">Giá trị bán</th>
                      <th className="text-nowrap text-end">Lãi/Lỗ</th>
                      <th className="text-nowrap text-center">Tỷ lệ lãi</th>
                      <th className="text-nowrap text-center">Trạng thái</th>
                      <th className="text-nowrap text-center">Thao tác</th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.map((item, index) => (
                      <tr key={index} className="align-middle">
                        <td>
                          <Badge bg="light" text="primary" className="border border-primary-subtle px-2 py-1">
                            {item.BatchCode}
                          </Badge>
                        </td>
                        <td className="text-nowrap">{formatDate(item.ImportDate)}</td>
                        <td>
                          <Badge bg="info" className="fw-normal">{item.CategoryName}</Badge>
                        </td>
                        <td className="text-center">
                          <span className="fw-bold">{item.TotalQuantity}</span>
                        </td>
                        <td className="text-center">
                          <span className="text-success fw-medium">{item.TotalSoldQuantity}</span>
                        </td>
                        <td className="text-center">
                          <Badge bg={item.RemainingQuantity > 0 ? "warning" : "secondary"} text={item.RemainingQuantity > 0 ? "dark" : "white"}>
                            {item.RemainingQuantity}
                          </Badge>
                        </td>
                        <td>
                          <div className="progress shadow-sm" style={{ height: '16px', borderRadius: '8px' }}>
                            <div
                              className={`progress-bar ${getProgressBarColor(item.RemainingQuantity, item.TotalQuantity)}`}
                              style={{ 
                                width: `${((item.TotalQuantity - item.RemainingQuantity) / item.TotalQuantity) * 100}%`,
                                fontSize: '10px',
                                fontWeight: 'bold'
                              }}
                            >
                              {(((item.TotalQuantity - item.RemainingQuantity) / item.TotalQuantity) * 100).toFixed(0)}%
                            </div>
                          </div>
                        </td>
                        <td className="text-end text-nowrap">
                          <small className="fw-medium">{formatCurrency(item.TotalImportValue)}</small>
                        </td>
                        <td className="text-end text-nowrap">
                          <small className="text-success fw-bold">
                            {formatCurrency(item.TotalSoldValue)}
                          </small>
                        </td>
                        <td className="text-end text-nowrap">
                          <span className={`${getProfitLossColor(item.ProfitLoss)} fw-bold`}>
                            <small>{formatCurrency(item.ProfitLoss)}</small>
                          </span>
                        </td>
                        <td className="text-center">
                          <Badge bg={item.ProfitLoss >= 0 ? "success" : "danger"} className="bg-opacity-75">
                            {item.ProfitMarginPercent.toFixed(1)}%
                          </Badge>
                        </td>
                        <td className="text-center">{getStatusBadge(item.Status)}</td>
                        <td className="text-center align-middle">
                          {onViewBatchDetails && (
                            <Button
                              variant="outline-primary"
                              size="sm"
                              onClick={() => onViewBatchDetails(item.BatchCode)}
                              title="Xem chi tiết lô hàng"
                              className="d-inline-flex align-items-center justify-content-center text-nowrap px-3"
                              style={{ height: '32px' }}
                            >
                              <i className="fas fa-eye me-2"></i>Chi tiết
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
