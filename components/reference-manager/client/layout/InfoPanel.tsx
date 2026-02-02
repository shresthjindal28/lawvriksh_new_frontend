'use client';

import { ReferenceItem } from '@/types/reference-manager';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import {
  Edit3,
  MoreVertical,
  Package,
  Pen,
  Sparkles,
  Trash2,
  X,
  Send,
  ChevronDown,
  ChevronUp,
  History,
} from 'lucide-react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import gsap from 'gsap';
import { infoFields, propertyFieldsByType } from '@/lib/config/referenceManagerConfig';
import { COMMON_ROUTES } from '@/lib/constants/routes';
import { Note } from '@/types/reference-manager';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useQueries } from '@tanstack/react-query';
import { authService } from '@/lib/api/authService';
import { useAnnotationsQuery } from '@/lib/api/queries/reference-manager/useAnnotationsQuery';
import { useDocumentTagsQuery } from '@/lib/api/queries/reference-manager/useDocumentTagsQuery';
import { useNotesQuery } from '@/lib/api/queries/reference-manager/useNotesQuery';
import { useReferenceDocumentIdQuery } from '@/lib/api/queries/reference-manager/useReferenceDocumentIdQuery';
import { useReferenceDocumentQuery } from '@/lib/api/queries/reference-manager/useReferenceDocumentQuery';
import InteractiveTag from '@/components/reference-manager/client/tags/InteractiveTag';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import '@/styles/reference-manager/InfoPanel.css';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useAutoAnnotationInputStore } from '@/store/zustand/useAutoAnnotationInputStore';

interface EditableFieldProps {
  label: string;
  value: string | undefined;
  fieldKey: string;
  onSave: (key: string, value: string) => void;
  isTextarea?: boolean;
  variant?: 'info' | 'property';
  collapsible?: boolean;
}

function CollapsibleText({
  text,
  className,
  onEdit,
}: {
  text: string;
  className?: string;
  onEdit?: () => void;
}) {
  const [isExpanded, setIsExpanded] = useState(false);
  const shouldTruncate = text.length > 150;

  return (
    <div className={className} style={{ display: 'block' }}>
      <div
        style={{
          display: '-webkit-box',
          WebkitLineClamp: isExpanded ? 'unset' : 2,
          WebkitBoxOrient: 'vertical',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          cursor: onEdit ? 'pointer' : 'default',
        }}
        onClick={onEdit}
        title={!isExpanded && shouldTruncate ? "Click 'Read More' to expand" : ''}
      >
        {text}
      </div>
      {shouldTruncate && (
        <button
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setIsExpanded(!isExpanded);
          }}
          style={{
            border: 'none',
            background: 'none',
            color: '#0073e6',
            padding: '4px 0',
            fontSize: '12px',
            cursor: 'pointer',
            fontWeight: 500,
            marginTop: '2px',
          }}
        >
          {isExpanded ? 'Read Less' : 'Read More'}
        </button>
      )}
    </div>
  );
}

function EditableField({
  label,
  value,
  fieldKey,
  onSave,
  isTextarea = false,
  variant = 'info',
  collapsible = false,
}: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(value || '');
  const inputRef = useRef<HTMLInputElement | HTMLTextAreaElement>(null);
  const prevValueRef = useRef(value);

  // Sync value from props when not editing - defer setState to avoid synchronous update
  useEffect(() => {
    if (prevValueRef.current !== value) {
      prevValueRef.current = value;
      setTimeout(() => setEditValue(value || ''), 0);
    }
  }, [value]);

  useEffect(() => {
    if (isEditing && inputRef.current) inputRef.current.focus();
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (editValue !== value) onSave(fieldKey, editValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isTextarea) {
      setIsEditing(false);
      onSave(fieldKey, editValue);
    }
    if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(value || '');
    }
  };

  const isEmpty = !value;
  const containerClass = variant === 'property' ? 'propertyRow' : 'infoField';
  const labelClass = variant === 'property' ? 'propertyLabel' : 'infoLabel';
  const valueClass = variant === 'property' ? 'propertyValue' : 'infoValue';
  const inputClass = variant === 'property' ? 'propertyInput' : 'infoInput';

  return (
    <div className={containerClass}>
      <span className={labelClass}>{label}</span>

      {isEditing ? (
        isTextarea ? (
          <textarea
            ref={inputRef as React.RefObject<HTMLTextAreaElement>}
            className={`${inputClass} infoTextarea`}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Empty"
          />
        ) : (
          <input
            ref={inputRef as React.RefObject<HTMLInputElement>}
            type="text"
            className={inputClass}
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder="Empty"
          />
        )
      ) : collapsible ? (
        <CollapsibleText
          text={isEmpty ? 'Empty' : value || ''}
          className={`${valueClass} ${isEmpty ? `${valueClass}Empty` : ''}`}
          onEdit={() => setIsEditing(true)}
        />
      ) : (
        <span
          className={`${valueClass} ${isEmpty ? `${valueClass}Empty` : ''}`}
          onClick={() => setIsEditing(true)}
        >
          {isEmpty ? 'Empty' : value}
        </span>
      )}
    </div>
  );
}

