'use client';

import Image from 'next/image';
import { ChevronRight, FileText, Trash2 } from 'lucide-react';
import { useRef, useState, useEffect, useCallback } from 'react';
import UnifiedUploadDialog from '../dialogs/UnifiedUploadDialog';
import { ReferenceItem, Tag } from '@/types/reference-manager';
import ReferenceContextMenu from './ReferenceContextMenu';
import { Collection, Folder } from '@/store/zustand/useReferenceStore';
import { Skeleton } from '@/components/ui/skeleton';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import ReferencePdfPreviewModal from '../dialogs/ReferencePdfPreviewModal';
import ReferenceTags from '../tags/ReferenceTags';
import { useQuery } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';
import EmptyStateAnimation from './EmptyStateAnimation';
import '@/styles/reference-manager/referenceTable.css';
export const Menu = ({
  onClick,
}: {
  onClick: (e: React.MouseEvent, mode: 'file' | 'url') => void;
}) => {
  return (
    <div className="menu-container">
      <div className="menu-item" onClick={(e) => onClick(e, 'file')}>
        <Image
          src="/assets/svgs/single-file.svg"
          alt="File"
          width={18}
          height={18}
          style={{ width: '18px', height: '18px' }}
        />
        File
      </div>

      <div className="menu-item" onClick={(e) => onClick(e, 'url')}>
        <Image
          src="/assets/svgs/link-2.svg"
          alt="URL"
          width={18}
          height={18}
          style={{ width: '18px', height: '18px' }}
        />
        URL
      </div>
    </div>
  );
};

export const UploadMenu = ({
  onClick,
  btnRef,
  onClose,
}: {
  onClick: (e: React.MouseEvent, mode: 'file' | 'url') => void;
  btnRef: React.RefObject<HTMLButtonElement | null>;
  onClose?: () => void;
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [menuPosition, setMenuPosition] = useState({ top: 100, left: 100 });

  useEffect(() => {
    if (btnRef.current) {
      const rect = btnRef.current.getBoundingClientRect();
      setMenuPosition({ top: rect.bottom + 6, left: rect.left });
    }
  }, [btnRef]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        onClose &&
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        btnRef.current &&
        !btnRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [btnRef, onClose]);

  return (
    <div
      ref={menuRef}
      className="menu-container"
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 9999,
      }}
    >
      <div className="menu-item" onClick={(e) => onClick(e, 'file')}>
        <Image
          src="/assets/svgs/single-file.svg"
          alt="File"
          width={18}
          height={18}
          style={{ width: '18px', height: '18px' }}
        />
        File
      </div>

      <div className="menu-item" onClick={(e) => onClick(e, 'url')}>
        <Image
          src="/assets/svgs/link-2.svg"
          alt="URL"
          width={18}
          height={18}
          style={{ width: '18px', height: '18px' }}
        />
        URL
      </div>
    </div>
  );
};

