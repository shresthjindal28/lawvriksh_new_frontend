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
import StudentDialog from '@/components/ui/StudentDialog';
import { dmsImageService } from '@/lib/api/imageService';
import { authService } from '@/lib/api/authService';
import { ProjectCategory } from '@/types/project';
import { useSidebarUIStore } from '@/store/zustand/useSidebarUIStore';
import { useCreateProject } from '@/lib/api/queries/workspace/useCreateProject';
import { cn } from '@/lib/utils';
import '@/styles/dashboard-styles/sidebar.css';
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
        className={cn(
          'w-full h-12 px-4 rounded-xl bg-transparent border-none cursor-pointer flex items-center text-left relative font-medium',
          'text-[#627c7d] hover:text-[#133435] hover:bg-[#f5f5f5]',
          'transition-colors duration-150',
          isActive && 'text-brand-700 bg-brand-50 font-semibold',
          effectiveCollapsed ? 'justify-center px-0' : 'justify-start'
        )}
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
              <IconComponent className="w-6 h-6 shrink-0 opacity-100" strokeWidth={2} />
            </div>
          ) : (
            <div className="flex items-center justify-between w-full h-full">
              <div className="flex items-center gap-2 flex-1">
                <IconComponent className="w-5 h-5 shrink-0 opacity-100" strokeWidth={2} />
                <motion.span
                  className="font-inherit text-[0.95rem] leading-6 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight"
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
              className="absolute left-[-16px] top-1/2 -translate-y-1/2 w-1 h-6 rounded-r-full bg-brand-700"
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            />
          )}
        </motion.div>
      </Link>
    );
  };

  return (
    <motion.aside
      className={cn(
        'h-screen flex flex-col fixed top-0 z-auto',
        'border-r border-dashboard-border-light shadow-sidebar',
        'bg-[#fafafa]',
        effectiveCollapsed ? 'w-20 p-0 z-50' : 'w-sidebar-expanded z-50',
        isMobileOpen && 'z-50'
      )}
      animate={effectiveCollapsed ? 'collapsed' : 'expanded'}
      variants={sidebarVariants}
    >
      <header className="p-4 pt-6 mb-2">
        <div
          className={cn(
            'flex items-center p-0',
            effectiveCollapsed ? 'justify-center' : 'justify-start'
          )}
        >
          <div
            className={cn(
              'flex items-center w-full',
              effectiveCollapsed ? 'justify-center' : 'justify-start'
            )}
          >
            <motion.button
              className="p-2 bg-transparent border-none cursor-pointer flex items-center justify-center opacity-80 rounded-lg hover:opacity-100 hover:bg-[#f5f5f5]"
              type="button"
              onClick={handleToggleCollapse}
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.95 }}
            >
              {effectiveCollapsed ? (
                <PanelLeftOpen className="w-6 h-6 text-[#627c7d]" />
              ) : (
                <PanelLeftClose className="w-6 h-6 text-[#627c7d]" />
              )}
            </motion.button>
          </div>
        </div>
      </header>

      {/* Start Writing Button */}
      <div className={cn('py-3 mb-4', effectiveCollapsed ? 'px-0 flex justify-center' : 'px-4')}>
        <motion.button
          className={cn(
            'bg-lv-bg-button-dark border-none rounded-lg flex items-center justify-center gap-2.5',
            'text-white cursor-pointer font-["Instrument_Sans",sans-serif] font-light text-base',
            'shadow-[0_4px_12px_rgba(0,0,0,0.1)] relative overflow-hidden',
            'hover:shadow-[0_6px_16px_rgba(0,0,0,0.15)]',
            effectiveCollapsed ? 'w-10 h-10 p-0 m-0 rounded-[10px]' : 'w-full h-[52px]'
          )}
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
            <Plus className="w-6 h-6 shrink-0 text-white stroke-white" />
          </motion.div>
          <AnimatePresence>
            {!effectiveCollapsed && (
              <motion.span
                className="whitespace-nowrap font-normal font-['Instrument_Sans',sans-serif]"
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

      <nav className="flex-1 px-4 overflow-y-auto scrollbar-none">
        <div className="flex flex-col gap-2">{filteredNavItems.map(renderNavItem)}</div>
      </nav>

      <div className="mt-auto px-4 pb-6 flex flex-col gap-4">
        <nav className="flex flex-col gap-2 pt-4 border-t border-[#e5e5e5]">
          {adjustedBottomNav.map(renderNavItem)}
          <motion.button
            className={cn(
              'w-full h-12 px-4 rounded-xl bg-transparent border-none cursor-pointer flex items-center text-left relative font-medium mt-2',
              'text-[#627c7d] hover:bg-[#f5f5f5]',
              effectiveCollapsed ? 'justify-center px-0' : ''
            )}
            onClick={handleProfileClick}
            title={effectiveCollapsed ? user.name || user.username || 'NA' : 'Profile'}
            whileHover={{ backgroundColor: '#f5f5f5' }}
          >
            <motion.div
              className={cn('flex items-center w-full', effectiveCollapsed && 'justify-center')}
              whileHover={{ x: effectiveCollapsed ? 0 : 4 }}
              transition={{ type: 'spring', stiffness: 400, damping: 20 }}
            >
              {effectiveCollapsed ? (
                <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-[#fafafa] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                  <Image
                    src={profileImageUrl}
                    alt={user.name || user.username || 'NA'}
                    className="w-full h-full rounded-full object-cover"
                    width={28}
                    height={28}
                    unoptimized
                  />
                </div>
              ) : (
                <div className="flex items-center justify-between w-full h-full">
                  <div className="flex items-center gap-2 flex-1">
                    <div className="w-8 h-8 rounded-full overflow-hidden shrink-0 border-2 border-[#fafafa] shadow-[0_2px_4px_rgba(0,0,0,0.05)]">
                      <Image
                        src={profileImageUrl}
                        alt={user.name || user.username || 'NA'}
                        className="w-full h-full rounded-full object-cover"
                        width={28}
                        height={28}
                        unoptimized
                      />
                    </div>
                    <motion.span
                      className="font-inherit text-[0.95rem] leading-6 whitespace-nowrap overflow-hidden text-ellipsis tracking-tight"
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
