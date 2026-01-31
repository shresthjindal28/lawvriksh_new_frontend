'use client';

import React, { useEffect, useCallback, useRef } from 'react';
import { createPortal } from 'react-dom';
import { DialogProps } from '@/types/ui';
import { useFocusTrap } from '@/hooks/common/useFocusTrap';
import { cn } from '@/lib/utils';

const sizeClasses = {
  sm: 'max-w-sm',
  md: 'max-w-[550px]',
  lg: 'max-w-3xl',
  xl: 'max-w-5xl',
};

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
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 backdrop-blur-sm animate-fade-in z-[9998]"
      onClick={handleOverlayClick}
      style={{ zIndex }}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'dialog-title' : undefined}
    >
      <div
        ref={focusTrapRef}
        className={cn(
          'bg-white rounded-xl shadow-modal w-full max-h-[90vh] overflow-y-auto animate-scale-in relative z-[9999]',
          'dark:bg-[#1f1f1f] dark:shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5),0_0_0_1px_rgba(255,255,255,0.1)]',
          'scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent hover:scrollbar-thumb-gray-400',
          'dark:scrollbar-thumb-gray-600 dark:hover:scrollbar-thumb-gray-500',
          sizeClasses[size as keyof typeof sizeClasses] || sizeClasses.md,
          className
        )}
        role="document"
      >
        {(title || closable) && (
          <div className="dark:border-gray-700">
            {title && (
              <h2
                id="dialog-title"
                className="text-xl font-semibold text-gray-900 m-0 dark:text-gray-100"
              >
                {title}
              </h2>
            )}
          </div>
        )}
        <div className="p-6">{children}</div>
      </div>
    </div>
  );

  return createPortal(dialogContent, document.body);
};

export default Dialog;
