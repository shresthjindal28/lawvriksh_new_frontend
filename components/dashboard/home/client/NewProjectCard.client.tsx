'use client';

/**
 * NewProjectCard.client.tsx
 *
 * Client Component - handles click to open project creation modal.
 * Uses Framer Motion for hover animations.
 */

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface NewProjectCardProps {
  id: string;
  label: string;
  Icon: LucideIcon;
  onClick: (categoryId: string) => void;
}

export default function NewProjectCard({ id, label, Icon, onClick }: NewProjectCardProps) {
  return (
    <motion.div
      onClick={() => onClick(id)}
      className="dashboard-new-project-card"
      whileHover={{ y: -4 }}
      whileTap={{ scale: 0.98 }}
    >
      <div className="dashboard-new-project-icon">
        <Icon size={24} strokeWidth={1.5} />
      </div>
      <span className="dashboard-new-project-label">{label}</span>
    </motion.div>
  );
}
