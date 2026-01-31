'use client';

/**
 * ProjectListVirtualized.client.tsx
 *
 * Client Component - renders a virtualized grid of project cards.
 * Uses TanStack Virtual for efficient rendering of large lists.
 *
 * Only renders visible items + overscan, reducing DOM nodes from O(n) to O(k).
 */

import { useRef, useMemo, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import { motion } from 'framer-motion';
import { Plus } from 'lucide-react';
import ProjectCard from '../../ProjectCard';
import { ProjectCardSkeletonGrid } from '@/components/ui/skeletons/ProjectCardSkeleton';
import { WorkspaceProject } from '@/types/workspace';

// ============================================================================
// Constants
// ============================================================================

// Threshold for enabling virtualization (below this, render normally)
const VIRTUALIZATION_THRESHOLD = 20;

// Grid configuration
const CARD_HEIGHT = 200; // Approximate height of project card
const CARD_GAP = 16; // Gap between cards
const COLUMNS = 3; // Number of columns in grid

// Animation variants (static to prevent re-creation)
const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.02,
      delayChildren: 0,
    },
  },
};

const itemVariants = {
  hidden: { opacity: 1, y: 0 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      type: 'spring' as const,
      stiffness: 100,
      damping: 15,
    },
  },
};

// ============================================================================
// Types
// ============================================================================

interface ProjectListVirtualizedProps {
  projects: WorkspaceProject[];
  isLoading: boolean;
  hasFetched: boolean;
  onDelete: (projectId: string) => void;
  onEdit: (project: any) => void;
  onExport: (projectId: string) => void;
  onShare: (projectId: string) => void;
  onCreateFromScratch: () => void;
}

// ============================================================================
// Component
// ============================================================================

export default function ProjectListVirtualized({
  projects,
  isLoading,
  hasFetched,
  onDelete,
  onEdit,
  onExport,
  onShare,
  onCreateFromScratch,
}: ProjectListVirtualizedProps) {
  const parentRef = useRef<HTMLDivElement>(null);

  // Calculate rows for virtualization (grid layout)
  const rows = useMemo(() => {
    const result: WorkspaceProject[][] = [];
    for (let i = 0; i < projects.length; i += COLUMNS) {
      result.push(projects.slice(i, i + COLUMNS));
    }
    return result;
  }, [projects]);

  // Virtualizer for rows
  // eslint-disable-next-line react-hooks/incompatible-library
  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => CARD_HEIGHT + CARD_GAP,
    overscan: 3, // Render 3 extra rows above/below viewport
  });

  // Decide whether to use virtualization
  const useVirtualization = projects.length > VIRTUALIZATION_THRESHOLD;

  // Loading state
  if (isLoading && !hasFetched) {
    return <ProjectCardSkeletonGrid count={6} />;
  }

  // Empty state
  if (!projects || projects.length === 0) {
    return (
      <div className="dashboard-recent-empty">
        <div className="dashboard-recent-empty-icon">
          <Plus size={20} />
        </div>
        <h3 className="dashboard-recent-empty-title">No projects yet</h3>
        <p className="dashboard-recent-empty-text">
          Create your first project to get started with LawVriksh.
        </p>
        <button onClick={onCreateFromScratch} className="dashboard-recent-empty-button">
          <Plus size={16} />
          <span>Create Empty Project</span>
        </button>
      </div>
    );
  }

  // Non-virtualized rendering for small lists
  if (!useVirtualization) {
    return (
      <motion.div
        className="dashboard-projects-grid"
        variants={containerVariants}
        initial="hidden"
        animate="visible"
      >
        {projects.map((project) => (
          <motion.div key={project.id} variants={itemVariants}>
            <ProjectCard
              project={project}
              onDelete={onDelete}
              onEdit={onEdit}
              onExport={onExport}
              onShare={onShare}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  }

  // Virtualized rendering for large lists
  return (
    <div
      ref={parentRef}
      className="dashboard-projects-grid-virtualized"
      style={{
        height: '600px', // Fixed height container for virtualization
        overflow: 'auto',
        contain: 'strict', // Performance optimization
      }}
    >
      <div
        style={{
          height: `${rowVirtualizer.getTotalSize()}px`,
          width: '100%',
          position: 'relative',
        }}
      >
        {rowVirtualizer.getVirtualItems().map((virtualRow) => {
          const rowProjects = rows[virtualRow.index];
          return (
            <div
              key={virtualRow.key}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: `${virtualRow.size}px`,
                transform: `translateY(${virtualRow.start}px)`,
                display: 'grid',
                gridTemplateColumns: `repeat(${COLUMNS}, 1fr)`,
                gap: `${CARD_GAP}px`,
                padding: '0 4px',
              }}
            >
              {rowProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onDelete={onDelete}
                  onEdit={onEdit}
                  onExport={onExport}
                  onShare={onShare}
                />
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}
