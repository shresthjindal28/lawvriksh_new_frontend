'use client';

import type React from 'react';
import '@/styles/ui-styles/feedback-dialog.css';
interface FeedbackDialogProps {
  isOpen: boolean;
  onClose: () => void;
  icon?: string;
  title: string;
  subtitle: string;
  steps: Array<{
    text: string;
  }>;
  onHighlightClick?: (text: string) => void;
}

export default function FeedbackDialog({
  isOpen,
  onClose,
  icon = '✓',
  title,
  subtitle,
  steps,
  onHighlightClick,
}: FeedbackDialogProps) {
  if (!isOpen) return null;

  const handleBackdropClick = () => {
    onClose();
  };

  const handleContentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
  };

  const parseStepText = (text: string) => {
    const parts = [];
    let lastIndex = 0;
    const regex = /\[([^\]]+)\]/g;
    let match;

    while ((match = regex.exec(text)) !== null) {
      if (match.index > lastIndex) {
        parts.push({
          type: 'text',
          content: text.substring(lastIndex, match.index),
        });
      }

      parts.push({
        type: 'highlight',
        content: match[1],
      });

      lastIndex = match.index + match[0].length;
    }

    if (lastIndex < text.length) {
      parts.push({
        type: 'text',
        content: text.substring(lastIndex),
      });
    }

    return parts.length > 0 ? parts : [{ type: 'text', content: text }];
  };

  return (
    <div className="feedback-dialog-overlay" onClick={handleBackdropClick}>
      <div className="feedback-dialog-container" onClick={handleContentClick}>
        {/* Close Button */}
        <button className="feedback-dialog-close" onClick={onClose} aria-label="Close dialog">
          ✕
        </button>

        {/* Header */}
        <div className="feedback-dialog-header">
          <span className="feedback-dialog-icon">{icon}</span>
          <h1 className="feedback-dialog-title">{title}</h1>
        </div>

        {/* Subtitle */}
        <p className="feedback-dialog-subtitle">{subtitle}</p>

        {/* Steps */}
        <div className="feedback-dialog-steps-box">
          <p className="feedback-dialog-steps-label">Next steps:</p>
          <ul className="feedback-dialog-steps-list">
            {steps.map((step, index) => (
              <li key={index} className="feedback-dialog-step-item">
                {parseStepText(step.text).map((part, partIndex) =>
                  part.type === 'highlight' ? (
                    <button
                      key={partIndex}
                      className="feedback-dialog-highlight"
                      onClick={() => onHighlightClick?.(part.content)}
                    >
                      [{part.content}]
                    </button>
                  ) : (
                    <span key={partIndex}>{part.content}</span>
                  )
                )}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
