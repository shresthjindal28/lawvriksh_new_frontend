'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';

interface AnimatedEmptyCollectionProps {
  className?: string;
}

export const AnimatedEmptyCollection: React.FC<AnimatedEmptyCollectionProps> = ({ className }) => {
  const svgRef = useRef<SVGSVGElement>(null);
  const folderBackRef = useRef<SVGPathElement>(null);
  const folderFrontRef = useRef<SVGPathElement>(null);
  const plusGroupRef = useRef<SVGGElement>(null);

  useEffect(() => {
    const svg = svgRef.current;
    const folderBack = folderBackRef.current;
    const folderFront = folderFrontRef.current;
    const plusGroup = plusGroupRef.current;

    if (!svg || !folderBack || !folderFront || !plusGroup) return;

    // Initial State (Reinforce with GSAP for runtime, though CSS handles FOUC)
    gsap.set(folderFront, { transformOrigin: 'bottom left' });
    gsap.set(plusGroup, { transformOrigin: 'center center', scale: 0, opacity: 0 });

    const tl = gsap.timeline({ repeat: -1, repeatDelay: 5 });

    tl.addLabel('start')
      // Reset
      .set(folderFront, { scaleY: 1, skewX: 0 })
      .set(plusGroup, { scale: 0, opacity: 0, rotation: 0 })

      // Step 1: Open Folder (Simulated by scaling/skewing front)
      .to(folderFront, {
        scaleY: 0.8,
        skewX: -10,
        duration: 0.5,
        ease: 'power2.inOut',
      })

      // Step 2: Plus Pop Up
      .to(
        plusGroup,
        {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: 'elastic.out(1, 0.5)',
        },
        '-=0.2'
      )

      // Step 3: Rotate Plus
      .to(
        plusGroup,
        {
          rotation: 90,
          duration: 0.4,
          ease: 'back.inOut(1.7)',
        },
        '+=0.1'
      )

      // Step 4: Hold
      .to({}, { duration: 1.5 })

      // Step 5: Close
      .to(plusGroup, {
        scale: 0,
        opacity: 0,
        rotation: 0,
        duration: 0.3,
        ease: 'power2.in',
      })
      .to(
        folderFront,
        {
          scaleY: 1,
          skewX: 0,
          duration: 0.5,
          ease: 'power2.inOut',
        },
        '-=0.1'
      );

    return () => {
      tl.kill();
    };
  }, []);

  return (
    <svg
      ref={svgRef}
      width="48"
      height="48"
      viewBox="0 0 24 24"
      fill="none"
      stroke="#12271D"
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      {/* Folder Back/Tab */}
      <path
        ref={folderBackRef}
        d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"
        className="opacity-50"
        display="none"
      />

      {/* Reconstructed Folder for Animation */}

      {/* Back Tab */}
      <path d="M2 5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2v2H2V5z" fill="none" />

      {/* Folder Front (Main Body) */}
      <path ref={folderFrontRef} d="M2 10v9a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-9H2z" fill="none" />

      {/* Plus Icon - Initially hidden via inline style to prevent FOUC */}
      <g ref={plusGroupRef} style={{ opacity: 0, transform: 'scale(0)' }}>
        <line x1="12" y1="11" x2="12" y2="17" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </g>
    </svg>
  );
};
