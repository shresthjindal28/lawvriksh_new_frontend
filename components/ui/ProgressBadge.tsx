import type React from 'react';
import { cn } from '@/lib/utils';
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
      className={cn(
        'inline-flex items-center gap-2 rounded-full py-1.5 pl-1.5 pr-2.5 leading-none font-sans border border-black/5 cursor-pointer',
        'bg-[#fff4d1] text-[#9a7a2a]',
        'hover:brightness-[0.99]',
        className
      )}
      style={
        {
          '--pb-bg': '#fff4d1',
          '--pb-text': '#9a7a2a',
          '--pb-ring': '#d9b44a',
          '--pb-track': '#f3e5b3',
          ...style,
        } as React.CSSProperties
      }
    >
      <div className="relative shrink-0" style={{ width: ringSize, height: ringSize }}>
        <svg
          className="block"
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
            className="stroke-[#f3e5b3]"
            cx={ringSize / 2}
            cy={ringSize / 2}
            r={radius}
            fill="none"
            strokeWidth={strokeWidth}
          />
          {/* Progress */}
          <circle
            className="stroke-[#d9b44a]"
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
        <span className="absolute inset-0 grid place-items-center text-[11px] font-light text-[#9a7a2a] select-none">
          {`${Math.round(clamped)}%`}
        </span>
      </div>

      <span className="text-sm font-normal whitespace-nowrap max-md:hidden">{label}</span>
    </div>
  );
}

export default ProgressBadge;
