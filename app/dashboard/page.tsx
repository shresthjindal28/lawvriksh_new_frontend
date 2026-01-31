'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VideoLoader from '@/components/ui/VideoLoader';
import { useAuth } from '@/lib/contexts/AuthContext';
import { REDIRECT_ROUTES } from '@/lib/constants/routes';

export default function DashboardPage() {
  const { profile, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const role = profile?.role || user?.role;
    if (role) {
      const roleRedirects: Record<string, string> = {
        admin: REDIRECT_ROUTES.ADMIN,
        professional: REDIRECT_ROUTES.PROFESSIONAL,
        student: REDIRECT_ROUTES.STUDENT,
        user: REDIRECT_ROUTES.USER,
      };

      const destination = roleRedirects[role] || '/login';
      router.replace(destination);
    }
  }, [profile, user, router]);

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
      <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Redirecting to your dashboard...</p>
    </div>
  );
}
