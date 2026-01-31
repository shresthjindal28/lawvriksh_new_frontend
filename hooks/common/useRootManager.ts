import { useCallback, useRef } from 'react';
import { TIMING } from '@/lib/constants/editor';
import { Root } from 'react-dom/client';

export function useRootManager() {
  const widgetRootsRef = useRef<Map<string, Root>>(new Map());
  const displayRootsRef = useRef<Map<string, Root>>(new Map());
  const insertWidgetRootsRef = useRef<Map<string, Root>>(new Map());

  const safeUnmount = useCallback((root: Root) => {
    setTimeout(() => {
      try {
        root.unmount();
      } catch (error) {
        console.error('Error unmounting root:', error);
      }
    }, TIMING.UNMOUNT_DELAY);
  }, []);

  const cleanupRoots = useCallback(
    (rootsMap: React.MutableRefObject<Map<string, Root>>) => {
      rootsMap.current.forEach(safeUnmount);
      rootsMap.current.clear();
    },
    [safeUnmount]
  );

  const cleanupAll = useCallback(() => {
    cleanupRoots(widgetRootsRef);
    cleanupRoots(displayRootsRef);
    cleanupRoots(insertWidgetRootsRef);
  }, [cleanupRoots]);

  return {
    widgetRootsRef,
    displayRootsRef,
    insertWidgetRootsRef,
    safeUnmount,
    cleanupRoots,
    cleanupAll,
  };
}
