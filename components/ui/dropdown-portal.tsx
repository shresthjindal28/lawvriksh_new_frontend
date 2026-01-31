// components/ui/DropdownPortal.tsx
'use client';

import { ReactNode, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';

interface DropdownPortalProps {
  children: ReactNode;
}

export default function DropdownPortal({ children }: DropdownPortalProps) {
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    if (!mounted) {
      setMounted(true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (!mounted) return null;

  return createPortal(
    <div
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        zIndex: 99999,
        pointerEvents: 'none', // Allow clicks to pass through container
      }}
    >
      <div style={{ pointerEvents: 'auto' }}>
        {' '}
        {/* Re-enable for children */}
        {children}
      </div>
    </div>,
    document.body
  );
}
