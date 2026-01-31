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
    <div
      className="page-header-default sticky-header"
      style={{ paddingLeft: '20px', paddingRight: '20px' }}
    >
      <div
        className="header-content"
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          width: '100%',
          maxWidth: '100%',
          margin: 0,
          gap: '1rem',
        }}
      >
        <div className="topbar-left" style={{ minWidth: 0, flex: 1, paddingRight: 0 }}>
          <div className="topbar-brand" style={{ width: '100%' }}>
            <Link
              href="/dashboard"
              className="topbar-brand"
              style={{ textDecoration: 'none', color: 'inherit', flexShrink: 0 }}
            >
              <ArrowLeft size={16} />
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
              className="topbar-title bg-transparent border-none outline-none focus:ring-0 p-0 m-0"
              style={{
                fontSize: '18px',
                fontWeight: 500,
                color: '#111827',
                flex: 1,
                minWidth: 0,
                width: '100%',
                textOverflow: 'ellipsis',
              }}
              placeholder="Untitled Document"
              aria-label="Document Title"
            />
          </div>
        </div>
        <div className="topbar-right" style={{ flexShrink: 0 }}>
          <div className="topbar-brand">
            <p className="topbar-save-text" style={{ whiteSpace: 'nowrap' }}>
              {isSaving ? (
                'Saving...'
              ) : (
                <>Edited {project?.updated_at ? formatTimeAgo(project.updated_at) : 'just now'}</>
              )}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
