'use client';

import { useMemo } from 'react';
import AdminPanel from '@/components/admin/AdminPanel';
import VideoLoader from '@/components/ui/VideoLoader';
import { useAdminDashboard } from '@/hooks/common/useAdminDashboard';
import { AdminInfoTransformer, StatsBuilder, ActionsBuilder } from '@/lib/utils/adminPanel';

export default function AdminDashboardPage() {
  const { dashboardData, systemStats, isLoading, error } = useAdminDashboard();

  // Transform data using memoized transformers
  const adminInfo = useMemo(() => AdminInfoTransformer.transform(dashboardData), [dashboardData]);

  const stats = useMemo(
    () => StatsBuilder.fromDashboardData(dashboardData, systemStats),
    [dashboardData, systemStats]
  );

  const actions = useMemo(() => ActionsBuilder.fromDashboardData(dashboardData), [dashboardData]);

  // Loading states
  if (isLoading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading Admin Dashboard...</p>
      </div>
    );
  }

  if (!adminInfo || stats.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Preparing dashboard...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <h2>Error loading dashboard</h2>
        <p>{error || 'An unexpected error occurred'}</p>
      </div>
    );
  }

  return <AdminPanel stats={stats} actions={actions} adminInfo={adminInfo} />;
}
