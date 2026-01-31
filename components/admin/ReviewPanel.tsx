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
  );
}
