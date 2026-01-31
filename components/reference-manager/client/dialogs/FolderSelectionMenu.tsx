'use client';

import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CornerDownRight, Folder } from 'lucide-react';
import { Collection, Folder as FolderType } from '@/store/zustand/useReferenceStore';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (collectionId: string | null, folderId: string | null) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  collections: Collection[];
  foldersByCollections: Record<string, FolderType[]>;
  showUnsignedOption?: boolean;
}

export default function FolderSelectionMenu({
  isOpen,
  onClose,
  onSelect,
  anchorRef,
  collections,
  foldersByCollections,
  showUnsignedOption,
}: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: 100, left: 100 });

  // Update position when opened or anchor changes
  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      const centeredLeft = rect.left + rect.width / 2 - 140; // Adjusted for wider menu
      setPos({
        top: rect.bottom + 6,
        left: Math.max(16, centeredLeft),
      });
    }
  }, [isOpen, anchorRef]);

  // Close menu on clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        // Check if the click was on the anchor element (button), if so let the button handle the toggle
        if (anchorRef.current && anchorRef.current.contains(e.target as Node)) {
          return;
        }
        onClose();
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose, anchorRef]);

  const hasAnyFolders = (collections || []).some((c) => {
    const folders = foldersByCollections?.[c.id];
    return folders && folders.length > 0;
  });

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          ref={ref}
          className="folder-selection-menu"
          initial={{ opacity: 0, scale: 0.95, y: -6 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: -6 }}
          transition={{ duration: 0.15 }}
          style={{
            position: 'fixed',
            top: pos.top,
            left: pos.left,
            zIndex: 99999,
            width: '280px',
            maxHeight: '400px',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden', // Override CSS overflow
          }}
        >
          <div style={{ flex: 1, overflowY: 'auto' }}>
            {showUnsignedOption && (
              <button
                className="folder-item"
                type="button"
                onClick={() => {
                  onSelect(null, null);
                  onClose();
                }}
              >
                <Folder size={16} style={{ color: 'var(--lv-text-muted)' }} />
                <span className="folder-name">Uncategorized</span>
              </button>
            )}
            {hasAnyFolders ? (
              (collections || []).map((collection) => {
                const folders = foldersByCollections?.[collection.id];
                if (!folders || folders.length === 0) return null;

                return (
                  <div key={collection.id} className="collection-group">
                    <div className="collection-header">{collection.title}</div>
                    {folders.map((folder) => (
                      <button
                        key={folder.id}
                        className="folder-item"
                        type="button"
                        onClick={() => {
                          onSelect(collection.id, folder.id);
                          onClose();
                        }}
                      >
                        <CornerDownRight size={16} style={{ color: 'var(--lv-text-muted)' }} />
                        <span className="folder-name">{folder.title}</span>
                      </button>
                    ))}
                  </div>
                );
              })
            ) : (
              <div className="empty-message">No folders available</div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
