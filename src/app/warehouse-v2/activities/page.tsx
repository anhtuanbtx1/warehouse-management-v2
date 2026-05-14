'use client';

import React, { useCallback, useEffect, useState } from 'react';
import { Badge, Breadcrumb, Button, Card, Col, Container, Form, Pagination, Row, Table } from 'react-bootstrap';

interface ProductActivityLog {
  LogID: number;
  ProductID?: number;
  ProductName?: string;
  IMEI?: string;
  ActionType: 'SELL' | 'UPDATE' | 'DELETE' | 'IMPORT';
  Description?: string;
  Amount?: number;
  PerformedBy?: string;
  PerformedAt: string;
}

const actionLabels: Record<string, { label: string; variant: string; icon: string }> = {
  SELL: { label: 'Bán hàng', variant: 'success', icon: 'fa-cart-shopping' },
  UPDATE: { label: 'Cập nhật', variant: 'warning', icon: 'fa-pen-to-square' },
  DELETE: { label: 'Xóa', variant: 'danger', icon: 'fa-trash' },
  IMPORT: { label: 'Nhập hàng', variant: 'primary', icon: 'fa-file-import' },
};

const ProductActivitiesPage = () => {
  const [logs, setLogs] = useState<ProductActivityLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionType, setActionType] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchLogs = useCallback(async (page: number = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '10',
        ...(actionType && { actionType }),
      });
      const response = await fetch(`/api/product-activities?${params}`);
      const result = await response.json();
      if (result.success) {
        setLogs(result.data.data || []);
        setCurrentPage(result.data.page || 1);
        setTotalPages(result.data.totalPages || 1);
      } else {
        setLogs([]);
        setCurrentPage(1);
        setTotalPages(1);
      }
    } catch (error) {
      console.error('Error fetching product activities:', error);
      setLogs([]);
      setCurrentPage(1);
      setTotalPages(1);
    } finally {
      setLoading(false);
    }
  }, [actionType]);

  useEffect(() => {
    fetchLogs(1);
  }, [fetchLogs]);

  const formatDateTime = (value: string) => {
    return new Date(value).toLocaleString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      hour12: false,
    });
  };

  const formatCurrency = (amount?: number) => {
    if (typeof amount !== 'number') return '-';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  };

  return (
    <Container fluid className="py-4">
      <Row>
        <Col>
          <Breadcrumb>
            <Breadcrumb.Item href="/warehouse-v2">Quản lý kho V2</Breadcrumb.Item>
            <Breadcrumb.Item active>Hoạt động</Breadcrumb.Item>
          </Breadcrumb>

          <Card>
            <Card.Header className="d-flex justify-content-between align-items-center flex-wrap gap-2">
              <h5 className="mb-0">
                <i className="fas fa-clock-rotate-left me-2 text-primary" aria-hidden="true"></i>
                Nhật ký hoạt động sản phẩm
              </h5>
              <div className="d-flex gap-2">
                <Form.Select value={actionType} onChange={(e) => setActionType(e.target.value)} style={{ minWidth: 180 }}>
                  <option value="">Tất cả hành động</option>
                  <option value="SELL">Bán hàng</option>
                  <option value="UPDATE">Cập nhật</option>
                  <option value="DELETE">Xóa</option>
                  <option value="IMPORT">Nhập hàng</option>
                </Form.Select>
                <Button variant="outline-secondary" onClick={() => setActionType('')} title="Đặt lại">
                  <i className="fas fa-rotate-left" aria-hidden="true"></i>
                </Button>
              </div>
            </Card.Header>
            <Card.Body>
              {loading ? (
                <div className="text-center py-4">
                  <div className="spinner-border" role="status">
                    <span className="visually-hidden">Loading...</span>
                  </div>
                </div>
              ) : logs.length === 0 ? (
                <div className="warehouse-empty-state">
                  <i className="fas fa-clipboard-list"></i>
                  <div>Chưa có hoạt động phù hợp.</div>
                </div>
              ) : (
                <>
                  <Table responsive striped hover>
                    <thead>
                      <tr>
                        <th>Thời gian</th>
                        <th>Hành động</th>
                        <th>Sản phẩm</th>
                        <th>IMEI</th>
                        <th>Nội dung</th>
                        <th className="text-end">Số tiền</th>
                        <th>Người thực hiện</th>
                      </tr>
                    </thead>
                    <tbody>
                      {logs.map((log) => {
                        const meta = actionLabels[log.ActionType] || { label: log.ActionType, variant: 'secondary', icon: 'fa-circle-info' };
                        return (
                          <tr key={log.LogID} className="align-middle">
                            <td className="text-nowrap">{formatDateTime(log.PerformedAt)}</td>
                            <td>
                              <Badge bg={meta.variant} className="d-inline-flex align-items-center gap-1">
                                <i className={`fas ${meta.icon}`} aria-hidden="true"></i>
                                {meta.label}
                              </Badge>
                            </td>
                            <td>{log.ProductName || '-'}</td>
                            <td><code>{log.IMEI || '-'}</code></td>
                            <td>{log.Description || '-'}</td>
                            <td className="text-end text-nowrap">{formatCurrency(log.Amount)}</td>
                            <td>{log.PerformedBy || 'system'}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </Table>

                  <div className="d-flex flex-column align-items-center gap-2 mt-3">
                    <div className="small text-muted">Trang <strong>{currentPage}</strong> / <strong>{totalPages || 1}</strong></div>
                    {totalPages > 1 && (
                      <Pagination className="mb-0">
                        <Pagination.Prev disabled={currentPage === 1} onClick={() => fetchLogs(currentPage - 1)} />
                        {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                          <Pagination.Item key={page} active={page === currentPage} onClick={() => fetchLogs(page)}>
                            {page}
                          </Pagination.Item>
                        ))}
                        <Pagination.Next disabled={currentPage === totalPages} onClick={() => fetchLogs(currentPage + 1)} />
                      </Pagination>
                    )}
                  </div>
                </>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default ProductActivitiesPage;
