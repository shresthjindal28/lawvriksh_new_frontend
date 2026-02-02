'use client';

import type React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import '../../styles/common-styles/loader.css';
import '@/styles/ui-styles/search-loader.css';
interface LoaderProps {
  message?: string;
}

export default function Loader({ message }: LoaderProps) {
  return (
    <div className="flex justify-center items-center h-screen gap-4">
      <div className="border-4 border-gray-100 border-t-[--lv-accent-gold-light] rounded-full w-[50px] h-[50px] animate-spin" />
      {message && <p className="mt-4 text-gray-900">{message}</p>}
    </div>
  );
}

export interface SkeletonLoaderProps {
  width?: string | number;
  height?: string | number;
  borderRadius?: string | number;
  className?: string;
  style?: React.CSSProperties;
}

export function SkeletonLoader({
  width = '100%',
  height = '1rem',
  borderRadius = '4px',
  className = '',
  style,
}: SkeletonLoaderProps) {
  return (
    <motion.div
      className={cn('bg-gray-200', className)}
      style={{
        width,
        height,
        borderRadius,
        ...style,
      }}
      animate={{
        opacity: [0.5, 0.8, 0.5],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    />
  );
}

// Bar animation delays for the search loader
const barDelays = [
  '0s',
  '-1.1s',
  '-1s',
  '-0.9s',
  '-0.8s',
  '-0.7s',
  '-0.6s',
  '-0.5s',
  '-0.4s',
  '-0.3s',
  '-0.2s',
  '-0.1s',
];

const barRotations = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];

export function SearchLoader() {
  return (
    <div className="relative w-[54px] h-[54px] rounded-[10px]">
      {barDelays.map((delay, index) => (
        <div
          key={index}
          className="absolute left-1/2 top-[30%] w-[8%] h-[24%] bg-gray-500 rounded-[50px] opacity-0 shadow-[0_0_3px_rgba(0,0,0,0.2)]"
          style={{
            transform: `rotate(${barRotations[index]}deg) translate(0, -130%)`,
            animation: 'fade458 1s linear infinite',
            animationDelay: delay,
          }}
        />
      ))}
      <style jsx>{`
        @keyframes fade458 {
          from {
            opacity: 1;
          }
          to {
            opacity: 0.25;
          }
        }
      `}</style>
    </div>
  );
}
