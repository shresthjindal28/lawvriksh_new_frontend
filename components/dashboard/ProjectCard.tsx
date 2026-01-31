import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Edit, Share, Download, Eye, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';

interface ProjectCardProps {
  project: any;
  onDelete?: (projectId: string) => void;
  onEdit?: (project: any) => void;
  onShare?: (projectId: string) => void;
  onExport?: (projectId: string) => void;
  onRestore?: (projectId: string) => void;
  index?: number;
  isTrashView?: boolean;
  variants?: any;
}

const categoryColors: Record<string, { bg: string; text: string }> = {
  Article: { bg: '#627C7D', text: '#ffffff' },
  Assignment: { bg: '#627C7D', text: '#ffffff' },
  'Research paper': { bg: '#627C7D', text: '#ffffff' },
  Research_paper: { bg: '#627C7D', text: '#ffffff' },
  Ideation: { bg: '#78716C', text: '#ffffff' },
  Draft: { bg: '#627C7D', text: '#ffffff' },
  draft: { bg: '#627C7D', text: '#ffffff' },
  assignment: { bg: '#627C7D', text: '#ffffff' },
  article: { bg: '#627C7D', text: '#ffffff' },
  research_paper: { bg: '#627C7D', text: '#ffffff' },
  ideation: { bg: '#627C7D', text: '#ffffff' },
};

// Author avatar colors - matching the design
const authorAvatarColors = [
  '#FFC4C4', // Pink/Red
  '#E8D4FF', // Purple
  '#C8FFCE', // Green
  '#E0E0E0', // Gray for overflow
];

// ✅ OPTIMIZED: Component wrapped with React.memo to prevent unnecessary re-renders
function ProjectCard({
  project,
  onDelete,
  onEdit,
  onShare,
  onExport,
  onRestore,
  index = 0,
  isTrashView = false,
  variants,
}: ProjectCardProps) {
  const router = useRouter();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const handleCardClick = () => {
    // Route draft projects to AI Drafting page
    const category = project.category?.toLowerCase() || '';
    if (category === 'draft') {
      router.push(`/AIDrafting/writing-section/${project.id}`);
    } else {
      router.push(`/writing-section/${project.id}`);
    }
  };

  const handleMenuAction = (action: () => void) => {
    action();
    setIsMenuOpen(false);
  };

  const handleDelete = () => {
    if (onDelete) {
      onDelete(project.id);
    }
  };

  const handleEdit = () => {
    if (onEdit) {
      onEdit(project);
    }
  };

  const handleShare = () => {
    if (onShare) {
      onShare(project.id);
    }
  };

  const handleExport = () => {
    if (onExport) {
      onExport(project.id);
    }
  };

  const handleRestore = () => {
    if (onRestore) {
      onRestore(project.id);
    }
  };

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Extract authors from metadata
  const authors =
    project.metadata?.data?.templateData?.authorNames ||
    project.metadata?.template_data?.templateData?.authorNames ||
    [];

  // Format category name
  const formatCategory = (category: string) => {
    if (!category) return 'Uncategorized';
    return category.charAt(0).toUpperCase() + category.slice(1).replace('_', ' ');
  };

  // Format relative time
  const formatRelativeTime = (dateString: string) => {
    if (!dateString) return 'Unknown';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'just now';
    if (diffMins < 60) return `${diffMins} minute${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
    return date.toLocaleDateString();
  };

  // Get author initials
  const getAuthorInitials = (name: string) => {
    return name
      .split(' ')
      .map((n: string) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const categoryStyle = categoryColors[formatCategory(project.category)] || {
    bg: '#f3f4f6',
    text: '#535353',
  };

  return (
    <motion.div
      variants={variants}
      initial={variants ? 'hidden' : { opacity: 0, y: 20 }}
      animate={variants ? 'visible' : { opacity: 1, y: 0 }}
      whileHover={{
        y: -8,
        scale: 1.02,
        boxShadow:
          'var(--shadow-floating, 0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04))',
      }}
      transition={{
        type: 'spring',
        stiffness: 400,
        damping: 30,
      }}
      className="project-card-container"
      onClick={handleCardClick}
    >
      {/* Three-dot menu */}
      <div className="project-card-menu" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="project-card-menu-btn"
        >
          <MoreVertical size={16} />
        </button>

        {/* Dropdown menu */}
        <AnimatePresence>
          {isMenuOpen && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -5 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -5 }}
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="project-card-dropdown"
            >
              {isTrashView ? (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(handleRestore);
                    }}
                  >
                    <RotateCcw size={14} /> Restore
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(handleDelete);
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={14} /> Delete Forever
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(handleCardClick);
                    }}
                  >
                    <Eye size={14} /> Open
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(handleEdit);
                    }}
                  >
                    <Edit size={14} /> Edit
                  </button>

                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleMenuAction(handleDelete);
                    }}
                    className="delete-btn"
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Title */}
      <h3 className="project-card-title">{project.title}</h3>

      {/* Gold divider */}
      <div className="project-card-divider" />

      {/* Authors Section */}
      <div className="project-card-authors">
        <p className="authors-label">Authors:</p>
        <div className="authors-avatars">
          {authors.slice(0, 3).map((author: string, idx: number) => (
            <motion.div
              key={idx}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2 + idx * 0.1, type: 'spring' }}
              className="author-avatar"
              style={{ backgroundColor: authorAvatarColors[idx % authorAvatarColors.length] }}
            >
              {getAuthorInitials(author)}
            </motion.div>
          ))}
          {authors.length > 3 && (
            <div
              className="author-avatar author-overflow"
              style={{ backgroundColor: authorAvatarColors[3] }}
            >
              +{authors.length - 3}
            </div>
          )}
        </div>
      </div>

      {/* Footer: Template Type & Last Edited */}
      <div className="project-card-footer">
        <span
          className="template-badge"
          style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
        >
          {formatCategory(project.category)}
        </span>
        <p className="last-edited">Last edited: {formatRelativeTime(project.updated_at)}</p>
      </div>
    </motion.div>
  );
}

// ✅ OPTIMIZED: Export memoized version to prevent re-renders when props haven't changed
export default memo(ProjectCard);
