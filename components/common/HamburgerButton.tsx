'use client';

import { Menu } from 'lucide-react';
import { useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';

export function HamburgerButton({ className = '' }: { className?: string }) {
  const { toggle } = useMobileSidebar();

  return (
    <button
      className={`topbar-hamburger ${className}`}
      onClick={toggle}
      aria-label="Toggle menu"
      type="button"
      style={{ display: 'flex' }} // Ensure it's visible where used, CSS media queries might control parent visibility or we control it here
    >
      <Menu size={20} />
    </button>
  );
}
