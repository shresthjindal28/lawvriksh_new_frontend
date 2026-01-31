import React, { useRef, useEffect, forwardRef } from 'react';
import { Plus } from 'lucide-react';
import gsap from 'gsap';

interface AnimatedCreateButtonProps {
  onClick: () => void;
  isOpen: boolean;
  className?: string;
}

export const AnimatedCreateButton = forwardRef<HTMLButtonElement, AnimatedCreateButtonProps>(
  ({ onClick, isOpen, className }, ref) => {
    const buttonRef = useRef<HTMLButtonElement | null>(null);
    const textRef = useRef<HTMLSpanElement>(null);
    const animationRef = useRef<HTMLDivElement>(null);
    const plusRef = useRef<HTMLDivElement>(null);

    // Combine refs
    useEffect(() => {
      if (!ref) return;
      if (typeof ref === 'function') {
        ref(buttonRef.current);
      } else {
        ref.current = buttonRef.current;
      }
    }, [ref]);

    useEffect(() => {
      const button = buttonRef.current;
      const text = textRef.current;
      const animation = animationRef.current;
      const plus = plusRef.current;

      if (!button || !text || !animation || !plus) return;

      const tl = gsap.timeline();

      if (isOpen) {
        // OPEN STATE ANIMATION
        tl
          // 1. Change Colors (Black -> White BG, White -> Green Text)
          .to(button, {
            backgroundColor: '#ffffff',
            color: '#12271D',
            borderColor: '#12271D',
            duration: 0.4,
            ease: 'power2.out',
          })
          // 2. Rotate Plus Icon
          .to(
            plus,
            { rotation: 180, autoAlpha: 0, scale: 0.5, duration: 0.4, ease: 'back.in(1.7)' },
            '<'
          )
          // 3. Hide "Create" Text (Slide Up/Fade Out)
          .to(text, { y: -10, autoAlpha: 0, duration: 0.3, ease: 'power2.in' }, '<')
          // 4. Show Animation (Slide Up/Fade In)
          .set(animation, { display: 'flex' })
          .fromTo(
            animation,
            { y: 10, autoAlpha: 0 },
            { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' }
          );
      } else {
        // CLOSE STATE ANIMATION (Revert)
        tl
          // 1. Hide Animation
          .to(animation, { y: 10, autoAlpha: 0, duration: 0.3, ease: 'power2.in' })
          .set(animation, { display: 'none' })
          // 2. Show "Create" Text
          .to(text, { y: 0, autoAlpha: 1, duration: 0.4, ease: 'back.out(1.7)' })
          // 3. Revert Colors
          .to(
            button,
            {
              backgroundColor: '', // Revert to CSS default (black)
              color: '',
              borderColor: '',
              duration: 0.4,
              ease: 'power2.out',
              clearProps: 'all', // Clear inline styles to let CSS take over
            },
            '<'
          )
          // 4. Rotate Plus Back
          .to(
            plus,
            { rotation: 0, autoAlpha: 1, scale: 1, duration: 0.4, ease: 'back.out(1.7)' },
            '<'
          );
      }

      return () => {
        tl.kill();
      };
    }, [isOpen]);

    return (
      <button
        ref={buttonRef}
        onClick={onClick}
        className={`createBtn relative overflow-hidden ${className || ''}`}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '8px',
          minWidth: '100px', // Ensure consistent width
        }}
      >
        {/* Plus Icon Container */}
        <div ref={plusRef} className="flex items-center justify-center">
          <Plus size={18} />
        </div>

        {/* Text Container */}
        <span ref={textRef} className="font-medium">
          Create
        </span>

        {/* Animation Container (Replaces Text) */}
        <div
          ref={animationRef}
          style={{
            position: 'absolute',
            inset: 0,
            display: 'none',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '3px',
            opacity: 0,
          }}
        >
          {/* Simple "Typing/Thinking" Dots Animation */}
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-[#12271D]"
              style={{
                animation: `bounce 1s infinite ${i * 0.2}s`,
              }}
            />
          ))}
          <style jsx>{`
            @keyframes bounce {
              0%,
              100% {
                transform: translateY(0);
              }
              50% {
                transform: translateY(-4px);
              }
            }
          `}</style>
        </div>
      </button>
    );
  }
);

AnimatedCreateButton.displayName = 'AnimatedCreateButton';
