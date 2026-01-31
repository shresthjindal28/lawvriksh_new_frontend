import type React from 'react';
import '@/styles/ui-styles/progress-badge.css';

export type ProgressBadgeProps = {
  value: number;
  label?: string;
  ringSize?: number; // diameter in px
  strokeWidth?: number; // ring thickness
  className?: string;
  // Optional CSS variable overrides for theming
  style?: React.CSSProperties & {
    ['--pb-bg']?: string;
    ['--pb-text']?: string;
    ['--pb-ring']?: string;
    ['--pb-track']?: string;
  };
  'aria-label'?: string;
  onClickHandler: () => void;
};

export function ProgressBadge({
  value,
  label = 'Profile completed',
  ringSize = 40,
  strokeWidth = 4,
  className,
  style,
  'aria-label': ariaLabel,
  onClickHandler,
}: ProgressBadgeProps) {
  const clamped = Math.max(0, Math.min(100, value));
  const radius = (ringSize - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference * (1 - clamped / 100);

  return (
    <div
      onClick={onClickHandler}
      className={['progress-badge', className].filter(Boolean).join(' ')}
      style={style}
    >
      <div className="progress-badge__circle" style={{ width: ringSize, height: ringSize }}>
        <svg
          className="progress-badge__svg"
          width={ringSize}
          height={ringSize}
          viewBox={`0 0 ${ringSize} ${ringSize}`}
          role="progressbar"
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(clamped)}
          aria-label={ariaLabel ?? label}
        >
          {/* Track */}
          <circle
            className="progress-badge__track"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            className="progress-badge__progress"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={dashOffset}
            transform={`rotate(-90 ${ringSize / 2} ${ringSize / 2})`}
          />
        </svg>
        <span className="progress-badge__percent">{`${Math.round(clamped)}%`}</span>
      </div>

      <span className="progress-badge__label">{label}</span>
    </div>
  );
}

export default ProgressBadge;
