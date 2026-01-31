'use client';

import type React from 'react';
import { motion } from 'framer-motion';

import '../../styles/common-styles/loader.css';
import '@/styles/ui-styles/search-loader.css';

interface LoaderProps {
  message?: string;
}

export default function Loader({ message }: LoaderProps) {
  return (
    <div className="Loader-Container">
      <div className="Loader"></div>
      {message && <p className="Loader-Message">{message}</p>}
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
      className={`skeleton-loader ${className}`}
      style={{
        width,
        height,
        borderRadius,
        backgroundColor: '#f0f0f0',
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

export function SearchLoader() {
  return (
    <div className="loader">
      <div className="bar1"></div>
      <div className="bar2"></div>
      <div className="bar3"></div>
      <div className="bar4"></div>
      <div className="bar5"></div>
      <div className="bar6"></div>
      <div className="bar7"></div>
      <div className="bar8"></div>
      <div className="bar9"></div>
      <div className="bar10"></div>
      <div className="bar11"></div>
      <div className="bar12"></div>
    </div>
  );
}
