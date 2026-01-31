'use client';

import { useEffect, useCallback, useState } from 'react';
import { useRouter } from 'next/navigation';

interface UseUnsavedChangesWarningProps {
  hasUnsavedChanges: boolean;
  autoSaveEnabled: boolean;
  onSave?: () => Promise<void>;
}

interface UseUnsavedChangesWarningReturn {
  showWarningModal: boolean;
  pendingNavigation: string | null;
  handleSaveAndContinue: () => Promise<void>;
  handleDiscardChanges: () => void;
  handleCancelNavigation: () => void;
}

export function useUnsavedChangesWarning({
  hasUnsavedChanges,
  autoSaveEnabled,
  onSave,
}: UseUnsavedChangesWarningProps): UseUnsavedChangesWarningReturn {
  const router = useRouter();
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<string | null>(null);

  // Only show warning when autosave is disabled AND there are unsaved changes
  const shouldWarn = hasUnsavedChanges && !autoSaveEnabled;

  // Browser beforeunload event for page close/refresh
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (shouldWarn) {
        e.preventDefault();
        e.returnValue = 'You have unsaved changes. Are you sure you want to leave?';
        return e.returnValue;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [shouldWarn]);

  // Intercept link clicks to show our custom modal
  useEffect(() => {
    if (!shouldWarn) return;

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const anchor = target.closest('a');

      if (anchor && anchor.href && !anchor.href.startsWith('#')) {
        const url = new URL(anchor.href);
        const currentUrl = new URL(window.location.href);

        // Only intercept internal navigation, not external links
        if (url.origin === currentUrl.origin && url.pathname !== currentUrl.pathname) {
          e.preventDefault();
          e.stopPropagation();
          setPendingNavigation(anchor.href);
          setShowWarningModal(true);
        }
      }
    };

    // Also intercept popstate (browser back/forward buttons)
    const handlePopState = (e: PopStateEvent) => {
      if (shouldWarn) {
        // Push current state back to prevent immediate navigation
        window.history.pushState(null, '', window.location.href);
        setShowWarningModal(true);
        setPendingNavigation('back');
      }
    };

    // Push state to enable popstate interception
    window.history.pushState(null, '', window.location.href);

    document.addEventListener('click', handleClick, true);
    window.addEventListener('popstate', handlePopState);

    return () => {
      document.removeEventListener('click', handleClick, true);
      window.removeEventListener('popstate', handlePopState);
    };
  }, [shouldWarn]);

  const handleSaveAndContinue = useCallback(async () => {
    if (onSave) {
      await onSave();
    }
    setShowWarningModal(false);

    if (pendingNavigation === 'back') {
      window.history.back();
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setPendingNavigation(null);
  }, [onSave, pendingNavigation, router]);

  const handleDiscardChanges = useCallback(() => {
    setShowWarningModal(false);

    if (pendingNavigation === 'back') {
      window.history.back();
    } else if (pendingNavigation) {
      router.push(pendingNavigation);
    }
    setPendingNavigation(null);
  }, [pendingNavigation, router]);

  const handleCancelNavigation = useCallback(() => {
    setShowWarningModal(false);
    setPendingNavigation(null);
  }, []);

  return {
    showWarningModal,
    pendingNavigation,
    handleSaveAndContinue,
    handleDiscardChanges,
    handleCancelNavigation,
  };
}

export default useUnsavedChangesWarning;
