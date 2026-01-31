'use client';

import { motion } from 'framer-motion';
import { AlertCircle, RefreshCw, HelpCircle, WifiOff, Lock, FileQuestion } from 'lucide-react';
import { slideUp } from '@/lib/constants/animation-variants';
import { cn } from '@/lib/utils';

type ErrorType = 'generic' | 'network' | 'auth' | 'notFound' | 'permission';

interface ErrorStateProps {
  type?: ErrorType;
  title?: string;
  message: string;
  onRetry?: () => void;
  isRetrying?: boolean;
  showSupport?: boolean;
  className?: string;
}

const errorConfig: Record<
  ErrorType,
  { icon: React.ReactNode; defaultTitle: string; color: string }
> = {
  generic: {
    icon: <AlertCircle size={48} />,
    defaultTitle: 'Something went wrong',
    color: 'text-red-500',
  },
  network: {
    icon: <WifiOff size={48} />,
    defaultTitle: 'Connection problem',
    color: 'text-orange-500',
  },
  auth: {
    icon: <Lock size={48} />,
    defaultTitle: 'Authentication required',
    color: 'text-amber-500',
  },
  notFound: {
    icon: <FileQuestion size={48} />,
    defaultTitle: 'Not found',
    color: 'text-gray-500',
  },
  permission: {
    icon: <Lock size={48} />,
    defaultTitle: 'Access denied',
    color: 'text-red-500',
  },
};

/**
 * Reusable error state component with consistent styling
 * Provides clear feedback and recovery options
 */
export function ErrorState({
  type = 'generic',
  title,
  message,
  onRetry,
  isRetrying = false,
  showSupport = true,
  className,
}: ErrorStateProps) {
  const config = errorConfig[type];

  return (
    <motion.div
      initial="initial"
      animate="animate"
      exit="exit"
      variants={slideUp}
      className={cn('flex flex-col items-center justify-center p-8 text-center', className)}
      role="alert"
      aria-live="polite"
    >
      {/* Icon */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.1, duration: 0.3 }}
        className={cn('mb-4', config.color)}
      >
        {config.icon}
      </motion.div>

      {/* Title */}
      <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-gray-100">
        {title || config.defaultTitle}
      </h3>

      {/* Message */}
      <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md leading-relaxed">{message}</p>

      {/* Actions */}
      <div className="flex items-center gap-3">
        {onRetry && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={onRetry}
            disabled={isRetrying}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-primary-300 text-white font-medium',
              'hover:bg-primary-400 transition-colors',
              'disabled:opacity-50 disabled:cursor-not-allowed',
              'focus:outline-none focus:ring-2 focus:ring-primary-300 focus:ring-offset-2'
            )}
          >
            {isRetrying ? (
              <>
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                >
                  <RefreshCw size={16} />
                </motion.div>
                <span>Retrying...</span>
              </>
            ) : (
              <>
                <RefreshCw size={16} />
                <span>Try Again</span>
              </>
            )}
          </motion.button>
        )}

        {showSupport && (
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => window.open('mailto:support@lawvriksh.com', '_blank')}
            className={cn(
              'inline-flex items-center gap-2 px-4 py-2 rounded-lg',
              'bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 font-medium',
              'hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors',
              'focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2'
            )}
          >
            <HelpCircle size={16} />
            <span>Get Help</span>
          </motion.button>
        )}
      </div>
    </motion.div>
  );
}

/**
 * Inline error message for forms and smaller contexts
 */
export function InlineError({ message, className }: { message: string; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -5 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -5 }}
      className={cn('flex items-center gap-2 text-sm text-red-600 dark:text-red-400', className)}
      role="alert"
    >
      <AlertCircle size={14} />
      <span>{message}</span>
    </motion.div>
  );
}
