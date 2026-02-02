'use client';

import React from 'react';
import { AlertTriangle, Save } from 'lucide-react';
interface UnsavedChangesModalProps {
  isOpen: boolean;
  onSaveAndContinue: () => void;
  onDiscardChanges: () => void;
  onCancel: () => void;
  isSaving?: boolean;
}

export function UnsavedChangesModal({
  isOpen,
  onSaveAndContinue,
  onCancel,
  isSaving = false,
}: UnsavedChangesModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/60 backdrop-blur-[4px]">
      <div className="relative w-[90%] max-w-[380px] animate-[modalSlideIn_0.25s_ease-out] rounded-xl border border-black/10 bg-white p-7 shadow-[0_24px_48px_rgba(0,0,0,0.2)]">
        <div className="mb-4 flex justify-center text-amber-500">
          <AlertTriangle size={40} />
        </div>

        <h2 className="mb-2 text-center text-lg font-semibold tracking-tight text-gray-900">
          Unsaved Changes
        </h2>

        <p className="mb-6 text-center text-sm leading-relaxed text-gray-500">
          You have unsaved changes. Would you like to save before continuing?
        </p>

        <div className="flex flex-col gap-2.5">
          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-900 bg-gray-900 px-5 py-3 text-sm font-medium text-white transition-all duration-150 hover:bg-gray-800 hover:border-gray-800 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onSaveAndContinue}
            disabled={isSaving}
            type="button"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>

          <button
            className="flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-5 py-3 text-sm font-medium text-gray-700 transition-all duration-150 hover:border-gray-400 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60"
            onClick={onCancel}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
      <style jsx>{`
        @keyframes modalSlideIn {
          from {
            opacity: 0;
            transform: scale(0.96) translateY(-8px);
          }
          to {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
      `}</style>
    </div>
  );
}

export default UnsavedChangesModal;
