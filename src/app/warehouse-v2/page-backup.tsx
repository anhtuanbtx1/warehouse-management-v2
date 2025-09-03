'use client';

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Badge } from 'react-bootstrap';
import Link from 'next/link';
import RevenueChart from '@/components/warehouse-v2/RevenueChart';
import { useDashboardStats } from '@/hooks/useDashboardStats';
import { getClientTimezoneDebug } from '@/utils/clientTimezone';
import styles from './dashboard.module.css';

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
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats, timezoneDebug } = useDashboardStats();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  useEffect(() => {
    fetchRecentActivities();
    const clientDebug = getClientTimezoneDebug();
    console.log('Dashboard Client Timezone Debug:', clientDebug);
    if (timezoneDebug) {
      console.log('Dashboard Timezone Comparison:', timezoneDebug);
    }
  }, [timezoneDebug]);

  const fetchRecentActivities = async () => {
    try {
      setActivitiesLoading(true);
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
    try {
      const isoString = dateString.includes('T') ? dateString : dateString + 'T00:00:00';
      const [datePart, timePart] = isoString.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds.split('.')[0];
    } catch (error) {
      const date = new Date(dateString);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return day + '/' + month + '/' + year + ' ' + hours + ':' + minutes + ':' + seconds;
    }
  };

  if (loading) {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải dữ liệu...</div>
          {timezoneDebug && (
            <div className="mt-3">
              <small style={{color: 'rgba(255,255,255,0.8)'}}>
                Timezone: {timezoneDebug.client?.vietnamToday || 'Loading...'}
              </small>
            </div>
          )}
        </div>
      </div>
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
        </div>
      </Container>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Container fluid className={styles.contentWrapper}>
        {/* Page Header */}
        <div className={styles.pageHeader}>
          <div className="d-flex justify-content-between align-items-center">
            <div>
              <h1 className={styles.pageTitle}>
                <i className="fas fa-rocket"></i>
                Dashboard Quản Lý Kho Hàng
              </h1>
              <p className={styles.pageSubtitle}>
                Xin chào! Hôm nay là {timezoneDebug?.client?.vietnamToday || new Date().toLocaleDateString('vi-VN')}
              </p>
            </div>
            <div className="d-flex gap-2">
              <Button 
                style={{
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  border: 'none',
                  borderRadius: '12px',
                  padding: '0.75rem 1.5rem',
                  fontWeight: '600'
                }}
                onClick={fetchDashboardData}
              >
                <i className="fas fa-sync-alt me-2"></i>
                Làm mới dữ liệu
              </Button>
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        {stats && (
          <Row className="mb-4">
            <Col md={3} className="mb-3">
              <div className={styles.statsCard + ' ' + styles.statsCardRevenue}>
                <div className={styles.statsIconWrapper}>
                  <i className={'fas fa-chart-line ' + styles.statsIcon}></i>
                </div>
                <h3 className={styles.statsValue}>
                  {formatCurrency(stats.revenue.today)}
                </h3>
                <p className={styles.statsLabel}>
                  Doanh thu hôm nay
                </p>
                <div className={styles.statsDetails}>
                  <div className={styles.statsDetailsRow}>
                    <span>Tháng này:</span>
                    <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                  </div>
                  {stats.revenue.growth !== 0 && (
                    <div className={styles.statsGrowth}>
                      {stats.revenue.growth > 0 ? '↑' : '↓'}
                      {Math.abs(stats.revenue.growth)}%
                    </div>
                  )}
                </div>
              </div>
            </Col>
            <Col md={3} className="mb-3">
              <div className={styles.statsCard + ' ' + styles.statsCardProfit}>
                <div className={styles.statsIconWrapper}>
                  <i className={'fas fa-dollar-sign ' + styles.statsIcon}></i>
                </div>
                <h3 className={styles.statsValue}>
                  {formatCurrency(stats.profit.today)}
                </h3>
                <p className={styles.statsLabel}>
                  Lãi/Lỗ hôm nay
                </p>
                <div className={styles.statsDetails}>
                  <div className={styles.statsDetailsRow}>
                    <span>Tỷ suất lợi nhuận:</span>
                    <strong>{stats.profit.margin.toFixed(1)}%</strong>
                  </div>
                  <div className={styles.statsGrowth}>
                    {stats.profit.today >= 0 ? '↑' : '↓'}
                    {stats.profit.today >= 0 ? 'Lãi' : 'Lỗ'}
                  </div>
                </div>
              </div>
            </Col>
            <Col md={3} className="mb-3">
              <div className={styles.statsCard + ' ' + styles.statsCardInventory}>
                <div className={styles.statsIconWrapper}>
                  <i className={'fas fa-warehouse ' + styles.statsIcon}></i>
                </div>
                <h3 className={styles.statsValue}>
                  {stats.inventory.totalProducts}
                </h3>
                <p className={styles.statsLabel}>
                  Tổng sản phẩm
                </p>
                <div className={styles.statsDetails}>
                  <div className={styles.statsDetailsRow}>
                    <span>Có sẵn:</span>
                    <strong>{stats.inventory.inStock}</strong>
                  </div>
                  <div className={styles.statsDetailsRow}>
                    <span>Đã bán:</span>
                    <strong>{stats.inventory.sold}</strong>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={3} className="mb-3">
              <div className={styles.statsCard + ' ' + styles.statsCardOrders}>
                <div className={styles.statsIconWrapper}>
                  <i className={'fas fa-shopping-cart ' + styles.statsIcon}></i>
                </div>
                <h3 className={styles.statsValue}>
                  {stats.sales.todayCount}
                </h3>
                <p className={styles.statsLabel}>
                  Đơn hàng hôm nay
                </p>
                <div className={styles.statsDetails}>
                  <div className={styles.statsDetailsRow}>
                    <span>Tháng này:</span>
                    <strong>{stats.sales.thisMonthCount}</strong>
                  </div>
                  <div className={styles.statsDetailsRow}>
                    <span>Giá trị TB:</span>
                    <strong>{formatCurrency(stats.sales.avgOrderValue)}</strong>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        )}

        <Row>
          {/* Quick Actions */}
          <Col md={8}>
            <div className={styles.quickActionsCard}>
              <div className={styles.quickActionsHeader}>
                <h5 className={styles.quickActionsTitle}>
                  <i className="fas fa-bolt"></i>
                  Thao tác nhanh
                </h5>
              </div>
              <div style={{ padding: '1.5rem' }}>
                <Row>
                  <Col md={4} className="mb-3">
                    <Link href="/warehouse-v2/import" className="text-decoration-none">
                      <div className={styles.quickActionItem}>
                        <div className={styles.actionIcon}>
                          <i className="fas fa-download"></i>
                        </div>
                        <h6 className={styles.actionTitle}>Nhập hàng</h6>
                        <p className={styles.actionDescription}>Tạo lô hàng mới</p>
                        <span className={styles.actionBadge}>Quản lý lô hàng</span>
                      </div>
                    </Link>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Link href="/warehouse-v2/sales" className="text-decoration-none">
                      <div className={styles.quickActionItem}>
                        <div className={styles.actionIcon}>
                          <i className="fas fa-shopping-cart"></i>
                        </div>
                        <h6 className={styles.actionTitle}>Bán hàng</h6>
                        <p className={styles.actionDescription}>Bán sản phẩm có sẵn</p>
                        <span className={styles.actionBadge}>
                          {stats?.inventory.inStock || 0} có sẵn
                        </span>
                      </div>
                    </Link>
                  </Col>
                  <Col md={4} className="mb-3">
                    <Link href="/warehouse-v2/inventory" className="text-decoration-none">
                      <div className={styles.quickActionItem}>
                        <div className={styles.actionIcon}>
                          <i className="fas fa-warehouse"></i>
                        </div>
                        <h6 className={styles.actionTitle}>Tồn kho</h6>
                        <p className={styles.actionDescription}>Báo cáo tồn kho</p>
                        <span className={styles.actionBadge}>
                          {stats?.inventory.totalProducts || 0} sản phẩm
                        </span>
                      </div>
                    </Link>
                  </Col>
                </Row>
              </div>
            </div>
          </Col>

          {/* Recent Activities */}
          <Col md={4}>
            <div className={styles.activitiesCard}>
              <div className={styles.activitiesHeader}>
                <h5 className={styles.activitiesTitle}>
                  <i className="fas fa-history"></i>
                  Hoạt động gần đây
                </h5>
              </div>
              <div className={styles.activitiesBody}>
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
                  <div className={styles.emptyState}>
                    <i className={'fas fa-clock ' + styles.emptyIcon}></i>
                    <div className={styles.emptyTitle}>Chưa có hoạt động nào</div>
                    <p className={styles.emptyDescription}>
                      Hoạt động sẽ hiển thị khi có giao dịch
                    </p>
                  </div>
                )}
              </div>
            </div>
          </Col>
        </Row>

        {/* Revenue Chart */}
        <Row className="mt-4">
          <Col md={12}>
            <div className={styles.chartContainer}>
              <RevenueChart />
            </div>
          </Col>
        </Row>

        {/* System Info */}
        <Row className="mt-4">
          <Col md={12}>
            <div className={styles.systemInfoCard}>
              <Row className="text-center">
                <Col md={3}>
                  <div className={styles.systemInfoItem}>
                    <i className={styles.systemInfoIcon + ' fas fa-mobile-alt'}></i>
                    <h6 className={styles.systemInfoTitle}>Quản lý theo IMEI</h6>
                    <p className={styles.systemInfoDesc}>
                      Theo dõi từng sản phẩm cụ thể
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className={styles.systemInfoItem}>
                    <i className={styles.systemInfoIcon + ' fas fa-boxes'}></i>
                    <h6 className={styles.systemInfoTitle}>Quản lý theo lô</h6>
                    <p className={styles.systemInfoDesc}>
                      Tính toán lãi/lỗ theo lô hàng
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className={styles.systemInfoItem}>
                    <i className={styles.systemInfoIcon + ' fas fa-chart-line'}></i>
                    <h6 className={styles.systemInfoTitle}>Báo cáo real-time</h6>
                    <p className={styles.systemInfoDesc}>
                      Thống kê tự động cập nhật
                    </p>
                  </div>
                </Col>
                <Col md={3}>
                  <div className={styles.systemInfoItem}>
                    <i className={styles.systemInfoIcon + ' fas fa-receipt'}></i>
                    <h6 className={styles.systemInfoTitle}>Hóa đơn tự động</h6>
                    <p className={styles.systemInfoDesc}>
                      Tạo hóa đơn khi bán hàng
                    </p>
                  </div>
                </Col>
              </Row>
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default WarehouseV2Dashboard;
