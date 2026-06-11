'use client';

import React, { useEffect, useState } from 'react';
import { Container, Row, Col, Button } from 'react-bootstrap';
import Link from 'next/link';
import RevenueChart from '@/components/warehouse-v2/RevenueChart';
import CategoryRevenueChart from '@/components/warehouse-v2/CategoryRevenueChart';
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

const quickActions = [
  {
    href: '/warehouse-v2/import',
    title: 'Nhập hàng',
    description: 'Tạo lô hàng mới và cập nhật số lượng kho nhanh chóng.',
    icon: 'fas fa-plus-square',
  },
  {
    href: '/warehouse-v2/sales',
    title: 'Bán hàng',
    description: 'Xử lý giao dịch và in hóa đơn cho khách hàng.',
    icon: 'fas fa-shopping-cart',
  },
  {
    href: '/warehouse-v2/inventory',
    title: 'Tồn kho',
    description: 'Tra cứu trạng thái máy và vị trí lưu kho theo IMEI.',
    icon: 'fas fa-boxes-stacked',
  },
];

const WarehouseV2Dashboard: React.FC = () => {
  const { stats, loading: statsLoading, error: statsError, refetch: refetchStats, timezoneDebug } = useDashboardStats();
  const [recentActivities, setRecentActivities] = useState<Activity[]>([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
    fetchRecentActivities();
  }, []);

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
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return new Intl.DateTimeFormat('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      }).format(date);
    } catch (error) {
      return dateString;
    }
  };

  if (loading && !isMounted) {
    return (
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tổng hợp dữ liệu...</div>
        </div>
      </div>
    );
  }

  if (statsError) {
    return (
      <Container fluid className="py-5">
        <div className="text-center">
          <div className="alert alert-danger d-inline-block px-4">
            <i className="fas fa-exclamation-triangle me-2"></i>
            {statsError}
          </div>
          <div className="mt-3">
            <Button variant="outline-primary" onClick={fetchDashboardData}>
              Thử lại
            </Button>
          </div>
        </div>
      </Container>
    );
  }

  return (
    <div className={`${styles.dashboardContainer} ${isMounted ? 'fade-in' : 'opacity-0'}`}>
      <Container fluid className={styles.contentWrapper}>
        <section className={styles.pageHeader}>
          <div className="d-flex justify-content-between align-items-end">
            <div>
              <h1 className={styles.pageTitle}>Tổng quan vận hành</h1>
              <p className={styles.pageSubtitle}>
                Hôm nay là {timezoneDebug?.client?.vietnamToday || new Date().toLocaleDateString('vi-VN')}. 
                Kiểm soát luồng hàng và hiệu quả kinh doanh trong thời gian thực.
              </p>
            </div>
            <div className="d-none d-md-block">
              <Button 
                variant="outline-secondary" 
                size="sm"
                className="border-0"
                onClick={fetchDashboardData}
              >
                <i className={`fas fa-sync-alt me-2 ${loading ? 'fa-spin' : ''}`}></i>
                Làm mới
              </Button>
            </div>
          </div>
        </section>

        {stats && (
          <Row className="g-3 mb-2">
            <Col md={6} xl={3}>
              <div className={styles.statsCard}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-coins"></i></span>
                  <span className={styles.statsTrend}>Hôm nay</span>
                </div>
                <p className={styles.statsLabel}>Doanh thu</p>
                <h3 className={styles.statsValue}>{formatCurrency(stats.revenue.today)}</h3>
                <div className={styles.statsMeta}>
                  <span>Tháng này</span>
                  <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                </div>
                {stats.revenue.growth !== 0 && (
                  <div className={`${styles.statsGrowth} ${stats.revenue.growth > 0 ? styles.positive : styles.negative}`}>
                    <i className={`fas ${stats.revenue.growth > 0 ? 'fa-caret-up' : 'fa-caret-down'}`}></i>
                    {Math.abs(stats.revenue.growth)}% so với hôm qua
                  </div>
                )}
              </div>
            </Col>
            <Col md={6} xl={3}>
              <div className={styles.statsCard}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-chart-line"></i></span>
                  <span className={styles.statsTrend}>Lợi nhuận</span>
                </div>
                <p className={styles.statsLabel}>Lãi ròng hôm nay</p>
                <h3 className={styles.statsValue}>{formatCurrency(stats.profit.today)}</h3>
                <div className={styles.statsMeta}>
                  <span>Biên lợi nhuận</span>
                  <strong>{stats.profit.margin.toFixed(1)}%</strong>
                </div>
                <div className={styles.statsGrowth}>
                   {stats.profit.today >= 0 ? (
                     <span className="text-success"><i className="fas fa-check-circle me-1"></i>Vận hành ổn định</span>
                   ) : (
                     <span className="text-danger"><i className="fas fa-exclamation-circle me-1"></i>Cần tối ưu chi phí</span>
                   )}
                </div>
              </div>
            </Col>
            <Col md={6} xl={3}>
              <div className={styles.statsCard}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-box"></i></span>
                  <span className={styles.statsTrend}>Kho hàng</span>
                </div>
                <p className={styles.statsLabel}>Tổng sản phẩm</p>
                <h3 className={styles.statsValue}>{stats.inventory.totalProducts}</h3>
                <div className={styles.statsSplit}>
                  <div>
                    <span>Trong kho</span>
                    <strong>{stats.inventory.inStock}</strong>
                  </div>
                  <div>
                    <span>Đã bán</span>
                    <strong>{stats.inventory.sold}</strong>
                  </div>
                </div>
              </div>
            </Col>
            <Col md={6} xl={3}>
              <div className={styles.statsCard}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-receipt"></i></span>
                  <span className={styles.statsTrend}>Giao dịch</span>
                </div>
                <p className={styles.statsLabel}>Đơn hàng mới</p>
                <h3 className={styles.statsValue}>{stats.sales.todayCount}</h3>
                <div className={styles.statsSplit}>
                  <div>
                    <span>Tháng này</span>
                    <strong>{stats.sales.thisMonthCount}</strong>
                  </div>
                  <div>
                    <span>Giá trị TB</span>
                    <strong>{formatCurrency(stats.sales.avgOrderValue)}</strong>
                  </div>
                </div>
              </div>
            </Col>
          </Row>
        )}

        <Row className="g-4">
          <Col xl={8}>
            {/* Quick Actions as a clean horizontal bar or grid */}
            <div className={styles.quickActionsCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Thao tác nhanh</h5>
                  <p>Truy cập nhanh các luồng nghiệp vụ lõi của hệ thống.</p>
                </div>
              </div>
              <Row className="g-3">
                {quickActions.map((action) => (
                  <Col md={4} key={action.href}>
                    <Link href={action.href} className="text-decoration-none d-block">
                      <div className={styles.quickActionItem}>
                        <span className={styles.actionIcon}><i className={action.icon}></i></span>
                        <h6 className={styles.actionTitle}>{action.title}</h6>
                        <p className={styles.actionDescription}>{action.description}</p>
                        <span className={styles.actionLink}>Bắt đầu</span>
                      </div>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>

            <div className={`${styles.chartContainer} mt-4`}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Biểu đồ doanh thu</h5>
                  <p>Xu hướng dòng tiền theo các ngày trong tháng.</p>
                </div>
              </div>
              <RevenueChart />
            </div>
          </Col>

          <Col xl={4}>
            <div className={styles.activitiesCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Giao dịch gần đây</h5>
                  <p>Lịch sử hoạt động thực tế tại kho.</p>
                </div>
              </div>
              <div className={styles.activitiesBody}>
                {recentActivities.length === 0 ? (
                  <div className="text-center py-5 text-muted">
                    <i className="fas fa-inbox d-block mb-2 fs-3"></i>
                    <small>Chưa có hoạt động nào</small>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div className={styles.timelineItem} key={activity.id}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineTitle}>{activity.title}</div>
                        <div className={styles.timelineDescription}>{activity.description}</div>
                        <div className="d-flex justify-content-between align-items-center">
                           <span className={styles.timelineTime}>{formatDateTime(activity.timestamp)}</span>
                           {activity.amount && <span className={styles.timelineAmount}>{formatCurrency(activity.amount)}</span>}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>

            <div className="mt-4">
              <CategoryRevenueChart />
            </div>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default WarehouseV2Dashboard;
