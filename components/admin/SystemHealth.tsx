'use client';

import { useState, useEffect, useRef } from 'react';
import { adminService } from '@/lib/api/adminService';
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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <VideoLoader width={150} height={150} />
        <p className="text-[#6F7A8F] text-base">Loading System Health...</p>
      </div>
    );
  }

  return (
    <>
      <div className="p-5 max-w-[1200px] mx-auto font-sans bg-white text-black print:max-w-none print:p-0 sm:p-4 min-[480px]:p-3">
        <div className="flex justify-between items-center mb-6 flex-wrap gap-4 border-b border-[#ccc] pb-5 md:flex-col md:items-stretch">
          <h1 className="m-0 text-[28px] font-semibold text-black md:text-2xl min-[480px]:text-xl">
            System Health Dashboard
          </h1>

          <div className="flex gap-3 flex-wrap md:justify-center min-[480px]:flex-col min-[480px]:w-full print:hidden">
            <button
              onClick={fetchHealthData}
              className="px-4 py-2 border border-black rounded cursor-pointer text-sm font-medium text-center no-underline inline-block transition-all duration-200 bg-white text-black hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-[480px]:w-full min-[480px]:text-center"
            >
              Refresh
            </button>

            <button
              onClick={refreshInterval ? stopAutoRefresh : startAutoRefresh}
              className={`px-4 py-2 border border-black rounded cursor-pointer text-sm font-medium text-center no-underline inline-block transition-all duration-200 bg-white text-black hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-[480px]:w-full min-[480px]:text-center`}
            >
              {refreshInterval ? 'Stop Auto-refresh' : 'Auto-refresh'}
            </button>
            <Link
              href="/dashboard/admin"
              className={`px-4 py-2 border border-black rounded cursor-pointer text-sm font-medium text-center no-underline inline-block transition-all duration-200 bg-white text-black hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-[480px]:w-full min-[480px]:text-center`}
            >
              Back to Dashboard
            </Link>
          </div>
        </div>

        {healthData && (
          <>
            {/* Overall Status */}
            <div className="bg-white border border-[#ccc] rounded-lg p-5 mb-6">
              <div className="flex justify-between items-center flex-wrap gap-4 md:flex-col md:items-start">
                <div>
                  <h2 className="m-0 mb-2 text-xl font-medium">Overall Status</h2>
                  <div
                    className={`inline-block px-3 py-[6px] rounded-2xl text-sm font-medium uppercase text-black bg-white border border-black print:text-black print:bg-white print:border-black
                      ${
                        ['warning', 'degraded'].includes(
                          healthData.health.overall_status.toLowerCase()
                        )
                          ? 'border-dashed'
                          : ''
                      }
                      ${
                        ['error', 'critical', 'unhealthy'].includes(
                          healthData.health.overall_status.toLowerCase()
                        )
                          ? 'border-2 font-semibold'
                          : ''
                      }
                      ${
                        ![
                          'healthy',
                          'ok',
                          'good',
                          'warning',
                          'degraded',
                          'error',
                          'critical',
                          'unhealthy',
                        ].includes(healthData.health.overall_status.toLowerCase())
                          ? 'border-[#999] text-white' // This might need revisiting if text-white on white bg is issue, but following logic
                          : ''
                      }
                    `}
                    style={
                      ![
                        'healthy',
                        'ok',
                        'good',
                        'warning',
                        'degraded',
                        'error',
                        'critical',
                        'unhealthy',
                      ].includes(healthData.health.overall_status.toLowerCase())
                        ? { borderColor: '#999', color: '#fff' } // Inline style to match CSS fallback specificity if needed, though classes usually safer
                        : {}
                    }
                  >
                    {healthData.health.overall_status}
                  </div>
                </div>

                <div className="text-right text-[#555] md:text-left">
                  <div className="text-sm">Last Updated</div>
                  <div className="text-base font-medium text-black">
                    {new Date(healthData.health.timestamp).toLocaleString()}
                  </div>
                </div>
              </div>
            </div>

            {/* Services Status */}
            <div className="grid grid-cols-[repeat(auto-fit,minmax(300px,1fr))] gap-5 mb-6 md:grid-cols-1">
              {Object.entries(healthData.health.services).map(([serviceName, service]) => (
                <div key={serviceName} className="bg-white border border-[#ccc] rounded-lg p-5">
                  <h3 className="m-0 mb-3 text-lg font-medium capitalize">{serviceName}</h3>

                  <div className="mb-2">
                    <span
                      className={`inline-block px-2 py-1 rounded-[12px] text-xs font-medium uppercase text-black bg-white border border-black print:text-black print:bg-white print:border-black
                      ${
                        ['warning', 'degraded'].includes(service.status.toLowerCase())
                          ? 'border-dashed'
                          : ''
                      }
                      ${
                        ['error', 'critical', 'unhealthy'].includes(service.status.toLowerCase())
                          ? 'border-2 font-semibold'
                          : ''
                      }
                    `}
                    >
                      {service.status}
                    </span>
                  </div>

                  {service.error && (
                    <div className="p-2 px-3 bg-white border border-black rounded text-black text-sm print:text-black print:bg-white print:border-black">
                      {service.error}
                    </div>
                  )}
                </div>
              ))}
            </div>

            {/* System Metrics */}
            <div className="bg-white border border-[#ccc] rounded-lg p-5 mb-6">
              <h2 className="m-0 mb-4 text-xl font-medium">System Metrics</h2>

              <div className="grid grid-cols-[repeat(auto-fit,minmax(200px,1fr))] gap-4 md:grid-cols-[repeat(auto-fit,minmax(150px,1fr))] min-[480px]:grid-cols-1">
                {Object.entries(healthData.health.metrics).map(([key, value]) => (
                  <div
                    key={key}
                    className="text-center p-4 bg-white rounded border border-[#eee]"
                  >
                    <div className="text-2xl font-semibold text-black mb-1">
                      {typeof value === 'number' ? value.toLocaleString() : value}
                    </div>
                    <div className="text-sm text-[#555] capitalize">
                      {key.replace(/_/g, ' ')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Alerts */}
            {healthData.health.alerts.length > 0 && (
              <div className="bg-white border border-black rounded-lg p-5 mb-6">
                <h2 className="m-0 mb-4 text-xl font-medium text-black">System Alerts</h2>

                <div className="flex flex-col gap-2">
                  {healthData.health.alerts.map((alert, index) => (
                    <div
                      key={index}
                      className="p-3 bg-[#f8f8f8] border border-[#ccc] rounded text-sm text-black print:text-black print:bg-white print:border-black"
                    >
                      {alert}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* System Cleanup */}
            <div className="bg-white border border-[#ccc] rounded-lg p-5 print:hidden">
              <h2 className="m-0 mb-4 text-xl font-medium">System Maintenance</h2>

              <div className="flex gap-3 items-center flex-wrap mb-4 md:flex-col md:items-stretch print:hidden">
                <button
                  onClick={() => handleSystemCleanup(false)}
                  disabled={cleanupLoading}
                  className="px-5 py-[10px] border border-black rounded cursor-pointer text-sm font-medium text-center no-underline inline-block transition-all duration-200 bg-white text-black hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-[480px]:w-full"
                >
                  {cleanupLoading ? 'Processing...' : 'Schedule Cleanup'}
                </button>

                <button
                  onClick={() => handleSystemCleanup(true)}
                  disabled={cleanupLoading}
                  className="px-5 py-[10px] border border-black rounded cursor-pointer text-sm font-medium text-center no-underline inline-block transition-all duration-200 bg-white text-black hover:bg-[#f0f0f0] disabled:cursor-not-allowed disabled:opacity-50 disabled:bg-[#f8f9fa] focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2 min-[480px]:w-full"
                >
                  {cleanupLoading ? 'Processing...' : 'Force Cleanup'}
                </button>
              </div>

              {cleanupResult && (
                <div className="p-3 bg-[#f8f8f8] border border-[#ccc] rounded text-black text-sm print:text-black print:bg-white print:border-black">
                  <div className="mb-1">
                    <strong>Cleanup Status:</strong>{' '}
                    {cleanupResult.cleanup_scheduled ? 'Scheduled' : 'Not Scheduled'}
                  </div>
                  <div className="mb-1">
                    <strong>Force Mode:</strong> {cleanupResult.force ? 'Yes' : 'No'}
                  </div>
                  <div className="mb-1">
                    <strong>Scheduled By:</strong> {cleanupResult.scheduled_by}
                  </div>
                  <div className="mb-0">
                    <strong>Scheduled At:</strong>{' '}
                    {new Date(cleanupResult.scheduled_at).toLocaleString()}
                  </div>
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </>
  );
}
