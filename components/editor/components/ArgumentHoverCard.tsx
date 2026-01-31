'use client';

import { X, Check } from 'lucide-react';
import { useRef } from 'react';

interface ArgumentHoverCardProps {
  data: any;
  lineId: string;
  text: string;
  suggestion?: string;
  position: { x: number; y: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAccept?: (id: string, correctedText: string) => void;
  placement?: 'top' | 'bottom';
}

export default function ArgumentHoverCard({
  data,
  lineId,
  text,
  suggestion,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onAccept,
  placement = 'bottom',
}: ArgumentHoverCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  // Check if suggestion indicates no change needed
  const isNoChangeNeeded =
    suggestion?.toLowerCase().includes('no suggested change needed') ||
    suggestion?.toLowerCase().includes('no suggestion needed') ||
    suggestion?.toLowerCase().includes('this sentence is accurate');

  const cardStyle: React.CSSProperties = {
    position: 'fixed',
    left: `${position.x}px`,
    top: `${position.y}px`,
    transform: placement === 'top' ? 'translateY(-100%)' : 'none',
    background: 'white',
    border: '1px solid #e5e7eb',
    borderRadius: '8px',
    padding: '14px',
    boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
    zIndex: 10000,
    width: '320px',
    maxHeight: '300px', // Fixed max height for consistent viewport fit
    overflowY: 'auto',
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    pointerEvents: 'auto' as const,
  };

  const handleAccept = () => {
    if (suggestion && onAccept && !isNoChangeNeeded) {
      onAccept(lineId, suggestion);
    }
    onClose();
  };

  return (
    <div
      ref={cardRef}
      style={cardStyle}
      className="argument-hover-card custom-scrollbar"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with badge and close button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '12px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Contradiction badge */}
          <span
            style={{
              background: '#fef3c7',
              color: '#d97706',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              fontStyle: 'italic',
              border: '1px solid #d9770620',
            }}
          >
            Contradiction
          </span>
          {/* Score */}
          <span
            style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '400',
            }}
          >
            {data?.contradiction_score || data?.confidence || 0}% score
          </span>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '4px',
            lineHeight: '1',
            width: '24px',
            height: '24px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '4px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f6';
            e.currentTarget.style.color = '#6b7280';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={18} />
        </button>
      </div>

      {/* Current text section */}
      {text && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              color: '#6b7280',
              fontSize: '12px',
              fontWeight: '400',
              marginBottom: '6px',
            }}
          >
            Current text:
          </div>
          <div
            style={{
              color: '#374151',
              fontSize: '13px',
              lineHeight: '1.4',
              backgroundColor: '#f9fafb',
              padding: '10px',
              borderRadius: '6px',
              border: '1px solid #e5e7eb',
            }}
          >
            {text}
          </div>
        </div>
      )}

      {/* Suggested correction section */}
      {suggestion && (
        <div style={{ marginBottom: '12px' }}>
          <div
            style={{
              color: '#6b7280',
              fontSize: '12px',
              fontWeight: '400',
              marginBottom: '6px',
            }}
          >
            Suggested correction:
          </div>
          <div
            style={{
              color: isNoChangeNeeded ? '#6b7280' : '#166534',
              fontSize: '13px',
              lineHeight: '1.4',
              backgroundColor: isNoChangeNeeded ? '#f9fafb' : '#dcfce7',
              padding: '10px',
              borderRadius: '6px',
              border: isNoChangeNeeded ? '1px solid #e5e7eb' : '1px solid #bbf7d0',
            }}
          >
            {suggestion}
          </div>
        </div>
      )}

      {/* Action buttons - Only Accept, no Dismiss/Reject */}
      {suggestion && onAccept && <div style={{ display: 'flex', gap: '12px' }}></div>}
    </div>
  );
}
