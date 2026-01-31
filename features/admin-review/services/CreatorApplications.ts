'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  ApplicationStatus,
  CreatorApplication,
  ReviewApplicationRequest,
} from '@/types/application.admin';
import { adminService } from '@/lib/api/adminService';

const PAGE_LIMIT = 20;

const useDebounce = (value: string, delay: number) => {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);
  return debouncedValue;
};

export function CreatorApplicationsService() {
  const [masterPageApplications, setMasterPageApplications] = useState<CreatorApplication[]>([]);
  const [displayApplications, setDisplayApplications] = useState<CreatorApplication[]>([]);

  const [selectedApp, setSelectedApp] = useState<CreatorApplication | null>(null);
  const [statusFilter, setStatusFilter] = useState<ApplicationStatus>('pending');

  const [currentPage, setCurrentPage] = useState(1);
  const [totalApplications, setTotalApplications] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearchTerm = useDebounce(searchTerm, 500);
  const [sortBy, setSortBy] = useState<
    'applied_at' | 'user_risk_score' | 'spam_analysis.spam_score'
  >('applied_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const fetchApplications = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const skip = (currentPage - 1) * PAGE_LIMIT;
      const response = await adminService.getCreatorApplications({
        skip,
        limit: PAGE_LIMIT,
        search: debouncedSearchTerm,
        sort_by: sortBy,
        sort_order: sortOrder,
      });

      if (response.success && response.data) {
        setMasterPageApplications(response.data.applications);
        setTotalApplications(response.data.pagination.total);
      } else {
        throw new Error(response.message || 'Failed to fetch applications');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, debouncedSearchTerm, sortBy, sortOrder]);

  // This useEffect triggers the API call only when pagination or searching changes.
  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  // This runs whenever the master list changes OR the user clicks a filter tab.
  useEffect(() => {
    const filtered = masterPageApplications.filter((app) => app.status === statusFilter);
    setDisplayApplications(filtered);
  }, [masterPageApplications, statusFilter]);

  const selectApplication = (app: CreatorApplication | null) => {
    setSelectedApp(app);
  };

  // This function only updates the local state..
  const submitReview = async (reviewData: ReviewApplicationRequest) => {
    if (!selectedApp) return;

    setIsSubmitting(true);
    setError(null);

    try {
      const response = await adminService.reviewCreatorApplication(selectedApp.id, reviewData);

      if (!response.success) {
        throw new Error(response.message || 'Failed to submit review');
      }

      // On success, update the status of the item in our master list for the page.
      setMasterPageApplications((currentApps) =>
        currentApps.map((app) =>
          app.id === selectedApp.id
            ? { ...app, status: reviewData.status } // Update the status
            : app
        )
      );

      setSelectedApp(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    applications: displayApplications,
    masterPageApplications,
    selectedApp,
    statusFilter,
    isLoading,
    isSubmitting,
    error,
    currentPage,
    totalApplications,
    limit: PAGE_LIMIT,
    searchTerm,
    sortBy,
    sortOrder,
    setStatusFilter,
    selectApplication,
    submitReview,
    setCurrentPage,
    onSearchChange: (term: string) => {
      setSearchTerm(term);
      setCurrentPage(1);
    },
    onSortByChange: (by: 'applied_at' | 'user_risk_score' | 'spam_analysis.spam_score') => {
      setSortBy(by);
      setCurrentPage(1);
    },
    onSortOrderChange: (order: 'asc' | 'desc') => {
      setSortOrder(order);
      setCurrentPage(1);
    },
  };
}
