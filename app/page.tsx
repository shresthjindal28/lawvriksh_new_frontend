'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/AuthContext';
import { PUBLIC_ROUTES } from '@/lib/constants/routes';
import { REDIRECT_ROUTES } from '@/lib/constants/routes';
import VideoLoader from '@/components/ui/VideoLoader';

export default function Home() {
  const router = useRouter();
  const { isAuthenticated, profile, isInitialLoading } = useAuth();

  useEffect(() => {
    // Always redirect from root route
    if (isInitialLoading) return;

    if (!isAuthenticated) {
      // Redirect unauthenticated users to login
      router.replace(PUBLIC_ROUTES.LOGIN);
    } else if (profile) {
      // Redirect authenticated users to their appropriate dashboard
      const roleRedirects: Record<string, string> = {
        admin: REDIRECT_ROUTES.ADMIN,
        professional: REDIRECT_ROUTES.PROFESSIONAL,
        student: REDIRECT_ROUTES.STUDENT,
        user: REDIRECT_ROUTES.USER,
      };
      const destination = roleRedirects[profile.role] || PUBLIC_ROUTES.LOGIN;
      router.replace(destination);
    } else {
      // Fallback to login if no profile
      router.replace(PUBLIC_ROUTES.LOGIN);
    }
  }, [isAuthenticated, profile, isInitialLoading, router]);

  // Show loading while redirecting
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
      <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Redirecting...</p>
    </div>
  );
}
