'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import VideoLoader from '@/components/ui/VideoLoader';
import CommonDashboardLayout from '@/components/layout/Dashboard.client';

interface SettingsLayoutProps {
  children: React.ReactNode;
}

export default function SettingsLayout({ children }: SettingsLayoutProps) {
  const { profile, isInitialLoading } = useAuth();

  if (isInitialLoading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <VideoLoader width={150} height={150} />
      </div>
    );
  }

  if (!profile) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '100vh',
        }}
      >
        <VideoLoader width={150} height={150} />
      </div>
    );
  }

  return <CommonDashboardLayout user={profile}>{children}</CommonDashboardLayout>;
}
