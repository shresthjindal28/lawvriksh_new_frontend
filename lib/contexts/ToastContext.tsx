'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Toast, ToastType } from '@/types/ui';

type ToastOptions = {
  duration?: number;
  progress?: number | null;
  showSpinner?: boolean;
};

interface ToastContextType {
  toasts: Toast[];
  addToast: (
    message: string,
    type?: ToastType,
    durationOrOptions?: number | ToastOptions
  ) => string;
  updateToast: (id: string, updates: Partial<Omit<Toast, 'id'>>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  }, []);

  const addToast = useCallback(
    (
      message: string,
      type: ToastType = 'info',
      durationOrOptions: number | ToastOptions = 3000
    ) => {
      const id = Math.random().toString(36).substr(2, 9);
      const opts: ToastOptions =
        typeof durationOrOptions === 'number' ? { duration: durationOrOptions } : durationOrOptions;
      const duration = typeof opts.duration === 'number' ? opts.duration : 3000;
      const newToast: Toast = {
        id,
        message,
        type,
        duration,
        progress: typeof opts.progress === 'number' ? opts.progress : (opts.progress ?? null),
        showSpinner: Boolean(opts.showSpinner),
      };

      setToasts((prev) => [...prev, newToast]);

      if (duration > 0) {
        setTimeout(() => {
          removeToast(id);
        }, duration);
      }
      return id;
    },
    [removeToast]
  );

  const updateToast = useCallback((id: string, updates: Partial<Omit<Toast, 'id'>>) => {
    setToasts((prev) =>
      prev.map((t) => {
        if (t.id !== id) return t;
        return { ...t, ...updates };
      })
    );
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, updateToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within ToastProvider');
  }
  return context;
}
