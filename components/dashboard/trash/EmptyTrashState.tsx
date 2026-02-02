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
    <div
      ref={containerRef}
      className="col-span-full flex flex-col items-center justify-center py-20 px-6 bg-white rounded-2xl border border-[#f0f0f0] text-center w-full min-h-[400px]"
    >
      <div className="flex flex-col items-center justify-center max-w-md w-full">
        <div ref={iconWrapperRef} className="relative mb-6">
          <div className="relative z-10 w-24 h-24 rounded-full bg-gray-50 flex items-center justify-center border-2 border-gray-100 shadow-sm">
            <Trash2 className="text-gray-400" size={48} strokeWidth={1.5} />
          </div>
          <div className="absolute -bottom-2 -right-2 bg-green-100 text-green-600 p-1.5 rounded-full border-2 border-white z-20 shadow-sm">
            <CheckCircle2 className="" size={20} />
          </div>
          <Sparkles
            ref={sparkleRef1}
            className="absolute -top-4 -right-4 text-yellow-400"
            size={24}
          />
          <Sparkles
            ref={sparkleRef2}
            className="absolute top-1/2 -left-8 text-blue-400"
            size={20}
          />
        </div>

        <div ref={textRef} className="flex flex-col items-center gap-2">
          <h3 className="text-lg font-semibold text-[#333] m-0">All Clean!</h3>
          <p className="text-sm text-[#666] m-0 max-w-[300px]">
            Your trash bin is empty. Keep up the great work maintaining a tidy workspace.
          </p>
        </div>
      </div>
    </div>
  );
};

export default EmptyTrashState;
