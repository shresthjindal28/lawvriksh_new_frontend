'use client';

import { useState, useEffect, useRef } from 'react';
import { adminService } from '@/lib/api/adminService';
import '@/styles/admin-styles/system-health.css';
import { SystemCleanupResponse, SystemHealth } from '@/types/admin';
import Link from 'next/link';
import VideoLoader from '../ui/VideoLoader';

export default function SystemHealthComponent() {
  const [healthData, setHealthData] = useState<SystemHealth | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cleanupLoading, setCleanupLoading] = useState(false);
  const [cleanupResult, setCleanupResult] = useState<SystemCleanupResponse | null>(null);
  const [refreshInterval, setRefreshInterval] = useState<NodeJS.Timeout | null>(null);
  const refreshIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Keep ref in sync with state
  useEffect(() => {
    refreshIntervalRef.current = refreshInterval;
  }, [refreshInterval]);

  const fetchHealthData = async () => {
    try {
      const response = await adminService.getSystemHealth();
      if (response.success && response.data) {
        setHealthData(response.data);
        setError(null);
      } else {
        setError('Failed to fetch system health data');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error fetching system health data');
      } else {
        setError('Error fetching system health data');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleSystemCleanup = async (force = false) => {
    setCleanupLoading(true);
    try {
      const response = await adminService.systemCleanup({ force });
      if (response.success && response.data) {
        setCleanupResult(response.data);
      } else {
        setError('Failed to schedule system cleanup');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Error scheduling system cleanup');
      } else {
        setError('Error scheduling system cleanup');
      }
    } finally {
      setCleanupLoading(false);
    }
  };

  const startAutoRefresh = () => {
    const interval = setInterval(fetchHealthData, 30000); // Refresh every 30 seconds
    setRefreshInterval(interval);
  };

  const stopAutoRefresh = () => {
    if (refreshInterval) {
      clearInterval(refreshInterval);
      setRefreshInterval(null);
    }
  };

  useEffect(() => {
    fetchHealthData();
    return () => {
      if (refreshIntervalRef.current) {
        clearInterval(refreshIntervalRef.current);
      }
    };
  }, []);

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading System Health...</p>
      </div>
    );
  }

  return (
    <div className="system-health-container">
      <div className="header">
        <h1 className="title">System Health Dashboard</h1>

        <div className="action-buttons">
          <button onClick={fetchHealthData} className="btn btn-primary">
            Refresh
          </button>

          <button
            onClick={refreshInterval ? stopAutoRefresh : startAutoRefresh}
            className={`btn ${refreshInterval ? 'btn-danger' : 'btn-success'}`}
          >
            {refreshInterval ? 'Stop Auto-refresh' : 'Auto-refresh'}
          </button>
          <Link href="/dashboard/admin" className={`btn`}>
            Back to Dashboard
          </Link>
        </div>
      </div>

      {healthData && (
        <>
          {/* Overall Status */}
          <div className="status-card">
            <div className="status-header">
              <div>
                <h2 className="status-title">Overall Status</h2>
                <div
                  className={`status-badge status-${healthData.health.overall_status.toLowerCase()}`}
                >
                  {healthData.health.overall_status}
                </div>
              </div>

              <div className="timestamp">
                <div className="timestamp-label">Last Updated</div>
                <div className="timestamp-value">
                  {new Date(healthData.health.timestamp).toLocaleString()}
                </div>
              </div>
            </div>
          </div>

          {/* Services Status */}
          <div className="services-grid">
            {Object.entries(healthData.health.services).map(([serviceName, service]) => (
              <div key={serviceName} className="service-card">
                <h3 className="service-title">{serviceName}</h3>

                <div className="service-status">
                  <span className={`status-badge status-${service.status.toLowerCase()}`}>
                    {service.status}
                  </span>
                </div>

                {service.error && <div className="service-error">{service.error}</div>}
              </div>
            ))}
          </div>

          {/* System Metrics */}
          <div className="metrics-card">
            <h2 className="section-title">System Metrics</h2>

            <div className="metrics-grid">
              {Object.entries(healthData.health.metrics).map(([key, value]) => (
                <div key={key} className="metric-item">
                  <div className="metric-value">
                    {typeof value === 'number' ? value.toLocaleString() : value}
                  </div>
                  <div className="metric-label">{key.replace(/_/g, ' ')}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Alerts */}
          {healthData.health.alerts.length > 0 && (
            <div className="alerts-card">
              <h2 className="alerts-title">System Alerts</h2>

              <div className="alerts-list">
                {healthData.health.alerts.map((alert, index) => (
                  <div key={index} className="alert-item">
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* System Cleanup */}
          <div className="cleanup-card">
            <h2 className="section-title">System Maintenance</h2>

            <div className="cleanup-buttons">
              <button
                onClick={() => handleSystemCleanup(false)}
                disabled={cleanupLoading}
                className="btn btn-primary"
              >
                {cleanupLoading ? 'Processing...' : 'Schedule Cleanup'}
              </button>

              <button
                onClick={() => handleSystemCleanup(true)}
                disabled={cleanupLoading}
                className="btn btn-danger"
              >
                {cleanupLoading ? 'Processing...' : 'Force Cleanup'}
              </button>
            </div>

            {cleanupResult && (
              <div className="cleanup-result">
                <div>
                  <strong>Cleanup Status:</strong>{' '}
                  {cleanupResult.cleanup_scheduled ? 'Scheduled' : 'Not Scheduled'}
                </div>
                <div>
                  <strong>Force Mode:</strong> {cleanupResult.force ? 'Yes' : 'No'}
                </div>
                <div>
                  <strong>Scheduled By:</strong> {cleanupResult.scheduled_by}
                </div>
                <div>
                  <strong>Scheduled At:</strong>{' '}
                  {new Date(cleanupResult.scheduled_at).toLocaleString()}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
