'use client';

import { X } from 'lucide-react';

interface ComplianceHoverCardProps {
  complianceData: any;
  position: { x: number; y: number };
  onClose: () => void;
  onMouseEnter: () => void;
  onMouseLeave: () => void;
  placement?: 'top' | 'bottom';
}

export default function ComplianceHoverCard({
  complianceData,
  position,
  onClose,
  onMouseEnter,
  onMouseLeave,
  placement = 'bottom',
}: ComplianceHoverCardProps) {
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
    fontSize: '14px',
    lineHeight: '1.5',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    pointerEvents: 'auto',
    maxHeight: '300px', // Fixed max height for consistent viewport fit
    overflowY: 'auto',
  };

  // Determine severity and color from compliance data
  const getSeverityInfo = () => {
    let severity = 'medium';
    let bgColor = '#fef3c7';
    let textColor = '#d97706';

    if (complianceData.severity) {
      severity = complianceData.severity;
    } else if (complianceData.confidence > 0.8) {
      severity = 'very_high';
    } else if (complianceData.confidence > 0.6) {
      severity = 'medium';
    }

    // Set colors based on severity level
    if (severity === 'very_high') {
      bgColor = '#fee2e2';
      textColor = '#dc2626';
    } else if (severity === 'medium') {
      bgColor = '#fef9c7'; // Yellow
      textColor = '#d97706';
    } else {
      bgColor = '#fef3c7';
      textColor = '#d97706';
    }

    return { severity, bgColor, textColor };
  };

  return (
    <div
      style={cardStyle}
      className="compliance-hover-card"
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
    >
      {/* Header with severity tag and confidence */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '8px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          {/* Severity tag */}
          <span
            style={{
              background: getSeverityInfo().bgColor,
              color: getSeverityInfo().textColor,
              padding: '2px 6px',
              borderRadius: '4px',
              fontSize: '11px',
              fontWeight: '500',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            {getSeverityInfo().severity}
          </span>
          <span
            style={{
              color: '#6b7280',
              fontSize: '13px',
              fontWeight: '400',
            }}
          >
            Compliances in this document are followed
          </span>
        </div>
        <button
          onClick={onClose}
          onMouseEnter={onMouseEnter}
          onMouseLeave={onMouseLeave}
          style={{
            background: 'none',
            border: 'none',
            color: '#9ca3af',
            fontSize: '14px',
            cursor: 'pointer',
            padding: '2px',
            lineHeight: '1',
            width: '20px',
            height: '20px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            borderRadius: '3px',
            transition: 'all 0.2s',
          }}
          onMouseOver={(e) => {
            e.currentTarget.style.background = '#f3f4f4';
            e.currentTarget.style.color = '#6b7280';
          }}
          onMouseOut={(e) => {
            e.currentTarget.style.background = 'none';
            e.currentTarget.style.color = '#9ca3af';
          }}
        >
          <X size={20} />
        </button>
      </div>

      {/* Current text section - Normal styling */}
      {complianceData.statement.wrongStatement && (
        <div style={{ marginBottom: '8px' }}>
          <div
            style={{
              color: '#374151',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Current text
          </div>
          <div
            style={{
              color: '#374151',
              fontSize: '14px',
              lineHeight: '1.4',
            }}
          >
            "{complianceData.statement.wrongStatement}"
          </div>
        </div>
      )}

      {/* Justification section - Red layout styling */}
      {complianceData.justification && (
        <div>
          <div
            style={{
              color: '#374151',
              fontSize: '12px',
              fontWeight: '500',
              marginBottom: '4px',
              textTransform: 'uppercase',
              letterSpacing: '0.5px',
            }}
          >
            Justification
          </div>
          <div
            style={{
              color: '#111111',
              fontSize: '14px',
              fontStyle: 'italic',
              backgroundColor: '#f7fde0ff',
              padding: '6px 8px',
              borderRadius: '4px',
              border: '2px solid #f3f8deff',
              lineHeight: '1.4',
            }}
          >
            {complianceData.justification}
          </div>
        </div>
      )}
    </div>
  );
}
