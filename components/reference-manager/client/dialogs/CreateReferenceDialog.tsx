'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText } from 'lucide-react';
import '@/styles/reference-manager/create-reference-dialog.css';
import { referenceDialogOptions } from '@/lib/config/referenceConfig';
import Image from 'next/image';
import { JSX, useState, useEffect } from 'react';
import { ReferenceType } from '@/types/reference-manager';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  // onSelect now receives the internal type id and a derived icon_id string
  onSelect: (type: ReferenceType, iconId?: string) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
}

export default function CreateReferenceDialog({ isOpen, onClose, onSelect, anchorRef }: Props) {
  const [dialogPosition, setDialogPosition] = useState({ top: 100, left: 100 });

  useEffect(() => {
    if (isOpen && anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setDialogPosition({ top: rect.bottom + 6, left: rect.left });
    }
  }, [isOpen, anchorRef]);
  // SVG icon mapping
  const svgIcons: Record<string, JSX.Element> = {
    Hearing: <Image src="/assets/svgs/hammer.svg" alt="Hearing" width={18} height={18} />,
    Bill: <Image src="/assets/svgs/bill.svg" alt="Bill" width={18} height={18} />,
    Legislation: (
      <Image src="/assets/svgs/legislation.svg" alt="Legislation" width={18} height={18} />
    ),
    Regulation: <Image src="/assets/svgs/regulation.svg" alt="Regulation" width={18} height={18} />,
  };

  // Helper function to get the icon for an item
  const getIcon = (item: (typeof referenceDialogOptions)[number]) => {
    // Check if we have a custom SVG for this label
    if (svgIcons[item.label]) {
      return svgIcons[item.label];
    }
    // Otherwise use the Lucide icon from config
    if (item.icon) {
      const IconComponent = item.icon;
      return <IconComponent size={18} />;
    }
    // Fallback to FileText icon
    return <FileText size={18} />;
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Invisible click-catcher */}
          <motion.div
            className="crd-overlay"
            onClick={onClose}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          />

          {/* Dialog */}
          <motion.div
            className="crd-dialog"
            initial={{ opacity: 0, scale: 0.95, y: -6 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -6 }}
            transition={{ duration: 0.15 }}
            style={{
              top: dialogPosition.top,
              left: dialogPosition.left,
            }}
          >
            {referenceDialogOptions.map((item, index) => (
              <button
                key={item.label}
                className={`crd-item ${index === 0 ? 'crd-item-active' : ''}`}
                onClick={() => {
                  const iconId = item.label.toLowerCase().replace(/\s+/g, '_');
                  onSelect(item.id, iconId);
                  onClose();
                }}
              >
                {getIcon(item)}
                <span>{item.label}</span>
              </button>
            ))}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
