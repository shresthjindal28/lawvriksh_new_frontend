import { useState, useEffect, useCallback } from 'react';
import type { UserDetails, UserRole } from '@/types/admin';
import { adminService } from '@/lib/api/adminService';
import { UserData } from '@/components/admin/UserModal';

const DEBOUNCE_DELAY = 500; // ms

interface UseUsersProps {
  initialLimit?: number;
}

export const useUsers = ({ initialLimit = 15 }: UseUsersProps = {}) => {
  const [users, setUsers] = useState<UserDetails[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters and Pagination State
  const [limit] = useState(initialLimit);
  const [skip, setSkip] = useState(0);
  const [role, setRole] = useState<UserRole | ''>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');

  // Debounce search input to avoid excessive API calls
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
      setSkip(0); // Reset to first page on new search
    }, DEBOUNCE_DELAY);

    return () => {
      clearTimeout(handler);
    };
  }, [searchTerm]);

  // Reset skip when role changes
  const handleSetRole = (newRole: UserRole | '') => {
    setRole(newRole);
    setSkip(0);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const roleParam = role || undefined;
      const searchParam = debouncedSearchTerm || undefined;

      const response = await adminService.getUsers(skip, limit, roleParam, searchParam);

      if (response.success && response.data) {
        console.log('Users Response', response);
        setUsers(response.data.users);
        setTotal(response.data.pagination?.total);
      } else {
        throw new Error(response.message || 'Failed to fetch users');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch users');
    } finally {
      setLoading(false);
    }
  }, [skip, limit, role, debouncedSearchTerm]);

  const addUser = async (data: UserData) => {
    setLoading(true);
    try {
      const response = await adminService.addUser(data);
      if (response.success) {
        await fetchUsers(); // Refresh data on success
      } else {
        throw new Error(response.message || 'Failed to add user.');
      }
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      throw error;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    total,
    loading,
    error,
    skip,
    limit,
    searchTerm,
    role,
    setSkip,
    setSearchTerm,
    setRole: handleSetRole,
    refetch: fetchUsers, // Expose a refetch function
    addUser,
  };
};
