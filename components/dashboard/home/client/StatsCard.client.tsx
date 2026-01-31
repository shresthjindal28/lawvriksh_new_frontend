'use client';

/**
 * StatsCard.client.tsx
 *
 * Client Component - handles CountUp animation.
 * Uses Framer Motion springs for smooth number animations.
 */

import { useRef, useEffect, ReactNode } from 'react';
import { useSpring, useMotionValue } from 'framer-motion';

// ============================================================================
// CountUp Animation Component
// ============================================================================

interface CountUpProps {
  to: number;
}

function CountUp({ to }: CountUpProps) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionValue = useMotionValue(0);
  const springValue = useSpring(motionValue, {
    damping: 30,
    stiffness: 100,
    duration: 2,
  });

  useEffect(() => {
    motionValue.set(to);
  }, [motionValue, to]);

  useEffect(() => {
    const unsubscribe = springValue.on('change', (latest) => {
      if (ref.current) {
        ref.current.textContent = Math.round(latest).toString();
      }
    });
    return () => unsubscribe();
  }, [springValue]);

  return <span ref={ref}>0</span>;
}

// ============================================================================
// StatsCard Component
// ============================================================================

interface StatsCardProps {
  label: string;
  value: number;
  trend: string;
  subtext?: string;
  icon: ReactNode;
  isStreak?: boolean;
}

export default function StatsCard({
  label,
  value,
  trend,
  subtext,
  icon,
  isStreak = false,
}: StatsCardProps) {
  return (
    <div className="dashboard-stat-card">
      <div>
        <h3 className="dashboard-stat-label">{label}</h3>
      </div>

      <div className="dashboard-stat-value">
        <CountUp to={value} />
      </div>

      <div className="dashboard-stat-footer">
        <div className="dashboard-footer-inner">
          <div className="dashboard-stat-trend">
            {icon}
            <span>{trend}</span>
          </div>

          {!isStreak && subtext && <div className="dashboard-stat-subtext">{subtext}</div>}
        </div>
      </div>
    </div>
  );
}