export default function InfoPanel({
  selectedReference: propSelectedReference,
  isOpen,
  onUpdateReference,
  showAddTagMenu,
  setShowAddTagMenu,
  tagButtonRef,
  defaultTab,
  onDeleteNote,
  editNote,
  onAddNote,
  onSaveAnnotation,
  onDeleteAnnotation,
  onClose,
  onAttachFile,
  onAttachUrl,
  showAutoAnnotateToggle,
  onAutoAnnotateQuery,
  pendingHighlight,
  onSavePendingHighlight,
  onCancelPendingHighlight,
  showMobileScreen,
  onNoteClick,
  isAnnotationView,
  historyOpen,
  onHistoryOpenChange,
  autoAnnotateProgress,
}: {
  selectedReference: ReferenceItem | null;
  isOpen: boolean;
  onUpdateReference?: (id: string, updates: Partial<ReferenceItem>) => void;
  showAddTagMenu?: boolean;
  setShowAddTagMenu?: React.Dispatch<React.SetStateAction<boolean>>;
  tagButtonRef?: React.RefObject<HTMLButtonElement | null>;
  defaultTab?: 'info' | 'properties' | 'notes';
  onDeleteNote?: (noteId: string) => void | Promise<void>;
  editNote?: (noteId: string, content: string) => void | Promise<void>;
  onAddNote?: (referenceId: string, content: string) => void | Promise<void>;
  onSaveAnnotation?: (annotationId: string, content: string) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  onClose?: () => void;
  onAttachFile?: () => void;
  onAttachUrl?: () => void;
  showAutoAnnotateToggle?: boolean;
  onAutoAnnotateQuery?: (query: string) => Promise<void>;
  pendingHighlight?: any;
  onSavePendingHighlight?: (content: string) => void;
  onCancelPendingHighlight?: () => void;
  showMobileScreen?: boolean;
  onNoteClick?: (annotationId: string, page: number) => void;
  isAnnotationView?: boolean;
  historyOpen?: boolean;
  onHistoryOpenChange?: (open: boolean) => void;
  autoAnnotateProgress?: number | null;
}) {
  // Inject dummy file if needed
  const baseSelectedReference = useMemo(
    () =>
      propSelectedReference
        ? {
            ...propSelectedReference,
            file_url: propSelectedReference.file_url || './dummy.pdf',
            document_source_type: propSelectedReference.document_source_type || 'file',
          }
        : null,
    [propSelectedReference]
  );

  const router = useRouter();
  const [activeTab, setActiveTab] = useState<'info' | 'properties' | 'notes'>(defaultTab || 'info');
  // Auto-switch to notes tab if pending highlight exists
  useEffect(() => {
    if (pendingHighlight) {
      setActiveTab('notes');
    }
  }, [pendingHighlight]);

  const { user, profile } = useAuth();
  const { collections, foldersByCollection } = useReferenceContext();
  const currentUserId = user?.user_id ?? null;

  const referenceId = propSelectedReference?.id ?? null;
  const documentIdFromProp = propSelectedReference?.documentId ?? null;
  const documentIdQuery = useReferenceDocumentIdQuery(referenceId, documentIdFromProp);
  const effectiveDocumentId = documentIdFromProp || documentIdQuery.data || referenceId;

  const { data: fetchedDocument } = useReferenceDocumentQuery(effectiveDocumentId);

  const selectedReference = useMemo(() => {
    if (!baseSelectedReference) return null;
    if (fetchedDocument) {
      const merged = {
        ...baseSelectedReference,
        ...fetchedDocument,
        // CRITICAL: Force the ID to match the base reference ID.
        // fetchedDocument usually contains the *Document ID*, which is different from the Reference ID.
        // We must ensure the UI continues to use the Reference ID for navigation and updates.
        id: baseSelectedReference.id,
        metadata: {
          ...baseSelectedReference.metadata,
          ...fetchedDocument.metadata,
        },
      };

      if (
        Array.isArray((fetchedDocument as any)?.tags) &&
        (fetchedDocument as any).tags.length === 0 &&
        (baseSelectedReference as any)?.tags?.length
      ) {
        (merged as any).tags = (baseSelectedReference as any).tags;
      }

      // Preserve file info from base if fetched is missing it (avoid overwriting with undefined/null)
      // This handles cases where prop has info (e.g. s3_key) but fetched document detail is incomplete
      if (
        !merged.file_url &&
        baseSelectedReference.file_url &&
        baseSelectedReference.file_url !== './dummy.pdf'
      ) {
        merged.file_url = baseSelectedReference.file_url;
      }
      if (!merged.s3_key && baseSelectedReference.s3_key) {
        merged.s3_key = baseSelectedReference.s3_key;
      }
      // Ensure document_source_type is preserved if base has it as 'file'
      if (
        baseSelectedReference.document_source_type === 'file' &&
        merged.document_source_type !== 'file'
      ) {
        merged.document_source_type = 'file';
      }

      return merged;
    }
    return baseSelectedReference;
  }, [baseSelectedReference, fetchedDocument]);

  const safeDocumentId = String(effectiveDocumentId ?? '');
  const previewDocumentId = useMemo(() => {
    return documentIdFromProp || documentIdQuery.data || referenceId;
  }, [documentIdFromProp, documentIdQuery.data, referenceId]);

  const isImageReference = useMemo(() => {
    if (!selectedReference) return false;

    const fileType =
      (fetchedDocument as any)?.file_type ||
      (selectedReference as any)?.file_type ||
      (selectedReference.metadata as any)?.file_type ||
      (selectedReference.metadata as any)?.mime_type;
    if (typeof fileType === 'string' && fileType.startsWith('image/')) return true;

    const imageType =
      (fetchedDocument as any)?.metadata?.image_type ||
      (selectedReference.metadata as any)?.image_type;
    if (typeof imageType === 'string' && imageType.includes('image')) return true;

    const s3Key = (fetchedDocument as any)?.s3_key || selectedReference.s3_key;
    if (typeof s3Key === 'string') {
      const s3KeyLower = s3Key.toLowerCase();
      if (
        s3KeyLower.includes('/workspace_image/') ||
        s3KeyLower.includes('/profile_image/') ||
        s3KeyLower.includes('/images/')
      ) {
        return true;
      }
    }

    const fileName =
      (fetchedDocument as any)?.title ||
      selectedReference.fileName ||
      (selectedReference as any)?.title;
    const fileUrl = (fetchedDocument as any)?.file_url || selectedReference.file_url;
    const nameToCheck = typeof fileName === 'string' ? fileName : '';
    const urlToCheck = typeof fileUrl === 'string' ? fileUrl : '';
    const extSource = urlToCheck || nameToCheck;
    if (!extSource) return false;
    const ext = extSource.split('.').pop()?.toLowerCase();
    if (!ext) return false;

    const imageExtensions = new Set([
      'jpg',
      'jpeg',
      'png',
      'gif',
      'webp',
      'bmp',
      'svg',
      'tiff',
      'tif',
      'ico',
      'heic',
      'heif',
    ]);

    return imageExtensions.has(ext);
  }, [selectedReference, fetchedDocument]);

  useEffect(() => {
    // Clear preview state when the reference or the specific document ID changes.
    // This ensures that we don't show a stale preview from a previous selection.
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
    setPreviewError(null);
    setIsPreviewDialogOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [referenceId, previewDocumentId]);

  const handlePreviewImage = async () => {
    if (!previewDocumentId) {
      setPreviewError('Document ID not found. Please wait or re-upload.');
      return;
    }

    setIsPreviewLoading(true);
    setPreviewUrl(null); // Clear existing preview immediately
    setPreviewError(null);

    try {
      const response = await referenceManagerService.previewDocument(previewDocumentId);
      const url =
        (response as any)?.data?.preview_url ||
        (response as any)?.data?.previewUrl ||
        (response as any)?.preview_url;

      if (!response.success || !url) {
        throw new Error(response.message || 'Failed to load preview');
      }

      // Fetch the image as a blob to ensure we have a fresh version and can control its lifecycle
      const imgResp = await fetch(url);
      if (!imgResp.ok) throw new Error('Failed to fetch image content');
      const blob = await imgResp.blob();
      const localUrl = URL.createObjectURL(blob);

      setPreviewUrl(localUrl);
      setIsPreviewDialogOpen(true);
    } catch (err) {
      setPreviewError(err instanceof Error ? err.message : 'Failed to load preview');
    } finally {
      setIsPreviewLoading(false);
    }
  };

  const handleClosePreview = () => {
    setIsPreviewDialogOpen(false);
    // Revoke the blob URL to free up memory
    if (previewUrl && previewUrl.startsWith('blob:')) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl(null);
  };

  const [noteInput, setNoteInput] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [menuOpenNoteId, setMenuOpenNoteId] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [isPreviewLoading, setIsPreviewLoading] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [internalHistoryOpen, setInternalHistoryOpen] = useState(false);

  // Use controlled state if provided, otherwise use internal state
  const isHistoryOpen = historyOpen !== undefined ? historyOpen : internalHistoryOpen;
  const setIsHistoryOpen = onHistoryOpenChange || setInternalHistoryOpen;
  const menuRef = useRef<HTMLDivElement>(null);
  const historyContentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = historyContentRef.current;
    if (!el) return;

    if (isHistoryOpen) {
      gsap.to(el, {
        height: 'auto',
        opacity: 1,
        marginTop: 8,
        marginBottom: 12,
        duration: 0.3,
        ease: 'power2.out',
      });
    } else {
      gsap.to(el, {
        height: 0,
        opacity: 0,
        marginTop: 0,
        marginBottom: 0,
        duration: 0.3,
        ease: 'power2.in',
      });
    }
  }, [isHistoryOpen]);

  const { isAutoMode, toggleAutoMode } = useAutoAnnotationInputStore();
  const isAutoModeEnabled = Boolean(showAutoAnnotateToggle && isAutoMode);
  const notePlaceholder = isAutoModeEnabled
    ? 'Ask AI to annotate selected content...'
    : 'Add a note here...';
  const submitButtonLabel = isAutoModeEnabled ? 'Auto-annotate' : 'Send note';
  useEffect(() => {
    if (pendingHighlight?.id) {
      setEditingNoteId(pendingHighlight.id);
      setEditingNoteContent('');
    }
  }, [pendingHighlight?.id]);

  const tagsQuery = useDocumentTagsQuery(effectiveDocumentId, isOpen && Boolean(referenceId));
  const notesQuery = useNotesQuery(effectiveDocumentId, isOpen && Boolean(referenceId));
  const annotationsQuery = useAnnotationsQuery(
    effectiveDocumentId,
    false,
    isOpen && Boolean(referenceId)
  );

  const fetchedNotes = useMemo(() => notesQuery.data ?? [], [notesQuery.data]);
  const fetchedAnnotations = useMemo(() => annotationsQuery.data ?? [], [annotationsQuery.data]);

  const displayTags = useMemo(() => {
    const raw = [
      ...((tagsQuery.data ?? []) as any[]),
      ...(((propSelectedReference?.tags as any) ?? []) as any[]),
      ...(((selectedReference?.tags as any) ?? []) as any[]),
    ] as any[];
    const normalized = raw
      .map((t) => {
        const id = t?.id ?? t?.tag_id ?? t?._id ?? t?.name ?? t?.label ?? t?.title;
        const label = t?.label ?? t?.name ?? t?.title ?? '';
        const color = t?.color ?? t?.colour ?? '#eee';
        return {
          id: typeof id === 'string' ? id : String(id ?? ''),
          label: typeof label === 'string' ? label : String(label ?? ''),
          color: typeof color === 'string' ? color : '#eee',
        };
      })
      .filter((t) => t.id && t.label);

    const map = new Map<string, { id: string; label: string; color?: string }>();
    for (const t of normalized) {
      map.set(t.id, t);
    }
    return Array.from(map.values());
  }, [tagsQuery.data, propSelectedReference?.tags, selectedReference?.tags]);
  const isTagsLoading = tagsQuery.isLoading || documentIdQuery.isLoading;
  const isNotesAndAnnotationsLoading =
    notesQuery.isLoading || annotationsQuery.isLoading || documentIdQuery.isLoading;

  const userIds = useMemo(() => {
    const ids = new Set<string>();

    for (const n of fetchedNotes || []) {
      if (n.createdBy && n.createdBy !== 'Test User') ids.add(n.createdBy);
    }
    for (const n of selectedReference?.independentNotes || []) {
      if (n.createdBy && n.createdBy !== 'Test User') ids.add(n.createdBy);
    }
    for (const a of fetchedAnnotations || []) {
      const id = (a as any).created_by;
      if (id && id !== 'Test User') ids.add(id);
    }
    for (const a of selectedReference?.annotations || []) {
      if (a.createdBy && a.createdBy !== 'Test User') ids.add(a.createdBy);
    }

    return Array.from(ids);
  }, [
    fetchedAnnotations,
    fetchedNotes,
    selectedReference?.annotations,
    selectedReference?.independentNotes,
  ]);

  const profileQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['publicProfile', id],
      queryFn: async () => {
        const res = await authService.getPublicProfile(id);
        const profileData = (res as any)?.data?.profile || (res as any)?.data;
        return profileData?.name || profileData?.username || id;
      },
      enabled: Boolean(id) && id !== 'Test User',
      staleTime: 1000 * 60 * 10,
    })),
  });

  const userNames = useMemo(() => {
    const map: Record<string, string> = {};
    userIds.forEach((id, idx) => {
      const q = profileQueries[idx];
      const name = q?.data;
      if (typeof name === 'string') map[id] = name;
    });
    return map;
  }, [profileQueries, userIds]);

  const isUserNamesLoading = profileQueries.some((q) => q.isLoading);

  useEffect(() => setNoteInput(''), [referenceId]);

  const handleInfoFieldSave = (fieldKey: string, value: string) => {
    if (selectedReference && onUpdateReference)
      onUpdateReference(selectedReference.id, { [fieldKey]: value });
  };

  const handleMetadataFieldSave = (fieldKey: string, value: string) => {
    if (selectedReference && onUpdateReference)
      onUpdateReference(selectedReference.id, {
        metadata: {
          [fieldKey]: value,
        },
      });
  };

  const handleTitleSave = (fieldKey: string, value: string) => {
    if (selectedReference && onUpdateReference)
      onUpdateReference(selectedReference.id, { title: value });
  };

  const handleNoteSave = async (e?: React.MouseEvent | React.KeyboardEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    const trimmedInput = noteInput.trim();
    if (!selectedReference || !trimmedInput) return;

    if (isAutoModeEnabled) {
      if (onAutoAnnotateQuery) {
        await onAutoAnnotateQuery(trimmedInput);
        setNoteInput('');
        // Automatically open history drawer when auto-annotation prompt is submitted
        setIsHistoryOpen(true);
        return;
      }
      // If auto-mode is enabled but no handler provided, fall back to normal note creation.
    }

    if (onAddNote) {
      await onAddNote(selectedReference.id, trimmedInput);
      setNoteInput('');
      return;
    }

    // Fallback to local-only update if backend handler not provided
    if (onUpdateReference) {
      const newNote = {
        id: `note-${Date.now()}`,
        content: trimmedInput,
        type: 'independent' as const,
        createdBy: 'Test User',
        createdAt: new Date().toISOString(),
      };

      onUpdateReference(selectedReference.id, {
        independentNotes: [...(selectedReference.independentNotes || []), newNote],
      });

      setNoteInput('');
    }
  };

  const handleEditNoteClick = (noteId: string, currentContent: string) => {
    setEditingNoteId(noteId);
    setEditingNoteContent(currentContent);
  };

  const handleNoteEditBlur = (noteId: string) => {
    editNote?.(noteId, editingNoteContent);
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleAnnotationEditBlur = async (noteId: string) => {
    if (onSaveAnnotation) {
      await onSaveAnnotation(noteId, editingNoteContent);
    }
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  const handleDeleteAnnotationNote = async (referenceId: string, noteId: string) => {
    if (onDeleteAnnotation) {
      await onDeleteAnnotation(noteId);
    }
  };

  const currentPropertyFields = selectedReference
    ? propertyFieldsByType[selectedReference.type]
    : [];

  // Close menu when clicking outside - must be before early return
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setMenuOpenNoteId(null);
      }
    };

    if (menuOpenNoteId) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [menuOpenNoteId]);

  if (!isOpen) return null;

  const uniqueNotesMap = new Map<string, any>();

  // 1. Add fetched notes (from backend)
  fetchedNotes.forEach((note) => {
    uniqueNotesMap.set(note.id, note);
  });

  // 2. Add/Overwrite with independent notes from selectedReference (which includes newly added ones)
  if (selectedReference?.independentNotes) {
    selectedReference.independentNotes.forEach((n) => {
      uniqueNotesMap.set(n.id, {
        id: n.id,
        type: 'independent',
        content: n.content,
        createdAt: n.createdAt,
        createdBy: n.createdBy,
        modifiedAt: n.modifiedAt,
      });
    });
  }

  // 3. Add fetched annotations (from backend)
  // Create a map of annotations from selectedReference for location data lookup
  const annotationLocationMap = new Map<string, any>();
  if (selectedReference?.annotations) {
    selectedReference.annotations.forEach((a) => {
      annotationLocationMap.set(a.id, a.locationInDocument);
    });
  }

  fetchedAnnotations.forEach((a) => {
    uniqueNotesMap.set(a.id, {
      id: a.id,
      type: 'annotation',
      content: a.reason || '', // Map 'reason' to content for display
      prompt: (a as any).prompt || (a as any).query || '',
      textSelected: a.text,
      createdAt: a.created_at,
      createdBy: a.created_by,
      annotationSource: a.type,
      comments: Array.isArray(a.comment) ? a.comment : [],
      locationInDocument: annotationLocationMap.get(a.id) || (a as any).locationInDocument, // Get location from selectedReference if available
    });
  });

  // 4. Add/Overwrite with local annotations (which includes newly added/optimistic ones)
  if (selectedReference?.annotations) {
    selectedReference.annotations.forEach((a) => {
      uniqueNotesMap.set(a.id, {
        id: a.id,
        type: 'annotation',
        content: a.note || '',
        prompt: (a as any).prompt || '',
        textSelected: a.textSelected,
        createdAt: a.createdAt,
        createdBy: a.createdBy,
        annotationSource: a.type,
        comments: Array.isArray(a.comment) ? a.comment : [],
        locationInDocument: a.locationInDocument, // Preserve location data
      });
    });
  }

  const mergedNotes = Array.from(uniqueNotesMap.values())
    .filter((n) => {
      // Keep independent notes
      if (n.type === 'independent') return true;
      // Keep auto annotations
      if (
        n.annotationSource === 2 ||
        n.annotationSource === 'AI_ANNOTATE' ||
        n.annotationSource === 'auto_annotate'
      )
        return true;
      // Keep manual annotations (including empty content) to show pending user_annotation
      if (n.annotationSource === 'manual_note') return true;
      if (Array.isArray(n.comments) && n.comments.length > 0) return true;
      return !!n.content;
    })
    .sort((a, b) => new Date(a.createdAt).valueOf() - new Date(b.createdAt).valueOf());

  // Helper function to display username
  const getUserDisplayName = (userId: string) => {
    if (!userId || userId === 'Test User') {
      return 'you';
    }

    if (userId === currentUserId) {
      return 'you';
    }

    const userName = userNames[userId];

    if (userName && userName !== userId) {
      return userName;
    }

    if (isUserNamesLoading) {
      return <Skeleton className="h-3 w-16 inline-block align-middle" aria-hidden="true" />;
    }

    return 'you';
  };

  // Helper function to format note time based on rules
  const formatNoteTime = (dateString: string): string => {
    if (!dateString) return '';

    const noteDate = new Date(dateString);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const oneWeekAgo = new Date(today);
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const noteDay = new Date(noteDate.getFullYear(), noteDate.getMonth(), noteDate.getDate());

    // Format time as h:mmam/pm
    const hours = noteDate.getHours();
    const minutes = noteDate.getMinutes();
    const ampm = hours >= 12 ? 'pm' : 'am';
    const formattedHours = hours % 12 || 12;
    const formattedMinutes = minutes.toString().padStart(2, '0');
    const timeStr = `${formattedHours}:${formattedMinutes}${ampm}`;

    if (noteDay.getTime() === today.getTime()) {
      return timeStr;
    } else if (noteDay.getTime() === yesterday.getTime()) {
      return 'Yesterday';
    } else if (noteDay >= oneWeekAgo) {
      const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
      return days[noteDate.getDay()];
    } else {
      const day = noteDate.getDate().toString().padStart(2, '0');
      const month = (noteDate.getMonth() + 1).toString().padStart(2, '0');
      const year = noteDate.getFullYear();
      return `${day}/${month}/${year}`;
    }
  };

  // Helper function to format file size
  const formatFileSize = (bytes: number | string | undefined) => {
    if (!bytes) return 'Unknown';
    const numBytes = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
    if (isNaN(numBytes)) return 'Unknown';

    if (numBytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(numBytes) / Math.log(k));
    return parseFloat((numBytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Handle edit click from menu
  const handleMenuEdit = (noteId: string, content: string) => {
    setMenuOpenNoteId(null);
    setEditingNoteId(noteId);
    setEditingNoteContent(content);
  };

  // Handle delete click from menu for independent notes
  const handleMenuDeleteNote = (noteId: string) => {
    setMenuOpenNoteId(null);
    onDeleteNote?.(noteId);
  };

  // Handle delete click from menu for annotations
  const handleMenuDeleteAnnotation = (noteId: string) => {
    setMenuOpenNoteId(null);
    handleDeleteAnnotationNote(selectedReference?.id || '', noteId);
  };

  // Get user's profile image from auth context
  const getUserProfileImage = () => {
    const pic = profile?.picture || user?.picture;
    // Ensure the picture is a valid URL or path before returning
    if (
      typeof pic === 'string' &&
      (pic.startsWith('/') || pic.startsWith('http') || pic.startsWith('data:'))
    ) {
      return pic;
    }
    return '/assets/images/background-image/backgroundImage.png';
  };

  const renderIndependentNote = (note: any) => {
    const isMenuOpen = menuOpenNoteId === note.id;
    const isEditing = editingNoteId === note.id;
    const displayName = getUserDisplayName(note.createdBy);
    const timeDisplay = formatNoteTime(note.createdAt);

    return (
      <div key={note.id} className="noteCardRedesign">
        {/* Header with profile, name, description, and menu */}
        <div className="noteCardHeader">
          <div className="noteCardHeaderLeft">
            <div className="noteProfileImage">
              <Image
                src={getUserProfileImage()}
                alt="Profile"
                width={28}
                height={28}
                className="noteProfileImg"
              />
            </div>
            <div className="noteUserInfo">
              <span className="noteUserName">
                {typeof displayName === 'string'
                  ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
                  : displayName}
              </span>
              <span className="noteDescription">
                <Image src="/assets/svgs/notepad-text.svg" alt="" width={14} height={14} />
                Quick note - {timeDisplay}
              </span>
            </div>
          </div>
          <div className="noteMenuContainer" ref={isMenuOpen ? menuRef : undefined}>
            <button
              className="noteThreeDotsBtn"
              onClick={() => setMenuOpenNoteId(isMenuOpen ? null : note.id)}
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div className="noteDropdownMenu">
                <button
                  className="noteDropdownItem"
                  onClick={() => handleMenuEdit(note.id, note.content || '')}
                >
                  <Edit3 size={14} />
                  <span>Edit note</span>
                </button>
                <button
                  className="noteDropdownItem noteDropdownItemDanger"
                  onClick={() => handleMenuDeleteNote(note.id)}
                >
                  <Trash2 size={14} />
                  <span>Delete note</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Note content */}
        {isEditing ? (
          <textarea
            className="noteEditingContent"
            value={editingNoteContent}
            onChange={(e) => setEditingNoteContent(e.target.value)}
            onBlur={() => handleNoteEditBlur(note.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                (e.currentTarget as HTMLTextAreaElement).blur();
              }
            }}
            autoFocus
            placeholder="Add a note..."
          />
        ) : (
          <p className="noteMainContent">
            {note.content || <span className="noteEmptyContent">No note content</span>}
          </p>
        )}
      </div>
    );
  };

  const renderManualAnnotation = (note: any) => {
    const isMenuOpen = menuOpenNoteId === note.id;
    const isEditing = editingNoteId === note.id;
    const displayName = getUserDisplayName(note.createdBy);
    const timeDisplay = formatNoteTime(note.createdAt);
    const hasLocation = note.locationInDocument?.page;
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't navigate if clicking on menu button or editing
      if (
        (e.target as HTMLElement).closest('.noteMenuContainer') ||
        (e.target as HTMLElement).closest('.noteEditingContent') ||
        isEditing
      ) {
        return;
      }
      if (hasLocation && onNoteClick) {
        onNoteClick(note.id, note.locationInDocument.page);
      }
    };

    return (
      <div
        key={note.id}
        className={`noteCardRedesign ${hasLocation ? 'noteCardClickable' : ''}`}
        onClick={handleCardClick}
        title={hasLocation ? 'Click to navigate to annotation in document' : undefined}
      >
        {/* Header with profile, name, description, and menu */}
        <div className="noteCardHeader">
          <div className="noteCardHeaderLeft">
            <div className="noteProfileImage">
              <Image
                src={getUserProfileImage()}
                alt="Profile"
                width={28}
                height={28}
                className="noteProfileImg"
              />
            </div>
            <div className="noteUserInfo">
              <span className="noteUserName">
                {typeof displayName === 'string'
                  ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
                  : displayName}
              </span>
              <span className="noteDescription">
                <Pen size={14} />
                Annotated note - {timeDisplay}
              </span>
            </div>
          </div>
          <div className="noteMenuContainer" ref={isMenuOpen ? menuRef : undefined}>
            <button
              className="noteThreeDotsBtn"
              onClick={() => setMenuOpenNoteId(isMenuOpen ? null : note.id)}
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div className="noteDropdownMenu">
                <button
                  className="noteDropdownItem"
                  onClick={() => handleMenuEdit(note.id, note.content || '')}
                >
                  <Edit3 size={14} />
                  <span>Edit note</span>
                </button>
                <button
                  className="noteDropdownItem noteDropdownItemDanger"
                  onClick={() => handleMenuDeleteAnnotation(note.id)}
                >
                  <Trash2 size={14} />
                  <span>Delete note</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Quoted/annotated text with gold strip */}
        {note.textSelected && (
          <div className="noteQuotedText">
            <div className="noteQuotedStrip" />
            <p className="noteQuotedContent">
              <span>{note.textSelected}</span>
            </p>
          </div>
        )}

        {/* Note content */}
        {isEditing ? (
          <textarea
            className="noteEditingContent"
            value={editingNoteContent}
            onChange={(e) => setEditingNoteContent(e.target.value)}
            onBlur={() => handleAnnotationEditBlur(note.id)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                e.stopPropagation();
                (e.currentTarget as HTMLTextAreaElement).blur();
              }
            }}
            autoFocus
            placeholder="Add a note..."
          />
        ) : (
          <>
            <p className="noteMainContent">{note.content}</p>
            {Array.isArray(note.comments) && note.comments.length > 0 && (
              <div className="noteCommentsList">
                {note.comments.map((c: string, idx: number) => (
                  <p key={idx} className="noteCommentItem">
                    {c}
                  </p>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    );
  };

  const renderMergedAutoAnnotations = (notes: any[], groupKey?: string) => {
    if (notes.length === 0) return null;
    const firstNote = notes[0];
    const isMenuOpen = menuOpenNoteId === `auto-${firstNote.id}`;
    const displayName = getUserDisplayName(firstNote.createdBy);
    const timeDisplay = formatNoteTime(firstNote.createdAt);
    const promptText = firstNote.prompt ? String(firstNote.prompt).trim() : '';
    // Use the first note's location if available
    const hasLocation = firstNote.locationInDocument?.page;
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't navigate if clicking on menu button
      if ((e.target as HTMLElement).closest('.noteMenuContainer')) {
        return;
      }
      if (hasLocation && onNoteClick) {
        onNoteClick(firstNote.id, firstNote.locationInDocument.page);
      }
    };

    const handleDeleteAll = async () => {
      setMenuOpenNoteId(null);
      if (confirm('Are you sure you want to delete all auto-annotations?')) {
        for (const note of notes) {
          await handleDeleteAnnotationNote(selectedReference?.id || '', note.id);
        }
      }
    };

    return (
      <div
        key={groupKey || `auto-${firstNote.id}`}
        className={`noteCardRedesign ${hasLocation ? 'noteCardClickable' : ''}`}
        onClick={handleCardClick}
        title={hasLocation ? 'Click to navigate to annotation in document' : undefined}
      >
        {/* Header with profile, name, description, and menu */}
        <div className="noteCardHeader">
          <div className="noteCardHeaderLeft">
            <div className="noteProfileImage">
              <Image
                src={getUserProfileImage()}
                alt="Profile"
                width={28}
                height={28}
                className="noteProfileImg"
              />
            </div>
            <div className="noteUserInfo">
              <span className="noteUserName">
                {typeof displayName === 'string'
                  ? displayName.charAt(0).toUpperCase() + displayName.slice(1)
                  : displayName}
              </span>
              <span className="noteDescription">
                <Sparkles size={14} />
                Auto-annotated note - {timeDisplay}
              </span>
            </div>
          </div>
          <div className="noteMenuContainer" ref={isMenuOpen ? menuRef : undefined}>
            <button
              className="noteThreeDotsBtn"
              onClick={() => setMenuOpenNoteId(isMenuOpen ? null : `auto-${firstNote.id}`)}
            >
              <MoreVertical size={16} />
            </button>
            {isMenuOpen && (
              <div className="noteDropdownMenu">
                {/* Auto-annotations only have Delete option, no Edit */}
                <button
                  className="noteDropdownItem noteDropdownItemDanger"
                  onClick={handleDeleteAll}
                >
                  <Trash2 size={14} />
                  <span>Delete all</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {promptText && (
          <div
            style={{
              margin: '6px 0 8px',
              padding: '8px',
              background: '#F6F7FB',
              borderRadius: '8px',
              fontSize: '12px',
              color: '#333',
            }}
          >
            <strong style={{ fontWeight: 600 }}>Prompt:</strong> {promptText}
          </div>
        )}

        {/* Quoted text from all auto-annotations */}
        <div className="noteQuotedText">
          <div className="noteQuotedStrip" />
          <div className="noteQuotedContent">
            {notes.map(
              (note, index) =>
                note.textSelected && (
                  <p key={note.id} style={{ marginBottom: '8px' }}>
                    {index + 1}. {note.textSelected}
                  </p>
                )
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      className={`infoPanel ${showMobileScreen ? 'is-mobile' : ''}`}
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
    >
      {showMobileScreen && (
        <button onClick={onClose} className="infoPanelCloseBtn">
          <X size={20} />
        </button>
      )}
      {/* TABS */}
      <div className="tabsContainer">
        {(['info', 'properties', 'notes'] as const).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tab ${activeTab === tab ? 'activeTab' : ''}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      {/* TAB CONTENT */}
      <div className="tabContent">
        {!selectedReference ? (
          <div className="emptyReferenceState">
            <Package className="emptyReferenceIcon" strokeWidth={1} />
            <div className="emptyReferenceText">Create or upload New reference to see its info</div>
          </div>
        ) : (
          <>
            {/* INFO TAB */}
            {activeTab === 'info' && (
              <div className="infoTabContent">
                {/* LOCATION INFO REMOVED */}

                {isImageReference ? (
                  <button
                    className="annotateButton"
                    onClick={handlePreviewImage}
                    disabled={!previewDocumentId || isPreviewLoading}
                  >
                    {isPreviewLoading ? 'Loading preview...' : 'Preview image'}
                    <Image src="/assets/svgs/arrow-up-right.svg" alt="" width={16} height={16} />
                  </button>
                ) : (
                  <button
                    className="annotateButton"
                    onClick={() => {
                      console.log('Annotate clicked for reference:', selectedReference?.id);
                      if (!selectedReference?.document_source_type) {
                        alert('Please attach a document first');
                        return;
                      }
                      // Navigate to the annotation view for this reference
                      router.push(`${COMMON_ROUTES.ANOTATE_FILE}/${selectedReference.id}`);
                    }}
                    disabled={!selectedReference?.document_source_type}
                  >
                    Annotate file
                    <Image src="/assets/svgs/arrow-up-right.svg" alt="" width={16} height={16} />
                  </button>
                )}

                {isImageReference && previewError && (
                  <div style={{ marginTop: '8px', color: '#d14343', fontSize: '12px' }}>
                    {previewError}
                  </div>
                )}

                {/* ABSTRACT */}
                {(() => {
                  const m = selectedReference.metadata as any;
                  const abstract = m.abstract || m.summary;
                  if (abstract) {
                    return (
                      <div className="infoField">
                        <span className="infoLabel">ABSTRACT</span>
                        <CollapsibleText text={abstract} className="infoValue" />
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* DATE */}
                {(() => {
                  const m = selectedReference.metadata as any;
                  const dateVal =
                    m.date ||
                    m.dateDecided ||
                    m.dateEnacted ||
                    m.enforcementDate ||
                    m.publicationDate;
                  if (dateVal) {
                    return (
                      <div className="infoField">
                        <span className="infoLabel">DATE</span>
                        <span className="infoValue">
                          {new Date(dateVal).toLocaleDateString('en-GB')}
                        </span>
                      </div>
                    );
                  }
                  return null;
                })()}

                {/* SIZE */}
                {selectedReference.size && (
                  <div className="infoField">
                    <span className="infoLabel">SIZE</span>
                    <span className="infoValue">{formatFileSize(selectedReference.size)}</span>
                  </div>
                )}

                {/* DATE UPLOADED */}
                {selectedReference.dateUploaded && (
                  <div className="infoField">
                    <span className="infoLabel">DATE UPLOADED</span>
                    <span className="infoValue">
                      {new Date(selectedReference.dateUploaded).toLocaleDateString('en-GB')}
                    </span>
                  </div>
                )}

                {!selectedReference?.s3_key && (
                  <>
                    <div className="attach-container">
                      <div className="attach-icon">
                        <span>+</span>
                      </div>

                      <p className="attach-text">Attach a document or image with this reference</p>

                      <div className="attach-links">
                        <a
                          href="#"
                          className="attach-file"
                          onClick={(e) => {
                            e.preventDefault();
                            onAttachFile?.();
                          }}
                        >
                          <Image
                            src="/assets/svgs/file-plus.svg"
                            alt="file-plus"
                            width={16}
                            height={16}
                          />{' '}
                          Attach file
                        </a>
                        <a
                          href="#"
                          className="attach-url"
                          onClick={(e) => {
                            e.preventDefault();
                            onAttachUrl?.();
                          }}
                        >
                          <Image src="/assets/svgs/link.svg" alt="link" width={16} height={16} />{' '}
                          Attach URL
                        </a>
                      </div>
                    </div>
                  </>
                )}
                <div className="tagsSection">
                  <div className="tagsSectionHeader">
                    <Image src="/assets/svgs/tags.svg" alt="Tag" width={16} height={16} />
                    <span className="tagsSectionTitle">
                      Tags (
                      {isTagsLoading ? (
                        <Skeleton
                          className="h-3 w-6 inline-block align-middle"
                          aria-hidden="true"
                        />
                      ) : (
                        displayTags.length
                      )}
                      )
                    </span>
                  </div>
                  <button
                    className="addTagButton"
                    onClick={() => setShowAddTagMenu?.((prev) => !prev)}
                    ref={tagButtonRef}
                  >
                    + Add tag
                  </button>
                  <div className="tagsList">
                    {isTagsLoading ? (
                      <>
                        {Array.from({ length: 4 }).map((_, idx) => (
                          <Skeleton
                            key={idx}
                            className="h-6 w-16 rounded-full"
                            aria-hidden="true"
                          />
                        ))}
                      </>
                    ) : (
                      displayTags.map((t) => (
                        <InteractiveTag
                          key={t.id}
                          tag={{ id: t.id, label: t.label, color: t.color || '#eee' }}
                          documentId={safeDocumentId}
                        />
                      ))
                    )}
                    {!isTagsLoading && displayTags.length === 0 && (
                      <span style={{ fontSize: '12px', color: '#777' }}>No tags</span>
                    )}
                  </div>
                </div>
              </div>
            )}

            {/* PROPERTIES TAB */}
            {activeTab === 'properties' && (
              <div className="propertiesTabContent">
                <div className="propertyRow">
                  <span className="propertyLabel">Item type</span>
                  <span className="propertyValue">
                    {selectedReference.type
                      .replace(/_/g, ' ')
                      .replace(/\b\w/g, (l) => l.toUpperCase())}
                  </span>
                </div>

                <EditableField
                  label="Title"
                  value={selectedReference.title}
                  fieldKey="title"
                  onSave={handleTitleSave}
                  variant="property"
                />

                {currentPropertyFields.map((field) => {
                  const m = selectedReference.metadata as any;
                  let value = m[field.key];
                  if (field.key === 'abstract') {
                    value = m.summary || m.abstract;
                  }

                  return (
                    <EditableField
                      key={field.key}
                      label={field.label}
                      value={value as string}
                      fieldKey={field.key}
                      onSave={handleMetadataFieldSave}
                      isTextarea={field.isTextarea}
                      variant="property"
                      collapsible={field.key === 'abstract' || field.key === 'summary'}
                    />
                  );
                })}
              </div>
            )}

            {/* NOTES TAB */}
            {activeTab === 'notes' && (
              <div className="notesTabContent">
                <div className="notesLayout">
                  <div className="notesListSection">
                    {isNotesAndAnnotationsLoading ? (
                      <div aria-hidden="true">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx} className="noteCard">
                            <div className="noteHeader">
                              <Skeleton className="h-4 w-4 rounded-sm" />
                              <Skeleton className="h-3 w-40" />
                            </div>
                            <div className="noteContent">
                              <Skeleton className="h-3 w-[85%]" />
                              <Skeleton className="h-3 w-[65%] mt-2" />
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <>
                        {mergedNotes.length === 0 &&
                          !selectedReference?.file_url &&
                          !selectedReference?.s3_key &&
                          selectedReference?.document_source_type !== 'file' && (
                            <div className="notesEmptyContainerLayout">
                              <div className="notesEmptyContainer">
                                <Image src="/assets/svgs/Box.svg" alt="" width={74} height={74} />
                                <div className="notesEmptyText">
                                  Add your first Note or Annotate
                                </div>
                              </div>

                              <div className="attach-container">
                                <div className="attach-icon">
                                  <span>+</span>
                                </div>

                                <p className="attach-text">
                                  Attach a document or image with this reference
                                </p>

                                <div className="attach-links">
                                  <a
                                    href="#"
                                    className="attach-file"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onAttachFile?.();
                                    }}
                                  >
                                    <Image
                                      src="/assets/svgs/file-plus.svg"
                                      alt="file-plus"
                                      width={16}
                                      height={16}
                                    />{' '}
                                    Attach file
                                  </a>
                                  <a
                                    href="#"
                                    className="attach-url"
                                    onClick={(e) => {
                                      e.preventDefault();
                                      onAttachUrl?.();
                                    }}
                                  >
                                    <Image
                                      src="/assets/svgs/link.svg"
                                      alt="link"
                                      width={16}
                                      height={16}
                                    />{' '}
                                    Attach URL
                                  </a>
                                </div>
                              </div>

                              <div className="tagsSection">
                                <div className="tagsSectionHeader">
                                  <Image
                                    src="/assets/svgs/tags.svg"
                                    alt="Tag"
                                    width={16}
                                    height={16}
                                  />
                                  <span className="tagsSectionTitle">
                                    Tags (
                                    {isTagsLoading ? (
                                      <Skeleton
                                        className="h-3 w-6 inline-block align-middle"
                                        aria-hidden="true"
                                      />
                                    ) : (
                                      displayTags.length
                                    )}
                                    )
                                  </span>
                                </div>
                                <button
                                  className="addTagButton"
                                  onClick={() => setShowAddTagMenu?.((prev) => !prev)}
                                  ref={tagButtonRef}
                                >
                                  + Add tag
                                </button>
                                <div className="tagsList">
                                  {isTagsLoading ? (
                                    <>
                                      {Array.from({ length: 4 }).map((_, idx) => (
                                        <Skeleton
                                          key={idx}
                                          className="h-6 w-16 rounded-full"
                                          aria-hidden="true"
                                        />
                                      ))}
                                    </>
                                  ) : (
                                    displayTags.map((t) => (
                                      <InteractiveTag
                                        key={t.id}
                                        tag={{ id: t.id, label: t.label, color: t.color || '#eee' }}
                                        documentId={safeDocumentId}
                                      />
                                    ))
                                  )}
                                  {!isTagsLoading && displayTags.length === 0 && (
                                    <span
                                      style={{
                                        fontSize: '12px',
                                        color: '#777',
                                      }}
                                    >
                                      No tags
                                    </span>
                                  )}
                                </div>
                              </div>
                            </div>
                          )}

                        {(() => {
                          const autoAnnotations = mergedNotes.filter(
                            (note) =>
                              note.annotationSource === 2 ||
                              note.annotationSource === 'AI_ANNOTATE' ||
                              note.annotationSource === 'auto_annotate'
                          );
                          const otherNotes = mergedNotes.filter(
                            (note) =>
                              !(
                                note.annotationSource === 2 ||
                                note.annotationSource === 'AI_ANNOTATE' ||
                                note.annotationSource === 'auto_annotate'
                              )
                          );

                          const groupsMap = new Map<string, any[]>();
                          autoAnnotations.forEach((n) => {
                            const key =
                              (typeof n.prompt === 'string' && n.prompt.trim()) || '(No prompt)';
                            const arr = groupsMap.get(key) || [];
                            arr.push(n);
                            groupsMap.set(key, arr);
                          });
                          const autoGroups = Array.from(groupsMap.values());

                          return (
                            <>
                              {autoGroups.length > 0 &&
                                autoGroups.map((group, idx) =>
                                  renderMergedAutoAnnotations(group, `auto-group-${idx}`)
                                )}
                              {otherNotes.map((note) => {
                                if (note.type === 'independent') {
                                  return renderIndependentNote(note);
                                } else {
                                  return renderManualAnnotation(note);
                                }
                              })}
                            </>
                          );
                        })()}
                      </>
                    )}
                  </div>

                  {(selectedReference?.file_url ||
                    selectedReference?.s3_key ||
                    selectedReference?.document_source_type === 'file') && (
                    <>
                      {mergedNotes.length === 0 && !isNotesAndAnnotationsLoading && (
                        <div className="notesEmptyContainerLayout">
                          <div className="notesEmptyContainer">
                            <Image src="/assets/svgs/Box.svg" alt="" width={74} height={74} />
                            <div className="notesEmptyText">Add your first Note or Annotate</div>
                          </div>
                        </div>
                      )}

                      {isAnnotationView && (
                        <div style={{ marginBottom: '16px', padding: '0 4px' }}>
                          <button
                            onClick={() => setIsHistoryOpen(!isHistoryOpen)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              width: '100%',
                              background: 'none',
                              border: 'none',
                              cursor: 'pointer',
                              padding: '8px 0',
                              fontSize: '14px',
                              fontWeight: 500,
                              color: '#333',
                            }}
                          >
                            <span>Actions</span>
                            {isHistoryOpen ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                          </button>

                          <div
                            ref={historyContentRef}
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              marginTop: 0,
                              marginBottom: 0,
                              paddingLeft: '4px',
                              height: 0,
                              opacity: 0,
                              overflow: 'hidden',
                            }}
                          >
                            {(() => {
                              const autoPrompts = mergedNotes
                                .filter(
                                  (n) =>
                                    n.annotationSource === 2 ||
                                    n.annotationSource === 'AI_ANNOTATE' ||
                                    n.annotationSource === 'auto_annotate'
                                )
                                .map((n) => (typeof n.prompt === 'string' ? n.prompt.trim() : ''))
                                .filter((p) => p && p.length > 0);
                              const uniquePrompts = Array.from(new Set(autoPrompts));
                              const isGenerating =
                                autoAnnotateProgress !== undefined &&
                                autoAnnotateProgress !== null &&
                                autoAnnotateProgress < 100;

                              if (uniquePrompts.length === 0 && !isGenerating) {
                                return (
                                  <span
                                    style={{ fontSize: '13px', color: '#777', padding: '8px 0' }}
                                  >
                                    No auto-annotation actions yet
                                  </span>
                                );
                              }

                              const totalItems = uniquePrompts.length + (isGenerating ? 1 : 0);
                              const goldColor = '#D4A017';
                              const beigeBg = '#F8F7F2';
                              const gapSize = 12; // Gap between items
                              const circleSize = 32;
                              const circleMarginTop = 6;
                              const circleCenterY = circleMarginTop + circleSize / 2; // 22px

                              return (
                                <div style={{ position: 'relative' }}>
                                  {/* Completed prompts */}
                                  {uniquePrompts.map((p, idx) => {
                                    const isLastVisual = idx === totalItems - 1;

                                    return (
                                      <div
                                        key={`${p}-${idx}`}
                                        style={{
                                          display: 'flex',
                                          alignItems: 'stretch',
                                          gap: '16px',
                                          paddingBottom: isLastVisual ? '0' : `${gapSize}px`,
                                          position: 'relative',
                                          zIndex: 1,
                                        }}
                                      >
                                        <div
                                          style={{
                                            width: `${circleSize}px`,
                                            position: 'relative',
                                            flexShrink: 0,
                                          }}
                                        >
                                          {/* Connecting Line Segment */}
                                          {totalItems > 1 && (
                                            <div
                                              style={{
                                                position: 'absolute',
                                                left: '50%',
                                                width: '2px',
                                                backgroundColor: goldColor,
                                                transform: 'translateX(-50%)',
                                                // Start logic:
                                                // First item: Start at center.
                                                // Others: Start at top (0) to connect from previous.
                                                top: idx === 0 ? `${circleCenterY}px` : '0',

                                                // End/Height logic:
                                                // Last visual item: End at center.
                                                // Others: Go to bottom + gap size (to reach next item's top).
                                                height: isLastVisual
                                                  ? `${circleCenterY}px`
                                                  : idx === 0
                                                    ? `calc(100% + ${gapSize}px - ${circleCenterY}px)`
                                                    : `calc(100% + ${gapSize}px)`,

                                                zIndex: 0,
                                              }}
                                            />
                                          )}
                                          {/* Circle */}
                                          <div
                                            style={{
                                              width: `${circleSize}px`,
                                              height: `${circleSize}px`,
                                              borderRadius: '50%',
                                              backgroundColor: '#FFFFFF',
                                              border: `2px solid ${goldColor}`,
                                              display: 'flex',
                                              alignItems: 'center',
                                              justifyContent: 'center',
                                              zIndex: 1,
                                              position: 'relative', // Ensure on top of line
                                              marginTop: `${circleMarginTop}px`,
                                            }}
                                          >
                                            <svg
                                              width="14"
                                              height="10"
                                              viewBox="0 0 14 10"
                                              fill="none"
                                            >
                                              <path
                                                d="M1 5L4.5 8.5L13 1"
                                                stroke="#374151"
                                                strokeWidth="2"
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                              />
                                            </svg>
                                          </div>
                                        </div>
                                        <div
                                          style={{
                                            backgroundColor: beigeBg,
                                            borderRadius: '12px',
                                            padding: '16px',
                                            flex: 1,
                                            fontSize: '14px',
                                            color: '#1F2937',
                                            lineHeight: '1.5',
                                            fontWeight: 400,
                                          }}
                                        >
                                          {p}
                                        </div>
                                      </div>
                                    );
                                  })}

                                  {/* Generating indicator - Always the last item if visible */}
                                  {isGenerating && (
                                    <div
                                      style={{
                                        display: 'flex',
                                        alignItems: 'stretch',
                                        gap: '16px',
                                        paddingBottom: '0',
                                        position: 'relative',
                                        zIndex: 1,
                                      }}
                                    >
                                      <div
                                        style={{
                                          width: `${circleSize}px`,
                                          position: 'relative',
                                          flexShrink: 0,
                                        }}
                                      >
                                        {/* Connecting Line from previous */}
                                        {totalItems > 1 && (
                                          <div
                                            style={{
                                              position: 'absolute',
                                              left: '50%',
                                              width: '2px',
                                              backgroundColor: goldColor,
                                              transform: 'translateX(-50%)',
                                              top: '0',
                                              height: `${circleCenterY}px`, // End at center
                                              zIndex: 0,
                                            }}
                                          />
                                        )}
                                        {/* Circle */}
                                        <div
                                          style={{
                                            width: `${circleSize}px`,
                                            height: `${circleSize}px`,
                                            borderRadius: '50%',
                                            backgroundColor: '#FFFFFF',
                                            border: `2px solid ${goldColor}`,
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            zIndex: 1,
                                            position: 'relative',
                                            marginTop: `${circleMarginTop}px`,
                                          }}
                                        >
                                          <svg
                                            width="16"
                                            height="16"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            style={{ animation: 'spin 1s linear infinite' }}
                                          >
                                            <circle
                                              cx="12"
                                              cy="12"
                                              r="10"
                                              stroke={goldColor}
                                              strokeWidth="3"
                                              strokeDasharray="32"
                                              strokeDashoffset="12"
                                              strokeLinecap="round"
                                            />
                                          </svg>
                                        </div>
                                      </div>
                                      <div
                                        style={{
                                          backgroundColor: beigeBg,
                                          borderRadius: '12px',
                                          padding: '16px',
                                          flex: 1,
                                          fontSize: '14px',
                                          color: '#1F2937',
                                          lineHeight: '1.5',
                                          fontWeight: 400,
                                          fontStyle: 'italic',
                                        }}
                                      >
                                        Generating...
                                      </div>
                                    </div>
                                  )}
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      )}

                      <div className="notesInputSection">
                        {showAutoAnnotateToggle && (
                          <button
                            type="button"
                            className={`autoAnnotateToggle ${isAutoModeEnabled ? 'autoAnnotateToggle--active' : ''}`}
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleAutoMode();
                            }}
                            aria-pressed={isAutoModeEnabled}
                            title="Toggle auto-annotation input"
                          >
                            {isAutoModeEnabled ? 'Auto-annotate' : 'Note mode'}
                          </button>
                        )}
                        <textarea
                          className="notesTextarea"
                          placeholder={notePlaceholder}
                          value={noteInput}
                          onChange={(e) => setNoteInput(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleNoteSave(e);
                            }
                          }}
                        />
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}
          </>
        )}
      </div>

      {isPreviewDialogOpen && isImageReference && previewUrl && (
        <div
          role="dialog"
          aria-modal="true"
          onClick={handleClosePreview}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 2000,
            padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#fff',
              borderRadius: '12px',
              maxWidth: '90vw',
              maxHeight: '90vh',
              padding: '16px',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
              display: 'flex',
              flexDirection: 'column',
              gap: '12px',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: '12px' }}>
              <div style={{ fontWeight: 600 }}>Image preview</div>
              <button
                type="button"
                onClick={handleClosePreview}
                style={{
                  border: 'none',
                  background: 'transparent',
                  fontSize: '18px',
                  cursor: 'pointer',
                }}
                aria-label="Close preview"
              >
                ×
              </button>
            </div>
            <Image
              key={previewUrl}
              src={previewUrl || ''}
              alt="Image preview"
              width={0}
              height={0}
              sizes="100vw"
              style={{
                maxWidth: '100%',
                maxHeight: '75vh',
                borderRadius: '8px',
                width: 'auto',
                height: 'auto',
              }}
              unoptimized
            />
          </div>
        </div>
      )}
    </motion.div>
  );
}
