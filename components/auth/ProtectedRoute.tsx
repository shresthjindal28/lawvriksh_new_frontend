'use client';
import { useRouter, usePathname } from 'next/navigation';
import { useEffect, useMemo, useState, useCallback } from 'react';
import { PageSkeleton } from '@/components/ui/PageSkeleton';
import { UserRole } from '@/types';
import { useAuth } from '@/lib/contexts/AuthContext';
import {
  PUBLIC_ROUTES,
  ADMIN_ROUTES,
  COMMON_ROUTES,
  PROFESSIONAL_ROUTES,
  STUDENT_ROUTES,
  REDIRECT_ROUTES,
} from '@/lib/constants/routes';

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export default function ProtectedRoute({ children }: ProtectedRouteProps) {
  const { profile, isInitialLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [isRedirecting, setIsRedirecting] = useState(false);
  const isDashboardRoot = pathname === '/dashboard';

  const initiateRedirect = useCallback(
    (path: string) => {
      setIsRedirecting(true);
      router.push(path);
    },
    [router]
  );

  // Check route types with proper subroute handling
  const isPublicRoute = useMemo(
    () => Object.values(PUBLIC_ROUTES).some((route) => pathname === route),
    [pathname]
  );

  const isCommonRoute = useMemo(
    () => Object.values(COMMON_ROUTES).some((route) => pathname.startsWith(route)),
    [pathname]
  );

  const isAdminRoute = useMemo(
    () => Object.values(ADMIN_ROUTES).some((route) => pathname.startsWith(route)),
    [pathname]
  );

  const isProfessionalRoute = useMemo(
    () => Object.values(PROFESSIONAL_ROUTES).some((route) => pathname.startsWith(route)),
    [pathname]
  );

  const isStudentRoute = useMemo(
    () => Object.values(STUDENT_ROUTES).some((route) => pathname.startsWith(route)),
    [pathname]
  );

  // Check if current route requires authentication
  const requiresAuth = useMemo(() => {
    return !isPublicRoute;
  }, [isPublicRoute]);

  // Check if user has access to current route
  const hasAccess = useMemo(() => {
    if (isPublicRoute) return true;

    if (!isAuthenticated) return false;

    if (isCommonRoute || isDashboardRoot) return true;

    if (!profile) return false;

    switch (profile.role) {
      case 'admin':
        return true;

      case 'professional':
        return isProfessionalRoute;

      case 'student':
        return isStudentRoute;

      default:
        return false;
    }
  }, [
    profile,
    isAuthenticated,
    isPublicRoute,
    isCommonRoute,
    isProfessionalRoute,
    isStudentRoute,
    isDashboardRoot,
  ]);

  // Get appropriate redirect route based on user role
  const getRedirectRoute = useCallback((userRole: UserRole): string => {
    const defaultRoutes: Record<UserRole, string> = {
      admin: ADMIN_ROUTES.ADMIN_DASHBOARD,
      professional: PROFESSIONAL_ROUTES.PROFESSIONAL_DASHBOARD,
      student: STUDENT_ROUTES.STUDENT_DASHBOARD,
      user: REDIRECT_ROUTES.USER,
    };
    return defaultRoutes[userRole] || PUBLIC_ROUTES.LOGIN;
  }, []);

  // Handle redirects
  useEffect(() => {
    // Explicitly handle root route - always redirect to login if not authenticated
    // Check this even during initial loading to prevent showing the root page
    if (pathname === '/') {
      if (!isInitialLoading && !isAuthenticated) {
        router.replace(PUBLIC_ROUTES.LOGIN);
        return;
      }
      // If authenticated, let the normal flow handle redirect to dashboard
      if (!isInitialLoading && isAuthenticated && profile) {
        router.replace(getRedirectRoute(profile.role));
        return;
      }
      // During loading, don't do anything yet
      if (isInitialLoading) return;
    }

    if (isInitialLoading) return;

    if (!isAuthenticated && requiresAuth) {
      router.replace(PUBLIC_ROUTES.LOGIN);
      return;
    }

    // Redirect authenticated users away from auth pages
    if (
      isAuthenticated &&
      profile &&
      isPublicRoute &&
      (pathname === PUBLIC_ROUTES.LOGIN || pathname === PUBLIC_ROUTES.REGISTER)
    ) {
      router.replace(getRedirectRoute(profile.role));
      return;
    }

    // Redirect if user doesn't have access to current route
    if (isAuthenticated && profile && !hasAccess && !isPublicRoute) {
      // Use setTimeout to avoid setState during render
      setTimeout(() => initiateRedirect(getRedirectRoute(profile.role)), 0);
      return;
    }

    // If no redirect is needed, ensure isRedirecting is false
    setTimeout(() => setIsRedirecting(false), 0);
  }, [
    profile,
    pathname,
    hasAccess,
    router,
    isInitialLoading,
    requiresAuth,
    isAuthenticated,
    isPublicRoute,
    initiateRedirect,
    getRedirectRoute,
  ]);

  // Don't show loading UI - verify session in background
  // Just render children immediately for better UX
  // Redirects will happen automatically via useEffect
  return <>{children}</>;
}
