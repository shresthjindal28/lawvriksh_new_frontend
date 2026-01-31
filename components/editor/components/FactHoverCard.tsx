'use client';

import { X, Check } from 'lucide-react';

interface FactHoverCardProps {
  factData: any;
  position: { x: number; y: number };
  factIndex: number;
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  onAccept: (factIndex: number, correctedText: string) => void;
  onDismiss: (factIndex: number) => void;
  placement?: 'top' | 'bottom';
}

export default function FactHoverCard({
  factData,
  position,
  factIndex,
  onClose,
  onMouseEnter,
  onMouseLeave,
  onAccept,
  onDismiss,
  placement = 'bottom',
}: FactHoverCardProps) {
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
    width: '380px',
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    pointerEvents: 'auto',
    maxHeight: '400px', // Increased height for better content display
    overflowY: 'auto',
  };

  // Determine verdict badge color based on verdict
  const getVerdictInfo = () => {
    const verdict = factData.verdict || 'unverifiable';
    let bgColor = '#fef3c7'; // orange background
    let textColor = '#d97706'; // orange text
    let label = verdict;

    if (verdict === 'inaccurate' || verdict === 'false') {
      bgColor = '#fee2e2'; // red background
      textColor = '#dc2626'; // red text
      label = 'False';
    } else if (verdict === 'misleading') {
      bgColor = '#fef3c7'; // orange background
      textColor = '#d97706'; // orange text
      label = 'Misleading';
    } else if (verdict === 'unverifiable') {
      bgColor = '#fef3c7'; // orange background
      textColor = '#d97706'; // orange text
      label = 'Unverifiable';
    } else if (verdict === 'accurate') {
      bgColor = '#d1fae5'; // green background
      textColor = '#059669'; // green text
      label = 'Accurate';
    }

    return { bgColor, textColor, label };
  };

  const verdictInfo = getVerdictInfo();
  const confidence = factData.confidence || 0;
  // Handle both 0-1 and 0-100 scales
  const confidencePercent = confidence > 1 ? Math.round(confidence) : Math.round(confidence * 100);

  const handleAccept = () => {
    if (factData.fact?.correctedStatement) {
      onAccept(factIndex, factData.fact.correctedStatement);
    }
    onClose();
  };

  const handleDismiss = () => {
    onDismiss(factIndex);
    onClose();
  };

  return (
    <div
      style={cardStyle}
      className="fact-hover-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with verdict badge, confidence, and close button */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '16px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Verdict badge */}
          <span
            style={{
              background: verdictInfo.bgColor,
              color: verdictInfo.textColor,
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '13px',
              fontWeight: '600',
              fontStyle: 'italic',
              border: `1px solid ${verdictInfo.textColor}20`,
            }}
          >
            {verdictInfo.label}
          </span>
          {/* Confidence score */}
          <span
            style={{
              color: '#6b7280',
              fontSize: '14px',
              fontWeight: '400',
            }}
          >
            {confidencePercent}% incorrect
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
      {factData.fact?.wrongStatement && (
        <div style={{ marginBottom: '16px' }}>
          <div
            style={{
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '400',
              marginBottom: '8px',
            }}
          >
            Current text:
          </div>
          <div
            style={{
              color: '#374151',
              fontSize: '15px',
              lineHeight: '1.5',
              backgroundColor: '#f9fafb',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #e5e7eb',
            }}
          >
            {factData.fact.wrongStatement}
          </div>
        </div>
      )}

      {/* Suggested correction section */}
      {factData.fact?.correctedStatement && (
        <div style={{ marginBottom: '20px' }}>
          <div
            style={{
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '400',
              marginBottom: '8px',
            }}
          >
            Suggested correction:
          </div>
          <div
            style={{
              color: '#166534',
              fontSize: '15px',
              lineHeight: '1.5',
              backgroundColor: '#dcfce7',
              padding: '12px',
              borderRadius: '8px',
              border: '1px solid #bbf7d0',
            }}
          >
            {factData.fact.correctedStatement}
          </div>
        </div>
      )}

      {/* Action buttons */}
      {factData.fact?.correctedStatement && factData.verdict !== 'accurate' && (
        <div style={{ display: 'flex' }}>
          <button
            onClick={handleAccept}
            style={{
              width: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              padding: '12px 16px',
              backgroundColor: '#16a34a',
              color: 'white',
              border: 'none',
              borderRadius: '8px',
              fontSize: '14px',
              fontWeight: '500',
              cursor: 'pointer',
              transition: 'background-color 0.2s',
            }}
            onMouseOver={(e) => {
              e.currentTarget.style.backgroundColor = '#15803d';
            }}
            onMouseOut={(e) => {
              e.currentTarget.style.backgroundColor = '#16a34a';
            }}
          >
            <Check size={16} />
            Accept Change
          </button>
        </div>
      )}
    </div>
  );
}
