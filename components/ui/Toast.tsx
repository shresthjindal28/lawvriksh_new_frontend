'use client';

import React, { useState } from 'react';
import { Toast as ToastType } from '@/types/ui';
import { useToast } from '@/lib/contexts/ToastContext';
import { cn } from '@/lib/utils';

interface ToastProps {
  toast: ToastType;
}

const typeStyles = {
  success: {
    container: 'bg-emerald-50 border-emerald-200 text-emerald-800',
    icon: 'bg-emerald-500 text-white',
  },
  error: {
    container: 'bg-red-50 border-red-200 text-red-800',
    icon: 'bg-red-500 text-white',
  },
  warning: {
    container: 'bg-amber-50 border-amber-200 text-amber-800',
    icon: 'bg-amber-500 text-white',
  },
  info: {
    container: 'bg-blue-50 border-blue-200 text-blue-800',
    icon: 'bg-blue-500 text-white',
  },
};

export function Toast({ toast }: ToastProps) {
  const { removeToast } = useToast();
  const [isExiting, setIsExiting] = useState(false);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(() => removeToast(toast.id), 300);
  };

  const progress =
    typeof toast.progress === 'number' ? Math.max(0, Math.min(100, toast.progress)) : null;

  const styles = typeStyles[toast.type as keyof typeof typeStyles] || typeStyles.info;

  return (
    <div
      className={cn(
        'flex items-center gap-3 min-w-[280px] max-w-[380px] py-3.5 px-4 rounded-lg border shadow-[0_4px_12px_rgba(0,0,0,0.08)]',
        'animate-slide-up',
        isExiting && 'opacity-0 translate-x-full transition-all duration-200 ease-in',
        styles.container
      )}
      role="alert"
    >
      <span
        className={cn(
          'shrink-0 flex items-center justify-center w-6 h-6 rounded-full text-sm',
          toast.showSpinner
            ? 'bg-transparent border-2 border-black/20 border-t-black/70 animate-spin'
            : styles.icon
        )}
      >
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
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <div className="flex items-center gap-2 min-w-0">
          <p className="flex-1 text-sm font-medium m-0 leading-snug overflow-hidden text-ellipsis whitespace-nowrap">
            {toast.message}
          </p>
          {progress !== null && (
            <span className="text-xs font-semibold opacity-85 shrink-0">
              {Math.round(progress)}%
            </span>
          )}
        </div>
        {progress !== null && (
          <div className="w-full h-1.5 rounded-full bg-black/10 overflow-hidden" aria-hidden="true">
            <div
              className="h-full rounded-full bg-current opacity-70 transition-[width] duration-200 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
      <button
        onClick={handleClose}
        className="bg-transparent border-none text-current cursor-pointer p-0 w-6 h-6 flex items-center justify-center opacity-50 transition-opacity duration-150 shrink-0 rounded hover:opacity-100 focus:outline-2 focus:outline-current focus:outline-offset-2 focus:opacity-100"
        aria-label="Close toast"
      >
        ✕
      </button>
    </div>
  );
}
