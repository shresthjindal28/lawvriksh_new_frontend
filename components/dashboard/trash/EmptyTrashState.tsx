'use client';

import React, { useEffect, useRef } from 'react';
import gsap from 'gsap';
import { Trash2, Sparkles, CheckCircle2 } from 'lucide-react';

const EmptyTrashState = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const iconWrapperRef = useRef<HTMLDivElement>(null);
  const textRef = useRef<HTMLDivElement>(null);
  const sparkleRef1 = useRef<SVGSVGElement>(null);
  const sparkleRef2 = useRef<SVGSVGElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Initial states
      gsap.set(iconWrapperRef.current, { scale: 0.5, opacity: 0 });
      gsap.set(textRef.current, { y: 20, opacity: 0 });
      gsap.set([sparkleRef1.current, sparkleRef2.current], { scale: 0, opacity: 0 });

      const tl = gsap.timeline({ defaults: { ease: 'back.out(1.7)' } });

      // Main entrance animation
      tl.to(iconWrapperRef.current, {
        scale: 1,
        opacity: 1,
        duration: 0.8,
      })
        .to(
          textRef.current,
          {
            y: 0,
            opacity: 1,
            duration: 0.6,
            ease: 'power2.out',
          },
          '-=0.4'
        )
        .to(
          [sparkleRef1.current, sparkleRef2.current],
          {
            scale: 1,
            opacity: 1,
            duration: 0.4,
            stagger: 0.2,
          },
          '-=0.4'
        );

      // Continuous subtle floating animation for the icon
      gsap.to(iconWrapperRef.current, {
        y: -10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: 'sine.inOut',
        delay: 1,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);

  return (
    <div ref={containerRef} className="empty-trash-container">
      <div className="empty-trash-content">
        <div ref={iconWrapperRef} className="empty-trash-icon-wrapper">
          <div className="icon-circle">
            <Trash2 className="trash-icon" size={48} strokeWidth={1.5} />
          </div>
          <div className="check-badge">
            <CheckCircle2 className="check-icon" size={20} />
          </div>
          <Sparkles ref={sparkleRef1} className="sparkle-icon sparkle-1" size={24} />
          <Sparkles ref={sparkleRef2} className="sparkle-icon sparkle-2" size={20} />
        </div>

        <div ref={textRef} className="empty-trash-text-container">
          <h3 className="empty-trash-heading">All Clean!</h3>
          <p className="empty-trash-description">
            Your trash bin is empty. Keep up the great work maintaining a tidy workspace.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyTrashState;
