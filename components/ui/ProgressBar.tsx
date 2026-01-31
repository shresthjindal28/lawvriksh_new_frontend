import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import '../../styles/auth-styles/progressbar.auth.css';

interface ProgressBarProps {
  progress: number;
  isVisible: boolean;
  className?: string;
}

const ProgressBar: React.FC<ProgressBarProps> = ({ progress, isVisible, className }) => {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          className={`progressBar ${className}`}
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.5 }}
        >
          <motion.div
            className="progressFill"
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.8, ease: 'easeOut' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default ProgressBar;
