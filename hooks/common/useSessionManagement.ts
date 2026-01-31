import { useState, useEffect } from 'react';
import { authService } from '@/lib/api/authService';
import { UserSession, APIResponse, SessionsResponseData } from '@/types/auth';

export function useSessionManager() {
  const [sessions, setSessions] = useState<UserSession[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSessions = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response: APIResponse<SessionsResponseData> = await authService.getSessions();
      if (response.success && response.data) {
        setSessions(response.data.sessions);
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to fetch sessions');
    } finally {
      setIsLoading(false);
    }
  };

  const deleteSession = async (sessionId: string): Promise<APIResponse> => {
    try {
      const response: APIResponse = await authService.deleteSession(sessionId);
      if (response.success) {
        setSessions((prev) => prev.filter((session) => session.session_id !== sessionId));
      }

      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to logout session');
      throw error;
    }
  };

  const logoutAllSessions = async (): Promise<APIResponse> => {
    try {
      const response = await authService.logoutAllSessions();
      if (response.success) {
        setSessions([]);
      }
      return response;
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to logout all sessions');
      throw error;
    }
  };

  useEffect(() => {
    fetchSessions();
  }, []);

  return {
    sessions,
    isLoading,
    error,
    fetchSessions,
    deleteSession,
    logoutAllSessions,
  };
}
