'use client';

import React from 'react';
import { AlertCircle, Save, Trash2 } from 'lucide-react';
import './DiscardSaveDialog.css';
interface DiscardSaveDialogProps {
  isOpen: boolean;
  onSave: () => void;
  onDiscard: () => void;
  onCancel?: () => void;
}

export function DiscardSaveDialog({ isOpen, onSave, onDiscard, onCancel }: DiscardSaveDialogProps) {
  if (!isOpen) return null;

  return (
    <div className="discard-save-overlay" onClick={onCancel}>
      <div className="discard-save-modal" onClick={(e) => e.stopPropagation()}>
        <div className="discard-save-icon">
          <AlertCircle size={24} />
        </div>

        <h2 className="discard-save-title">Save Document?</h2>

        <p className="discard-save-message">
          You are exiting this document for the first time. Would you like to save it to your
          dashboard or discard it?
        </p>

        <div className="discard-save-actions">
          <button
            className="discard-save-btn discard-save-btn-discard"
            onClick={onDiscard}
            type="button"
          >
            <Trash2 size={16} />
            Discard
          </button>

          <button className="discard-save-btn discard-save-btn-save" onClick={onSave} type="button">
            <Save size={16} />
            Save & Exit
          </button>
        </div>
      </div>
    </div>
  );
}

export default DiscardSaveDialog;
