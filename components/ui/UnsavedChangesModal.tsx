'use client';

import React from 'react';
import { AlertTriangle, Save } from 'lucide-react';
import '@/styles/common-styles/top-bar.css';
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
    <div className="unsaved-changes-overlay">
      <div className="unsaved-changes-modal">
        <div className="unsaved-changes-icon">
          <AlertTriangle size={40} />
        </div>

        <h2 className="unsaved-changes-title">Unsaved Changes</h2>

        <p className="unsaved-changes-message">
          You have unsaved changes. Would you like to save before continuing?
        </p>

        <div className="unsaved-changes-actions">
          <button
            className="unsaved-changes-btn unsaved-changes-btn-save"
            onClick={onSaveAndContinue}
            disabled={isSaving}
            type="button"
          >
            <Save size={16} />
            {isSaving ? 'Saving...' : 'Save & Continue'}
          </button>

          <button
            className="unsaved-changes-btn unsaved-changes-btn-cancel"
            onClick={onCancel}
            disabled={isSaving}
            type="button"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}

export default UnsavedChangesModal;
