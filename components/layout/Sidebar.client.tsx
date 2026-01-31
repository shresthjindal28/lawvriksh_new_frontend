'use client';
import {
  Plus,
  Home,
  BookOpen,
  Library,
  Trash2,
  CreditCard,
  Settings,
  FileText,
  PanelLeftClose,
  PanelLeftOpen,
} from 'lucide-react';
import React, { useCallback, useEffect, useLayoutEffect, useMemo } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { motion, AnimatePresence, Variants } from 'framer-motion';
import { useQuery } from '@tanstack/react-query';
import { UserProfile } from '../../types';
import { NavigationItem } from '@/lib/config/sidebarConfig';
import '@/styles/dashboard-styles/sidebar.css';
import StudentDialog from '@/components/ui/StudentDialog';
import { dmsImageService } from '@/lib/api/imageService';
import { authService } from '@/lib/api/authService';
import { ProjectCategory } from '@/types/project';
import { useSidebarUIStore } from '@/store/zustand/useSidebarUIStore';
import { useCreateProject } from '@/lib/api/queries/workspace/useCreateProject';

interface SidebarProps {
  user: UserProfile;
  navigationItems: NavigationItem[];
  bottomNavigationItems: NavigationItem[];
  isMobileOpen?: boolean;
  onMobileClose?: () => void;
  onCollapseChange?: (collapsed: boolean) => void;
}

