'use client';

import { Menu } from 'lucide-react';
import { useMobileSidebar } from '@/lib/contexts/MobileSidebarContext';
import { useScrollDirection } from '@/hooks/common/useScrollDirection';
import { cn } from '@/lib/utils';

export function MobileHeader() {
  const { toggle } = useMobileSidebar();
  const scrollDirection = useScrollDirection();
  const isVisible = scrollDirection !== 'down';

  return (
    <div
      className={cn(
        'sticky top-0 w-full z-10 bg-white border-b border-[#e3e3e3] px-4 py-3 flex items-center gap-3 transition-transform duration-300 ease-in-out md:hidden',
        !isVisible && '-translate-y-full'
      )}
    >
      <div className="flex items-center gap-3">
        <button
          className="bg-transparent border-none p-2 cursor-pointer text-[#111827] transition-colors duration-200 rounded-lg flex items-center justify-center hover:bg-[#f3f4f6] active:bg-[#e5e7eb]"
          onClick={toggle}
          aria-label="Toggle menu"
          type="button"
        >
          <Menu size={20} />
        </button>
        <div className="flex items-center gap-3">
          <span className="w-[2px] h-[32px] bg-[#d1d5dbe6] rounded-full" aria-hidden="true" />
          <h1 className="font-[family-name:var(--font-instrument-serif),serif] text-[20px] font-normal leading-[1.17] tracking-[-0.025em] text-[#3d3d3d] m-0 border-b-2 border-[#d4af37] whitespace-nowrap">
            LawVriksh
          </h1>
        </div>
      </div>
    </div>
  );
}
