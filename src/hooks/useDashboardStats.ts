import { useState, useEffect } from 'react';
import { getClientVietnamToday, getClientVietnamYesterday, getClientVietnamCurrentMonth, getClientTimezoneDebug } from '@/utils/clientTimezone';

interface DashboardStats {
  revenue: {
    today: number;
    thisMonth: number;
    thisYear: number;
    growth: number;
  };
  profit: {
    today: number;
    thisMonth: number;
    thisYear: number;
    margin: number;
  };
  inventory: {
    totalProducts: number;
    inStock: number;
    sold: number;
    lowStock: number;
  };
  sales: {
    todayCount: number;
    thisMonthCount: number;
    avgOrderValue: number;
  };
}

interface UseDashboardStatsReturn {
  stats: DashboardStats | null;
  loading: boolean;
  error: string | null;
  refetch: () => void;
  timezoneDebug: any;
}

export function useDashboardStats(): UseDashboardStatsReturn {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timezoneDebug, setTimezoneDebug] = useState<any>(null);

  const fetchStats = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get client-side Vietnam timezone dates
      const today = getClientVietnamToday();
      const yesterday = getClientVietnamYesterday();
      const currentMonth = getClientVietnamCurrentMonth();
      const debug = getClientTimezoneDebug();

      console.log('Client Timezone Debug:', debug);

      // Create API URL with client-calculated dates
      const params = new URLSearchParams({
        clientToday: today,
        clientYesterday: yesterday,
        clientMonth: currentMonth.month.toString(),
        clientYear: currentMonth.year.toString(),
        timezoneOverride: 'client'
      });

      const response = await fetch(`/api/dashboard/stats?${params.toString()}`);
      const result = await response.json();

      if (result.success) {
        setStats(result.data);
        setTimezoneDebug({
          client: debug,
          server: result.debug || null,
          comparison: {
            clientToday: today,
            serverToday: result.debug?.timezone?.vietnam || 'unknown',
            match: today === (result.debug?.timezone?.vietnam || 'unknown'),
            explanation: 'Client and server dates should match for consistent data'
          }
        });
      } else {
        setError(result.error || 'Failed to fetch dashboard stats');
      }
    } catch (err) {
      console.error('Dashboard stats error:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch dashboard stats');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  return {
    stats,
    loading,
    error,
    refetch: fetchStats,
    timezoneDebug
  };
}
