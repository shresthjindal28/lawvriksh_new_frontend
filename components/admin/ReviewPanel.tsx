'use client';

import { useState } from 'react';
import {
  ApplicationStatus,
  CreatorApplication,
  ReviewApplicationRequest,
} from '@/types/application.admin';
import { Skeleton } from '@/components/ui/skeleton';

interface ReviewPanelProps {
  applications: CreatorApplication[];
  masterPageApplications: CreatorApplication[];
  selectedApp: CreatorApplication | null;
  statusFilter: ApplicationStatus;
  isLoading: boolean;
  isSubmitting: boolean;
  error: string | null;
  onSelectApp: (app: CreatorApplication | null) => void;
  onSetFilter: (status: ApplicationStatus) => void;
  onSubmitReview: (review: ReviewApplicationRequest) => Promise<void>;
  searchTerm: string;
  onSearchChange: (term: string) => void;
  sortBy: 'applied_at' | 'user_risk_score' | 'spam_analysis.spam_score';
  onSortByChange: (sortBy: 'applied_at' | 'user_risk_score' | 'spam_analysis.spam_score') => void;
  sortOrder: 'asc' | 'desc';
  onSortOrderChange: (sortOrder: 'asc' | 'desc') => void;
  currentPage: number;
  totalApplications: number;
  limit: number;
  onPageChange: (page: number) => void;
}

