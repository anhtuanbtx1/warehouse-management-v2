'use client';

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ApexOptions } from 'apexcharts';
import { Card } from 'react-bootstrap';
import styles from '@/app/warehouse-v2/dashboard.module.css';

const Chart = dynamic(() => import('react-apexcharts'), { ssr: false });

interface CategoryData {
  categoryId?: number;
  category: string;
  revenue: number;
  count: number;
  productCount?: number;
  percentage: number;
}

const CategoryRevenueChart = () => {
  const [chartData, setChartData] = useState<CategoryData[]>([]);
  const [loading, setLoading] = useState(true);
  const [total, setTotal] = useState<number>(0);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    // Lấy ngày hiện tại theo múi giờ Việt Nam
    const getVietnamDate = () => {
      const now = new Date();
      // Chuyển sang múi giờ Việt Nam (UTC+7)
      const vietnamTime = new Date(now.toLocaleString("en-US", {timeZone: "Asia/Ho_Chi_Minh"}));
      const year = vietnamTime.getFullYear();
      const month = String(vietnamTime.getMonth() + 1).padStart(2, '0');
      const day = String(vietnamTime.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const todayDate = getVietnamDate();
    setCurrentDate(todayDate);
    fetchCategoryData(todayDate);
    
    // Refresh mỗi 30 giây
    const interval = setInterval(() => {
      const newDate = getVietnamDate();
      if (newDate !== currentDate) {
        setCurrentDate(newDate);
      }
      fetchCategoryData(newDate);
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  const fetchCategoryData = async (date?: string) => {
    const targetDate = date || currentDate;
    if (!targetDate) return;
    
    setLoading(true);
    try {
      // Gọi API với ngày hiện tại
      const response = await fetch(`/api/dashboard/category-revenue?date=${targetDate}`, {
        headers: {
          'Accept': 'application/json; charset=utf-8',
          'Content-Type': 'application/json'
        }
      });
      const result = await response.json();

      if (result.success && result.data && Array.isArray(result.data)) {
        // Lọc và validate dữ liệu
        const validData = result.data
          .filter((item: any) => 
            item && 
            item.category && 
            typeof item.revenue === 'number' &&
            typeof item.percentage === 'number'
          )
          .slice(0, 5)
          .map((item: any) => ({
            ...item,
            revenue: Number(item.revenue) || 0,
            count: Number(item.count) || 0,
            percentage: Number(item.percentage) || 0
          }));
        
        setChartData(validData);
        setTotal(result.total || 0);
      } else {
        // Nếu không có dữ liệu, set empty
        setChartData([]);
        setTotal(0);
      }
    } catch (error) {
      console.error('Error fetching category data:', error);
      setChartData([]);
      setTotal(0);
    } finally {
      setLoading(false);
    }
  };

  // Chỉ tạo chart options khi có data
  const chartOptions: ApexOptions = chartData.length > 0 ? {
    chart: {
      type: 'donut',
      width: '100%',
      height: 240,
      animations: {
        enabled: true,
        easing: 'easeinout',
        speed: 800,
        animateGradually: {
          enabled: true,
          delay: 150
        },
        dynamicAnimation: {
          enabled: true,
          speed: 350
        }
      }
    },
    labels: chartData.map(item => item.category || 'Unknown'),
    colors: ['#667eea', '#f093fb', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#ffeaa7'],
    dataLabels: {
      enabled: true,
      formatter: function(val: any, opts: any) {
        const name = opts.w.globals.labels[opts.seriesIndex];
        return [name, val.toFixed(1) + '%'];
      },
      style: {
        fontSize: '12px',
        fontWeight: 600,
      },
      dropShadow: {
        enabled: false
      }
    },
    plotOptions: {
      pie: {
        donut: {
          size: '65%',
          labels: {
            show: true,
            name: {
              show: true,
              fontSize: '14px',
              fontWeight: 600,
              color: '#1a1a1a',
              offsetY: -10
            },
            value: {
              show: true,
              fontSize: '20px',
              fontWeight: 700,
              color: '#1a1a1a',
              offsetY: 5,
              formatter: function(val: string) {
                const num = parseFloat(val);
                if (num >= 1000000) {
                  return (num / 1000000).toFixed(1) + 'M';
                } else if (num >= 1000) {
                  return (num / 1000).toFixed(0) + 'K';
                }
                return val;
              }
            },
            total: {
              show: true,
              showAlways: true,
              label: 'Tổng doanh thu',
              fontSize: '12px',
              fontWeight: 600,
              color: '#6c757d',
              formatter: function(w: any) {
                const total = w.globals.seriesTotals.reduce((a: number, b: number) => a + b, 0);
                if (total >= 1000000000) {
                  return (total / 1000000000).toFixed(1) + 'B';
                } else if (total >= 1000000) {
                  return (total / 1000000).toFixed(0) + 'M';
                }
                return total.toLocaleString();
              }
            }
          }
        }
      }
    },
    legend: {
      position: 'bottom',
      horizontalAlign: 'center',
      floating: false,
      fontSize: '13px',
      fontWeight: 500,
      offsetY: 10,
      labels: {
        colors: '#1a1a1a'
      },
      markers: {
        width: 12,
        height: 12,
        radius: 3
      },
      itemMargin: {
        horizontal: 10,
        vertical: 5
      }
    },
    tooltip: {
      enabled: true,
      y: {
        formatter: function(val: number) {
          return val.toLocaleString('vi-VN', {
            style: 'currency',
            currency: 'VND'
          });
        }
      },
      style: {
        fontSize: '12px'
      }
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 300
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  } : {};

  // Validate series data
  const series = chartData.map(item => Number(item.revenue) || 0);

  const formatCurrency = (value: number) => {
    return value.toLocaleString('vi-VN', {
      style: 'currency',
      currency: 'VND'
    });
  };

  if (loading) {
    return (
      <div className={styles.categoryChartCard}>
        <div className={styles.categoryChartHeader}>
          <h5 className={styles.categoryChartTitle}>
            <i className="fas fa-chart-pie"></i>
            Doanh thu hôm nay
          </h5>
          <div className={styles.todayBadge}>
            <i className="fas fa-calendar-day"></i>
            {new Date().toLocaleDateString('vi-VN')}
          </div>
        </div>
        <div className={styles.categoryChartBody}>
          <div className={styles.loadingSpinner}>
            <div className="spinner-border text-primary" role="status">
              <span className="visually-hidden">Loading...</span>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={styles.categoryChartCard}>
        <div className={styles.categoryChartHeader}>
          <h5 className={styles.categoryChartTitle}>
            <i className="fas fa-chart-pie"></i>
            Doanh thu hôm nay
          </h5>
          <div className={styles.todayBadge}>
            <i className="fas fa-calendar-day"></i>
            {new Date().toLocaleDateString('vi-VN')}
          </div>
      </div>
      <div className={styles.categoryChartBody}>
        {chartData.length > 0 && series.some(value => value > 0) ? (
          <>
            <div style={{ height: '240px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Chart
                options={chartOptions}
                series={series}
                type="donut"
                width="100%"
                height={240}
              />
            </div>
            <div className={styles.categoryStats}>
              {chartData.map((item, index) => (
                <div key={index} className={styles.categoryStatItem}>
                  <div className={styles.categoryStatIcon} 
                    style={{
                      background: ['#667eea', '#f093fb', '#feca57', '#48dbfb', '#ff9ff3', '#54a0ff', '#ffeaa7'][index]
                    }}>
                    <i className="fas fa-mobile-alt"></i>
                  </div>
                  <div className={styles.categoryStatInfo}>
                    <h6 className={styles.categoryName}>{item.category}</h6>
                    <div className={styles.categoryRevenue}>
                      {formatCurrency(item.revenue)}
                    </div>
                    <div className={styles.categoryMeta}>
                      <span className={styles.categoryCount}>
                        {item.count} đơn hàng
                      </span>
                      <span className={styles.categoryPercent}>
                        {item.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </>
        ) : (
          <div className={styles.emptyState}>
            <i className={'fas fa-chart-pie ' + styles.emptyIcon}></i>
            <div className={styles.emptyTitle}>Chưa có dữ liệu bán hàng</div>
            <p className={styles.emptyDescription}>
              Dữ liệu doanh thu ngày {new Date().toLocaleDateString('vi-VN')} sẽ hiển thị khi có giao dịch
            </p>
            {chartData.length > 0 && (
              <div className={styles.categoryStats} style={{marginTop: '20px'}}>
                <div className={styles.emptyCategories}>
                <small style={{color: '#6c757d'}}>
                  Danh mục sản phẩm hiện có:
                </small>
                  <div style={{marginTop: '8px'}}>
                    {chartData.map((item, index) => (
                      <span key={index} style={{
                        display: 'inline-block',
                        padding: '4px 8px',
                        margin: '2px',
                        borderRadius: '4px',
                        backgroundColor: '#f8f9fa',
                        fontSize: '11px',
                        color: '#495057'
                      }}>
                        {item.category}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CategoryRevenueChart;
