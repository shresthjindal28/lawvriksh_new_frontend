'use client';

import React, { memo, useCallback, CSSProperties } from 'react';
import Image from 'next/image';
import { FileText, Trash2 } from 'lucide-react';
import { ReferenceItem } from '@/types/reference-manager';
import '@/styles/reference-manager/referenceTable.css';

interface ReferenceRowProps {
  reference: ReferenceItem;
  isSelected: boolean;
  isInSelection: boolean;
  isDragging: boolean;
  style: CSSProperties;
  onClick: (e: React.MouseEvent, id: string) => void;
  onCheckboxChange: (e: React.ChangeEvent<HTMLInputElement>, id: string) => void;
  onDragStart: (e: React.DragEvent, id: string) => void;
  onDragEnd: () => void;
  onDelete: (id: string) => void;
  onViewFile: (id: string) => void;
  onContextMenu: (e: React.MouseEvent, ref: ReferenceItem) => void;
}

// Helper functions to extract displayable metadata
const getDisplayAuthor = (r: ReferenceItem): string => {
  const m = r.metadata as any;
  if (!m) return r.uploadedBy || 'Empty';

  if (m.author) return m.author;
  if (m.Author) return m.Author;
  if (m.creator) return m.creator;
  if (m.uploader) return m.uploader;

  return r.uploadedBy || 'Empty';
};

const getDisplayDate = (r: ReferenceItem): string => {
  const m = r.metadata as any;
  if (!m) return r.dateUploaded || 'Empty';

  if (m.date) return m.date;
  if (m.Date) return m.Date;
  if (m.year) return m.year;
  if (m.Year) return m.Year;
  if (m.Timestamp) return m.Timestamp;

  return r.dateUploaded || 'Empty';
};

const getDisplayTitle = (r: ReferenceItem): string => {
  const m = r.metadata as any;

  if (r.title && r.title.trim()) return r.title;
  if (m?.title) return m.title;
  if (m?.Title) return m.Title;
  if (r.fileName) return r.fileName;

  return 'Untitled Reference';
};

/**
 * Memoized row component for virtualized table.
 * Only re-renders when its specific props change.
 */
export const ReferenceRow = memo(
  function ReferenceRow({
    reference,
    isSelected,
    isInSelection,
    isDragging,
    style,
    onClick,
    onCheckboxChange,
    onDragStart,
    onDragEnd,
    onDelete,
    onViewFile,
    onContextMenu,
  }: ReferenceRowProps) {
    const handleClick = useCallback(
      (e: React.MouseEvent) => onClick(e, reference.id),
      [onClick, reference.id]
    );

    const handleCheckbox = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => onCheckboxChange(e, reference.id),
      [onCheckboxChange, reference.id]
    );

    const handleDragStart = useCallback(
      (e: React.DragEvent) => onDragStart(e, reference.id),
      [onDragStart, reference.id]
    );

    const handleDelete = useCallback(() => onDelete(reference.id), [onDelete, reference.id]);

    const handleViewFile = useCallback(() => onViewFile(reference.id), [onViewFile, reference.id]);

    const handleContextMenu = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        onContextMenu(e, reference);
      },
      [onContextMenu, reference]
    );

    const hasFile = !!reference.file_url || !!reference.web_url;
    const displayTitle = getDisplayTitle(reference);
    const displayAuthor = getDisplayAuthor(reference);
    const displayDate = getDisplayDate(reference);

    return (
      <div
        style={style}
        className={`reference-row ${isSelected ? 'selected' : ''} ${
          isInSelection ? 'in-selection' : ''
        } ${isDragging ? 'dragging' : ''}`}
        onClick={handleClick}
        onContextMenu={handleContextMenu}
        draggable
        onDragStart={handleDragStart}
        onDragEnd={onDragEnd}
      >
        {/* Checkbox */}
        <div className="reference-row-checkbox">
          <input
            type="checkbox"
            checked={isInSelection}
            onChange={handleCheckbox}
            onClick={(e) => e.stopPropagation()}
          />
        </div>

        {/* Icon */}
        <div className="reference-row-icon">
          {reference.document_source_type === 'weblink' ? (
            <Image src="/assets/svgs/link-2.svg" alt="Link" width={20} height={20} />
          ) : (
            <FileText size={20} className="text-gray-500" />
          )}
        </div>

        {/* Title */}
        <div className="reference-row-title" title={displayTitle}>
          <span className="reference-title-text">{displayTitle}</span>
          {!hasFile && <span className="reference-no-file-badge">No file</span>}
        </div>

        {/* Author */}
        <div className="reference-row-author" title={displayAuthor}>
          {displayAuthor}
        </div>

        {/* Date */}
        <div className="reference-row-date" title={displayDate}>
          {displayDate}
        </div>

        {/* Actions */}
        <div className="reference-row-actions">
          {hasFile && (
            <button
              className="reference-action-btn view-btn"
              onClick={(e) => {
                e.stopPropagation();
                handleViewFile();
              }}
              title="View file"
            >
              <Image src="/assets/svgs/eye.svg" alt="View" width={16} height={16} />
            </button>
          )}
          <button
            className="reference-action-btn delete-btn"
            onClick={(e) => {
              e.stopPropagation();
              handleDelete();
            }}
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    // Custom comparison for memoization
    // Only re-render if these specific props change
    return (
      prevProps.reference.id === nextProps.reference.id &&
      prevProps.reference.title === nextProps.reference.title &&
      prevProps.reference.file_url === nextProps.reference.file_url &&
      prevProps.reference.web_url === nextProps.reference.web_url &&
      prevProps.isSelected === nextProps.isSelected &&
      prevProps.isInSelection === nextProps.isInSelection &&
      prevProps.isDragging === nextProps.isDragging &&
      prevProps.style.transform === nextProps.style.transform
    );
  }
);

export default ReferenceRow;
