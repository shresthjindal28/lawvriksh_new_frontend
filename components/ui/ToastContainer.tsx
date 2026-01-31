'use client';

import React from 'react';
import { useToast } from '@/lib/contexts/ToastContext';
import { Toast } from './Toast';
import '@/styles/ui-styles/toast.css';

export function ToastContainer() {
  const { toasts } = useToast();

  return (
    <div className="toast-container">
      {toasts.map((toast) => (
        <Toast key={toast.id} toast={toast} />
      ))}
    </div>
  );
}
