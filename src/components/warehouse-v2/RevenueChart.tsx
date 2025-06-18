'use client';

import React, { useState, useEffect } from 'react';
import { Card, Spinner, Alert, ButtonGroup, Button } from 'react-bootstrap';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface RevenueChartData {
  date: string;
  revenue: number;
  profit: number;
  orders: number;
}

interface RevenueChartProps {
  className?: string;
}

const RevenueChart: React.FC<RevenueChartProps> = ({ className }) => {
  const [data, setData] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [period, setPeriod] = useState<number>(30);

  const fetchData = async (days: number) => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`/api/dashboard/revenue-chart?days=${days}`);
      const result = await response.json();
      
      if (result.success) {
        setData(result.data);
      } else {
        setError(result.error || 'Không thể tải dữ liệu');
      }
    } catch (err) {
      setError('Lỗi kết nối API');
      console.error('Error fetching revenue chart:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData(period);
  }, [period]);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN', {
      timeZone: 'Asia/Ho_Chi_Minh',
      month: 'short',
      day: 'numeric'
    });
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border rounded shadow">
          <p className="fw-bold mb-2">{formatDate(label)}</p>
          {payload.map((entry: any, index: number) => (
            <p key={index} className="mb-1" style={{ color: entry.color }}>
              <span className="me-2">●</span>
              {entry.name}: {entry.name === 'Đơn hàng' ? entry.value : formatCurrency(entry.value)}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  const totalRevenue = data.reduce((sum, item) => sum + item.revenue, 0);
  const totalProfit = data.reduce((sum, item) => sum + item.profit, 0);
  const totalOrders = data.reduce((sum, item) => sum + item.orders, 0);

  return (
    <Card className={className}>
      <Card.Header className="d-flex justify-content-between align-items-center">
        <h5 className="mb-0">
          <span className="me-2">📈</span>
          Biểu đồ doanh thu
        </h5>
        <ButtonGroup size="sm">
          <Button 
            variant={period === 7 ? "primary" : "outline-primary"}
            onClick={() => setPeriod(7)}
          >
            7 ngày
          </Button>
          <Button 
            variant={period === 30 ? "primary" : "outline-primary"}
            onClick={() => setPeriod(30)}
          >
            30 ngày
          </Button>
          <Button 
            variant={period === 90 ? "primary" : "outline-primary"}
            onClick={() => setPeriod(90)}
          >
            90 ngày
          </Button>
        </ButtonGroup>
      </Card.Header>
      
      <Card.Body>
        {loading ? (
          <div className="text-center py-5">
            <Spinner animation="border" variant="primary" />
            <div className="mt-2">Đang tải dữ liệu...</div>
          </div>
        ) : error ? (
          <Alert variant="danger">
            <span className="me-2">⚠️</span>
            {error}
          </Alert>
        ) : (
          <>
            {/* Summary Stats */}
            <div className="row mb-4">
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 text-success mb-1">{formatCurrency(totalRevenue)}</div>
                  <small className="text-muted">Tổng doanh thu</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 text-info mb-1">{formatCurrency(totalProfit)}</div>
                  <small className="text-muted">Tổng lợi nhuận</small>
                </div>
              </div>
              <div className="col-md-4">
                <div className="text-center p-3 bg-light rounded">
                  <div className="h4 text-primary mb-1">{totalOrders}</div>
                  <small className="text-muted">Tổng đơn hàng</small>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div style={{ width: '100%', height: '400px' }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis 
                    dataKey="date" 
                    tickFormatter={formatDate}
                    tick={{ fontSize: 12 }}
                  />
                  <YAxis 
                    tickFormatter={(value) => `${(value / 1000000).toFixed(1)}M`}
                    tick={{ fontSize: 12 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend />
                  <Line 
                    type="monotone" 
                    dataKey="revenue" 
                    stroke="#28a745" 
                    strokeWidth={3}
                    name="Doanh thu"
                    dot={{ fill: '#28a745', strokeWidth: 2, r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="profit" 
                    stroke="#17a2b8" 
                    strokeWidth={2}
                    name="Lợi nhuận"
                    dot={{ fill: '#17a2b8', strokeWidth: 2, r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </>
        )}
      </Card.Body>
    </Card>
  );
};

export default RevenueChart;
