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
    <>
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

    <style jsx>{`
        /* --- General Container --- */
.logs-container {
  padding: 25px;
  font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
  color: #000;
  background-color: #fff;
  max-width: 1200px;
  margin: 0 auto;
}

.logs-header {
  font-size: 26px;
  font-weight: 600;
  margin-bottom: 25px;
  border-bottom: 2px solid #000;
  padding-bottom: 10px;
}

.header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

/* --- Search Bar --- */
.search-container {
  margin-bottom: 25px;
}

.search-input {
  width: 100%;
  padding: 10px;
  font-size: 16px;
  border: 1px solid #000;
  box-sizing: border-box;
  /* Ensures padding doesn't affect width */
}

.search-input:focus {
  outline: 2px solid #000;
  outline-offset: 2px;
}

/* --- Status Messages --- */
.status-message {
  text-align: center;
  padding: 20px;
  font-size: 16px;
}

.error-message {
  font-weight: bold;
  background-color: #f9f9f9;
  border: 1px solid #000;
}

/* --- Table --- */
.table-wrapper {
  overflow-x: auto;
  /* For responsiveness on small screens */
  border: 1px solid #000;
}

.logs-table {
  width: 100%;
  border-collapse: collapse;
  /* Removes space between cells */
}

.logs-table th,
.logs-table td {
  padding: 12px 15px;
  text-align: left;
  border-bottom: 1px solid #eee;
  /* Light gray for inner lines */
}

.logs-table th {
  background-color: #f2f2f2;
  font-weight: 600;
  border-bottom: 2px solid #000;
}

.logs-table tr:last-child td {
  border-bottom: none;
}

.logs-table tr:hover {
  background-color: #f5f5f5;
}

.no-logs-message {
  text-align: center;
  padding: 25px;
  color: #555;
}

/* --- Pagination --- */
.pagination-controls {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 25px;
  padding-top: 15px;
  border-top: 1px solid #000;
}

.pagination-info {
  font-size: 14px;
}

.pagination-buttons {
  display: flex;
  align-items: center;
  gap: 15px;
}

.pagination-buttons button {
  padding: 8px 16px;
  border: 1px solid #000;
  background-color: #fff;
  color: #000;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.2s ease-in-out;
}

.pagination-buttons button:hover:not(:disabled) {
  background-color: #000;
  color: #fff;
}

.pagination-buttons button:disabled {
  cursor: not-allowed;
  color: #999;
  border-color: #ccc;
  background-color: #f9f9f9;
}

.page-indicator {
  font-size: 14px;
  font-weight: bold;
}

.filters-section {
  background: #f8f9fa;
  border: 1px solid #e9ecef;
  border-radius: 8px;
  padding: 20px;
  margin: 20px 0;
}

.filters-section h3 {
  margin: 0 0 15px 0;
  color: #343a40;
  font-size: 1.1rem;
  font-weight: 600;
}

.filters-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: 15px;
  margin-bottom: 20px;
}

.filter-group {
  display: flex;
  flex-direction: column;
}

.filter-group label {
  font-size: 0.9rem;
  font-weight: 500;
  margin-bottom: 5px;
  color: #495057;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  border: 1px solid #ced4da;
  border-radius: 4px;
  font-size: 0.9rem;
  transition: border-color 0.2s ease;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #007bff;
  box-shadow: 0 0 0 2px rgba(0, 123, 255, 0.25);
}

.filter-actions {
  display: flex;
  gap: 10px;
  justify-content: flex-end;
  align-items: center;
}

.clear-filters-button,
.refresh-button {
  padding: 8px 16px;
  border: 1px solid;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  transition: all 0.2s ease;
}

.clear-filters-button {
  background: #fff;
  border-color: #dc3545;
  color: #dc3545;
}

.clear-filters-button:hover:not(:disabled) {
  background: #dc3545;
  color: white;
}

.refresh-button {
  background: #007bff;
  border-color: #007bff;
  color: white;
}

.refresh-button:hover:not(:disabled) {
  background: #0056b3;
  border-color: #0056b3;
}

.refresh-button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.active-filters {
  background: #e7f3ff;
  border: 1px solid #b3d9ff;
  border-radius: 6px;
  padding: 15px;
  margin: 15px 0;
}

.active-filters h4 {
  margin: 0 0 10px 0;
  font-size: 0.95rem;
  color: #0056b3;
}

.filter-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  background: #007bff;
  color: white;
  padding: 4px 8px;
  border-radius: 4px;
  font-size: 0.85rem;
  gap: 6px;
}

.filter-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 50%;
  transition: background 0.2s ease;
}

.filter-tag button:hover {
  background: rgba(255, 255, 255, 0.2);
}

.results-summary {
  margin: 15px 0;
  padding: 10px 15px;
  background: #f8f9fa;
  border-left: 4px solid #007bff;
  border-radius: 0 4px 4px 0;
}

.results-summary p {
  margin: 0;
  font-size: 0.9rem;
  color: #495057;
}

.action-badge {
  padding: 4px 8px;
  border-radius: 12px;
  font-size: 0.8rem;
  font-weight: 500;
  text-transform: uppercase;
}

.action-badge.login {
  background: #d4edda;
  color: #155724;
}

.action-badge.logout {
  background: #f8d7da;
  color: #721c24;
}

.action-badge.create {
  background: #d1ecf1;
  color: #0c5460;
}

.action-badge.update {
  background: #fff3cd;
  color: #856404;
}

.action-badge.delete {
  background: #f8d7da;
  color: #721c24;
}

.action-badge.suspend {
  background: #ffeaa7;
  color: #6c5ce7;
}

.action-badge.restore {
  background: #74b9ff;
  color: white;
}

.action-badge.approve {
  background: #00b894;
  color: white;
}

.action-badge.reject {
  background: #e17055;
  color: white;
}

.user-id {
  background: #f8f9fa;
  padding: 2px 6px;
  border-radius: 3px;
  font-family: monospace;
  font-size: 0.8rem;
  border: 1px solid #e9ecef;
}

/* Responsive adjustments */
@media (max-width: 768px) {
  .filters-grid {
    grid-template-columns: 1fr;
  }

  .filter-actions {
    justify-content: stretch;
  }

  .clear-filters-button,
  .refresh-button {
    flex: 1;
  }

  .filter-tags {
    justify-content: flex-start;
  }

  .logs-table th:nth-child(6) {
    display: none;
  }

  .logs-table td:nth-child(6) {
    display: none;
  }
}

/* Add these styles to your audit-logs.css */

.export-section {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  align-items: flex-end;
}

.export-controls {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.export-select {
  padding: 0.5rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
  font-size: 0.9rem;
  min-width: 120px;
}

.export-select:disabled {
  background-color: #f5f5f5;
  cursor: not-allowed;
}

.export-button {
  padding: 0.5rem 1rem;
  background-color: #007bff;
  color: white;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.9rem;
  white-space: nowrap;
  transition: background-color 0.2s;
}

.export-button:hover:not(:disabled) {
  background-color: #0056b3;
}

.export-button:disabled {
  background-color: #6c757d;
  cursor: not-allowed;
}

.export-button.loading {
  position: relative;
}

.export-button.loading::after {
  content: '';
  position: absolute;
  width: 16px;
  height: 16px;
  margin: auto;
  border: 2px solid transparent;
  border-top-color: #ffffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.export-success {
  color: #28a745;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background-color: #d4edda;
  border: 1px solid #c3e6cb;
  border-radius: 4px;
  max-width: 300px;
  text-align: center;
}

.export-error {
  color: #dc3545;
  font-size: 0.9rem;
  padding: 0.25rem 0.5rem;
  background-color: #f8d7da;
  border: 1px solid #f5c6cb;
  border-radius: 4px;
  max-width: 300px;
  text-align: center;
}

/* Responsive design for export section */
@media (max-width: 768px) {
  .export-section {
    align-items: stretch;
  }

  .export-controls {
    flex-direction: column;
    gap: 0.5rem;
  }

  .export-select,
  .export-button {
    width: 100%;
  }
}

  `}</style>
    </>
  );
}
