import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/lib/api/adminService';
import { AuditLog } from '@/types/admin';

interface AuditLogFilters {
  user_id?: string;
  admin_id?: string;
  action?: string;
  start_date?: string;
  end_date?: string;
  search_term?: string;
}

interface ExportAuditLogsParams {
  format?: string;
  days?: number;
}

export const useAuditLogs = () => {
  const [logs, setLogs] = useState<AuditLog[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [exportLoading, setExportLoading] = useState(false);

  // State for pagination and searching
  const [currentPage, setCurrentPage] = useState(1);
  const [limit] = useState(20);

  // Enhanced filter states
  const [filters, setFilters] = useState<AuditLogFilters>({});

  // Debounced filters to avoid excessive API calls
  const [debouncedFilters, setDebouncedFilters] = useState<AuditLogFilters>({});

  // Debounce filters to avoid excessive API calls
  useEffect(() => {
    const timerId = setTimeout(() => {
      setDebouncedFilters(filters);
      setCurrentPage(1); // Reset to first page on new filters
    }, 500); // 500ms delay

    return () => {
      clearTimeout(timerId);
    };
  }, [filters]);

  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const offset = (currentPage - 1) * limit;

      // Build parameters object with only non-empty values
      const params: any = {
        limit,
        offset,
      };

      // Add filters only if they have values
      if (debouncedFilters.search_term?.trim()) {
        params.search_term = debouncedFilters.search_term.trim();
      }
      if (debouncedFilters.user_id?.trim()) {
        params.user_id = debouncedFilters.user_id.trim();
      }
      if (debouncedFilters.admin_id?.trim()) {
        params.admin_id = debouncedFilters.admin_id.trim();
      }
      if (debouncedFilters.action?.trim()) {
        params.action = debouncedFilters.action.trim();
      }
      if (debouncedFilters.start_date?.trim()) {
        params.start_date = debouncedFilters.start_date.trim();
      }
      if (debouncedFilters.end_date?.trim()) {
        params.end_date = debouncedFilters.end_date.trim();
      }

      const response = await adminService.getAuditLogs(params);

      if (response.success && response.data) {
        setLogs(response.data.logs);
        setTotal(response.data.pagination?.total || 0);
      } else {
        throw new Error(response.message || 'Failed to fetch audit logs');
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      }
      setLogs([]);
      setTotal(0);
    } finally {
      setIsLoading(false);
    }
  }, [currentPage, limit, debouncedFilters]);

  const exportAuditLogs = useCallback(async (params: ExportAuditLogsParams) => {
    setError(null);
    setExportLoading(true);

    try {
      const response = await adminService.exportAuditLogs(params);

      if (response.success) {
        return { success: true };
      } else {
        throw new Error(response.message || 'Failed to export audit logs');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      return {
        success: false,
        error: error instanceof Error ? error.message : 'An unknown error occurred.',
      };
    } finally {
      setExportLoading(false);
    }
  }, []);

  // Effect to fetch data when page or filters change
  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  // Helper functions to update individual filters
  const updateFilter = useCallback((key: keyof AuditLogFilters, value: string) => {
    setFilters((prev) => ({
      ...prev,
      [key]: value || undefined, // Remove empty strings
    }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({});
    setCurrentPage(1);
  }, []);

  const setSearchTerm = useCallback(
    (value: string) => {
      updateFilter('search_term', value);
    },
    [updateFilter]
  );

  return {
    logs,
    total,
    isLoading,
    exportLoading,
    error,
    currentPage,
    limit,
    filters,

    // Actions
    setCurrentPage,
    updateFilter,
    exportAuditLogs,
    clearFilters,

    // Legacy compatibility
    searchTerm: filters.search_term || '',
    setSearchTerm,

    // Refresh function
    refetch: fetchLogs,
  };
};
