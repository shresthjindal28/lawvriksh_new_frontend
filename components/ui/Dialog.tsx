'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import '@/styles/ui-styles/dialog.css';
import { DialogProps } from '@/types/ui';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';

const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  closable = true,
  overlayClosable = true,
  className = '',
  zIndex = 1000,
}) => {
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const focusTrapRef = useFocusTrap(isOpen);

  const handleEscapeKey = useCallback(
    (event: KeyboardEvent) => {
      if (event.key === 'Escape' && closable) {
        onClose();
      }
    },
    [onClose, closable]
  );

  const handleOverlayClick = useCallback(
    (event: React.MouseEvent) => {
      if (event.target === event.currentTarget && overlayClosable) {
        onClose();
      }
    },
    [onClose, overlayClosable]
  );

  useEffect(() => {
    if (isOpen) {
      previousActiveElement.current = document.activeElement as HTMLElement;
      document.body.style.overflow = 'hidden';
      document.addEventListener('keydown', handleEscapeKey);
    } else {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
      previousActiveElement.current?.focus();
    }

    return () => {
      document.body.style.overflow = '';
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [isOpen, handleEscapeKey]);

  if (!isOpen) return null;

  const dialogContent = (
    <div
      className="dialog-overlay"
      onClick={handleOverlayClick}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
    >
      <div
        ref={focusTrapRef}
        className={`dialog-container dialog-${size} ${className}`}
        role="document"
      >
        {(title || closable) && (
          <div className="dialog-header">
            {title && (
              <h2 id="dialog-title" className="dialog-title">
                {title}
              </h2>
            )}
          </div>
        )}
        <div className="dialog-content">{children}</div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default Dialog;
