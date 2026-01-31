'use client';

import ReviewPanel from '@/components/admin/ReviewPanel';
import VideoLoader from '@/components/ui/VideoLoader';
import { CreatorApplicationsService } from '@/features/admin-review/services/CreatorApplications';

export default function ApplicationsPage() {
  const {
    applications,
    masterPageApplications,
    selectedApp,
    statusFilter,
    isLoading,
    isSubmitting,
    error,
    selectApplication,
    setStatusFilter,
    submitReview,
    currentPage,
    totalApplications,
    limit,
    setCurrentPage,
    searchTerm,
    sortBy,
    sortOrder,
    onSearchChange,
    onSortByChange,
    onSortOrderChange,
  } = CreatorApplicationsService();

  if (isLoading && applications.length === 0) {
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
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Fetching applications...</p>
      </div>
    );
  }

  return (
    <div className="applicationsPage" style={{ padding: '20px' }}>
      <ReviewPanel
        applications={applications}
        masterPageApplications={masterPageApplications}
        selectedApp={selectedApp}
        statusFilter={statusFilter}
        isLoading={isLoading}
        isSubmitting={isSubmitting}
        error={error}
        onSelectApp={selectApplication}
        onSetFilter={setStatusFilter}
        onSubmitReview={submitReview}
        currentPage={currentPage}
        totalApplications={totalApplications}
        limit={limit}
        onPageChange={setCurrentPage}
        searchTerm={searchTerm}
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSearchChange={onSearchChange}
        onSortByChange={onSortByChange}
        onSortOrderChange={onSortOrderChange}
      />
    </div>
  );
}
