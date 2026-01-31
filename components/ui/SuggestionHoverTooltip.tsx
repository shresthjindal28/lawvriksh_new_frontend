'use client';

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Keyboard, CornerDownLeft, Sparkles } from 'lucide-react';

interface SuggestionHoverTooltipProps {
  visible: boolean;
  x: number;
  y: number;
}

export default function SuggestionHoverTooltip({ visible, x, y }: SuggestionHoverTooltipProps) {
  if (!visible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: -5, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, scale: 0.95 }}
        transition={{ duration: 0.15 }}
        style={{
          position: 'fixed',
          left: x,
          top: y,
          zIndex: 9999,
          pointerEvents: 'none', // Allow clicking through to editor if needed, but tooltip is informative
          display: 'flex',
          flexDirection: 'column',
          gap: '4px',
          alignItems: 'flex-start',
          backgroundColor: 'white',
          border: '1px solid #e5e7eb',
          boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
          borderRadius: '8px',
          padding: '10px',
          minWidth: '240px',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '12px',
            fontWeight: 600,
            color: '#374151',
            marginBottom: '6px',
          }}
        >
          <Sparkles size={12} color="#393634" />
          <span>Smart Suggestion</span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', width: '100%' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#4b5563',
              backgroundColor: '#f9fafb',
              padding: '6px 8px',
              borderRadius: '4px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <CornerDownLeft size={10} />
              Accept
            </span>
            <kbd
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'monospace',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              Tab
            </kbd>
          </div>

          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              fontSize: '12px',
              color: '#4b5563',
              backgroundColor: '#f9fafb',
              padding: '6px 8px',
              borderRadius: '4px',
            }}
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <Keyboard size={10} />
              Next Suggestion
            </span>
            <kbd
              style={{
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '4px',
                padding: '2px 6px',
                fontSize: '10px',
                fontFamily: 'monospace',
                boxShadow: '0 1px 2px 0 rgba(0, 0, 0, 0.05)',
              }}
            >
              Alt + N
            </kbd>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
