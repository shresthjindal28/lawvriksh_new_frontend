'use client';

import { FolderPlus, Edit2, Upload, Trash2, ChevronRight } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion } from 'framer-motion';

export default function CreateFolderMenu({
  onNewSubcollection,
  onRename,
  onExport,
  onDelete,
  onClose,
  position,
  isSubfolder,
}: {
  onNewSubcollection: () => void;
  onRename: () => void;
  onExport: () => void;
  onDelete: () => void;
  onClose: () => void;
  position: { top: number; left: number };
  isSubfolder?: boolean;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    if (!mounted) {
      setTimeout(() => setMounted(true), 0);
    }
  }, [mounted]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const Options = [
    {
      label: 'BibTex',
    },
    {
      label: 'BibLatex',
    },
    {
      label: 'BibTxt',
    },
    {
      label: 'RIS',
    },
    {
      label: 'CFF',
    },
  ];

  if (!mounted) return null;

  return createPortal(
    <motion.div
      ref={ref}
      className="contextMenu"
      style={{
        top: position.top,
        left: position.left,
        position: 'fixed',
        zIndex: 9999,
      }}
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Only show "New Subcollection" if it's NOT a subfolder */}
      {!isSubfolder && (
        <button className="contextItem" onClick={onNewSubcollection}>
          <FolderPlus size={14} />
          <span>New Subcollection</span>
        </button>
      )}

      <button className="contextItem" onClick={onRename}>
        <Edit2 size={14} />
        <span>Rename</span>
      </button>

      <button className="contextItem exportItem" onClick={onExport}>
        <Upload size={14} />
        <span>Export Collection</span>
        <ChevronRight size={14} className="submenuChevron" />

        <div className="submenu">
          {Options.map((option, index) => (
            <div
              className="submenuItem"
              key={index}
              onClick={() => {
                /* Placeholder */
              }}
            >
              {option.label}
            </div>
          ))}
        </div>
      </button>

      <button className="contextItem deleteItem" onClick={onDelete}>
        <Trash2 size={14} />
        <span>Delete</span>
      </button>
    </motion.div>,
    document.body
  );
}
