'use client';

import React from 'react';
import { useDocumentTagsQuery } from '@/lib/api/queries/reference-manager/useDocumentTagsQuery';

interface DashboardReferenceTagsProps {
  documentId: string;
  maxDisplay?: number;
}

const hexToRgba = (hex: string, alpha: number) => {
  const cleanHex = hex.replace('#', '');
  if (cleanHex.length === 3) {
    const r = parseInt(cleanHex[0] + cleanHex[0], 16);
    const g = parseInt(cleanHex[1] + cleanHex[1], 16);
    const b = parseInt(cleanHex[2] + cleanHex[2], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  if (cleanHex.length === 6) {
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
  return hex;
};

export default function DashboardReferenceTags({
  documentId,
  maxDisplay = 1,
}: DashboardReferenceTagsProps) {
  const { data: tags = [], isLoading } = useDocumentTagsQuery(documentId, true);

  if (isLoading) {
    return (
      <div className="dashboard-tags-container">
        <div className="dashboard-tag-skeleton" />
      </div>
    );
  }

  if (!tags || tags.length === 0) {
    return null;
  }

  const displayedTags = tags.slice(0, maxDisplay);
  const remainingCount = tags.length - displayedTags.length;

  return (
    <div className="dashboard-tags-container">
      {displayedTags.map((tag) => {
        const tagColor = tag.color || '#666';
        const isHex = tagColor.startsWith('#');

        return (
          <span
            key={tag.id}
            className="dashboard-tag"
            style={{
              backgroundColor: isHex ? hexToRgba(tagColor, 0.15) : tagColor,
              borderColor: isHex ? hexToRgba(tagColor, 0.2) : tagColor,
              color: tagColor,
            }}
            title={tag.label}
          >
            {tag.label}
          </span>
        );
      })}
      {remainingCount > 0 && (
        <span className="dashboard-tag-more" title={`+${remainingCount} more tags`}>
          +{remainingCount}
        </span>
      )}
    </div>
  );
}
