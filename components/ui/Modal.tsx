'use client';
import React, { useEffect, useRef } from 'react';
import { cn } from '@/lib/utils';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  title?: string;
  isLoading?: boolean;
}

export default function Modal({ isOpen, onClose, children, title }: ModalProps) {
  const modalContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  const handleOverlayClick = (event: React.MouseEvent<HTMLDivElement>) => {
    if (modalContentRef.current && !modalContentRef.current.contains(event.target as Node)) {
      onClose();
    }
  };

  if (!isOpen) {
    return null;
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-[1000]"
      onClick={handleOverlayClick}
      role="dialog"
      aria-modal="true"
      aria-labelledby="modal-title"
    >
      <div
        className="bg-white text-black p-6 rounded-lg max-w-[500px] w-[90%] shadow-[0_5px_15px_rgba(0,0,0,0.3)] relative"
        ref={modalContentRef}
      >
        <div className="flex justify-between items-center border-b border-gray-200 pb-3 mb-4">
          {title && (
            <h2 id="modal-title" className="m-0 text-2xl font-semibold">
              {title}
            </h2>
          )}
          <button
            onClick={onClose}
            className="bg-transparent border-none text-3xl leading-none text-gray-500 cursor-pointer p-0 hover:text-black"
            aria-label="Close modal"
          >
            &times;
          </button>
        </div>
        <div>{children}</div>
      </div>
    </div>
  );
}
