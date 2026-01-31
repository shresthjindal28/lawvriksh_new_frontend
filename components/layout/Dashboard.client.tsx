'use client';
import { ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import Sidebar from './Sidebar.client';
import { UserProfile } from '../../types';
import { navigationConfigs } from '@/lib/config/sidebarConfig';
import { MobileSidebarProvider, useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';
import '@/styles/common-styles/home.css';
import { useAuth } from '@/lib/contexts/AuthContext';
import VideoLoader from '@/components/ui/VideoLoader';

interface CommonDashboardProps {
  children: ReactNode;
  className?: string;
  user: UserProfile;
}

function DashboardContent({ children, className = '', user }: CommonDashboardProps) {
  const { isOpen, close } = useMobileSidebar();

  const mainNavItems =
    navigationConfigs[user.role as keyof typeof navigationConfigs] || navigationConfigs.student;
  const bottomNavItems = navigationConfigs.bottom;

  return (
    <div className={`layout ${className}`}>
      {/* Overlay for Mobile */}
      {isOpen && <div className="mobile-sidebar-overlay" onClick={close} />}

      {/* Sidebar Component */}
      <Sidebar
        user={user}
        isMobileOpen={isOpen}
        onMobileClose={close}
        navigationItems={mainNavItems}
        bottomNavigationItems={bottomNavItems}
      />

      {/* Main Content Area */}
      <main className="content">{children}</main>
    </div>
  );
}

export default function CommonDashboardLayout(props: CommonDashboardProps) {
  return (
    <MobileSidebarProvider>
      <DashboardContent {...props} />
    </MobileSidebarProvider>
  );
}

export function DashboardAuthLayout({ children }: { children: ReactNode }) {
  const { profile, isInitialLoading } = useAuth();
  const pathname = usePathname();
  const isDashboardRoot = pathname === '/dashboard';

  if (isDashboardRoot) {
    return <>{children}</>;
  }

  if (isInitialLoading || !profile) {
    return <VideoLoader width={300} height={300} className="h-screen w-full bg-white" />;
  }

  return <CommonDashboardLayout user={profile}>{children}</CommonDashboardLayout>;
}
