import { motion, AnimatePresence } from 'framer-motion';
import { MoreVertical, Trash2, Edit, Share, Download, Eye, RotateCcw } from 'lucide-react';
import { useState, useRef, useEffect, memo } from 'react';
import { useRouter } from 'next/navigation';
import '@/styles/dashboard-styles/project-card.css';
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
      className="flex h-full w-full pt-[22px] pb-[16.92px] px-[22px] flex-col items-start gap-4 rounded-[14px] bg-white text-left relative overflow-hidden box-border border border-[rgba(19,52,53,0.08)] shadow-[0_2px_4px_rgba(0,0,0,0.02)] transition-shadow duration-300"
      onClick={handleCardClick}
    >
      {/* Three-dot menu */}
      <div className="absolute top-4 right-3 z-20" ref={menuRef}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            setIsMenuOpen(!isMenuOpen);
          }}
          className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
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
              className="absolute right-0 top-8 w-40 bg-white rounded-lg shadow-xl border border-gray-100 py-1 z-30 flex flex-col overflow-hidden [&>button]:flex [&>button]:items-center [&>button]:gap-2 [&>button]:px-3 [&>button]:py-2 [&>button]:text-sm [&>button]:text-gray-600 [&>button]:hover:bg-gray-50 [&>button]:w-full [&>button]:text-left [&>button]:transition-colors"
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
                    className="text-red-600 hover:bg-red-50"
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
                    className="text-red-600 hover:bg-red-50"
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
      <h3
        className="w-full text-[#133435] text-[18px] font-normal leading-tight overflow-hidden text-ellipsis line-clamp-2 min-h-[44px]"
        style={{ fontFamily: "var(--font-instrument-serif), 'Instrument Serif', serif" }}
      >
        {project.title}
      </h3>

      {/* Footer: Template Type & Last Edited */}
      <div className="flex justify-between items-center self-stretch pt-3 mt-auto border-t border-[rgba(19,52,53,0.06)] gap-2">
        <span
          className="px-2.5 py-1 rounded-full text-[11px] font-medium tracking-wide whitespace-nowrap shrink-0 transition-colors duration-200"
          style={{ backgroundColor: categoryStyle.bg, color: categoryStyle.text }}
        >
          {formatCategory(project.category)}
        </span>
        <p className="text-[#b7b7b7] text-[10px] italic whitespace-nowrap shrink-0">
          Last edited: {formatRelativeTime(project.updated_at)}
        </p>
      </div>
    </motion.div>
  );
}

// ✅ OPTIMIZED: Export memoized version to prevent re-renders when props haven't changed
export default memo(ProjectCard);
