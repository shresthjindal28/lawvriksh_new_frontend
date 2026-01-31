'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Check, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface LoadingSuccessProps {
  isLoading: boolean;
  isSuccess: boolean;
  children?: React.ReactNode;
  className?: string;
  size?: number;
}

/**
 * Animated loading to success transition component
 * Shows a spinner while loading, then animates to a checkmark on success
 */
export function LoadingSuccess({
  isLoading,
  isSuccess,
  children,
  className,
  size = 24,
}: LoadingSuccessProps) {
  return (
    <AnimatePresence mode="wait">
      {isLoading ? (
        <motion.div
          key="loading"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className={cn('flex items-center justify-center', className)}
        >
          {children || (
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
            >
              <Loader2 size={size} className="text-primary-300" />
            </motion.div>
          )}
        </motion.div>
      ) : isSuccess ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, scale: 0 }}
          animate={{
            opacity: 1,
            scale: [0, 1.2, 1],
          }}
          transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
          className={cn('flex items-center justify-center text-green-500', className)}
        >
          <Check size={size} />
        </motion.div>
      ) : null}
    </AnimatePresence>
  );
}
