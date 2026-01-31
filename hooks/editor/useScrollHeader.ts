'use client';

import { useState, useCallback, useRef } from 'react';

interface UseScrollHeaderReturn {
  headersHidden: boolean;
  editorScrollRef: (node: HTMLDivElement | null) => void;
}

/**
 * useScrollHeader - Manages header hide/show based on scroll direction
 *
 * Behavior:
 * - Scroll down > 15px: Hide headers
 * - Scroll up > 15px: Show headers
 * - Near top (< 30px): Always show headers
 * - Near bottom: Don't change
 */
export function useScrollHeader(): UseScrollHeaderReturn {
  const [headersHidden, setHeadersHidden] = useState(false);
  const lastScrollY = useRef(0);
  const scrollContainerRef = useRef<HTMLDivElement | null>(null);

  /**
   * Callback ref for scroll container - attaches scroll listener
   */
  const editorScrollRef = useCallback((node: HTMLDivElement | null) => {
    scrollContainerRef.current = node;

    if (node) {
      const handleScroll = () => {
        const currentScrollY = node.scrollTop;
        const scrollHeight = node.scrollHeight;
        const clientHeight = node.clientHeight;

        const delta = currentScrollY - lastScrollY.current;
        if (Math.abs(delta) < 5) return;

        const isNearBottom = currentScrollY + clientHeight >= scrollHeight - 50;
        const isNearTop = currentScrollY <= 30;

        if (isNearTop) {
          setHeadersHidden(false);
        } else if (!isNearBottom) {
          if (delta > 15) {
            // Scrolling down -> Hide headers
            setHeadersHidden(true);
          } else if (delta < -15) {
            // Scrolling up -> Show headers
            setHeadersHidden(false);
          }
        }

        lastScrollY.current = currentScrollY;
      };

      node.addEventListener('scroll', handleScroll, { passive: true });

      // Return cleanup function (not used in callback ref pattern, but good practice)
      return () => {
        node.removeEventListener('scroll', handleScroll);
      };
    }
  }, []);

  return {
    headersHidden,
    editorScrollRef,
  };
}

export default useScrollHeader;
