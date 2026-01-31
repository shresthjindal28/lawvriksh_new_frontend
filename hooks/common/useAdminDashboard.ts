'use client';

import { useState, useEffect, useCallback } from 'react';
import { AdminDashboard, SystemStats } from '@/types/admin';
import { adminService } from '@/lib/api/adminService';

export function useAdminDashboard() {
  const [dashboardData, setDashboardData] = useState<AdminDashboard | null>(null);
  const [systemStats, setSystemStats] = useState<SystemStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchAllData = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);

      const [statsResponse, dashboardResponse] = await Promise.all([
        adminService.getStats(),
        adminService.getAdminDashboard(),
      ]);

      // Set system stats if the request was successful
      if (statsResponse.success && statsResponse.data) {
        setSystemStats(statsResponse.data);
      } else {
        throw new Error(statsResponse.message || 'Failed to fetch system stats');
      }

      // Set dashboard data, accessing the nested object
      if (dashboardResponse.success && dashboardResponse.data?.dashboard) {
        setDashboardData(dashboardResponse.data.dashboard);
      } else {
        throw new Error(dashboardResponse.message || 'Failed to fetch dashboard data');
      }
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  return { dashboardData, systemStats, isLoading, error };
}
