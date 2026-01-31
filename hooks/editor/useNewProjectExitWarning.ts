import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface UseNewProjectExitWarningProps {
  isNewProject: boolean;
  onDiscard: () => Promise<void>;
  onSave: () => void;
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
}

export function useNewProjectExitWarning({
  isNewProject,
  onDiscard,
  onSave,
  isOpen,
  setIsOpen,
}: UseNewProjectExitWarningProps) {
  const router = useRouter();
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Browser beforeunload event for page close/refresh
  useEffect(() => {
    if (!isNewProject) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      e.preventDefault();
      e.returnValue = 'You have a new project. Do you want to save or discard it?';
      return e.returnValue;
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isNewProject]);

  // Intercept navigation
  useEffect(() => {
    if (!isNewProject) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.href.startsWith('#')) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        // Only intercept internal navigation
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(anchor.href);
          setIsOpen(true);
        }
      }
    };

    const handlePopState = (e: PopStateEvent) => {
      // Prevent back navigation
      window.history.pushState(null, '', window.location.href);
      setPendingNavigation('back');
      setIsOpen(true);
    };

    // Push state to allow intercepting the first back action
    // Check if we haven't already pushed state to avoid duplicates if re-rendering
    // But re-running effect cleans up listeners, so it's fine.
    // However, pushing state repeatedly on every render is bad.
    // The effect dependency is [isNewProject].
    window.history.pushState(null, '', window.location.href);

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [isNewProject, setIsOpen]);

  const handleConfirmSave = useCallback(() => {
    onSave(); // Should handle saving (if needed)

    // Perform navigation
    if (pendingNavigation === 'back') {
      router.push('/dashboard');
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    } else {
      router.push('/dashboard');
    }
  }, [onSave, pendingNavigation, router]);

  const handleConfirmDiscard = useCallback(async () => {
    await onDiscard();
    // Navigation should be handled by onDiscard (e.g. router.push('/dashboard'))
    // But if onDiscard just deletes, we need to navigate.
    // The passed onDiscard usually includes navigation.
  }, [onDiscard]);

  return {
    handleConfirmSave,
    handleConfirmDiscard,
  };
}
