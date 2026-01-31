'use client';

import { cn } from '@/lib/utils';

interface SkeletonProps {
  className?: string;
  width?: string | number;
  height?: string | number;
  borderRadius?: string;
  animate?: boolean;
}

/**
 * Base Skeleton component for loading states
 * Uses CSS shimmer animation for a polished loading effect
 */
export function Skeleton({
  className,
  width,
  height = '1rem',
  borderRadius = '0.375rem',
  animate = true,
}: SkeletonProps) {
  return (
    <div
      className={cn('bg-gray-200 dark:bg-gray-800', animate && 'animate-shimmer', className)}
      style={{
        width,
        height,
        borderRadius,
      }}
      aria-hidden="true"
    />
  );
}

/**
 * Text skeleton that matches typical text line heights
 */
export function SkeletonText({
  lines = 1,
  className,
  lastLineWidth = '100%',
}: {
  lines?: number;
  className?: string;
  lastLineWidth?: string;
}) {
  return (
    <div className={cn('space-y-2', className)} aria-hidden="true">
      {Array.from({ length: lines }).map((_, i) => (
        <Skeleton key={i} height="0.875rem" width={i === lines - 1 ? lastLineWidth : '100%'} />
      ))}
    </div>
  );
}

/**
 * Avatar skeleton for profile images
 */
export function SkeletonAvatar({ size = 40, className }: { size?: number; className?: string }) {
  return <Skeleton width={size} height={size} borderRadius="50%" className={className} />;
}

/**
 * Button skeleton
 */
export function SkeletonButton({
  width = '6rem',
  height = '2.25rem',
  className,
}: {
  width?: string | number;
  height?: string | number;
  className?: string;
}) {
  return <Skeleton width={width} height={height} borderRadius="0.5rem" className={className} />;
}

/**
 * Image skeleton with aspect ratio support
 */
export function SkeletonImage({
  aspectRatio = '16/9',
  className,
}: {
  aspectRatio?: string;
  className?: string;
}) {
  return (
    <div
      className={cn('relative overflow-hidden rounded-lg', className)}
      style={{ aspectRatio }}
      aria-hidden="true"
    >
      <Skeleton width="100%" height="100%" borderRadius="0.5rem" className="absolute inset-0" />
    </div>
  );
}
