'use client';

import { useEffect, useRef } from 'react';
import gsap from 'gsap';

export default function EmptyStateAnimation() {
  const containerRef = useRef<HTMLDivElement>(null);
  const folderGroupRef = useRef<SVGGElement>(null);
  const glassRef = useRef<SVGGElement>(null);
  const paper1Ref = useRef<SVGGElement>(null);
  const paper2Ref = useRef<SVGGElement>(null);
  const shadowRef = useRef<SVGEllipseElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial state
      gsap.set(glassRef.current, { transformOrigin: '20px 20px' });
      gsap.set([paper1Ref.current, paper2Ref.current], { transformOrigin: 'bottom center' });

      // Floating animation for the whole folder group
      gsap.to(folderGroupRef.current, {
        y: -8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Shadow breathing
      gsap.to(shadowRef.current, {
        scaleX: 0.9,
        scaleY: 0.9,
        opacity: 0.3,
        transformOrigin: 'center',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
      });

      // Papers peeking out animation
      gsap.to(paper1Ref.current, {
        y: -5,
        rotation: -2,
        duration: 2.5,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
        delay: 0.2,
      });

      gsap.to(paper2Ref.current, {
        y: -8,
        rotation: 2,
        duration: 3,
        repeat: -1,
        yoyo: true,
        ease: 'power1.inOut',
      });

      // Magnifying glass scanning animation
      const glassTl = gsap.timeline({ repeat: -1 });
      glassTl
        .to(glassRef.current, {
          x: 40,
          y: -20,
          rotation: 15,
          duration: 1.5,
          ease: 'power1.inOut',
        })
        .to(glassRef.current, {
          x: -30,
          y: 0,
          rotation: -15,
          duration: 1.5,
          ease: 'power1.inOut',
        })
        .to(glassRef.current, {
          x: 0,
          y: 0,
          rotation: 0,
          duration: 1.5,
          ease: 'power1.inOut',
        });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div
      ref={containerRef}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        width: '100%',
        height: '100%',
        minHeight: '200px',
        position: 'relative',
      }}
    >
      <svg
        viewBox="0 -60 200 320"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        style={{
          width: '100%',
          height: '100%',
          maxWidth: '300px',
          maxHeight: '300px',
          overflow: 'visible',
        }}
        preserveAspectRatio="xMidYMid meet"
      >
        {/* Shadow */}
        <ellipse
          ref={shadowRef}
          cx="100"
          cy="170"
          rx="50"
          ry="6"
          fill="var(--color-text-tertiary)"
          opacity="0.2"
        />

        <g ref={folderGroupRef}>
          {/* Folder Back */}
          <path
            d="M60 80 H100 L110 90 H140 C142.209 90 144 91.7909 144 94 V150 C144 152.209 142.209 154 140 154 H60 C57.7909 154 56 152.209 56 150 V84 C56 81.7909 57.7909 80 60 80 Z"
            fill="#0E1F17"
            stroke="#12271D"
            strokeWidth="2"
          />

          {/* Paper 2 (Back) */}
          <g ref={paper2Ref}>
            <rect
              x="70"
              y="70"
              width="60"
              height="70"
              rx="2"
              fill="var(--color-surface)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <line
              x1="75"
              y1="80"
              x2="125"
              y2="80"
              stroke="var(--color-border-dark)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="75"
              y1="90"
              x2="125"
              y2="90"
              stroke="var(--color-border-dark)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="75"
              y1="100"
              x2="115"
              y2="100"
              stroke="var(--color-border-dark)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Paper 1 (Front) */}
          <g ref={paper1Ref}>
            <rect
              x="65"
              y="75"
              width="60"
              height="70"
              rx="2"
              fill="var(--color-surface-hover)"
              stroke="var(--color-border)"
              strokeWidth="1"
            />
            <line
              x1="70"
              y1="85"
              x2="120"
              y2="85"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="70"
              y1="95"
              x2="120"
              y2="95"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
            />
            <line
              x1="70"
              y1="105"
              x2="100"
              y2="105"
              stroke="var(--color-text-muted)"
              strokeWidth="2"
              strokeLinecap="round"
            />
          </g>

          {/* Folder Front */}
          <path
            d="M56 110 H144 V150 C144 152.209 142.209 154 140 154 H60 C57.7909 154 56 152.209 56 150 V110 Z"
            fill="#12271D"
            stroke="#2A4535"
            strokeWidth="2"
          />
          {/* Fold effect */}
          <path d="M56 110 L144 110 L134 105 H66 L56 110 Z" fill="#2A4535" opacity="0.5" />
        </g>

        {/* Magnifying Glass */}
        <g ref={glassRef} transform="translate(100, 110)">
          <circle
            cx="0"
            cy="0"
            r="18"
            stroke="var(--color-text-secondary)"
            strokeWidth="3"
            fill="rgba(255,255,255,0.4)"
          />
          <path
            d="M12 12 L26 26"
            stroke="var(--color-text-secondary)"
            strokeWidth="4"
            strokeLinecap="round"
          />
          {/* Glass Glare */}
          <path
            d="M-10 -8 Q-4 -14 6 -10"
            stroke="white"
            strokeWidth="2"
            opacity="0.6"
            strokeLinecap="round"
            fill="none"
          />
        </g>
      </svg>
    </div>
  );
}
