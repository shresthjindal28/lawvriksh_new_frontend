'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { Editor } from '@tiptap/react';

interface UseAutoSaveProps {
  editorInstance: Editor | null;
  isLoading: boolean;
  isDraftPending: boolean;
  onSave: (isAutoSave?: boolean) => Promise<void>;
  autoSaveEnabled?: boolean;
  debounceMs?: number;
}

interface UseAutoSaveReturn {
  hasUnsavedChanges: boolean;
  triggerDebouncedSave: () => void;
  markAsSaved: () => void;
}

export function useAutoSave({
  editorInstance,
  isLoading,
  isDraftPending,
  onSave,
  autoSaveEnabled = true,
  debounceMs = 5000,
}: UseAutoSaveProps): UseAutoSaveReturn {
  const initialSaveTriggeredRef = useRef(false);
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Cleanup debounce timer on unmount
  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, []);

  // Trigger debounced save - call this when content changes
  const triggerDebouncedSave = useCallback(() => {
    // Mark as having unsaved changes
    setHasUnsavedChanges(true);

    // Clear any existing debounce timer
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    // Only set up autosave timer if autosave is enabled
    if (!autoSaveEnabled) {
      return;
    }

    // Skip if conditions not met
    if (!editorInstance || isLoading || isDraftPending) {
      return;
    }

    // Set new debounce timer
    debounceTimerRef.current = setTimeout(() => {
      onSave(true)
        .then(() => {
          setHasUnsavedChanges(false);
          console.log('✅ Debounced autosave completed');
        })
        .catch((error) => {
          console.error('Debounced autosave failed:', error);
        });
    }, debounceMs);
  }, [editorInstance, isLoading, isDraftPending, onSave, autoSaveEnabled, debounceMs]);

  // Mark as saved - call after manual save
  const markAsSaved = useCallback(() => {
    setHasUnsavedChanges(false);
    // Clear pending debounce since we just saved
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
      debounceTimerRef.current = null;
    }
  }, []);

  // Initial save effect - trigger save once when editor is ready
  useEffect(() => {
    if (editorInstance && !isLoading && !initialSaveTriggeredRef.current) {
      const timeoutId = setTimeout(() => {
        if (!initialSaveTriggeredRef.current) {
          initialSaveTriggeredRef.current = true;
          console.log('🚀 Triggering initial save...');
          onSave(true)
            .then(() => {
              setHasUnsavedChanges(false);
            })
            .catch((error) => {
              console.error('Initial save failed:', error);
            });
        }
      }, 2000);

      return () => clearTimeout(timeoutId);
    }
  }, [editorInstance, isLoading, onSave]);

  return {
    hasUnsavedChanges,
    triggerDebouncedSave,
    markAsSaved,
  };
}

export default useAutoSave;
