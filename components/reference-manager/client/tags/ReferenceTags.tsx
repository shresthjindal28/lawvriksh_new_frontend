'use client';

import { useDocumentTagsQuery } from '@/lib/api/queries/reference-manager/useDocumentTagsQuery';

interface ReferenceTagsProps {
  documentId: string;
  displayMode?: 'dot' | 'full';
}

export default function ReferenceTags({ documentId, displayMode = 'dot' }: ReferenceTagsProps) {
  const { data: tags, isLoading } = useDocumentTagsQuery(documentId);

  if (isLoading) {
    if (displayMode === 'full') {
      return <span className="text-gray-400 text-sm">Loading...</span>;
    }
    return null;
  }

  if (!tags || tags.length === 0) {
    if (displayMode === 'full') {
      return <span className="text-gray-500 text-sm">-</span>;
    }
    return null;
  }

  const primaryTag = tags[0];
  const extraCount = tags.length - 1;

  if (displayMode === 'full') {
    return (
      <div className="flex items-center gap-2 max-w-full">
        <div
          className="w-3 h-3 rounded-full flex-shrink-0"
          style={{ backgroundColor: primaryTag.color }}
        />
        <span className="text-sm text-gray-700 truncate min-w-0" title={primaryTag.label}>
          {primaryTag.label}
        </span>
        {extraCount > 0 && (
          <span className="text-xs text-gray-500 flex-shrink-0">+{extraCount}</span>
        )}
      </div>
    );
  }

  return (
    <div className="relative inline-flex items-center justify-center">
      <div
        className="w-4.5 h-4.5 rounded-full border border-gray-200 shadow-sm"
        style={{ backgroundColor: primaryTag.color }}
        title={primaryTag.label}
      />
      {extraCount > 0 && (
        <span
          className="absolute -top-1.5 -right-2 flex h-3.5 min-w-3.5 items-center justify-center rounded-full bg-gray-600 text-[9px] font-medium text-white ring-1 ring-white"
          title={`${extraCount} more tags`}
        >
          +{extraCount}
        </span>
      )}
    </div>
  );
}
