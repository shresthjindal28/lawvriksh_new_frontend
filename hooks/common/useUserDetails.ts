import { useState, useEffect, useCallback } from 'react';
import { adminService } from '@/lib/api/adminService';
import type {
  UserDetailsForAdmin,
  UserSessionDetails,
  RecentActivity,
  SuspendUserRequest,
  RestoreUserRequest,
  UpdateUserRole,
  UpdateUserScore,
  UserActionRequest,
} from '@/types/admin';
import { UserActionRequestSchema } from '@/lib/validators/admin/requests';
import { fromZodError } from 'zod-validation-error';
import { UserData } from '@/components/admin/UserModal';

export const useUserDetails = (userId: string | null) => {
  const [user, setUser] = useState<UserDetailsForAdmin | null>(null);
  const [sessions, setSessions] = useState<UserSessionDetails[]>([]);
  const [activity, setActivity] = useState<RecentActivity[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    if (!userId) return;

    setLoading(true);
    setError(null);
    try {
      const response = await adminService.getUserById(userId);
      if (response.success && response.data) {
        setUser(response.data.user);
        setSessions(response.data.sessions);
        setActivity(response.data.recent_activity);
      } else {
        throw new Error(response.message || 'Failed to fetch user details');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch user details');
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    fetchUserDetails();
  }, [fetchUserDetails]);

  const userAction = async (data: UserActionRequest) => {
    if (!userId) throw new Error('User ID is missing.');
    setIsSubmitting(true);

    try {
      const parsed = UserActionRequestSchema.safeParse(data);
      if (!parsed.success) {
        const validationError = fromZodError(parsed.error);
        setError(validationError.message);
        return { success: false, message: validationError.message };
      }
      const response = await adminService.userAction({ ...data, user_id: userId });
      if (!response.success) throw new Error(response.message || 'Failed to perform user action.');
      await fetchUserDetails(); // Refresh data on success
      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const suspendUser = async (data: Omit<SuspendUserRequest, 'user_id'>) => {
    if (!userId) throw new Error('User ID is missing.');

    setIsSubmitting(true);
    try {
      const response = await adminService.suspendUser({ ...data, user_id: userId });
      if (!response.success) throw new Error(response.message || 'Failed to suspend user.');
      await fetchUserDetails(); // Refresh data on success
      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const restoreUser = async (data: Omit<RestoreUserRequest, 'user_id'>) => {
    if (!userId) throw new Error('User ID is missing.');

    setIsSubmitting(true);
    try {
      const response = await adminService.restoreUser({ ...data, user_id: userId });
      if (!response.success) throw new Error(response.message || 'Failed to restore user.');
      await fetchUserDetails(); // Refresh data on success
      return response;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserRole = async (data: Omit<UpdateUserRole, 'user_id'>) => {
    if (!userId) throw new Error('User ID is missing.');
    setIsSubmitting(true);
    try {
      const response = await adminService.updateUserRole({ user_id: userId, ...data });
      if (response.success) {
        await fetchUserDetails(); // Refresh data on success
      } else {
        throw new Error(response.message || 'Failed to update user role.');
      }
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateUserScore = async (data: UpdateUserScore) => {
    if (!userId) throw new Error('User ID is missing.');
    setIsSubmitting(true);
    try {
      const updateData = {
        ...data,
        user_id: userId,
      };
      const response = await adminService.updateUserScore(updateData);
      if (response.success) {
        await fetchUserDetails(); // Refresh data on success
      } else {
        throw new Error(response.message || 'Failed to update user score.');
      }
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  const editUser = async (data: UserData) => {
    if (!userId) throw new Error('User ID is missing.');
    setIsSubmitting(true);
    try {
      const response = await adminService.updateUser(userId, data);
      if (response.success) {
        await fetchUserDetails(); // Refresh data on success
      } else {
        throw new Error(response.message || 'Failed to update user.');
      }
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An unknown error occurred.');
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    user,
    sessions,
    activity,
    loading,
    error,
    isSubmitting,
    userAction,
    suspendUser,
    restoreUser,
    updateUserRole,
    updateUserScore,
    editUser,
    refetch: fetchUserDetails,
  };
};
