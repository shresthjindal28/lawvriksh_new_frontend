'use client';

import React from 'react';
import { useToast } from '@/lib/contexts/ToastContext';
import { Toast } from './Toast';

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
