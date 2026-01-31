'use client';

import { Menu } from 'lucide-react';
import { useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';
import { useScrollDirection } from '@/hooks/common/useScrollDirection';

export function MobileHeader() {
  const { toggle } = useMobileSidebar();
  const scrollDirection = useScrollDirection();
  const isVisible = scrollDirection !== 'down';

  return (
    <div
      className={`mobile-header md:hidden ${!isVisible ? 'mobile-header-hidden' : ''}`}
      style={{
        transition: 'transform 0.3s ease-in-out',
        transform: isVisible ? 'translateY(0)' : 'translateY(-100%)',
      }}
    >
      <div className="mobile-header-left">
        <button
          className="mobile-header-hamburger"
          onClick={toggle}
          aria-label="Toggle menu"
          type="button"
        >
          <Menu size={20} />
        </button>
        <div className="topbar-brand">
          <span className="topbar-separator" aria-hidden="true" />
          <h1 className="topbar-logo" style={{ fontSize: '20px' }}>
            LawVriksh
          </h1>
        </div>
      </div>
    </div>
  );
}
