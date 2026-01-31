// TagMenu.tsx
'use client';

import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Edit2, Trash2 } from 'lucide-react';
import { Tag } from '@/types/reference-manager';

export default function TagMenu({
  anchorRect,
  tag,
  onClose,
  onColorChange,
  onRename,
  onDelete,
}: {
  anchorRect: DOMRect | null;
  tag: Tag | null;
  onClose: () => void;
  onColorChange: (id: string, color: string) => void;
  onRename: (id: string) => void;
  onDelete: (id: string) => void;
}) {
  const ref = useRef<HTMLDivElement | null>(null);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);
  const [measured, setMeasured] = useState(false);
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    if (!mounted) {
      setTimeout(() => setMounted(true), 0);
    }
  }, [mounted]);

  useEffect(() => {
    function handleOutside(e: Event) {
      if (!ref.current) return;
      if (!(e.target instanceof Node)) return;
      if (!ref.current.contains(e.target)) onClose();
    }
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape') onClose();
    }

    document.addEventListener('mousedown', handleOutside);
    document.addEventListener('touchstart', handleOutside);
    document.addEventListener('keydown', handleEscape);
    return () => {
      document.removeEventListener('mousedown', handleOutside);
      document.removeEventListener('touchstart', handleOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [onClose]);

  useLayoutEffect(() => {
    if (!anchorRect) {
      setTimeout(() => setPosition(null), 0);
      return;
    }
    const el = ref.current;
    if (!el) {
      // wait until mounted - use async pattern
      return;
    }

    const menuRect = el.getBoundingClientRect();
    const menuWidth = menuRect.width || 200;
    const menuHeight = menuRect.height || 140;

    // Prefer placing ABOVE the anchor; if not enough space place BELOW
    // Using fixed positioning, so we use viewport coordinates (no scrollY)
    let top = anchorRect.top - menuHeight - 8; // above with 8px gap
    const wouldOverflowTop = top < 8;
    if (wouldOverflowTop) {
      top = anchorRect.bottom + 8; // place below
    }

    // Prefer placing to the right of anchor; if it overflows, clamp to the viewport
    let left = anchorRect.right + 8;
    if (left + menuWidth > window.innerWidth - 8) {
      left = Math.max(8, window.innerWidth - menuWidth - 12);
    }
    if (left < 8) left = 8;

    setTimeout(() => {
      setPosition({ top, left });
      setMeasured(true);
    }, 0);
  }, [anchorRect, tag]);

  if (!mounted || !anchorRect || !tag) return null;

  const palette = [
    tag.color,
    '#53A7F9',
    '#E04646',
    '#FFC107',
    '#28A745',
    '#6C757D',
    '#A16AE8',
    '#FF6B6B',
  ].filter((v, i, a) => a.indexOf(v) === i);

  return createPortal(
    <AnimatePresence>
      <motion.div
        ref={ref}
        className="tagMenuCard"
        initial={{ opacity: 0, scale: 0.96, y: -6 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -6 }}
        transition={{ duration: 0.16 }}
        style={{
          position: 'fixed',
          top: position?.top ?? 0,
          left: position?.left ?? 0,
          zIndex: 9999,
          minWidth: 180,
        }}
        role="dialog"
        aria-label="Tag menu"
      >
        <div className="tagMenuContent">
          <div className="tagMenuRow paletteRow">
            {palette.map((c) => (
              <button
                key={c}
                className={`paletteDot ${c === tag.color ? 'active' : ''}`}
                title={c}
                aria-label={`Set color ${c}`}
                onClick={() => onColorChange(tag.id, c)}
              >
                <span style={{ background: c }} />
              </button>
            ))}
          </div>

          <div className="tagMenuDivider" />

          <button
            className="tagMenuAction renameAction"
            onClick={() => {
              onRename(tag.id);
              onClose();
            }}
          >
            <Edit2 size={15} />
            <span>Rename</span>
          </button>

          <button
            className="tagMenuAction deleteAction"
            onClick={() => {
              onDelete(tag.id);
              onClose();
            }}
          >
            <Trash2 size={15} />
            <span>Delete</span>
          </button>
        </div>
      </motion.div>
    </AnimatePresence>,
    document.body
  );
}
