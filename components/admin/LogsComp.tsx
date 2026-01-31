'use client';

import { useAuditLogs } from '@/hooks/common/useAuditLogs';
import VideoLoader from '../ui/VideoLoader';
import Link from 'next/link';
import { useState } from 'react';

export default function LogsComp() {
  const {
    logs,
    total,
    isLoading,
    exportLoading,
    error,
    currentPage,
    limit,
    filters,
    setCurrentPage,
    updateFilter,
    clearFilters,
    refetch,
    exportAuditLogs,
  } = useAuditLogs();

  const totalPages = Math.ceil(total / limit);
  const [exportDays, setExportDays] = useState(7);
  const [exportFormat, setExportFormat] = useState('csv');
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);

  const handleExport = async () => {
    setExportSuccess(null);

    const result = await exportAuditLogs({
      format: exportFormat,
      days: exportDays,
    });

    if (result?.success) {
      setExportSuccess(`Successfully exported audit logs for the last ${exportDays} days`);
      // Clear success message after 5 seconds
      setTimeout(() => setExportSuccess(null), 5000);
    }
  };

  // format date for datetime-local input
  const formatDateForInput = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString().slice(0, 16);
  };

  // convert datetime-local input to ISO string
  const formatDateForAPI = (date: string) => {
    if (!date) return '';
    return new Date(date).toISOString();
  };

  const hasActiveFilters = Object.values(filters).some((value) => value && value.trim() !== '');

  return (
    <div className="logs-container">
      <div className="header">
        <h1 className="logs-header">System Audit Logs</h1>
        <div className="export-section">
          <div className="export-controls">
            <select
              value={exportDays}
              onChange={(e) => setExportDays(Number(e.target.value))}
              className="export-select"
              disabled={exportLoading}
            >
              <option value={1}>Last 1 day</option>
              <option value={7}>Last 7 days</option>
              <option value={30}>Last 30 days</option>
              <option value={90}>Last 90 days</option>
            </select>

            <select
              value={exportFormat}
              onChange={(e) => setExportFormat(e.target.value)}
              className="export-select"
              disabled={exportLoading}
            >
              <option value="csv">CSV</option>
              <option value="xlsx">Excel</option>
              <option value="json">JSON</option>
            </select>

            <button
              disabled={exportLoading}
              onClick={handleExport}
              className={`export-button ${exportLoading ? 'loading' : ''}`}
            >
              {exportLoading ? 'Exporting...' : 'Export Logs'}
            </button>
          </div>

          {/* Export Status Messages */}
          {exportSuccess && <div className="export-success">✓ {exportSuccess}</div>}

          {error && error.includes('export') && (
            <div className="export-error">✗ Export failed: {error}</div>
          )}
        </div>
      </div>

      <Link href="/dashboard" className="back-button">
        Back to Dashboard
      </Link>

      {/* Enhanced Filter Section */}
      <div className="filters-section">
        <h3>Filters</h3>

        <div className="filters-grid">
          {/* Search Term */}
          <div className="filter-group">
            <label>Search in Description</label>
            <input
              type="text"
              value={filters.search_term || ''}
              onChange={(e) => updateFilter('search_term', e.target.value)}
              placeholder="Search logs by keyword..."
              className="filter-input"
            />
          </div>

          {/* User ID */}
          <div className="filter-group">
            <label>User ID</label>
            <input
              type="text"
              value={filters.user_id || ''}
              onChange={(e) => updateFilter('user_id', e.target.value)}
              placeholder="Filter by user ID..."
              className="filter-input"
            />
          </div>

          {/* Admin ID */}
          <div className="filter-group">
            <label>Admin ID</label>
            <input
              type="text"
              value={filters.admin_id || ''}
              onChange={(e) => updateFilter('admin_id', e.target.value)}
              placeholder="Filter by admin ID..."
              className="filter-input"
            />
          </div>

          {/* Action Type */}
          <div className="filter-group">
            <label>Action Type</label>
            <select
              value={filters.action || ''}
              onChange={(e) => updateFilter('action', e.target.value)}
              className="filter-select"
            >
              <option value="">All Actions</option>
              <option value="login">Login</option>
              <option value="logout">Logout</option>
              <option value="create">Create</option>
              <option value="update">Update</option>
              <option value="delete">Delete</option>
              <option value="suspend">Suspend</option>
              <option value="restore">Restore</option>
              <option value="approve">Approve</option>
              <option value="reject">Reject</option>
            </select>
          </div>

          {/* Start Date */}
          <div className="filter-group">
            <label>Start Date</label>
            <input
              type="datetime-local"
              value={filters.start_date ? formatDateForInput(filters.start_date) : ''}
              onChange={(e) =>
                updateFilter('start_date', e.target.value ? formatDateForAPI(e.target.value) : '')
              }
              className="filter-input"
            />
          </div>

          {/* End Date */}
          <div className="filter-group">
            <label>End Date</label>
            <input
              type="datetime-local"
              value={filters.end_date ? formatDateForInput(filters.end_date) : ''}
              onChange={(e) =>
                updateFilter('end_date', e.target.value ? formatDateForAPI(e.target.value) : '')
              }
              className="filter-input"
            />
          </div>
        </div>

        {/* Filter Actions */}
        <div className="filter-actions">
          {hasActiveFilters && (
            <button onClick={clearFilters} className="clear-filters-button">
              Clear Filters
            </button>
          )}
          <button onClick={refetch} className="refresh-button" disabled={isLoading}>
            Refresh
          </button>
        </div>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="active-filters">
          <h4>Active Filters:</h4>
          <div className="filter-tags">
            {filters.search_term && (
              <span className="filter-tag">
                Search: "{filters.search_term}"
                <button onClick={() => updateFilter('search_term', '')}>×</button>
              </span>
            )}
            {filters.user_id && (
              <span className="filter-tag">
                User ID: {filters.user_id.slice(0, 8)}...
                <button onClick={() => updateFilter('user_id', '')}>×</button>
              </span>
            )}
            {filters.admin_id && (
              <span className="filter-tag">
                Admin ID: {filters.admin_id.slice(0, 8)}...
                <button onClick={() => updateFilter('admin_id', '')}>×</button>
              </span>
            )}
            {filters.action && (
              <span className="filter-tag">
                Action: {filters.action}
                <button onClick={() => updateFilter('action', '')}>×</button>
              </span>
            )}
            {filters.start_date && (
              <span className="filter-tag">
                From: {new Date(filters.start_date).toLocaleDateString()}
                <button onClick={() => updateFilter('start_date', '')}>×</button>
              </span>
            )}
            {filters.end_date && (
              <span className="filter-tag">
                To: {new Date(filters.end_date).toLocaleDateString()}
                <button onClick={() => updateFilter('end_date', '')}>×</button>
              </span>
            )}
          </div>
        </div>
      )}

      {/* Loading and Error States */}
      {isLoading && (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '40px 0',
            gap: '16px',
          }}
        >
          <VideoLoader width={150} height={150} />
          <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading logs...</p>
        </div>
      )}
      {error && <p className="status-message error-message">Error: {error}</p>}

      {/* Results Count */}
      {!isLoading && !error && (
        <div className="results-summary">
          <p>
            Found {total} log{total !== 1 ? 's' : ''}
          </p>
        </div>
      )}

      {/* Main Content */}
      {!isLoading && !error && (
        <>
          <div className="table-wrapper">
            <table className="logs-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>User</th>
                  <th>Action</th>
                  <th>Description</th>
                  <th>IP Address</th>
                  <th>User ID</th>
                </tr>
              </thead>
              <tbody>
                {logs.length > 0 ? (
                  logs.map((log) => (
                    <tr key={log.id}>
                      <td>{new Date(log.created_at).toLocaleString()}</td>
                      <td>{log.user_email || 'System'}</td>
                      <td>
                        <span className={`action-badge ${log.action.toLowerCase()}`}>
                          {log.action}
                        </span>
                      </td>
                      <td>{log.description}</td>
                      <td>{log.ip_address || 'N/A'}</td>
                      <td>
                        {log.user_id ? <code className="user-id">{log.user_id}</code> : 'N/A'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="no-logs-message">
                      {hasActiveFilters ? 'No logs found matching your filters.' : 'No logs found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination Controls */}
          {total > 0 && (
            <div className="pagination-controls">
              <span className="pagination-info">
                Showing {Math.min((currentPage - 1) * limit + 1, total)} to{' '}
                {Math.min(currentPage * limit, total)} of {total} results
              </span>
              <div className="pagination-buttons">
                <button
                  onClick={() => setCurrentPage(currentPage - 1)}
                  disabled={currentPage <= 1 || isLoading}
                >
                  Previous
                </button>
                <span className="page-indicator">
                  Page {currentPage} of {totalPages}
                </span>
                <button
                  onClick={() => setCurrentPage(currentPage + 1)}
                  disabled={currentPage >= totalPages || isLoading}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
