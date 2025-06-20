'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Alert, Table, Badge, Breadcrumb } from 'react-bootstrap';
import { useToast } from '@/contexts/ToastContext';

interface StatusCheck {
  BatchID: number;
  BatchCode: string;
  TotalQuantity: number;
  TotalSoldQuantity: number;
  RemainingQuantity: number;
  Status: string;
  ExpectedStatus: string;
}

interface MigrationData {
  triggerExists: boolean;
  statusDistribution: Array<{ Status: string; Count: number }>;
  mismatches: StatusCheck[];
  needsMigration: boolean;
  summary: {
    totalMismatches: number;
    batchesNeedingCompletion: number;
  };
}

const MigrateBatchStatusPage: React.FC = () => {
  const { showSuccess, showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(true);
  const [migrationData, setMigrationData] = useState<MigrationData | null>(null);
  const [migrationResult, setMigrationResult] = useState<any>(null);

  useEffect(() => {
    checkCurrentStatus();
  }, []);

  const checkCurrentStatus = async () => {
    try {
      setChecking(true);
      const response = await fetch('/api/admin/migrate-batch-status');
      const result = await response.json();

      if (result.success) {
        setMigrationData(result.data);
      } else {
        showError('Lỗi kiểm tra trạng thái', result.error);
      }
    } catch (error) {
      console.error('Error checking status:', error);
      showError('Lỗi kết nối', 'Không thể kiểm tra trạng thái hiện tại');
    } finally {
      setChecking(false);
    }
  };

  const runMigration = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/migrate-batch-status', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (result.success) {
        setMigrationResult(result.data);
        showSuccess('Migration thành công!', 'Đã cập nhật trigger và status của các lô hàng');
        // Refresh status after migration
        await checkCurrentStatus();
      } else {
        showError('Migration thất bại', result.error);
      }
    } catch (error) {
      console.error('Migration error:', error);
      showError('Lỗi migration', 'Không thể chạy migration');
    } finally {
      setLoading(false);
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

  if (checking) {
    return (
      <Container fluid>
        <div className="text-center py-4">
          <div className="spinner-border" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Đang kiểm tra trạng thái...</p>
        </div>
      </Container>
    );
  }

  return (
    <Container fluid>
      <Row>
        <Col>
          {/* Breadcrumb */}
          <Breadcrumb className="mb-3">
            <Breadcrumb.Item href="/warehouse-v2">Trang chủ</Breadcrumb.Item>
            <Breadcrumb.Item active>Migration Batch Status</Breadcrumb.Item>
          </Breadcrumb>

          {/* Page Header */}
          <div className="d-flex justify-content-between align-items-center mb-4">
            <h2 className="mb-0">
              <span className="me-2">🔧</span>
              Migration: Batch Status Auto-Update
            </h2>
            <Button
              variant="outline-primary"
              onClick={checkCurrentStatus}
              disabled={checking}
            >
              <span className="me-1">🔄</span>
              Refresh
            </Button>
          </div>

          {/* Current Status */}
          {migrationData && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <span className="me-2">📊</span>
                  Trạng thái hiện tại
                </h5>
              </Card.Header>
              <Card.Body>
                <Row className="mb-3">
                  <Col md={6}>
                    <p><strong>Trigger tồn tại:</strong> {migrationData.triggerExists ? '✅ Có' : '❌ Không'}</p>
                    <p><strong>Cần migration:</strong> {migrationData.needsMigration ? '⚠️ Có' : '✅ Không'}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Tổng lô không khớp:</strong> {migrationData.summary.totalMismatches}</p>
                    <p><strong>Lô cần hoàn thành:</strong> {migrationData.summary.batchesNeedingCompletion}</p>
                  </Col>
                </Row>

                {/* Status Distribution */}
                <h6>Phân bố trạng thái:</h6>
                <Row>
                  {migrationData.statusDistribution.map((status, index) => (
                    <Col md={3} key={index} className="mb-2">
                      <div className="d-flex justify-content-between align-items-center">
                        {getStatusBadge(status.Status)}
                        <span className="fw-bold">{status.Count}</span>
                      </div>
                    </Col>
                  ))}
                </Row>
              </Card.Body>
            </Card>
          )}

          {/* Migration Action */}
          {migrationData?.needsMigration && (
            <Card className="mb-4">
              <Card.Header className="bg-warning">
                <h5 className="mb-0">
                  <span className="me-2">⚠️</span>
                  Cần Migration
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="warning">
                  <strong>Phát hiện vấn đề:</strong> Có {migrationData.summary.totalMismatches} lô hàng 
                  có trạng thái không khớp với số lượng đã bán. Trong đó có {migrationData.summary.batchesNeedingCompletion} lô 
                  đã bán hết nhưng chưa được đánh dấu "Hoàn thành".
                </Alert>
                
                <div className="d-flex gap-2">
                  <Button
                    variant="warning"
                    onClick={runMigration}
                    disabled={loading}
                    size="lg"
                  >
                    {loading ? (
                      <>
                        <span className="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>
                        Đang chạy migration...
                      </>
                    ) : (
                      <>
                        <span className="me-1">🚀</span>
                        Chạy Migration
                      </>
                    )}
                  </Button>
                </div>
              </Card.Body>
            </Card>
          )}

          {/* Migration Success */}
          {!migrationData?.needsMigration && (
            <Card className="mb-4">
              <Card.Header className="bg-success text-white">
                <h5 className="mb-0">
                  <span className="me-2">✅</span>
                  Hệ thống đã cập nhật
                </h5>
              </Card.Header>
              <Card.Body>
                <Alert variant="success">
                  <strong>Tuyệt vời!</strong> Trigger đã được cập nhật và tất cả lô hàng có trạng thái chính xác. 
                  Hệ thống sẽ tự động cập nhật Status thành "Hoàn thành" khi remainingQuantity = 0.
                </Alert>
              </Card.Body>
            </Card>
          )}

          {/* Mismatches Table */}
          {migrationData?.mismatches && migrationData.mismatches.length > 0 && (
            <Card className="mb-4">
              <Card.Header>
                <h5 className="mb-0">
                  <span className="me-2">📋</span>
                  Lô hàng cần cập nhật ({migrationData.mismatches.length})
                </h5>
              </Card.Header>
              <Card.Body>
                <Table responsive striped hover>
                  <thead>
                    <tr>
                      <th>Mã lô</th>
                      <th>Tổng SL</th>
                      <th>Đã bán</th>
                      <th>Còn lại</th>
                      <th>Trạng thái hiện tại</th>
                      <th>Trạng thái đúng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {migrationData.mismatches.slice(0, 10).map((batch) => (
                      <tr key={batch.BatchID}>
                        <td><code>{batch.BatchCode}</code></td>
                        <td>{batch.TotalQuantity}</td>
                        <td>{batch.TotalSoldQuantity}</td>
                        <td>
                          <span className={batch.RemainingQuantity === 0 ? 'text-success fw-bold' : ''}>
                            {batch.RemainingQuantity}
                          </span>
                        </td>
                        <td>{getStatusBadge(batch.Status)}</td>
                        <td>{getStatusBadge(batch.ExpectedStatus)}</td>
                      </tr>
                    ))}
                  </tbody>
                </Table>
                {migrationData.mismatches.length > 10 && (
                  <p className="text-muted">Hiển thị 10/{migrationData.mismatches.length} lô hàng cần cập nhật</p>
                )}
              </Card.Body>
            </Card>
          )}

          {/* Migration Result */}
          {migrationResult && (
            <Card className="mb-4">
              <Card.Header className="bg-info text-white">
                <h5 className="mb-0">
                  <span className="me-2">📊</span>
                  Kết quả Migration
                </h5>
              </Card.Header>
              <Card.Body>
                <Row>
                  <Col md={6}>
                    <p><strong>Trigger đã cập nhật:</strong> ✅</p>
                    <p><strong>Tổng lô hàng:</strong> {migrationResult.summary.totalBatches}</p>
                    <p><strong>Lô hoàn thành:</strong> {migrationResult.summary.completedBatches}</p>
                  </Col>
                  <Col md={6}>
                    <p><strong>Lô đang hoạt động:</strong> {migrationResult.summary.activeBatches}</p>
                    <p><strong>Status chính xác:</strong> {migrationResult.summary.correctStatuses}</p>
                  </Col>
                </Row>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
};

export default MigrateBatchStatusPage;
