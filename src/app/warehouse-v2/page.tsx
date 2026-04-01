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
    description: 'Tạo lô hàng mới và cập nhật số lượng nhanh.',
    icon: 'fas fa-box-open',
  },
  {
    href: '/warehouse-v2/sales',
    title: 'Bán hàng',
    description: 'Chọn sản phẩm sẵn có và xử lý giao dịch ngay.',
    icon: 'fas fa-cart-shopping',
  },
  {
    href: '/warehouse-v2/inventory',
    title: 'Tồn kho',
    description: 'Theo dõi trạng thái lô hàng và số lượng còn lại.',
    icon: 'fas fa-warehouse',
  },
];

const systemHighlights = [
  {
    icon: 'fas fa-mobile-screen-button',
    title: 'Quản lý theo IMEI',
    description: 'Theo dõi từng máy và lịch sử giao dịch chi tiết.',
  },
  {
    icon: 'fas fa-layer-group',
    title: 'Quản lý theo lô',
    description: 'Đối chiếu nhập, bán và lợi nhuận trên từng đợt hàng.',
  },
  {
    icon: 'fas fa-chart-line',
    title: 'Báo cáo thời gian thực',
    description: 'Số liệu dashboard đồng bộ theo doanh thu và lợi nhuận.',
  },
  {
    icon: 'fas fa-file-invoice',
    title: 'Hóa đơn tự động',
    description: 'In hóa đơn bán hàng ngay từ danh sách giao dịch.',
  },
];

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
      currency: 'VND',
    }).format(amount);
  };

  const formatDateTime = (dateString: string) => {
    try {
      const isoString = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
      const [datePart, timePart] = isoString.split('T');
      const [year, month, day] = datePart.split('-');
      const [hours, minutes, seconds] = timePart.split(':');
      return `${day}/${month}/${year} ${hours}:${minutes}:${seconds.split('.')[0]}`;
    } catch (error) {
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
      <div className={styles.loadingContainer}>
        <div className="text-center">
          <div className={styles.loadingSpinner}></div>
          <div className={styles.loadingText}>Đang tải dữ liệu dashboard...</div>
          {timezoneDebug && (
            <div className="mt-3">
              <small className={styles.loadingMeta}>Timezone: {timezoneDebug.client?.vietnamToday || 'Loading...'}</small>
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
            <i className="fas fa-circle-exclamation me-2"></i>
            Lỗi tải dữ liệu: {statsError}
          </div>
          <Button variant="primary" onClick={fetchDashboardData}>
            <i className="fas fa-rotate me-2"></i>
            Thử lại
          </Button>
        </div>
      </Container>
    );
  }

  return (
    <div className={styles.dashboardContainer}>
      <Container fluid className={styles.contentWrapper}>
        <section className={`warehouse-page-header ${styles.pageHeader}`}>
          <div className="warehouse-page-title">
            <span className="warehouse-page-title-icon">
              <i className="fas fa-chart-pie" aria-hidden="true"></i>
            </span>
            <div>
              <h1 className={styles.pageTitle}>Tổng quan vận hành kho</h1>
              <p className={styles.pageSubtitle}>
                Xin chào. Hôm nay là {timezoneDebug?.client?.vietnamToday || new Date().toLocaleDateString('vi-VN')}.
                Theo dõi nhanh doanh thu, tồn kho và giao dịch gần nhất.
              </p>
            </div>
          </div>
          <div className="warehouse-page-actions">
            <Button variant="primary" onClick={fetchDashboardData}>
              <i className="fas fa-rotate me-2"></i>
              Làm mới dữ liệu
            </Button>
          </div>
        </section>

        {stats && (
          <Row className="g-3 mb-4">
            <Col md={6} xl={3}>
              <div className={`${styles.statsCard} ${styles.revenueCard}`}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-sack-dollar"></i></span>
                  <span className={styles.statsTrend}>Hôm nay</span>
                </div>
                <p className={styles.statsLabel}>Doanh thu</p>
                <h3 className={styles.statsValue}>{formatCurrency(stats.revenue.today)}</h3>
                <div className={styles.statsMeta}>
                  <span>Tháng này</span>
                  <strong>{formatCurrency(stats.revenue.thisMonth)}</strong>
                </div>
                {stats.revenue.growth !== 0 && (
                  <div className={styles.statsGrowth}>
                    <i className={`fas ${stats.revenue.growth > 0 ? 'fa-arrow-trend-up' : 'fa-arrow-trend-down'}`}></i>
                    {Math.abs(stats.revenue.growth)}%
                  </div>
                )}
              </div>
            </Col>
            <Col md={6} xl={3}>
              <div className={`${styles.statsCard} ${styles.profitCard}`}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-chart-line"></i></span>
                  <span className={styles.statsTrend}>Biên lợi nhuận</span>
                </div>
                <p className={styles.statsLabel}>Lãi/Lỗ</p>
                <h3 className={styles.statsValue}>{formatCurrency(stats.profit.today)}</h3>
                <div className={styles.statsMeta}>
                  <span>Tỷ suất</span>
                  <strong>{stats.profit.margin.toFixed(1)}%</strong>
                </div>
                <div className={styles.statsGrowth}>
                  <i className={`fas ${stats.profit.today >= 0 ? 'fa-circle-check' : 'fa-triangle-exclamation'}`}></i>
                  {stats.profit.today >= 0 ? 'Đang có lãi' : 'Cần theo dõi'}
                </div>
              </div>
            </Col>
            <Col md={6} xl={3}>
              <div className={`${styles.statsCard} ${styles.inventoryCard}`}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-warehouse"></i></span>
                  <span className={styles.statsTrend}>Tồn kho</span>
                </div>
                <p className={styles.statsLabel}>Tổng sản phẩm</p>
                <h3 className={styles.statsValue}>{stats.inventory.totalProducts}</h3>
                <div className={styles.statsSplit}>
                  <div>
                    <span>Có sẵn</span>
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
              <div className={`${styles.statsCard} ${styles.orderCard}`}>
                <div className={styles.statsCardTop}>
                  <span className={styles.statsIconWrapper}><i className="fas fa-bag-shopping"></i></span>
                  <span className={styles.statsTrend}>Giao dịch</span>
                </div>
                <p className={styles.statsLabel}>Đơn hàng hôm nay</p>
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

        <Row className="g-4 mb-4">
          <Col xl={8}>
            <div className={styles.quickActionsCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Thao tác nhanh</h5>
                  <p>Đi tới các nghiệp vụ chính với bố cục rõ ràng và ít thao tác hơn.</p>
                </div>
              </div>
              <Row className="g-3">
                {quickActions.map((action) => (
                  <Col md={4} key={action.href}>
                    <Link href={action.href} className="text-decoration-none h-100 d-block">
                      <div className={styles.quickActionItem}>
                        <span className={styles.actionIcon}><i className={action.icon}></i></span>
                        <h6 className={styles.actionTitle}>{action.title}</h6>
                        <p className={styles.actionDescription}>{action.description}</p>
                        <span className={styles.actionLink}>Mở màn hình</span>
                      </div>
                    </Link>
                  </Col>
                ))}
              </Row>
            </div>
          </Col>

          <Col xl={4}>
            <CategoryRevenueChart />
          </Col>
        </Row>

        <Row className="g-4 mb-4">
          <Col xl={8}>
            <div className={styles.chartContainer}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Doanh thu theo thời gian</h5>
                  <p>Theo dõi xu hướng bán hàng để quyết định nhập hàng và giá bán.</p>
                </div>
              </div>
              <RevenueChart />
            </div>
          </Col>
          <Col xl={4}>
            <div className={styles.activitiesCard}>
              <div className={styles.sectionHeader}>
                <div>
                  <h5>Hoạt động gần đây</h5>
                  <p>Cập nhật mới nhất từ nhập hàng, bán hàng và tạo lô.</p>
                </div>
              </div>
              <div className={styles.activitiesBody}>
                {recentActivities.length === 0 ? (
                  <div className="warehouse-empty-state">
                    <i className="fas fa-clock-rotate-left"></i>
                    <div>Chưa có hoạt động nào gần đây.</div>
                  </div>
                ) : (
                  recentActivities.map((activity) => (
                    <div className={styles.timelineItem} key={activity.id}>
                      <div className={styles.timelineDot}></div>
                      <div className={styles.timelineContent}>
                        <div className={styles.timelineTitle}>{activity.title}</div>
                        <div className={styles.timelineDescription}>{activity.description}</div>
                        <div className={styles.timelineTime}>{formatDateTime(activity.timestamp)}</div>
                        {activity.amount && <div className={styles.timelineAmount}>{formatCurrency(activity.amount)}</div>}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </Col>
        </Row>

        <div className={styles.systemInfoCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h5>Năng lực hệ thống</h5>
              <p>Những nhóm chức năng chính hỗ trợ vận hành kho hàng mỗi ngày.</p>
            </div>
          </div>
          <Row className="g-3">
            {systemHighlights.map((item) => (
              <Col md={6} xl={3} key={item.title}>
                <div className={styles.systemInfoItem}>
                  <span className={styles.systemInfoIcon}><i className={item.icon}></i></span>
                  <h6 className={styles.systemInfoTitle}>{item.title}</h6>
                  <p className={styles.systemInfoDesc}>{item.description}</p>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      </Container>
    </div>
  );
};

export default WarehouseV2Dashboard;
