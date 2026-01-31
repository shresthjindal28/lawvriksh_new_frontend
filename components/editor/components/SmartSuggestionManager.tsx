'use client';

import React, { useEffect, useRef, useCallback, useState } from 'react';
import { Editor } from '@tiptap/react';
import { useSmartSuggestion } from '@/hooks/writing-hooks';
import SuggestionHoverTooltip from '@/components/ui/SuggestionHoverTooltip';
import { useAppSettings } from '@/hooks/common/useAppSettings';

interface SmartSuggestionManagerProps {
  editorInstance: Editor | null;
  projectId: string;
  userId: string;
  templateContent: string;
  listRefDocuments: () => Promise<any[]>;
  isDrafting: boolean;
}

const TYPING_DEBOUNCE_MS = 700;

const SmartSuggestionManager: React.FC<SmartSuggestionManagerProps> = ({
  editorInstance,
  projectId,
  userId,
  templateContent,
  listRefDocuments,
  isDrafting = false,
}) => {
  // State for tooltip
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });

  // Refs
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isFetchingRef = useRef(false);
  const sessionInitializedRef = useRef(false);
  const lastContentRef = useRef<string>('');

  // Smart suggestion hook
  const {
    isSessionReady,
    suggestion: hookSuggestion,
    initSession,
    fetchSuggestion,
    dismissSuggestion,
    closeSession,
    cycleSuggestion,
  } = useSmartSuggestion({ projectId, userId });

  const { isSmartKeyPointSuggestionEnabled } = useAppSettings();

  // ==================== COMMAND HELPER ====================

  const setExtensionSuggestion = useCallback(
    (text: string | null) => {
      if (!editorInstance || editorInstance.isDestroyed) return;

      if (text) {
        editorInstance.commands.setSmartSuggestion(text);
        // Removed auto-show tooltip. Now handled by hover events.
      } else {
        editorInstance.commands.clearSmartSuggestion();
        setTooltipVisible(false);
      }
    },
    [editorInstance]
  );

  // Handle Tooltip Hover Events
  useEffect(() => {
    const handleHoverStart = (e: CustomEvent) => {
      const rect = e.detail.rect;
      setTooltipPosition({ x: rect.left, y: rect.bottom + 5 });
      setTooltipVisible(true);
    };

    const handleHoverEnd = () => {
      console.log('[SmartSuggestionManager] Hover end - hiding tooltip');
      setTooltipVisible(false);
    };

    document.addEventListener('smart-suggestion-hover-start', handleHoverStart as EventListener);
    document.addEventListener('smart-suggestion-hover-end', handleHoverEnd as EventListener);

    return () => {
      document.removeEventListener(
        'smart-suggestion-hover-start',
        handleHoverStart as EventListener
      );
      document.removeEventListener('smart-suggestion-hover-end', handleHoverEnd as EventListener);
    };
  }, []);

  // ==================== SESSION MANAGEMENT ====================
  // ==================== SESSION MANAGEMENT ====================

  useEffect(() => {
    console.log(
      '[SmartSuggestionManager] Init Effect running. Ref:',
      sessionInitializedRef.current,
      'ContentLen:',
      templateContent?.length,
      'UserId:',
      userId
    );

    if (sessionInitializedRef.current || !templateContent || !userId) {
      console.log('[SmartSuggestionManager] Skipping init. Conditions not met.');
      return;
    }

    const initializeSession = async () => {
      console.log('[SmartSuggestionManager] Initializing session...');
      const tempDiv = document.createElement('div');
      tempDiv.innerHTML = templateContent;
      const draftText = tempDiv.textContent || tempDiv.innerText || '';

      const refs = await listRefDocuments();
      sessionInitializedRef.current = true;
      try {
        await initSession(draftText, refs || []);
        console.log('[SmartSuggestionManager] Session initialization requested');
      } catch (e) {
        console.error('[SmartSuggestionManager] Session init failed', e);
        sessionInitializedRef.current = false; // Retry on failure?
      }
    };

    initializeSession();
  }, [templateContent, userId, initSession, listRefDocuments]);

  // Unmount cleanup
  useEffect(() => {
    return () => {
      console.log('[SmartSuggestionManager] Component unmounting. Closing session.');
      closeSession();
    };
  }, [closeSession]);

  // Editor/Interaction cleanup
  useEffect(() => {
    return () => {
      setExtensionSuggestion(null);
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }
    };
  }, [setExtensionSuggestion]);

  // ==================== SUGGESTION SYNC ====================

  // Sync hook suggestion to Extension
  useEffect(() => {
    if (isDrafting) {
      setExtensionSuggestion(null);
      return;
    }

    console.log(
      '[SmartSuggestionManager] Syncing hook suggestion:',
      hookSuggestion ? hookSuggestion.substring(0, 30) + '...' : 'null'
    );

    if (hookSuggestion) {
      setExtensionSuggestion(hookSuggestion);
    }
  }, [hookSuggestion, isDrafting, setExtensionSuggestion]);

  // ==================== CONTENT CHANGE HANDLER ====================

  useEffect(() => {
    if (!editorInstance || editorInstance.isDestroyed) {
      console.log('[SmartSuggestionManager] No editor instance or destroyed');
      return;
    }

    console.log('[SmartSuggestionManager] Attaching update listener');

    // Initialize last content
    lastContentRef.current = editorInstance.getText();

    const handleUpdate = () => {
      const currentText = editorInstance.getText();
      console.log('[SmartSuggestionManager] Update triggered. Length:', currentText.length);

      // If content hasn't changed (e.g. selection change), ignore for fetching
      if (currentText === lastContentRef.current) {
        // Content unchanged
        return;
      }
      console.log('[SmartSuggestionManager] Content changed. Scheduling debounce.');
      lastContentRef.current = currentText;

      // Clear previous timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = null;
      }

      // Hide tooltip immediately on typing
      setTooltipVisible(false);

      // Debounce API call
      typingTimeoutRef.current = setTimeout(async () => {
        console.log('[SmartSuggestionManager] Debounce fired. Checking conditions...');

        if (isFetchingRef.current) {
          console.log('[SmartSuggestionManager] Already fetching');
          return;
        }
        if (isDrafting) {
          console.log('[SmartSuggestionManager] Is drafting, skipping');
          return;
        }
        if (!isSessionReady) {
          console.log('[SmartSuggestionManager] Session not ready');
          return;
        }
        if (!editorInstance || editorInstance.isDestroyed) return;

        // Skip if content is too short
        const text = editorInstance.getText();
        if (text.trim().length < 5) {
          console.log('[SmartSuggestionManager] Text too short');
          return;
        }

        isFetchingRef.current = true;

        try {
          // Gating check: if smart suggestion is disabled, do not fetch
          if (!isSmartKeyPointSuggestionEnabled) {
            console.log('[SmartSuggestionManager] Smart suggestion disabled in settings');
            return;
          }

          console.log('[SmartSuggestionManager] Fetching suggestion from hook...');
          dismissSuggestion(); // Clear old hook state
          await fetchSuggestion(text);
        } catch (err) {
          console.error('[SmartSuggestionManager] Error fetching:', err);
        } finally {
          isFetchingRef.current = false;
        }
      }, TYPING_DEBOUNCE_MS);
    };

    editorInstance.on('update', handleUpdate);

    // Listen to selection updates to hide tooltip if suggestion was cleared by extension
    editorInstance.on('selectionUpdate', () => {
      try {
        const hasSuggestion = !!(editorInstance.storage as any).smartSuggestion?.suggestion;
        if (!hasSuggestion) {
          setTooltipVisible(false);
        }
      } catch (e) {
        // Ignore storage access errors
      }
    });

    return () => {
      console.log('[SmartSuggestionManager] Detaching listeners');
      editorInstance.off('update', handleUpdate);
      editorInstance.off('selectionUpdate');
    };
  }, [
    editorInstance,
    isSessionReady,
    isDrafting,
    dismissSuggestion,
    fetchSuggestion,
    isSmartKeyPointSuggestionEnabled,
  ]);

  // ==================== KEYBOARD HANDLERS (Manual Alt+N) ====================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Alt+N to cycle
      if (e.altKey && (e.key === 'n' || e.key === 'N')) {
        console.log('[SmartSuggestionManager] Alt+N pressed');
        // Only if we have an active suggestion in extension
        const hasSuggestion = !!(editorInstance?.storage as any).smartSuggestion?.suggestion;

        if (hasSuggestion) {
          console.log('[SmartSuggestionManager] Cycling suggestion...');
          e.preventDefault();
          e.stopPropagation();
          cycleSuggestion(); // Cycle hook state -> triggers useEffect -> updates extension
        } else {
          console.log('[SmartSuggestionManager] No active suggestion to cycle');
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown, true);
    return () => {
      document.removeEventListener('keydown', handleKeyDown, true);
    };
  }, [editorInstance, cycleSuggestion]);

  // ==================== RENDER ====================

  return (
    <SuggestionHoverTooltip
      visible={tooltipVisible && isSmartKeyPointSuggestionEnabled}
      x={tooltipPosition.x}
      y={tooltipPosition.y}
    />
  );
};

export default SmartSuggestionManager;