export default function ReviewPanel({
  applications,
  masterPageApplications,
  selectedApp,
  statusFilter,
  isLoading,
  isSubmitting,
  error,
  onSelectApp,
  onSetFilter,
  onSubmitReview,
  searchTerm,
  onSearchChange,
  sortBy,
  onSortByChange,
  sortOrder,
  onSortOrderChange,
  currentPage,
  totalApplications,
  limit,
  onPageChange,
}: ReviewPanelProps) {
  const [notes, setNotes] = useState('');
  const totalPages = Math.ceil(totalApplications / limit);

  const counts = {
    pending: masterPageApplications.filter((app) => app.status === 'pending').length,
    approved: masterPageApplications.filter((app) => app.status === 'approved').length,
    rejected: masterPageApplications.filter((app) => app.status === 'rejected').length,
  };

  const handleReview = (status: 'approved' | 'rejected') => {
    onSubmitReview({ status, review_notes: notes });
    setNotes('');
  };

  return (
    <>
    <div className={`review-panel-container ${selectedApp ? 'details-visible' : ''}`}>
      {masterPageApplications.length > 0 || isLoading ? (
        <>
          {/* Left Panel: List of Applications */}
          <div className="list-panel">
            <header className="list-header">
              <h2>Applications</h2>
              <div className="filter-tabs">
                {(['pending', 'approved', 'rejected'] as ApplicationStatus[]).map((status) => (
                  <button
                    key={status}
                    className={`filter-btn ${statusFilter === status ? 'active' : ''}`}
                    onClick={() => onSetFilter(status)}
                  >
                    {status} ({counts[status]})
                  </button>
                ))}
              </div>
              {/* Search and Sort Controls */}
              <div className="search-sort-controls">
                <input
                  type="text"
                  className="search-input"
                  placeholder="Search by username..."
                  value={searchTerm}
                  onChange={(e) => onSearchChange(e.target.value)}
                />
                <div className="sort-controls">
                  <select value={sortBy} onChange={(e) => onSortByChange(e.target.value as any)}>
                    <option value="applied_at">Date</option>
                    <option value="user_risk_score">User Risk</option>
                    <option value="spam_analysis.spam_score">Spam Score</option>
                  </select>
                  <select
                    value={sortOrder}
                    onChange={(e) => onSortOrderChange(e.target.value as any)}
                  >
                    <option value="desc">Newest</option>
                    <option value="asc">Oldest</option>
                  </select>
                </div>
              </div>
            </header>
            <div className="applications-list">
              {isLoading ? (
                <>
                  {[1, 2, 3, 4, 5].map((n) => (
                    <div
                      key={n}
                      className="application-item"
                      aria-hidden="true"
                      style={{ padding: '12px' }}
                    >
                      <Skeleton className="h-5 w-32 mb-2" />
                      <div style={{ display: 'flex', gap: '8px', marginTop: '8px' }}>
                        <Skeleton className="h-4 w-20" />
                        <Skeleton className="h-4 w-24" />
                      </div>
                    </div>
                  ))}
                </>
              ) : applications.length > 0 ? (
                applications.map((app) => (
                  <div
                    key={app.id}
                    className={`application-item ${selectedApp?.id === app.id ? 'selected' : ''}`}
                    onClick={() => onSelectApp(app)}
                  >
                    <p className="item-username">{app.user_username || 'N/A'}</p>
                    <span className="item-category">{app.category}</span>
                    <span className="item-date">
                      {new Date(app.applied_at).toLocaleDateString()}
                    </span>
                  </div>
                ))
              ) : (
                <div className="placeholder">
                  <p>No applications match this filter on the current page.</p>
                </div>
              )}
            </div>
            {/* Pagination Controls */}
            <footer className="list-footer">
              <button
                onClick={() => onPageChange(currentPage - 1)}
                disabled={currentPage === 1 || isLoading}
              >
                Previous
              </button>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => onPageChange(currentPage + 1)}
                disabled={currentPage === totalPages || isLoading}
              >
                Next
              </button>
            </footer>
          </div>

          {/* Right Panel: Application Details and Review */}
          <div className="details-panel">
            {selectedApp ? (
              <>
                <header className="details-header">
                  <h3>Reviewing: {selectedApp.user_name}</h3>
                  <button className="close-btn" onClick={() => onSelectApp(null)}>
                    ✖
                  </button>
                </header>
                <div className="details-content">
                  {/* Flags Section */}
                  {selectedApp.flags && (
                    <div className="flags-container">
                      {selectedApp.flags.high_spam_risk && (
                        <span className="flag-item">⚠️ High Spam Risk</span>
                      )}
                      {selectedApp.flags.high_user_risk && (
                        <span className="flag-item">🚨 High User Risk</span>
                      )}
                      {selectedApp.flags.needs_review && (
                        <span className="flag-item">🧐 Needs Manual Review</span>
                      )}
                      {selectedApp.flags.urgent && <span className="flag-item">🔥 Urgent</span>}
                    </div>
                  )}
                  <p>
                    <strong>Username:</strong> {selectedApp.user_username}
                  </p>
                  <p>
                    <strong>Email:</strong> {selectedApp.user_email}
                  </p>
                  <p>
                    <strong>Status:</strong> {selectedApp.status}
                  </p>
                  <p>
                    <strong>Spam Score:</strong> {selectedApp.spam_analysis?.spam_score}
                  </p>
                  <p>
                    <strong>Spam Level:</strong> {selectedApp.spam_analysis?.spam_level}
                  </p>
                  <p>
                    <strong>Spam Confidence:</strong> {selectedApp.spam_analysis?.confidence}
                  </p>
                  {selectedApp.bio && (
                    <>
                      <h4>Bio</h4>
                      <p className="details-block">{selectedApp.bio}</p>
                    </>
                  )}
                  {selectedApp.why_creator && (
                    <>
                      <h4>Reason for Applying</h4>
                      <p className="details-block">{selectedApp.why_creator}</p>
                    </>
                  )}
                </div>
                <footer className="details-footer">
                  <h4>Admin Review</h4>
                  {error && <p className="error-message">{error}</p>}
                  <textarea
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    placeholder="Add review notes (optional)..."
                    disabled={isSubmitting}
                  />
                  <div className="review-actions">
                    <button
                      className="btn-reject"
                      onClick={() => handleReview('rejected')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Reject'}
                    </button>
                    <button
                      className="btn-approve"
                      onClick={() => handleReview('approved')}
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Submitting...' : 'Approve'}
                    </button>
                  </div>
                </footer>
              </>
            ) : (
              <div className="placeholder">
                <p>Select an application from the list to review its details.</p>
              </div>
            )}
          </div>
        </>
      ) : (
        <div className="no-applications">
          <p>No applications found.</p>
        </div>
      )}
    </div>

    <style jsx>{`
        .review-panel-container {
  display: flex;
  height: calc(100vh - 100px);
  font-family: sans-serif;
  background-color: #f7f8fa;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  overflow: hidden;
  position: relative;
}

/* --- Left Panel: List --- */
.list-panel {
  width: 350px;
  border-right: 1px solid #e0e0e0;
  display: flex;
  flex-direction: column;
  flex-shrink: 0;
  /* Prevents panel from shrinking */
}

.list-header {
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.list-header h2 {
  margin: 0 0 16px 0;
  font-size: 1.5rem;
}

.filter-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
}

.filter-btn {
  flex-grow: 1;
  padding: 8px 12px;
  border: 1px solid #ccc;
  background-color: #fff;
  cursor: pointer;
  border-radius: 6px;
  text-transform: capitalize;
  transition: all 0.2s;
}

.filter-btn:hover {
  background-color: #f0f0f0;
}

.filter-btn.active {
  background-color: #007bff;
  color: #fff;
  border-color: #007bff;
}

/* New Styles for Search and Sort */
.search-sort-controls {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.search-input {
  width: 100%;
  padding: 8px 12px;
  border: 1px solid #ccc;
  border-radius: 6px;
  font-size: 1rem;
}

.sort-controls {
  display: flex;
  gap: 8px;
}

.sort-controls select {
  flex-grow: 1;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 6px;
  background-color: #fff;
}

.applications-list {
  flex-grow: 1;
  overflow-y: auto;
  padding: 8px;
}

.application-item {
  padding: 12px 16px;
  border-radius: 6px;
  cursor: pointer;
  margin-bottom: 4px;
  transition: background-color 0.2s;
  border: 1px solid transparent;
}

.application-item:hover {
  background-color: #e9ecef;
}

.application-item.selected {
  background-color: #d4e8ff;
  border-color: #007bff;
}

.item-username {
  font-weight: bold;
  margin: 0 0 4px 0;
}

.item-category,
.item-date {
  font-size: 0.85rem;
  color: #666;
  margin-right: 12px;
}

/* New Styles for Pagination Footer */
.list-footer {
  padding: 12px 16px;
  border-top: 1px solid #e0e0e0;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.list-footer button {
  padding: 6px 12px;
  border: 1px solid #ccc;
  border-radius: 4px;
  background-color: #fff;
  cursor: pointer;
}

.list-footer button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* --- Right Panel: Details --- */
.details-panel {
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  background-color: #fff;
}

.details-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px;
  border-bottom: 1px solid #e0e0e0;
}

.details-header h3 {
  margin: 0;
}

.close-btn {
  background: none;
  border: none;
  font-size: 1.5rem;
  cursor: pointer;
  color: #888;
}

.details-content {
  flex-grow: 1;
  padding: 24px;
  overflow-y: auto;
  line-height: 1.6;
}

.details-block {
  background-color: #f7f8fa;
  border-left: 3px solid #007bff;
  padding: 12px;
  border-radius: 4px;
}

/* New Styles for Flags */
.flags-container {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin-bottom: 20px;
}

.flag-item {
  display: inline-block;
  padding: 6px 10px;
  border-radius: 20px;
  background-color: #ffeeb2;
  border: 1px solid #ffd466;
  font-size: 0.85rem;
  font-weight: bold;
}

.details-footer {
  padding: 16px 24px;
  border-top: 1px solid #e0e0e0;
  background-color: #f7f8fa;
}

.details-footer textarea {
  width: 100%;
  min-height: 80px;
  padding: 8px;
  border: 1px solid #ccc;
  border-radius: 4px;
  margin-bottom: 12px;
  box-sizing: border-box;
}

.review-actions {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

.review-actions button {
  padding: 10px 20px;
  border: none;
  border-radius: 6px;
  color: #fff;
  font-weight: bold;
  cursor: pointer;
}

.btn-approve {
  background-color: #28a745;
}

.btn-reject {
  background-color: #dc3545;
}

.review-actions button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: #888;
}

.error-message {
  color: #dc3545;
  font-size: 0.9rem;
  margin-bottom: 10px;
}

.no-applications {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #000;
}

.loading-message {
  text-align: center;
  padding: 20px;
  color: #6c757d;
}

/* =================================== */
/* Responsive Media Queries            */
/* =================================== */

/* For tablets and mobile phones */
@media (max-width: 768px) {
  .review-panel-container {
    /* Keep flex, but we'll control children with transforms */
    flex-direction: row;
    width: 100%;
    overflow: hidden;
    /* Important for the sliding effect */
  }

  .list-panel {
    width: 100%;
    border-right: none;
    transition: transform 0.3s ease-in-out;
    /* Ensures it doesn't shrink when its sibling is positioned absolutely */
    flex-shrink: 0;
  }

  .details-panel {
    /* Position the details panel on top of the list panel */
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    /* Start off-screen to the right */
    transform: translateX(100%);
    transition: transform 0.3s ease-in-out;
  }

  /* When an app is selected, the 'details-visible' class is added */
  .review-panel-container.details-visible .list-panel {
    /* Move list off-screen to the left */
    transform: translateX(-100%);
  }

  .review-panel-container.details-visible .details-panel {
    /* Bring details panel into view */
    transform: translateX(0);
  }

  .details-content {
    padding: 16px;
  }

  .details-footer {
    padding: 16px;
  }
}

  `}</style>
    </>
  );
}
