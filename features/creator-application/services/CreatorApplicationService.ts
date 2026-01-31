'use client';

import { useState } from 'react';
import { creatorService } from '@/lib/api/creatorService';
import { APIResponse } from '@/types/auth';
import { CreatorApplication, CreatorApplicationsData } from '@/types/creator';

export default function CreatorApplicationService() {
  const [userApplications, setUserApplications] = useState<CreatorApplication[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getUserApplications = async (): Promise<APIResponse<CreatorApplicationsData>> => {
    setLoading(true);
    setError(null);
    try {
      const response = await creatorService.getMyCreatorApplications();
      if (response.success && response.data && response.data.applications) {
        setUserApplications(response.data.applications);
        console.log('User Applications', response.data.applications);
      }
      return response;
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('An unexpected error occurred');
      }
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return {
    userApplications,
    setUserApplications,
    loading,
    error,
    getUserApplications,
  };
}