export default function ReferenceTable({
  references,
  selectedReferenceId,
  onSelectReference,
  filterTag,
  trashedReferences,
  isTrashOpen,
  onMoveReferences,
  onCopyReferences,
  onDeleteReference,
  collections,
  foldersByCollections,
  onUploadFile,
  onUploadUrls,
  onUploadImage,
  onAttachFile,
  onAttachUrl,
  onUnlinkFile,
  onOpenReference,
  onRenameReference,
  onDownloadReference,
  onRestoreReference,
  onHardDeleteReference,
  selectedCollectionId,
  progress,
  status,
  isLoading,
}: {
  collections: Collection[];
  foldersByCollections: Record<string, Folder[]>;
  references: ReferenceItem[];
  selectedReferenceId: string | null;
  onSelectReference: (id: string) => void;
  filterTag: Tag | null;
  trashedReferences: ReferenceItem[];
  isTrashOpen: boolean;
  onMoveReferences: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
  onCopyReferences?: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
  onDeleteReference: (id: string) => void;
  onUploadFile: (file: File) => Promise<void>;
  onUploadUrls: (urls: string[]) => Promise<void>;
  onUploadImage?: (file: File, referenceId?: string) => Promise<void>;
  onAttachFile?: (referenceId: string, file: File) => Promise<void>;
  onAttachUrl?: (referenceId: string, url: string) => Promise<void>;
  onUnlinkFile?: (referenceId: string, documentId?: string) => Promise<void>;
  onOpenReference: (referenceId: string) => void;
  onRenameReference: (referenceId: string) => void;
  onDownloadReference: (referenceId: string) => void;
  onRestoreReference: (referenceId: string) => void;
  onHardDeleteReference: (referenceId: string) => void;
  selectedCollectionId?: string | null;
  progress?: number | null;
  status?: string;
  isLoading?: boolean;
}) {
  const [openMenuFor, setOpenMenuFor] = useState<string | null>(null);
  const [openUploadDialog, setOpenUploadDialog] = useState(false);
  const [uploadMode, setUploadMode] = useState<'file' | 'url' | 'image'>('file');
  const [attachToReferenceId, setAttachToReferenceId] = useState<string | null>(null);
  const [contextMenuInfo, setContextMenuInfo] = useState<{
    id: string;
    top: number;
    left: number;
  } | null>(null);
  const longPressTimeout = useRef<number | null>(null);
  const buttonRefs = useRef<Record<string, HTMLButtonElement | null>>({});
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [dragStart, setDragStart] = useState<{ x: number; y: number } | null>(null);
  const [dragRect, setDragRect] = useState<{
    left: number;
    top: number;
    width: number;
    height: number;
  } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [draggedIds, setDraggedIds] = useState<string[]>([]);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewTitle, setPreviewTitle] = useState<string>('');
  const [previewDocumentId, setPreviewDocumentId] = useState<string | null>(null);

  const tableRef = useRef<HTMLDivElement | null>(null);
  const rowRefs = useRef<Record<string, HTMLDivElement | null>>({});

  useEffect(() => {
    const handleClickOutside = () => {
      setOpenMenuFor(null);
    };
    window.addEventListener('click', handleClickOutside);
    return () => window.removeEventListener('click', handleClickOutside);
  }, []);

  const handleMenuClick = (e: React.MouseEvent, mode: 'file' | 'url', referenceId?: string) => {
    e.stopPropagation();
    setUploadMode(mode);
    setAttachToReferenceId(referenceId || null);
    setOpenUploadDialog(true);
  };

  // Check intersection during drag
  useEffect(() => {
    if (!isDragging || !dragRect) return;

    const selected: string[] = [];
    references.forEach((r) => {
      const el = rowRefs.current[r.id];
      if (!el) return;

      const rect = el.getBoundingClientRect();
      const intersects =
        dragRect.left < rect.right &&
        dragRect.left + dragRect.width > rect.left &&
        dragRect.top < rect.bottom &&
        dragRect.top + dragRect.height > rect.top;

      if (intersects) {
        selected.push(r.id);
      }
    });

    // Defer state update to avoid synchronous setState in effect
    setTimeout(() => setSelectedIds(selected), 0);
  }, [dragRect, isDragging, references]);

  // Auto-close upload dialog when progress is 100%
  useEffect(() => {
    if (openUploadDialog && progress === 100) {
      const timer = setTimeout(() => {
        setOpenUploadDialog(false);
        setAttachToReferenceId(null);
      }, 0);
      return () => clearTimeout(timer);
    }
  }, [progress, openUploadDialog]);

  // Handle mouse up globally
  useEffect(() => {
    const handleMouseUp = () => {
      if (isDragging) {
        setIsDragging(false);
        setDragStart(null);
        setDragRect(null);
      }
    };

    window.addEventListener('mouseup', handleMouseUp);
    return () => window.removeEventListener('mouseup', handleMouseUp);
  }, [isDragging]);

  const handleRowMouseDown = (e: React.MouseEvent, id: string) => {
    // Don't interfere with checkbox or button clicks
    if ((e.target as HTMLElement).closest('input[type=checkbox]')) return;
    if ((e.target as HTMLElement).closest('button')) return;

    if (e.ctrlKey || e.metaKey) {
      // Toggle selection with Ctrl/Cmd
      setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
    } else if (e.shiftKey && selectedIds.length > 0) {
      // Range selection with Shift
      const lastSelected = selectedIds[selectedIds.length - 1];
      const lastIndex = references.findIndex((r) => r.id === lastSelected);
      const currentIndex = references.findIndex((r) => r.id === id);
      const start = Math.min(lastIndex, currentIndex);
      const end = Math.max(lastIndex, currentIndex);
      const rangeIds = references.slice(start, end + 1).map((r) => r.id);
      setSelectedIds(rangeIds);
    } else {
      // Start drag selection
      setSelectedIds([id]);
      setIsDragging(true);
      onSelectReference(id);
    }
  };

  const handleRowMouseEnter = (id: string) => {
    if (isDragging && !selectedIds.includes(id)) {
      setSelectedIds((prev) => [...prev, id]);
    }
  };

  const handleCheckboxChange = (e: React.ChangeEvent<HTMLInputElement>, id: string) => {
    if (e.target.checked) {
      setSelectedIds((prev) => [...prev, id]);
    } else {
      setSelectedIds((prev) => prev.filter((i) => i !== id));
    }
  };

  const handleDragStart = (e: React.DragEvent, id: string) => {
    // If the dragged item is not in selection, select only it
    const itemsToDrag = selectedIds.includes(id) ? selectedIds : [id];
    setDraggedIds(itemsToDrag);
    setIsDragging(true);

    // Set drag data
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', JSON.stringify(itemsToDrag));

    // Optional: Create custom drag image showing count
    if (itemsToDrag.length > 1) {
      const dragImage = document.createElement('div');
      dragImage.style.padding = '8px 12px';
      dragImage.style.background = '#2196F3';
      dragImage.style.color = 'white';
      dragImage.style.borderRadius = '4px';
      dragImage.style.fontSize = '14px';
      dragImage.style.fontWeight = '500';
      dragImage.textContent = `${itemsToDrag.length} items`;
      dragImage.style.position = 'absolute';
      dragImage.style.top = '-1000px';
      document.body.appendChild(dragImage);
      e.dataTransfer.setDragImage(dragImage, 0, 0);
      setTimeout(() => document.body.removeChild(dragImage), 0);
    }
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    setDraggedIds([]);
  };

  // References are already filtered by useReferenceFiltering hook
  // which handles trash, collection, folder, tag, and search filtering
  const displayReferences = references;

  const handleViewFile = async (referenceId: string) => {
    const refItem = displayReferences.find((r) => r.id === referenceId);
    const documentId = refItem?.documentId || refItem?.id;

    setPreviewTitle(refItem?.title || 'Preview');
    setIsPreviewOpen(true);
    setPreviewDocumentId(documentId || null);

    if (!documentId) {
      return;
    }
  };

  const previewQuery = useQuery({
    queryKey: previewDocumentId ? referenceKeys.preview(previewDocumentId) : referenceKeys.all,
    enabled: Boolean(previewDocumentId) && isPreviewOpen,
    queryFn: async () => {
      if (!previewDocumentId) return null as string | null;
      const response = await referenceManagerService.previewDocument(previewDocumentId);
      const url = (response as any)?.data?.preview_url;
      return typeof url === 'string' && url.length > 0
        ? `/proxy-pdf?url=${encodeURIComponent(url)}`
        : null;
    },
    staleTime: 1000 * 60 * 10,
  });

  const previewUrl = previewQuery.data ?? null;
  const isPreviewLoading = previewQuery.isLoading;
  const previewError =
    previewDocumentId && !isPreviewLoading && (previewQuery.isError || previewQuery.isSuccess)
      ? previewUrl
        ? null
        : 'Failed to fetch preview URL'
      : null;

  // Helper functions to extract displayable metadata
  const getDisplayAuthor = (r: ReferenceItem) => {
    const m = r.metadata as any;
    if (!m) return r.uploadedBy || 'Empty';

    // Check for specific author-like fields based on type
    if (m.author) return m.author;
    if (m.contributor) return m.contributor; // Hearing
    if (m.sponsor) return m.sponsor; // Bill

    return r.uploadedBy || 'Empty';
  };

  const getDisplayDate = (r: ReferenceItem) => {
    const m = r.metadata as any;
    if (!m) return r.dateUploaded || 'Empty';

    // Check for specific date fields based on type
    if (m.date) return m.date;
    if (m.dateDecided) return m.dateDecided; // LegalCase
    if (m.dateEnacted) return m.dateEnacted; // Legislation
    if (m.enforcementDate) return m.enforcementDate; // Regulation

    return r.dateUploaded || 'Empty';
  };

  return (
    <div className="tableSection">
      {' '}
      <div className="tableHeader">
        <div className="tableHeaderCell checkboxCell"></div>
        <div className="tableHeaderCell iconCell"></div>
        <div className="tableHeaderCell titleCell">Title</div>
        <div className="tableHeaderCell authorCell">Author</div>
        <div className="tableHeaderCell tagInfoCell">Tag</div>
        <div className="tableHeaderCell dateCell">Date published</div>
        <div className="tableHeaderCell actionCell">Action</div>
      </div>
      {isLoading && displayReferences.length === 0 ? (
        <div className="tableBody">
          {Array.from({ length: 8 }).map((_, idx) => (
            <div key={idx} className="referenceRow" aria-hidden="true">
              <div className="tableCell checkboxCell">
                <Skeleton className="h-4 w-4 rounded-sm" />
              </div>
              <div className="tableCell iconCell">
                <Skeleton className="h-4.5 w-4.5 rounded-sm" />
              </div>
              <div className="tableCell titleCell truncate">
                <Skeleton className="h-4 w-[60%]" />
              </div>
              <div className="tableCell authorCell truncate">
                <Skeleton className="h-4 w-[45%]" />
              </div>
              <div className="tableCell tagInfoCell truncate">
                <Skeleton className="h-4 w-20" />
              </div>
              <div className="tableCell dateCell truncate">
                <Skeleton className="h-4 w-22.5" />
              </div>
              <div className="tableCell actionCell">
                <Skeleton className="h-6 w-6 rounded-md" />
              </div>
            </div>
          ))}
        </div>
      ) : displayReferences.length === 0 ? (
        <div
          className="emptyState"
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '20px 20px 60px',
            color: 'var(--color-text-secondary)',
            textAlign: 'center',
          }}
        >
          <EmptyStateAnimation />
          <h3
            style={{
              fontSize: '18px',
              fontWeight: '500',
              marginBottom: '8px',
              color: 'var(--color-text-primary)',
              marginTop: '-10px',
            }}
          >
            {isTrashOpen
              ? 'Trash is empty'
              : filterTag
                ? 'No references with this tag'
                : 'No references found'}
          </h3>
          <p style={{ fontSize: '14px', maxWidth: '400px' }}>
            {isTrashOpen
              ? 'Deleted references will appear here.'
              : filterTag
                ? `Try selecting a different tag or clear the filter.`
                : 'Try adjusting your search or create a new reference.'}
          </p>
        </div>
      ) : (
        <div
          className="tableBody"
          ref={tableRef}
          style={{
            position: 'relative',
            userSelect: isDragging ? 'none' : 'auto',
          }}
        >
          {displayReferences.map((r) => (
            <div
              key={r.id}
              className={`referenceRow ${selectedIds.includes(r.id) ? 'selectedReference' : ''}`}
              onMouseDown={(e) => {
                if (isTrashOpen && e.button === 0) {
                  // In Trash view, left-click opens the context menu instead of drag-select
                  e.stopPropagation();
                  setContextMenuInfo({
                    id: r.id,
                    top: e.clientY,
                    left: e.clientX,
                  });
                  return;
                }
                handleRowMouseDown(e, r.id);
              }}
              onMouseEnter={() => handleRowMouseEnter(r.id)}
              onContextMenu={(e) => {
                e.preventDefault();
                e.stopPropagation();
                setContextMenuInfo({
                  id: r.id,
                  top: e.clientY,
                  left: e.clientX,
                });
              }}
              onTouchStart={(e) => {
                const touch = e.touches[0];
                if (longPressTimeout.current) {
                  window.clearTimeout(longPressTimeout.current);
                }
                longPressTimeout.current = window.setTimeout(() => {
                  setContextMenuInfo({
                    id: r.id,
                    top: touch.clientY,
                    left: touch.clientX,
                  });
                }, 500);
              }}
              onTouchEnd={() => {
                if (longPressTimeout.current) {
                  window.clearTimeout(longPressTimeout.current);
                  longPressTimeout.current = null;
                }
              }}
              draggable={true}
              onDragStart={(e) => handleDragStart(e, r.id)}
              onDragEnd={handleDragEnd}
              style={{
                position: 'relative',
                opacity: draggedIds.includes(r.id) ? 0.5 : 1,
                cursor: isDragging ? 'grabbing' : 'grab',
              }}
            >
              <div className="tableCell checkboxCell">
                <input
                  type="checkbox"
                  id={r.id}
                  checked={selectedIds.includes(r.id)}
                  onChange={(e) => handleCheckboxChange(e, r.id)}
                  onClick={(e) => e.stopPropagation()}
                  aria-label={`Select reference ${r.title || 'untitled'}`}
                />
              </div>
              <div className="tableCell iconCell">
                <FileText size={18} color="#6b7280" />
              </div>
              <div className="tableCell titleCell truncate" title={r.title || 'Untitled reference'}>
                {r.title === r.id ||
                r.title === `Reference ${r.id}` ||
                r.title === `Reference ${r.id.slice(0, 8)}` ? (
                  r.folderId ? (
                    <span style={{ fontWeight: 'bold' }}>Empty References</span>
                  ) : (
                    <span style={{ fontWeight: 'bold' }}>Unsigned</span>
                  )
                ) : (
                  r.title
                )}
              </div>
              <div className="tableCell authorCell truncate">{getDisplayAuthor(r)}</div>
              <div className="tableCell tagInfoCell">
                <ReferenceTags documentId={r.documentId || r.id} displayMode="full" />
              </div>
              <div className="tableCell dateCell truncate">{getDisplayDate(r)}</div>
              <div className="tableCell actionCell">
                {!r.s3_key && !r.file_url && !r.web_url ? (
                  <button
                    className="referenceTableAddBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setOpenMenuFor(openMenuFor === r.id ? null : r.id);
                    }}
                    title="Attach file or URL"
                    aria-label="Attach file or URL"
                  >
                    <Image src="/assets/svgs/plus-circle.svg" alt="Attach" width={18} height={18} />
                  </button>
                ) : (
                  <button
                    className="referenceTableAddBtn"
                    onClick={(e) => {
                      e.stopPropagation();
                      if (onUnlinkFile) {
                        onUnlinkFile(r.id, r.documentId);
                      }
                    }}
                    title="Remove attachment"
                    aria-label="Remove attachment"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
              {openMenuFor === r.id && (
                <div
                  className="menuWrapper"
                  style={{ pointerEvents: 'auto' }}
                  onClick={(e) => e.stopPropagation()}
                  onMouseDown={(e) => e.stopPropagation()}
                  onMouseUp={(e) => e.stopPropagation()}
                >
                  <Menu
                    onClick={(e: React.MouseEvent, mode: 'file' | 'url') => {
                      const refId = (r.metadata as any)?.reference_id || r.id;
                      handleMenuClick(e, mode, refId);
                    }}
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <UnifiedUploadDialog
        uploadMode={uploadMode}
        open={openUploadDialog}
        progress={progress}
        status={status}
        onClose={() => {
          setOpenUploadDialog(false);
          setAttachToReferenceId(null);
        }}
        onUploadFile={
          attachToReferenceId && onAttachFile
            ? async (file: File) => {
                await onAttachFile(attachToReferenceId, file);
                setOpenUploadDialog(false);
                setAttachToReferenceId(null);
              }
            : onUploadFile
        }
        onUploadUrls={
          attachToReferenceId && onAttachUrl
            ? async (urls: string[]) => {
                if (urls.length > 0) {
                  await onAttachUrl(attachToReferenceId, urls[0]);
                }
                setOpenUploadDialog(false);
                setAttachToReferenceId(null);
              }
            : onUploadUrls
        }
        onUploadImage={
          onUploadImage
            ? async (file: File) => {
                await onUploadImage(file, attachToReferenceId ?? undefined);
                setOpenUploadDialog(false);
                setAttachToReferenceId(null);
              }
            : undefined
        }
      />
      {contextMenuInfo && (
        <ReferenceContextMenu
          collections={collections}
          foldersByCollections={foldersByCollections}
          referenceId={contextMenuInfo.id}
          selectedIds={selectedIds}
          onOpen={() => {
            handleViewFile(contextMenuInfo.id);
            setContextMenuInfo(null);
          }}
          onRename={() => {
            onRenameReference(contextMenuInfo.id);
          }}
          onMoveReferences={(referenceIds, targetCollectionId, targetFolderId) => {
            onMoveReferences(referenceIds, targetCollectionId, targetFolderId);
            setContextMenuInfo(null);
            setSelectedIds([]);
          }}
          onCopyReferences={(referenceIds, targetCollectionId, targetFolderId) => {
            onCopyReferences?.(referenceIds, targetCollectionId, targetFolderId);
            setContextMenuInfo(null);
            setSelectedIds([]);
          }}
          onExportCitation={(format) => {
            console.log('Export citation not yet implemented', format);
            setContextMenuInfo(null);
          }}
          position={{
            top: contextMenuInfo.top,
            left: contextMenuInfo.left,
          }}
          isTrashMode={isTrashOpen}
          onDelete={() => {
            const targetIds = selectedIds.includes(contextMenuInfo.id)
              ? selectedIds
              : [contextMenuInfo.id];

            if (isTrashOpen) {
              targetIds.forEach((id) => onHardDeleteReference(id));
            } else {
              targetIds.forEach((id) => onDeleteReference(id));
            }
            setContextMenuInfo(null);
            setSelectedIds([]);
          }}
          onDownload={() => {
            onDownloadReference(contextMenuInfo.id);
          }}
          onRestore={
            isTrashOpen
              ? () => {
                  const targetIds = selectedIds.includes(contextMenuInfo.id)
                    ? selectedIds
                    : [contextMenuInfo.id];
                  targetIds.forEach((id) => onRestoreReference(id));
                  setContextMenuInfo(null);
                  setSelectedIds([]);
                }
              : undefined
          }
          onClose={() => setContextMenuInfo(null)}
          selectedCollectionId={selectedCollectionId}
        />
      )}
      <ReferencePdfPreviewModal
        isOpen={isPreviewOpen}
        onClose={() => {
          setIsPreviewOpen(false);
          setPreviewDocumentId(null);
          setPreviewTitle('');
        }}
        title={previewTitle}
        url={previewUrl}
        isLoading={isPreviewLoading}
        error={previewError}
      />
    </div>
  );
}
