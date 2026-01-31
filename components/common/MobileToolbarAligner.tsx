'use client';

import { useEffect } from 'react';

/**
 * MobileToolbarAligner
 *
 * A utility component that forces the EditorJS toolbar to align with the TOP of the
 * currently focused block on mobile devices. This fixes the issue where the toolbar
 * gets vertically centered (default EditorJS behavior) or misplaced on small screens.
 */
export function MobileToolbarAligner() {
  useEffect(() => {
    // Only run on mobile/tablet (matching our CSS breakpoints)
    if (typeof window === 'undefined' || window.innerWidth >= 1024) return;

    let rafId: number;
    let isUpdating = false;

    const alignToolbar = () => {
      const toolbar = document.querySelector('.ce-toolbar') as HTMLElement;
      // We need the active block. EditorJS native class 'ce-block--focused' is reliable.
      const activeBlock = document.querySelector('.ce-block--focused') as HTMLElement;
      // Use the main editor container as the reference point for 'absolute' positioning
      const container = document.querySelector('.codex-editor') as HTMLElement;

      if (!toolbar || !activeBlock || !container) return;

      // Calculate positions
      const blockRect = activeBlock.getBoundingClientRect();
      const containerRect = container.getBoundingClientRect();

      // Calculate top relative to the container
      // This places the toolbar at the exact top pixel of the block
      const relativeTop = blockRect.top - containerRect.top;

      // Apply changes using transform (PC behavior) but forced to top
      // We assume horizontal position is handled by CSS (left: 0/5px) or we can force X=0
      const newTransform = `translate3d(0px, ${relativeTop}px, 0px)`;

      if (toolbar.style.transform !== newTransform) {
        isUpdating = true;
        // We override EditorJS's transform
        toolbar.style.transform = newTransform;
        // Clear 'top' if we previously set it, to rely on transform
        if (toolbar.style.top) {
          toolbar.style.removeProperty('top');
        }

        requestAnimationFrame(() => {
          isUpdating = false;
        });
      }
    };

    const observer = new MutationObserver((mutations) => {
      if (isUpdating) return;
      // aggressively update on any relevant change
      cancelAnimationFrame(rafId);
      rafId = requestAnimationFrame(alignToolbar);
    });

    const config = {
      attributes: true,
      childList: true,
      subtree: true,
      attributeFilter: ['style', 'class', 'height'],
    };

    const target = document.querySelector('.codex-editor');
    if (target) {
      observer.observe(target, config);
      alignToolbar();
    }

    // High frequency events for responsiveness
    document.addEventListener('selectionchange', alignToolbar);
    window.addEventListener('resize', alignToolbar);
    // Capture scroll too, just in case (though sticky/fixed usually handles it, absolute needs updates if container scrolls)
    window.addEventListener('scroll', alignToolbar, { capture: true, passive: true });

    return () => {
      observer.disconnect();
      document.removeEventListener('selectionchange', alignToolbar);
      window.removeEventListener('resize', alignToolbar);
      window.removeEventListener('scroll', alignToolbar);
      cancelAnimationFrame(rafId);
    };
  }, []);

  return null;
}