// Animation Variants
const sidebarVariants: Variants = {
  expanded: {
    width: 280, // Updated width
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
  collapsed: {
    width: 80, // Updated width
    transition: {
      type: 'spring',
      stiffness: 300,
      damping: 30,
    },
  },
};

const textVariants: Variants = {
  hidden: { opacity: 0, width: 0, display: 'none' },
  visible: {
    opacity: 1,
    width: 'auto',
    display: 'block',
    transition: { duration: 0.2 },
  },
};

// Map navigation item IDs to Lucide React icons
const getIconForItem = (itemId: string) => {
  const iconMap: Record<string, React.ElementType> = {
    home: Home,
    workspace: Home, // Workspace uses home icon
    'reference-manager': BookOpen,
    library: Library,
    'trash-bin': Trash2,
    subscription: CreditCard,
    settings: Settings,
  };
  return iconMap[itemId] || FileText;
};

export default function Sidebar({
  user,
  navigationItems,
  bottomNavigationItems,
  isMobileOpen,
  onMobileClose,
  onCollapseChange,
}: SidebarProps) {
  const isCollapsed = useSidebarUIStore((state) => state.isCollapsed);
  const isDialogOpen = useSidebarUIStore((state) => state.isDialogOpen);
  const selectedCategory = useSidebarUIStore((state) => state.selectedCategory);
  const optimisticPath = useSidebarUIStore((state) => state.optimisticPath);

  const toggleCollapsed = useSidebarUIStore((state) => state.toggleCollapsed);
  const openDialog = useSidebarUIStore((state) => state.openDialog);
  const closeDialog = useSidebarUIStore((state) => state.closeDialog);
  const setSelectedCategory = useSidebarUIStore((state) => state.setSelectedCategory);
  const setOptimisticPath = useSidebarUIStore((state) => state.setOptimisticPath);
  const resetSidebarUIState = useSidebarUIStore((state) => state.reset);

  const router = useRouter();
  const pathname = usePathname();
  const createProjectMutation = useCreateProject();
  const isCreating = createProjectMutation.isPending;
  const userKey = user.user_id || user.email || user.username || user.role || 'user';

  const userSmUrl = user.profile_image_urls?.sm;
  const userSmUrlValid =
    !!userSmUrl && (userSmUrl.startsWith('http') || userSmUrl.startsWith('blob:'));

  const userPictureValid =
    !!user.picture && (user.picture.startsWith('http') || user.picture.startsWith('blob:'));

  const storedUrls = useMemo(() => authService.getStoredProfileImageUrls(), []);
  const storedSmUrlValid =
    !!storedUrls?.sm && (storedUrls.sm.startsWith('http') || storedUrls.sm.startsWith('blob:'));

  const shouldFetchProfileImageUrls = !userSmUrlValid && !userPictureValid;

  const profileImageUrlsQuery = useQuery({
    queryKey: ['sidebar', 'profileImageUrls', userKey],
    enabled: shouldFetchProfileImageUrls,
    initialData: storedUrls ?? undefined,
    queryFn: async () => {
      const response = await dmsImageService.getProfileImageUrls();
      if (!response.success || !response.data?.urls) {
        throw new Error(response.message || 'Failed to fetch profile image URLs');
      }
      return response.data.urls;
    },
    staleTime: 1000 * 60 * 60 * 24,
    gcTime: 1000 * 60 * 60 * 24 * 7,
  });

  useEffect(() => {
    const urls = profileImageUrlsQuery.data;
    if (!urls || typeof urls !== 'object') return;
    if (Object.keys(urls).length === 0) return;
    authService.storeProfileImageUrls(urls as Record<string, string>);
  }, [profileImageUrlsQuery.data]);

  const profileImageUrl = useMemo(() => {
    if (userSmUrlValid) return userSmUrl!;
    if (userPictureValid) return user.picture!;
    if (storedSmUrlValid) return storedUrls!.sm;

    const fetchedSmUrl = (profileImageUrlsQuery.data as any)?.sm;
    if (
      typeof fetchedSmUrl === 'string' &&
      (fetchedSmUrl.startsWith('http') || fetchedSmUrl.startsWith('blob:'))
    ) {
      return fetchedSmUrl;
    }

    return '/assets/images/background-image/backgroundImage.png';
  }, [
    profileImageUrlsQuery.data,
    storedSmUrlValid,
    storedUrls,
    user.picture,
    userPictureValid,
    userSmUrl,
    userSmUrlValid,
  ]);

  // Force expanded state when mobile menu is open
  const effectiveCollapsed = isMobileOpen ? false : isCollapsed;

  // Adjust trash-bin path based on user role
  const adjustedBottomNav = useMemo(() => {
    return bottomNavigationItems.map((item) => {
      if (item.id === 'trash-bin') {
        return {
          ...item,
          path: `/dashboard/${user.role}/trash-bin`,
        };
      }
      if (item.id === 'subscription') {
        return {
          ...item,
          path: `/dashboard/${user.role}/subscription`,
        };
      }
      return item;
    });
  }, [bottomNavigationItems, user.role]);

  // Close mobile sidebar on route change
  useEffect(() => {
    if (onMobileClose && isMobileOpen) {
      onMobileClose();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  useLayoutEffect(() => {
    setOptimisticPath(pathname);
  }, [pathname, setOptimisticPath]);

  useEffect(() => {
    return () => {
      resetSidebarUIState();
    };
  }, [resetSidebarUIState]);

  const filteredNavItems = useMemo(() => {
    return navigationItems.filter((item) => item.id !== 'documents');
  }, [navigationItems]);

  useEffect(() => {
    const paths = Array.from(
      new Set([...filteredNavItems.map((i) => i.path), ...adjustedBottomNav.map((i) => i.path)])
    );

    let cancelled = false;

    const runPrefetch = () => {
      if (cancelled) return;
      paths.forEach((p) => {
        try {
          router.prefetch(p);
        } catch {}
      });
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
      const ric = (window as any).requestIdleCallback(runPrefetch, { timeout: 2000 });
      return () => {
        cancelled = true;
        if ('cancelIdleCallback' in window) {
          (window as any).cancelIdleCallback(ric);
        }
      };
    }

    const timeoutId = setTimeout(runPrefetch, 0);
    return () => {
      cancelled = true;
      clearTimeout(timeoutId);
    };
  }, [adjustedBottomNav, filteredNavItems, router]);

  const handleNavClick = useCallback(
    (path: string) => {
      return (e: React.MouseEvent) => {
        if (e.defaultPrevented) return;
        if (e.button !== 0) return;
        if (e.metaKey || e.altKey || e.ctrlKey || e.shiftKey) return;
        setOptimisticPath(path);
      };
    },
    [setOptimisticPath]
  );

  const handleToggleCollapse = () => {
    // If mobile is open, toggling might close it or do nothing.
    // Usually toggle is hidden on mobile, but if visible, we should just update local state
    const newCollapsed = toggleCollapsed();
    onCollapseChange?.(newCollapsed);
  };

  const handleProfileClick = async () => {
    try {
      router.push(`/dashboard/${user.role}/profile`);
    } catch (error) {
      console.error('Error navigating to profile:', error);
    }
  };

  // New project dialog handlers
  const handleNewProjectClick = () => {
    setSelectedCategory('ideation'); // Default to ideation for general new project
    openDialog();
  };

  const handleDialogClose = () => {
    if (!isCreating) {
      closeDialog();
    }
  };

  const handleProjectCreate = async (data: any) => {
    try {
      await createProjectMutation.mutateAsync(data);
      // Dialog will close automatically in handleDialogClose
    } catch (error) {
      console.error('Error creating project:', error);
    }
  };

  // Helper function to render a navigation item
  const renderNavItem = (item: NavigationItem) => {
    const isActive = optimisticPath === item.path;
    const IconComponent = getIconForItem(item.id);

    return (
      <Link
        key={item.id}
        href={item.path}
        className={`sidebar__nav-item ${isActive ? 'sidebar__nav-item--active' : ''} ${effectiveCollapsed ? 'sidebar__nav-item--collapsed' : ''}`}
        title={effectiveCollapsed ? item.label : undefined}
        onClick={handleNavClick(item.path)}
      >
        <motion.div
          className="flex items-center w-full relative"
          whileHover={{ x: effectiveCollapsed ? 0 : 4 }}
          transition={{ type: 'spring', stiffness: 400, damping: 20 }}
        >
          {effectiveCollapsed ? (
            <div className="flex justify-center w-full">
              <IconComponent
                className="sidebar__nav-icon sidebar__nav-icon--collapsed"
                strokeWidth={2}
              />
            </div>
          ) : (
            <div className="sidebar__nav-content">
              <div className="sidebar__nav-label">
                <IconComponent className="sidebar__nav-icon" strokeWidth={2} />
                <motion.span
                  className="sidebar__nav-text"
                  initial="hidden"
                  animate="visible"
                  variants={textVariants}
                >
                  {item.label}
                </motion.span>
              </div>
            </div>
          )}
          {isActive && !effectiveCollapsed && (
            <motion.div
              layoutId="activeIndicator"
              className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full"
              style={{ backgroundColor: 'var(--sidebar-active-text)' }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.aside
      className={`sidebar ${effectiveCollapsed ? 'sidebar--collapsed' : 'sidebar--expanded'} ${isMobileOpen ? 'sidebar--mobile-open' : ''}`}
      animate={effectiveCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
    >
      <header className="sidebar__header">
        <div
          className={
            effectiveCollapsed ? 'sidebar__header-content-collapsed' : 'sidebar__header-content'
          }
        >
          <div className="sidebar__toggle-container">
            <motion.button
              className="sidebar__toggle-btn"
              type="button"
              onClick={handleToggleCollapse}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {effectiveCollapsed ? (
                <PanelLeftOpen className="sidebar__toggle-icon" />
              ) : (
                <PanelLeftClose className="sidebar__toggle-icon" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Start Writing Button */}
      <div className="sidebar__new-project-section">
        <motion.button
          className={`sidebar__new-project-btn ${effectiveCollapsed ? 'sidebar__new-project-btn--collapsed' : ''}`}
          title={effectiveCollapsed ? 'Start Writing' : ''}
          onClick={handleNewProjectClick}
          whileHover={{ scale: 1.02, boxShadow: '0 8px 15px rgba(0, 0, 0, 0.1)' }}
          whileTap={{ scale: 0.98 }}
        >
          <motion.div
            animate={{ rotate: effectiveCollapsed ? 0 : 180 }}
            transition={{ duration: 0.5, ease: 'easeInOut' }}
            className="flex items-center justify-center"
          >
            <Plus className="sidebar__new-project-icon" />
          </motion.div>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.span
                className="sidebar__new-project-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                Start Writing
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>

      <nav className="sidebar__nav">
        <div className="sidebar__nav-list">{filteredNavItems.map(renderNavItem)}</div>
      </nav>

      <div className="sidebar__footer">
        <nav className="sidebar__bottom-nav">
          {adjustedBottomNav.map(renderNavItem)}
          <motion.button
            className={`sidebar__nav-item ${effectiveCollapsed ? 'sidebar__nav-item--collapsed' : ''} mt-2`}
            onClick={handleProfileClick}
            title={effectiveCollapsed ? user.name || user.username || 'NA' : 'Profile'}
            whileHover={{ backgroundColor: 'var(--sidebar-hover-bg)' }}
          >
            <motion.div
              className={`flex items-center w-full ${effectiveCollapsed ? 'justify-center' : ''}`}
              whileHover={{ x: effectiveCollapsed ? 0 : 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {effectiveCollapsed ? (
                <div className="sidebar__avatar sidebar__avatar--collapsed">
                  <Image
                    src={profileImageUrl}
                    alt={user.name || user.username || 'NA'}
                    className="sidebar__avatar-img"
                    width={28}
                    height={28}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="sidebar__nav-content">
                  <div className="sidebar__nav-label">
                    <div className="sidebar__avatar">
                      <Image
                        src={profileImageUrl}
                        alt={user.name || user.username || 'NA'}
                        className="sidebar__avatar-img"
                        width={28}
                        height={28}
                        unoptimized
                      />
                    </div>
                    <motion.span
                      className="sidebar__nav-text"
                      initial="hidden"
                      animate="visible"
                      variants={textVariants}
                    >
                      {user.name || user.username || 'NA'}
                    </motion.span>
                  </div>
                </div>
              )}
            </motion.div>
          </motion.button>
        </nav>
      </div>

      {/* New Project Dialog */}
      <StudentDialog
        isOpen={isDialogOpen}
        onClose={handleDialogClose}
        onSubmit={handleProjectCreate}
        isLoading={isCreating}
        category={selectedCategory}
        dialogKey="sidebar"
      />
    </motion.aside>
  );
}
