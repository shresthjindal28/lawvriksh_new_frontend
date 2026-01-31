'use client';

import React, { useState } from 'react';
import { Toast as ToastType } from '@/types/ui';
import { useToast } from '@/lib/contexts/ToastContext';
import '@/styles/ui-styles/toast.css';

interface ToastProps {
  toast: ToastType;
}

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  const progress =
    typeof toast.progress === 'number' ? Math.max(0, Math.min(100, toast.progress)) : null;

  return (
    <div className={`toast toast-${toast.type} ${isExiting ? 'toast-exit' : ''}`} role="alert">
      <span className={`toast-icon ${toast.showSpinner ? 'toast-spinner' : ''}`}>
        {toast.showSpinner
          ? ''
          : toast.type === 'success'
            ? '✓'
            : toast.type === 'error'
              ? '✕'
              : toast.type === 'warning'
                ? '⚠'
                : 'ℹ'}
      </span>
      <div className="toast-body">
        <div className="toast-message-row">
          <p className="toast-message">{toast.message}</p>
          {progress !== null && (
            <span className="toast-progress-percent">{Math.round(progress)}%</span>
          )}
        </div>
        {progress !== null && (
          <div className="toast-progress-track" aria-hidden="true">
            <div className="toast-progress-fill" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
      <button onClick={handleClose} className="toast-close" aria-label="Close toast">
        ✕
      </button>
    </div>
  );
}
