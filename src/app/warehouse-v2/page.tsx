'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';
import RevenueChart from '@/components/warehouse-v2/RevenueChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { getClientTimezoneDebug } from '@/utils/clientTimezone';

// DashboardStats interface is now imported from the hook

interface Activity {
  id: string;
  type: 'SALE' | 'IMPORT' | 'BATCH_CREATE' | 'PRODUCT_ADD';
  title: string;
  description: string;
  amount?: number;
  timestamp: string;
  icon: string;
  color: string;
}



const WarehouseV2Dashboard: React.FC = () => {
  // Use custom hook for timezone-aware dashboard stats
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats, timezoneDebug } = useDashboardStats();

  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();

    // Log timezone debug info
    const clientDebug = getClientTimezoneDebug();
    console.log('Dashboard Client Timezone Debug:', clientDebug);

    // Log comparison when both client and server debug are available
    if (timezoneDebug) {
      console.log('Dashboard Timezone Comparison:', timezoneDebug);
    }
  }, [timezoneDebug]);

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);

      // Fetch recent activities
      const activitiesResponse = await fetch('/api/dashboard/activities?limit=10');
      const activitiesResult = await activitiesResponse.json();

      if (activitiesResult.success) {
        setRecentActivities(activitiesResult.data);
      }
    } catch (error) {
      console.error('Error fetching activities:', error);
    } finally {
      setActivitiesLoading(false);
    }
  };

  const fetchDashboardData = async () => {
    refetchStats();
    fetchRecentActivities();
  };

  const loading = statsLoading || activitiesLoading;

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    // Parse date string directly to avoid any timezone conversion
    // Database stores Vietnam time, display exactly as stored
    try {
      // Extract date and time parts from ISO string
      const isoString = dateString.includes('T') ? dateString : dateString + 'T00:00:00';
      const [datePart, timePart] = isoString.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds.split('.')[0]}`;
    } catch (error) {
      // Fallback to Date object if parsing fails
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');

      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds}`;
    }
  };



  if (loading) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <div className="mt-2">Đang tải dữ liệu...</div>
          {timezoneDebug && (
            <div className="mt-3">
              <small className="text-muted">
                Timezone: {timezoneDebug.client?.vietnamToday || 'Loading...'}
              </small>
            </div>
          )}
        </div>
      </Container>
    );
  }

  if (statsError) {
    return (
      <Container fluid className="py-4">
        <div className="text-center py-5">
          <div className="alert alert-danger">
            <i className="fas fa-exclamation-triangle me-2"></i>
            Lỗi tải dữ liệu: {statsError}
          </div>
          <Button variant="primary" onClick={fetchDashboardData}>
            <i className="fas fa-sync-alt me-1"></i>
            Thử lại
          </Button>
          {timezoneDebug && (
            <div className="mt-3">
              <details>
                <summary>Debug Info</summary>
                <pre className="text-start mt-2">
                  {JSON.stringify(timezoneDebug, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </Container>
    );
  }

  return (
    <Container fluid className="py-4">
      {/* Page Header */}
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="mb-1">
            <i className="fas fa-tachometer-alt text-primary me-2"></i>
            Trang chủ
          </h2>
       
        </div>
        <div className="d-flex gap-2">
          <Button variant="outline-primary" onClick={fetchDashboardData}>
            <i className="fas fa-sync-alt me-1"></i>
            Làm mới
          </Button>
          {timezoneDebug && (
            <Button
              variant="outline-secondary"
              size="sm"
              onClick={() => console.log('Timezone Debug:', timezoneDebug)}
              title="Click to log timezone debug info to console"
            >
              <i className="fas fa-clock me-1"></i>
              {timezoneDebug.client?.vietnamToday}
              {timezoneDebug.comparison?.match ? ' ✓' : ' ⚠️'}
            </Button>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      {stats && (
        <Row className="mb-4">
          <Col md={3}>
            <Card className="border-warning h-100" style={{ borderWidth: '3px' }}>
              <Card.Body className="text-center" style={{ padding: '2rem' }}>
                <i className="fas fa-chart-line fa-4x text-warning mb-4"></i>
                <h3 className="text-warning mb-3" style={{ fontSize: '2.2rem', fontWeight: '700' }}>
                  {formatCurrency(stats.revenue.today)}
                </h3>
                <p className="mb-2" style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50' }}>
                  Doanh thu hôm nay
                </p>
                <div style={{ fontSize: '1.1rem', color: '#5a6c7d' }}>
                  <div>Tháng: <strong>{formatCurrency(stats.revenue.thisMonth)}</strong></div>
                  {stats.revenue.growth !== 0 && (
                    <div className={`mt-1 ${stats.revenue.growth > 0 ? 'text-success' : 'text-danger'}`}
                         style={{ fontSize: '1.1rem', fontWeight: '600' }}>
                      {stats.revenue.growth > 0 ? '📈' : '📉'} {Math.abs(stats.revenue.growth)}%
                    </div>
                  )}
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-danger h-100" style={{ borderWidth: '3px' }}>
              <Card.Body className="text-center" style={{ padding: '2rem' }}>
                <i className={`fas fa-dollar-sign fa-4x ${stats.profit.today >= 0 ? 'text-success' : 'text-danger'} mb-4`}></i>
                <h3 className={`${stats.profit.today >= 0 ? 'text-success' : 'text-danger'} mb-3`}
                    style={{ fontSize: '2.2rem', fontWeight: '700' }}>
                  {formatCurrency(stats.profit.today)}
                </h3>
                <p className="mb-2" style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50' }}>
                  Lãi/Lỗ hôm nay
                </p>
                <div style={{ fontSize: '1.1rem', color: '#5a6c7d' }}>
                  <div>Tỷ lệ: <strong>{stats.profit.margin.toFixed(1)}%</strong></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-success h-100" style={{ borderWidth: '3px' }}>
              <Card.Body className="text-center" style={{ padding: '2rem' }}>
                <i className="fas fa-warehouse fa-4x text-success mb-4"></i>
                <h3 className="text-success mb-3" style={{ fontSize: '2.2rem', fontWeight: '700' }}>
                  {stats.inventory.totalProducts}
                </h3>
                <p className="mb-2" style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50' }}>
                  Tồn kho
                </p>
                <div style={{ fontSize: '1.1rem', color: '#5a6c7d' }}>
                  <div>SP có sẵn: <strong>{stats.inventory.inStock}</strong></div>
                  <div>Đã bán: <strong>{stats.inventory.sold}</strong></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
          <Col md={3}>
            <Card className="border-info h-100" style={{ borderWidth: '3px' }}>
              <Card.Body className="text-center" style={{ padding: '2rem' }}>
                <i className="fas fa-shopping-cart fa-4x text-info mb-4"></i>
                <h3 className="text-info mb-3" style={{ fontSize: '2.2rem', fontWeight: '700' }}>
                  {stats.sales.todayCount}
                </h3>
                <p className="mb-2" style={{ fontSize: '1.3rem', fontWeight: '600', color: '#2c3e50' }}>
                  Đơn hàng hôm nay
                </p>
                <div style={{ fontSize: '1.1rem', color: '#5a6c7d' }}>
                  <div>Tháng: <strong>{stats.sales.thisMonthCount}</strong></div>
                  <div>TB: <strong>{formatCurrency(stats.sales.avgOrderValue)}</strong></div>
                </div>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}

      <Row>
        {/* Quick Actions */}
        <Col md={8}>
          <Card className="mb-4">
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-bolt me-2"></i>
                Thao tác nhanh
              </h5>
            </Card.Header>
            <Card.Body>
              <Row>
                <Col md={4} className="mb-3">
                  <Link href="/warehouse-v2/import" className="text-decoration-none">
                    <Card className="border-primary h-100 hover-shadow">
                      <Card.Body className="text-center">
                        <i className="fas fa-arrow-down fa-2x text-primary mb-2"></i>
                        <h6 className="text-primary">Nhập hàng</h6>
                        <small className="text-muted">Tạo lô hàng mới</small>
                        <div className="mt-2">
                          <Badge bg="primary">Quản lý lô hàng</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4} className="mb-3">
                  <Link href="/warehouse-v2/sales" className="text-decoration-none">
                    <Card className="border-success h-100 hover-shadow">
                      <Card.Body className="text-center">
                        <i className="fas fa-shopping-cart fa-2x text-success mb-2"></i>
                        <h6 className="text-success">Bán hàng</h6>
                        <small className="text-muted">Bán sản phẩm có sẵn</small>
                        <div className="mt-2">
                          <Badge bg="success">{stats?.inventory.inStock || 0} có sẵn</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
                <Col md={4} className="mb-3">
                  <Link href="/warehouse-v2/inventory" className="text-decoration-none">
                    <Card className="border-info h-100 hover-shadow">
                      <Card.Body className="text-center">
                        <i className="fas fa-warehouse fa-2x text-info mb-2"></i>
                        <h6 className="text-info">Tồn kho</h6>
                        <small className="text-muted">Báo cáo tồn kho</small>
                        <div className="mt-2">
                          <Badge bg="info">{stats?.inventory.totalProducts || 0} sản phẩm</Badge>
                        </div>
                      </Card.Body>
                    </Card>
                  </Link>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>

        {/* Recent Activities */}
        <Col md={4}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">
                <i className="fas fa-history me-2"></i>
                Hoạt động gần đây
              </h5>
            </Card.Header>
            <Card.Body style={{ maxHeight: '260px', overflowY: 'auto' }}>
              {recentActivities.length > 0 ? (
                <div className="timeline">
                  {recentActivities.slice(0, 8).map((activity) => (
                    <div key={activity.id} className="timeline-item mb-3">
                      <div className="d-flex align-items-start">
                        <span className="me-2" style={{ fontSize: '1.2rem' }}>
                          {activity.icon}
                        </span>
                        <div className="flex-grow-1">
                          <div className="d-flex justify-content-between align-items-start">
                            <div>
                              <strong className="d-block">{activity.title}</strong>
                              <small className="text-muted">{activity.description}</small>
                              {activity.amount && (
                                <div className="mt-1">
                                  <Badge bg={activity.color} className="me-1">
                                    {formatCurrency(activity.amount)}
                                  </Badge>
                                </div>
                              )}
                            </div>
                            <small className="text-muted ms-2">
                              {formatDateTime(activity.timestamp)}
                            </small>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-3 text-muted">
                  <i className="fas fa-clock fa-2x mb-2"></i>
                  <div>Chưa có hoạt động nào</div>
                  <small>Hoạt động sẽ hiển thị khi có giao dịch</small>
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* Revenue Chart */}
      <Row className="mt-4">
        <Col md={12}>
          <RevenueChart />
        </Col>
      </Row>

      {/* System Info */}
      <Row className="mt-4">
        <Col md={12}>
          <Card className="bg-light">
            <Card.Body>
              <Row className="text-center">
                <Col md={3}>
                  <i className="fas fa-mobile-alt text-primary me-2"></i>
                  <strong>Quản lý theo IMEI</strong>
                  <div><small className="text-muted">Theo dõi từng sản phẩm cụ thể</small></div>
                </Col>
                <Col md={3}>
                  <i className="fas fa-boxes text-success me-2"></i>
                  <strong>Quản lý theo lô</strong>
                  <div><small className="text-muted">Tính toán lãi/lỗ theo lô hàng</small></div>
                </Col>
                <Col md={3}>
                  <i className="fas fa-chart-line text-warning me-2"></i>
                  <strong>Báo cáo real-time</strong>
                  <div><small className="text-muted">Thống kê tự động cập nhật</small></div>
                </Col>
                <Col md={3}>
                  <i className="fas fa-receipt text-info me-2"></i>
                  <strong>Hóa đơn tự động</strong>
                  <div><small className="text-muted">Tạo hóa đơn khi bán hàng</small></div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <style jsx>{`
        /* Global font size improvements */
        .container-fluid {
          font-size: 16px;
        }

        /* Headers */
        h1, h2 {
          font-size: 2.2rem !important;
          font-weight: 600 !important;
          color: #1a1a1a !important;
        }

        h3 {
          font-size: 2rem !important;
          font-weight: 600 !important;
        }

        h4 {
          font-size: 1.8rem !important;
          font-weight: 600 !important;
        }

        h5 {
          font-size: 1.4rem !important;
          font-weight: 600 !important;
          color: #2c3e50 !important;
        }

        h6 {
          font-size: 1.2rem !important;
          font-weight: 600 !important;
          color: #34495e !important;
        }

        /* Card text */
        .card-body p {
          font-size: 1.1rem !important;
          color: #2c3e50 !important;
          margin-bottom: 0.75rem !important;
        }

        .card-body small {
          font-size: 1rem !important;
          color: #5a6c7d !important;
        }

        /* Table improvements */
        .table {
          font-size: 1.1rem !important;
        }

        .table th {
          font-size: 1.2rem !important;
          font-weight: 600 !important;
          color: #2c3e50 !important;
          background-color: #f8f9fa !important;
        }

        .table td {
          font-size: 1.1rem !important;
          color: #34495e !important;
          padding: 1rem 0.75rem !important;
        }

        /* Button improvements */
        .btn {
          font-size: 1.1rem !important;
          font-weight: 500 !important;
          padding: 0.75rem 1.5rem !important;
        }

        .btn-sm {
          font-size: 1rem !important;
          padding: 0.5rem 1rem !important;
        }

        /* Badge improvements */
        .badge {
          font-size: 0.95rem !important;
          font-weight: 500 !important;
          padding: 0.5rem 0.75rem !important;
        }

        /* Text colors */
        .text-muted {
          color: #6c757d !important;
          font-size: 1rem !important;
        }

        .text-primary {
          color: #0066cc !important;
        }

        .text-success {
          color: #28a745 !important;
        }

        .text-warning {
          color: #ffc107 !important;
        }

        .text-danger {
          color: #dc3545 !important;
        }

        .text-info {
          color: #17a2b8 !important;
        }

        /* Card improvements */
        .card {
          box-shadow: 0 2px 8px rgba(0,0,0,0.1) !important;
          border: 1px solid #e3e6f0 !important;
        }

        .card-header {
          background-color: #f8f9fc !important;
          border-bottom: 1px solid #e3e6f0 !important;
          font-weight: 600 !important;
        }

        /* Hover effects */
        .hover-shadow:hover {
          box-shadow: 0 6px 16px rgba(0,0,0,0.15) !important;
          transform: translateY(-3px);
          transition: all 0.3s ease;
        }

        /* Timeline improvements */
        .timeline-item {
          border-left: 3px solid #e9ecef;
          padding-left: 1.25rem;
          position: relative;
          margin-bottom: 1.5rem;
        }

        .timeline-item:before {
          content: '';
          position: absolute;
          left: -6px;
          top: 8px;
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background: #6c757d;
        }

        .timeline-item .d-block {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: #2c3e50 !important;
        }

        .timeline-item small {
          font-size: 1rem !important;
          color: #5a6c7d !important;
        }

        /* Form improvements */
        .form-control {
          font-size: 1.1rem !important;
          padding: 0.75rem !important;
          border: 2px solid #e3e6f0 !important;
        }

        .form-control:focus {
          border-color: #0066cc !important;
          box-shadow: 0 0 0 0.2rem rgba(0, 102, 204, 0.25) !important;
        }

        .form-label {
          font-size: 1.1rem !important;
          font-weight: 600 !important;
          color: #2c3e50 !important;
        }

        /* Alert improvements */
        .alert {
          font-size: 1.1rem !important;
          padding: 1rem 1.25rem !important;
        }

        /* Loading spinner */
        .spinner-border {
          width: 3rem !important;
          height: 3rem !important;
        }

        /* Code elements */
        code {
          font-size: 1rem !important;
          color: #e83e8c !important;
          background-color: #f8f9fa !important;
          padding: 0.25rem 0.5rem !important;
          border-radius: 0.25rem !important;
        }
      `}</style>


    </Container>
  );
};

export default WarehouseV2Dashboard;
