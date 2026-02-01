import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { formatTimeAgo } from '@/lib/utils/helpers';
import { GetProjectContent } from '@/types/project';

interface EditableTitleHeaderProps {
  projectTitle: string;
  project: GetProjectContent | null;
  onTitleChange: (newTitle: string) => Promise<void>;
  isSaving?: boolean;
  onBack?: () => void;
}

export default function EditableTitleHeader({
  projectTitle,
  project,
  onTitleChange,
  isSaving = false,
  onBack,
}: EditableTitleHeaderProps) {
  const [title, setTitle] = useState(projectTitle);
  const [isEditing, setIsEditing] = useState(false);
  // Track if we have a pending local change that hasn't been reflected in props yet
  const pendingTitleRef = React.useRef<string | null>(null);

  // Sync with prop when it changes (and we're not editing and no pending change)
  const prevProjectTitleRef = useRef(projectTitle);
  useEffect(() => {
    // If we have a pending title change, only sync once prop matches it
    if (pendingTitleRef.current !== null) {
      if (projectTitle === pendingTitleRef.current) {
        // Prop now matches our pending change - clear pending
        pendingTitleRef.current = null;
      }
      // Don't overwrite local state while we have a pending change
      return;
    }

    // Only sync from props when not editing and prop actually changed
    if (!isEditing && prevProjectTitleRef.current !== projectTitle) {
      prevProjectTitleRef.current = projectTitle;
      queueMicrotask(() => setTitle(projectTitle));
    }
  }, [projectTitle, isEditing]);

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    const newTitle = title.trim() || 'Untitled Document';
    if (newTitle !== projectTitle) {
      // Mark that we have a pending change
      pendingTitleRef.current = newTitle;
      onTitleChange(newTitle);
    }
  }, [title, projectTitle, onTitleChange]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.currentTarget.blur();
    }
  };

  return (
    <div className="sticky top-0 z-40 w-full bg-white border-b border-gray-200">
      <div className="h-14 px-5 flex items-center justify-between gap-4">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <Link
            href="/dashboard"
            className="text-gray-500 hover:text-gray-900 transition-colors shrink-0 p-1 rounded-md hover:bg-gray-100"
          >
            <ArrowLeft size={18} />
          </Link>
          <input
            type="text"
            value={title}
            onChange={(e) => {
              setTitle(e.target.value);
              setIsEditing(true);
            }}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            className="flex-1 min-w-0 bg-transparent border-none outline-none text-base font-semibold text-gray-900 placeholder:text-gray-400 focus:ring-0 p-0"
            placeholder="Untitled Document"
            aria-label="Document Title"
          />
        </div>
        <div className="shrink-0">
          <p className="text-xs text-gray-500 font-medium whitespace-nowrap">
            {isSaving ? (
              'Saving...'
            ) : (
              <>
                Edited{' '}
                {project?.updated_at ? formatTimeAgo(project.updated_at) : 'just now'}
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
