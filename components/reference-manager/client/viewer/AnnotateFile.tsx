'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { DocumentHeader } from '../content/DocumentHeader';
import { DocumentViewer } from './DocumentViewer';
import InfoPanel from '../layout/InfoPanel';
import UnifiedUploadDialog from '../dialogs/UnifiedUploadDialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import { useReferenceActions } from '@/app/references/hooks/useReferenceActions';
import { useDocumentActions } from '@/app/references/hooks/useDocumentActions';
import { useReferenceInitialization } from '@/app/references/hooks/useReferenceInitialization';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import { Annotation } from '@/types/reference-manager';
import { isTempAnnotationId } from '@/lib/utils/helpers';
import { useNotificationSound } from '@/hooks/common/useNotificationSound';
import { useAutoAnnotationInputStore } from '@/store/zustand/useAutoAnnotationInputStore';
import '@/styles/reference-manager/document-viewer.css';
import { Skeleton } from '@/components/ui/skeleton';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';

const bboxToRect = (
  bbox: unknown
): { x: number; y: number; width: number; height: number } | null => {
  if (!Array.isArray(bbox) || bbox.length !== 4) return null;
  if (!bbox.every((val) => typeof val === 'number' && Number.isFinite(val))) return null;

  const [x0, y0, x1OrW, y1OrH] = bbox;
  const looksLikeCorners = x1OrW > x0 && y1OrH > y0;

  const width = looksLikeCorners ? x1OrW - x0 : x1OrW;
  const height = looksLikeCorners ? y1OrH - y0 : y1OrH;

  return {
    x: x0,
    y: y0,
    width: Math.max(0, width),
    height: Math.max(0, height),
  };
};

const rectToBbox = (rect: { x: number; y: number; width: number; height: number } | undefined) => {
  const x0 = rect?.x ?? 0;
  const y0 = rect?.y ?? 0;
  const width = rect?.width ?? 0;
  const height = rect?.height ?? 0;
  return [x0, y0, x0 + width, y0 + height];
};

const mergeRects = (rects: { x: number; y: number; width: number; height: number }[]) => {
  if (rects.length === 0) return null;
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  return { x: minX, y: minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
};

interface AnotateFileProps {
  referenceId: string;
}

export default function AnotateFile({ referenceId }: AnotateFileProps) {
  useReferenceInitialization();
  const router = useRouter();

  const { references } = useReferenceContext();
  const { updateReference } = useReferenceActions();
  const { deleteNote, editNote, addIndependentNote } = useDocumentActions();
  const { user } = useAuth();
  const { addToast, updateToast, removeToast } = useToast();
  const queryClient = useQueryClient();
  const { playSuccess, playError } = useNotificationSound();
  const resetAutoAnnotationMode = useAutoAnnotationInputStore((state) => state.resetAutoMode);

  const invalidateAnnotationQueries = (docId?: string | null) => {
    if (!docId) return;
    queryClient.invalidateQueries({ queryKey: referenceKeys.annotations(docId, true) });
    queryClient.invalidateQueries({ queryKey: referenceKeys.annotations(docId, false) });
  };
  const pendingAnnotationReasonsRef = useRef<Record<string, string>>({});
  const pendingAnnotationCommentsRef = useRef<Record<string, string[]>>({});
  const [annotationIdMap, setAnnotationIdMap] = useState<Record<string, string>>({});
  const reference = references.find((r) => r.id === referenceId);

  const [selectedHighlightColor, setSelectedHighlightColor] = useState<string | null>('#FEF3C7');
  const [infoPanelOpen, setInfoPanelOpen] = useState(true);
  const [showUploadDialog, setShowUploadDialog] = useState(false);
  const [uploadMode] = useState<'file' | 'url' | 'ai'>('ai');
  const [autoAnnotateProgress, setAutoAnnotateProgress] = useState<number | null>(null);
  const [autoAnnotateStatus, setAutoAnnotateStatus] = useState<string>('');
  const [showMobileScreen, setShowMobileScreen] = useState(false);
  const [historyDrawerOpen, setHistoryDrawerOpen] = useState(false);
  const autoAnnotateStartTime = useRef<Date | null>(null);
  const initialAnnotationIds = useRef<Set<string>>(new Set());
  const autoAnnotateSoundPlayedRef = useRef(false);
  const autoAnnotateToastIdRef = useRef<string | null>(null);

  const handleAutoAnnotate = async (query: string, closeDialog = true) => {
    const finalizeToast = (type: 'success' | 'error', message: string) => {
      if (!autoAnnotateToastIdRef.current) return;
      if (type === 'success') {
        playSuccess();
      } else {
        playError();
      }
      updateToast(autoAnnotateToastIdRef.current, {
        type,
        message,
        progress: type === 'success' ? 100 : null,
        showSpinner: false,
        duration: type === 'success' ? 2000 : 4000,
      });
      const tid = autoAnnotateToastIdRef.current;
      setTimeout(
        () => {
          removeToast(tid);
        },
        type === 'success' ? 2000 : 4000
      );
      autoAnnotateToastIdRef.current = null;
    };

    const updateProgressToast = (message: string, progressValue?: number) => {
      if (!autoAnnotateToastIdRef.current) {
        autoAnnotateToastIdRef.current = addToast(message, 'info', {
          duration: 0,
          progress: progressValue ?? 0,
          showSpinner: true,
        });
      } else {
        const updates: any = { message, showSpinner: true };
        if (typeof progressValue === 'number') {
          updates.progress = Math.max(0, Math.min(100, progressValue));
        }
        updateToast(autoAnnotateToastIdRef.current, updates);
      }
    };

    try {
      let targetDocId = reference?.documentId || referenceId;
      let targetS3Key = reference?.s3_key || '';

      if (!targetS3Key) {
        const childDoc = references.find((r) => r.refId === referenceId && r.s3_key);
        if (childDoc) {
          targetDocId = childDoc.id;
          targetS3Key = childDoc.s3_key || '';
        }
      }

      const payload = {
        document_id: targetDocId,
        query: query,
        s3_key: targetS3Key,
      };

      setAutoAnnotateStatus('Processing auto-annotation...');
      setAutoAnnotateProgress(20);
      updateProgressToast('Processing auto-annotation...', 20);

      autoAnnotateStartTime.current = new Date();
      autoAnnotateSoundPlayedRef.current = false;
      if (reference?.annotations) {
        initialAnnotationIds.current = new Set(reference.annotations.map((a) => a.id));
      } else {
        initialAnnotationIds.current = new Set();
      }

      const response = await referenceManagerService.autoAnnotateDocument(payload);

      // Handle new direct response format
      if (response.data && response.data.results && Array.isArray(response.data.results)) {
        setAutoAnnotateProgress(80);
        updateProgressToast('Finalizing annotations...', 80);

        const newAnnotations: Annotation[] = response.data.results
          .map((result: any, index: number): Annotation | null => {
            const bboxes = result.bboxes || [];
            if (bboxes.length === 0) return null;

            const coordinatesList = bboxes
              .map((box: any) => bboxToRect(box.bbox))
              .filter(
                (r: any): r is { x: number; y: number; width: number; height: number } => r !== null
              );

            if (coordinatesList.length === 0) return null;

            const coordinates = mergeRects(coordinatesList) || {
              x: 0,
              y: 0,
              width: 0,
              height: 0,
            };

            // Convert 0-based page to 1-based page
            const firstPage = bboxes[0].page;
            const page = typeof firstPage === 'number' ? firstPage + 1 : 1;

            return {
              id: `auto-${Date.now()}-${index}`,
              type: 'auto_annotate' as const,
              textSelected: result.text || '',
              note: result.type || '',
              prompt: query,
              highlightColor: '#FFEB3B',
              locationInDocument: {
                page,
                coordinates,
                coordinatesList,
                charStart: bboxes[0].char_start,
                charEnd: bboxes[bboxes.length - 1].char_end,
              },
              createdBy: user?.user_id || 'system',
              createdAt: new Date().toISOString(),
            };
          })
          .filter((a: Annotation | null): a is Annotation => a !== null);

        if (newAnnotations.length > 0) {
          const currentAnnotations = reference?.annotations || [];
          const updatedAnnotations = [...currentAnnotations, ...newAnnotations];
          updateReference(referenceId, { annotations: updatedAnnotations }, true);
          if (!autoAnnotateSoundPlayedRef.current) {
            playSuccess();
            autoAnnotateSoundPlayedRef.current = true;
          }
        }

        setAutoAnnotateStatus('Auto-annotation completed!');
        setAutoAnnotateProgress(100);
        finalizeToast('success', 'Auto-annotation completed!');

        setTimeout(() => {
          if (closeDialog) setShowUploadDialog(false);
          setAutoAnnotateProgress(null);
          setAutoAnnotateStatus('');
          // Close history drawer when auto-annotation completes
          setHistoryDrawerOpen(false);
        }, 1000);
        return;
      }

      const message = response.data?.message || (response as any).message || '';
      const taskIdMatch = message.match(/Task queued:\s*([0-9a-fA-F-]+)/);
      if (taskIdMatch && taskIdMatch[1]) {
        const taskId = taskIdMatch[1];

        let token = '';
        if (typeof document !== 'undefined') {
          const cookies = document.cookie.split(';');
          for (const cookie of cookies) {
            const [name, ...rest] = cookie.trim().split('=');
            if (name === STORAGE_KEYS.ACCESS_TOKEN) {
              token = decodeURIComponent(rest.join('='));
              break;
            }
          }
        }
        if (token) {
          // Set cookie for WebSocket authentication (backend requirement)
          // Secure flag required for HTTPS in production, SameSite=Strict for CSRF protection
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `ws_access_token=${token}; path=/; max-age=3600; SameSite=Strict${isSecure ? '; Secure' : ''}`;

          let taskWsBase = process.env.NEXT_PUBLIC_TASK_WS_URL || '';

          // Log the original URL for debugging
          console.log('[AutoAnnotate] Original NEXT_PUBLIC_TASK_WS_URL:', taskWsBase);
          console.log(
            '[AutoAnnotate] Page protocol:',
            typeof window !== 'undefined' ? window.location.protocol : 'unknown'
          );

          // Auto-upgrade to wss:// for HTTPS sites to prevent mixed content errors
          if (isSecure && taskWsBase.startsWith('ws://')) {
            taskWsBase = taskWsBase.replace('ws://', 'wss://');
            console.log(
              '[AutoAnnotate] Upgraded WebSocket to secure connection (wss://):',
              taskWsBase
            );
          }

          // Fallback if no URL configured
          if (!taskWsBase) {
            const wsProtocol = isSecure ? 'wss:' : 'ws:';
            const host = typeof window !== 'undefined' ? window.location.host : 'localhost:8000';
            taskWsBase = `${wsProtocol}//${host}/api/ws/tasks`;
            console.log('[AutoAnnotate] Using fallback WebSocket URL:', taskWsBase);
          }

          const wsUrl = `${taskWsBase}/${taskId}?token=${token}`;
          console.log(
            '[AutoAnnotate] Final WebSocket URL:',
            wsUrl.replace(/token=.*$/, 'token=[REDACTED]')
          );

          let ws: WebSocket;
          try {
            // Use Sec-WebSocket-Protocol header for authentication (browser-compatible)
            // Format: ["access_token", "<jwt_token>"] - browser sends as "access_token, <jwt>"
            // Also keeping token in query param as fallback
            ws = new WebSocket(wsUrl);
            console.log('[AutoAnnotate] WebSocket created with Sec-WebSocket-Protocol auth');
          } catch (wsCreateError) {
            console.error('[AutoAnnotate] Failed to create WebSocket:', wsCreateError);
            finalizeToast('error', 'Failed to establish connection to annotation service');
            setAutoAnnotateStatus('Connection failed. Please try again.');
            return;
          }

          ws.onopen = () => {
            console.log('[AutoAnnotate] WebSocket connected successfully');
            console.log('[AutoAnnotate] Protocol negotiated:', ws.protocol || 'none');
            setAutoAnnotateStatus('Connected to annotation service...');
            setAutoAnnotateProgress(0);
            updateProgressToast('Connected to annotation service...', 0);
          };

          ws.onmessage = (event) => {
            try {
              const data = JSON.parse(event.data);
              console.log('[AutoAnnotate] WebSocket message received:', data);

              // Handle backend message types - IMPORTANT: prevents early closure
              if (data.type === 'ack') {
                console.log('✅ Connection acknowledged:', data.message);
                setAutoAnnotateStatus('Connection established...');
                updateProgressToast('Connection established...', 10);
                return; // Don't close! Wait for more messages
              }

              if (data.type === 'connection') {
                console.log('🎉 Fully connected!', data.message);
                setAutoAnnotateStatus('Processing auto-annotation...');
                setAutoAnnotateProgress(20);
                updateProgressToast('Processing auto-annotation...', 20);
                return;
              }

              if (data.type === 'progress') {
                console.log('⏳ Progress update:', data.message, data.progress);
                if (data.message) {
                  setAutoAnnotateStatus(data.message);
                }
                if (data.progress !== undefined) {
                  setAutoAnnotateProgress(data.progress);
                  updateProgressToast(data.message || 'Processing...', data.progress);
                }
                return;
              }

              // Update status and progress from WebSocket
              if (data.status) {
                setAutoAnnotateStatus(data.status);
                updateProgressToast(data.status, data.progress);
              }
              if (data.progress !== undefined) {
                setAutoAnnotateProgress(data.progress);
                updateProgressToast(data.status || 'Annotating...', data.progress);
              }

              // When task completes, fetch annotations and update UI
              if (
                data.status === 'completed' ||
                data.state === 'completed' ||
                data.event === 'COMPLETE' ||
                data.progress === 100
              ) {
                setAutoAnnotateStatus('Auto-annotation completed!');
                setAutoAnnotateProgress(100);
                finalizeToast('success', 'Auto-annotation completed!');

                // Close dialog and history drawer when auto-annotation completes
                setTimeout(() => {
                  if (closeDialog) setShowUploadDialog(false);
                  setAutoAnnotateProgress(null);
                  setAutoAnnotateStatus('');
                  setHistoryDrawerOpen(false);
                }, 1000);

                queryClient.invalidateQueries({
                  queryKey: referenceKeys.annotations(targetDocId, true),
                });
                queryClient.invalidateQueries({
                  queryKey: referenceKeys.annotations(targetDocId, false),
                });
              }

              // Handle errors
              if (data.status === 'failed' || data.state === 'failed') {
                setAutoAnnotateStatus('Auto-annotation failed. Please try again.');
                finalizeToast('error', 'Auto-annotation failed');
                setTimeout(() => {
                  if (closeDialog) setShowUploadDialog(false);
                  setAutoAnnotateProgress(null);
                  setAutoAnnotateStatus('');
                }, 2000);
              }
            } catch (e) {
              console.error('Error parsing WebSocket message:', e);
            }
          };

          ws.onerror = (event) => {
            // WebSocket error events don't contain much detail for security reasons
            // Log what we can and provide helpful guidance
            console.error('[AutoAnnotate] WebSocket error occurred:', {
              url: wsUrl.replace(/token=.*$/, 'token=[REDACTED]'),
              readyState: ws.readyState,
              readyStateLabel:
                ['CONNECTING', 'OPEN', 'CLOSING', 'CLOSED'][ws.readyState] || 'UNKNOWN',
              protocol: ws.protocol || 'none',
              isSecurePage: typeof window !== 'undefined' && window.location.protocol === 'https:',
              wsProtocol: wsUrl.startsWith('wss://') ? 'wss' : 'ws',
            });

            // Check for common issues
            const isSecurePage =
              typeof window !== 'undefined' && window.location.protocol === 'https:';
            const isInsecureWs = wsUrl.startsWith('ws://');

            let errorMessage = 'Connection error';
            if (isSecurePage && isInsecureWs) {
              errorMessage = 'Secure connection required. Please check WebSocket configuration.';
              console.error(
                '[AutoAnnotate] Mixed content error: HTTPS page trying to connect to ws:// WebSocket. Configure NEXT_PUBLIC_TASK_WS_URL with wss:// protocol.'
              );
            } else {
              errorMessage = 'Failed to connect to annotation service. Please try again.';
            }

            setAutoAnnotateStatus(errorMessage);
            finalizeToast('error', errorMessage);
          };

          ws.onclose = (event) => {
            console.log('[AutoAnnotate] WebSocket closed:', {
              code: event.code,
              reason: event.reason || 'No reason provided',
              wasClean: event.wasClean,
            });

            // Provide user-friendly messages for common close codes
            if (!event.wasClean && autoAnnotateProgress !== null && autoAnnotateProgress < 100) {
              let closeReason = 'Connection lost';
              switch (event.code) {
                case 1006:
                  closeReason = 'Connection closed abnormally. Server may be unavailable.';
                  break;
                case 1008:
                  closeReason = 'Policy violation. Please re-authenticate.';
                  break;
                case 1011:
                  closeReason = 'Server encountered an error.';
                  break;
                case 4001:
                  closeReason = 'Authentication failed. Please log in again.';
                  break;
              }
              console.warn('[AutoAnnotate] Unclean WebSocket close:', closeReason);
              setAutoAnnotateStatus(closeReason);
              finalizeToast('error', closeReason);

              // Reset progress after showing error
              setTimeout(() => {
                setAutoAnnotateProgress(null);
                setAutoAnnotateStatus('');
              }, 3000);
            }
          };
        } else {
          console.error('No access token found for WebSocket connection');
          finalizeToast('error', 'Authentication token not found');
        }
      }

      // Don't close dialog - keep it open to show progress
      if (!response.data?.results) {
        setAutoAnnotateStatus('Auto-annotation request sent! Waiting for response...');
        setAutoAnnotateProgress(5);
        updateProgressToast('Auto-annotation request sent!', 5);
      }
    } catch (error) {
      console.error('Error auto-annotating:', error);
      setAutoAnnotateStatus('Error: ' + (error instanceof Error ? error.message : String(error)));
      finalizeToast('error', 'Auto-annotation failed');
      setTimeout(() => {
        if (closeDialog) setShowUploadDialog(false);
        setAutoAnnotateProgress(null);
        setAutoAnnotateStatus('');
      }, 3000);
    }
  };

  // Effect to monitor new annotations and close dialog if they appear
  useEffect(() => {
    if (autoAnnotateProgress !== null && reference?.annotations) {
      const hasNewAnnotations = reference.annotations.some((ann) => {
        if (ann.type !== 'auto_annotate') return false;

        // Check if annotation is new (not in initial set)
        // If initialAnnotationIds is empty, we rely on time check or assume it's new
        if (initialAnnotationIds.current.size > 0) {
          return !initialAnnotationIds.current.has(ann.id);
        }

        // Fallback to time check
        if (autoAnnotateStartTime.current && ann.createdAt) {
          return new Date(ann.createdAt) > autoAnnotateStartTime.current;
        }

        return false;
      });

      if (hasNewAnnotations && autoAnnotateProgress < 100) {
        if (!autoAnnotateSoundPlayedRef.current) {
          playSuccess();
          autoAnnotateSoundPlayedRef.current = true;
        }

        // Finalize toast if it exists
        if (autoAnnotateToastIdRef.current) {
          updateToast(autoAnnotateToastIdRef.current, {
            type: 'success',
            message: 'Auto-annotation completed!',
            progress: 100,
            showSpinner: false,
            duration: 2000,
          });
          const tid = autoAnnotateToastIdRef.current;
          setTimeout(() => {
            removeToast(tid);
          }, 2000);
          autoAnnotateToastIdRef.current = null;
        }

        setAutoAnnotateStatus('Auto-annotation completed!');
        setAutoAnnotateProgress(100);
        setTimeout(() => {
          setAutoAnnotateProgress(null);
          setAutoAnnotateStatus('');
          autoAnnotateStartTime.current = null;
          initialAnnotationIds.current.clear();
          // Close history drawer when auto-annotation completes
          setHistoryDrawerOpen(false);
        }, 1000);
      }
    }
  }, [reference?.annotations, autoAnnotateProgress, playSuccess, updateToast, removeToast]);

  // Effect to periodically refresh annotations if progress is stuck
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (autoAnnotateProgress !== null && autoAnnotateProgress < 100) {
      interval = setInterval(() => {
        if (reference?.documentId) {
          queryClient.invalidateQueries({
            queryKey: referenceKeys.annotations(reference.documentId, true),
          });
        }
      }, 5000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [autoAnnotateProgress, reference?.documentId, queryClient]);

  useEffect(() => {
    return () => {
      resetAutoAnnotationMode();
    };
  }, [resetAutoAnnotationMode]);

  // Page/Zoom state for header integration
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [scale, setScale] = useState(1.5);
  const [targetPage, setTargetPage] = useState<number | undefined>(undefined);
  const [targetScale, setTargetScale] = useState<number | undefined>(undefined);
  const [scrollToAnnotationId, setScrollToAnnotationId] = useState<string | undefined>(undefined);

  const handleZoomIn = () => {
    const newScale = Math.min(scale + 0.25, 3);
    setTargetScale(newScale);
    setScale(newScale);
  };

  const handleZoomOut = () => {
    const newScale = Math.max(scale - 0.25, 0.5);
    setTargetScale(newScale);
    setScale(newScale);
  };

  const handlePageChange = (page: number) => {
    setTargetPage(page);
    setCurrentPage(page);
  };

  const handleNoteClick = (annotationId: string, page: number) => {
    // Navigate to the annotation's page and scroll to the annotation
    if (page >= 1 && page <= totalPages) {
      // Clear scroll target first to force re-scroll even if on same page
      setScrollToAnnotationId(undefined);
      // Use setTimeout to ensure state updates in correct order
      setTimeout(() => {
        setTargetPage(page);
        setCurrentPage(page);
        setScrollToAnnotationId(annotationId);
        // Clear the scroll target after scrolling completes to allow re-triggering
        setTimeout(() => {
          setScrollToAnnotationId(undefined);
        }, 1500);
      }, 10);
    }
  };

  const documentId = reference?.documentId || reference?.id || null;

  const previewQuery = useQuery({
    queryKey: documentId ? referenceKeys.preview(documentId) : referenceKeys.all,
    enabled: Boolean(documentId),
    queryFn: async () => {
      if (!documentId) return null;
      return referenceManagerService.previewDocument(documentId);
    },
    staleTime: 1000 * 60 * 10,
  });

  const annotationsQuery = useQuery({
    queryKey: documentId ? referenceKeys.annotations(documentId, true) : referenceKeys.all,
    enabled: Boolean(documentId),
    queryFn: async () => {
      if (!documentId) return null;
      return referenceManagerService.listAnnotations(documentId, { includePositions: true });
    },
    select: (response) => {
      const annotationsRaw = ((response as any)?.data?.annotations || []) as any[];

      const mapped: Annotation[] = annotationsRaw
        .filter((ann: any) => {
          if (!ann.positions || ann.positions.length === 0) return false;
          return ann.positions.some((pos: any) => bboxToRect(pos?.bbox) !== null);
        })
        .map((ann: any) => {
          const coordinatesList = (ann.positions || [])
            .map((pos: any) => bboxToRect(pos?.bbox))
            .filter(
              (rect: any): rect is { x: number; y: number; width: number; height: number } =>
                rect !== null
            );

          const coordinates = mergeRects(coordinatesList) || {
            x: 0,
            y: 0,
            width: 0,
            height: 0,
          };
          const firstPageNumber = ann.positions?.find(
            (p: any) => typeof p?.page_number === 'number'
          )?.page_number;

          return {
            id: ann.id,
            textSelected: ann.text || '',
            highlightColor: ann.color || '#FFEB3B',
            locationInDocument: {
              page: firstPageNumber || 1,
              coordinates,
              coordinatesList,
              charStart: ann.char_start || 0,
              charEnd: ann.char_end || 0,
            },
            note: ann.reason || '',
            comment: ann.comment || [],
            prompt: ann.prompt || ann.query || '',
            createdBy: ann.created_by,
            createdAt: ann.created_at,
            type: (ann.type === 'AI_ANNOTATE' ? 'auto_annotate' : ann.type) as
              | 'manual_highlight'
              | 'manual_note'
              | 'auto_annotate',
          };
        })
        .filter((ann) => {
          const text = ann.textSelected?.trim() || '';
          if (text.length < 3) return false;

          const datePatterns = [
            /^(?:early|late|mid)?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}(?:,\s*\d{4})?$/i,
            /^(?:early|late|mid)?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{4}$/i,
            /^\d{1,2}\s+(?:January|February|March|April|May|June|July|August|September|October|November|December)(?:,?\s*\d{4})?$/i,
            /^\d{4}$/,
            /^(?:early|late|mid)?\s*(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?$/i,
            /^\d{1,2}(?:\/|-)\d{1,2}(?:\/|-)\d{2,4}$/,
            /^(?:January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2}\s*(?:to|-|–)\s*\d{1,2}(?:,\s*\d{4})?$/i,
          ];

          const isDate = datePatterns.some((pattern) => pattern.test(text));
          const isManual = ann.type === 'manual_highlight' || ann.type === 'manual_note';
          return isManual || !isDate;
        });

      return mapped;
    },
    staleTime: 1000 * 30,
  });

  useEffect(() => {
    if (annotationsQuery.data) {
      updateReference(referenceId, { annotations: annotationsQuery.data }, true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [annotationsQuery.data, referenceId]);

  // State for pending note workflow
  const [pendingHighlight, setPendingHighlight] = useState<any | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const handleResize = () => {
      const isMobile = window.innerWidth < 768;
      setShowMobileScreen(isMobile);
      if (isMobile) {
        setInfoPanelOpen(false);
      } else {
        setInfoPanelOpen(true);
      }
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (pendingHighlight && !infoPanelOpen) {
      setInfoPanelOpen(true);
    }
  }, [pendingHighlight, infoPanelOpen]);

  useEffect(() => {
    if (pendingHighlight && reference) {
      const exists = (reference.annotations || []).some((a) => a.id === pendingHighlight.id);
      if (!exists) {
        const tempAnnotation: Annotation = {
          id: pendingHighlight.id,
          type: 'manual_note',
          textSelected: pendingHighlight.text || '',
          note: '',
          highlightColor: pendingHighlight.color || selectedHighlightColor || '#FFEB3B',
          locationInDocument: {
            page: pendingHighlight.pageNumber,
            coordinates: pendingHighlight.pdfPosition,
            coordinatesList: pendingHighlight.pdfPositions,
            charStart: pendingHighlight.charStart,
            charEnd: pendingHighlight.charEnd,
          },
          createdBy: user?.user_id || 'user_1',
          createdAt: new Date().toISOString(),
        };
        const currentAnnotations = reference.annotations || [];
        updateReference(
          referenceId,
          { annotations: [...currentAnnotations, tempAnnotation] },
          true
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pendingHighlight, reference]);

  const handleSavePendingHighlight = async (noteContent: string) => {
    if (!pendingHighlight || !reference) return;

    // Prepare payload
    const clientRects =
      pendingHighlight.pdfPositions && pendingHighlight.pdfPositions.length > 0
        ? pendingHighlight.pdfPositions
        : pendingHighlight.pdfPosition
          ? [pendingHighlight.pdfPosition]
          : [];

    const positions = (
      clientRects.length > 0 ? clientRects : [{ x: 0, y: 0, width: 0, height: 0 }]
    ).map((rect: any) => ({
      bbox: rectToBbox(rect),
      page_number: pendingHighlight.pageNumber,
    }));

    const payload = {
      annotation_type: 'USER_ANNOTATE',
      color: pendingHighlight.color || '#FFEB3B',
      created_by: user?.user_id || 'user_1',
      document_id: reference.documentId || reference.id,
      positions,
      reason: noteContent,
      text: pendingHighlight.text || '',
    };

    try {
      const response = await referenceManagerService.createAnnotation(payload as any);
      if (response.success && response.data) {
        const newAnnotation = response.data.annotation as any;

        // Map response to frontend model
        const serverCoordinatesList = (newAnnotation.positions || [])
          .map((pos: any) => bboxToRect(pos?.bbox))
          .filter(
            (rect: any): rect is { x: number; y: number; width: number; height: number } =>
              rect !== null
          );

        const serverCoordinates = mergeRects(serverCoordinatesList) ||
          pendingHighlight.pdfPosition || { x: 0, y: 0, width: 0, height: 0 };

        const serverFirstPageNumber = newAnnotation.positions?.find(
          (p: any) => typeof p?.page_number === 'number'
        )?.page_number;

        const mappedAnnotation: Annotation = {
          id: newAnnotation.id,
          type: 'manual_note', // It has a note now
          textSelected: newAnnotation.text,
          note: newAnnotation.reason || '',
          highlightColor: newAnnotation.color,
          locationInDocument: {
            page: serverFirstPageNumber || pendingHighlight.pageNumber,
            coordinates: serverCoordinates,
            coordinatesList:
              serverCoordinatesList.length > 0
                ? serverCoordinatesList
                : pendingHighlight.pdfPositions,
            charStart: pendingHighlight.charStart,
            charEnd: pendingHighlight.charEnd,
          },
          createdBy: newAnnotation.created_by,
          createdAt: newAnnotation.created_at,
        };

        const currentAnnotations = reference.annotations || [];
        const updatedAnnotations = currentAnnotations
          .filter((a) => a.id !== pendingHighlight.id)
          .concat(mappedAnnotation);

        updateReference(referenceId, { annotations: updatedAnnotations }, true);
        invalidateAnnotationQueries(payload.document_id);
        setPendingHighlight(null);
        playSuccess();

        setAnnotationIdMap((prev) => ({
          ...prev,
          [pendingHighlight.id]: newAnnotation.id,
        }));

        const pendingComments = pendingAnnotationCommentsRef.current[pendingHighlight.id];
        if (pendingComments && newAnnotation.id) {
          try {
            const updatePayload = {
              annotation_id: newAnnotation.id,
              comment: pendingComments,
            };
            const updateResponse = await referenceManagerService.updateAnnotation(
              updatePayload as any
            );
            if (updateResponse.success) {
              updateReference(
                referenceId,
                {
                  annotations: updatedAnnotations.map((a) =>
                    a.id === newAnnotation.id ? { ...a, comment: pendingComments } : a
                  ),
                },
                true
              );
              invalidateAnnotationQueries(payload.document_id);
            }
          } catch (error) {
          } finally {
            delete pendingAnnotationCommentsRef.current[pendingHighlight.id];
          }
        }
      } else {
        alert('Failed to save note. Please try again.');
      }
    } catch (error) {
      alert('Error saving note. Please try again.');
    }
  };

  useEffect(() => {
    if (references.length > 0 && !reference) {
      console.error(`Reference with id ${referenceId} not found`);
    }
  }, [reference, referenceId, references.length]);

  if (!reference && references.length === 0) {
    return (
      <div className="document-viewer-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Loading...</h2>
        </div>
      </div>
    );
  }

  if (!reference) {
    return (
      <div className="document-viewer-container">
        <div style={{ padding: '2rem', textAlign: 'center' }}>
          <h2>Reference not found</h2>
          <p>The reference with ID "{referenceId}" does not exist.</p>
        </div>
      </div>
    );
  }

  const rawPreviewUrl = (previewQuery.data as any)?.data?.preview_url as string | undefined;
  const documentUrl = rawPreviewUrl ? `/proxy-pdf?url=${encodeURIComponent(rawPreviewUrl)}` : '';
  const loadingPreview = previewQuery.isLoading;

  return (
    <div className="document-viewer-container">
      <DocumentHeader
        currentPage={currentPage}
        totalPages={totalPages}
        onPageChange={handlePageChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        selectedHighlightColor={selectedHighlightColor}
        onHighlightColorChange={setSelectedHighlightColor}
        onBack={() => router.back()}
        onToggleInfoPanel={() => setInfoPanelOpen(!infoPanelOpen)}
        infoPanelOpen={infoPanelOpen}
      />

      <div className="document-viewer-layout">
        {/* Document Viewer Area */}
        <div className="document-area">
          {loadingPreview ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                padding: '20px',
                height: '100%',
                overflowY: 'auto',
              }}
            >
              {/* Simulate 3 pages loading */}
              {[1, 2, 3].map((page) => (
                <div
                  key={page}
                  style={{
                    width: '100%',
                    maxWidth: '800px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  {/* Page header */}
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 flex-1" />
                  </div>

                  {/* Content lines */}
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-4/5" />

                  <div style={{ height: '16px' }} />

                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />

                  <div style={{ height: '16px' }} />

                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}

              {/* Loading text */}
              <div
                style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                  marginTop: '8px',
                }}
              >
                Loading document...
              </div>
            </div>
          ) : (
            <DocumentViewer
              highlightColor={selectedHighlightColor}
              documentUrl={documentUrl}
              initialAnnotations={reference?.annotations || []}
              setPendingHighlight={setPendingHighlight}
              onPageChange={setCurrentPage}
              onNumPagesChange={setTotalPages}
              externalCurrentPage={targetPage}
              externalScale={targetScale}
              scrollToAnnotationId={scrollToAnnotationId}
              onCreateAnnotation={async (annotation: Annotation) => {
                // Add annotation to local state first
                const currentAnnotations = reference?.annotations || [];
                updateReference(
                  referenceId,
                  {
                    annotations: [...currentAnnotations, annotation],
                  },
                  true
                );

                const clientRects =
                  annotation.locationInDocument.coordinatesList &&
                  annotation.locationInDocument.coordinatesList.length > 0
                    ? annotation.locationInDocument.coordinatesList
                    : annotation.locationInDocument.coordinates
                      ? [annotation.locationInDocument.coordinates]
                      : [];

                const positions = (
                  clientRects.length > 0 ? clientRects : [{ x: 0, y: 0, width: 0, height: 0 }]
                ).map(
                  (rect: { x: number; y: number; width: number; height: number } | undefined) => ({
                    bbox: rectToBbox(rect),
                    page_number: annotation.locationInDocument.page,
                  })
                );

                const payload = {
                  annotation_type: 'USER_ANNOTATE',
                  color: annotation.highlightColor || '#FFEB3B',
                  created_by: user?.user_id || 'user_1',
                  document_id: reference?.documentId || referenceId,
                  positions,
                  reason: '', // Empty initially, can be added later
                  text: annotation.textSelected || '',
                };

                try {
                  const response = await referenceManagerService.createAnnotation(payload as any);
                  if (response.success && response.data) {
                    const newAnnotation = response.data.annotation as any;

                    // Replace temporary annotation with server response
                    const serverCoordinatesList = (newAnnotation.positions || [])
                      .map((pos: any) => bboxToRect(pos?.bbox))
                      .filter(
                        (
                          rect: any
                        ): rect is { x: number; y: number; width: number; height: number } =>
                          rect !== null
                      );

                    const serverCoordinates = mergeRects(serverCoordinatesList) ||
                      annotation.locationInDocument.coordinates || {
                        x: 0,
                        y: 0,
                        width: 0,
                        height: 0,
                      };

                    const serverFirstPageNumber = newAnnotation.positions?.find(
                      (p: any) => typeof p?.page_number === 'number'
                    )?.page_number;
                    const mappedAnnotation: Annotation = {
                      id: newAnnotation.id,
                      type: 'manual_highlight',
                      textSelected: newAnnotation.text,
                      note: newAnnotation.reason || '',
                      highlightColor: newAnnotation.color,
                      locationInDocument: {
                        page: serverFirstPageNumber || annotation.locationInDocument.page,
                        coordinates: serverCoordinates,
                        coordinatesList:
                          serverCoordinatesList.length > 0
                            ? serverCoordinatesList
                            : annotation.locationInDocument.coordinatesList,
                        charStart: annotation.locationInDocument.charStart,
                        charEnd: annotation.locationInDocument.charEnd,
                      },
                      createdBy: newAnnotation.created_by,
                      createdAt: newAnnotation.created_at,
                    };

                    // Update reference with server-generated ID
                    const updatedAnnotations = currentAnnotations.filter(
                      (a) => a.id !== annotation.id
                    );
                    updatedAnnotations.push(mappedAnnotation);
                    updateReference(referenceId, { annotations: updatedAnnotations }, true);
                    invalidateAnnotationQueries(payload.document_id);

                    setAnnotationIdMap((prev) => ({
                      ...prev,
                      [annotation.id]: newAnnotation.id,
                    }));

                    const pendingReason = pendingAnnotationReasonsRef.current[annotation.id];
                    if (pendingReason && newAnnotation.id) {
                      try {
                        const updatePayload = {
                          annotation_id: newAnnotation.id,
                          reason: pendingReason,
                        };
                        const updateResponse = await referenceManagerService.updateAnnotation(
                          updatePayload as any
                        );

                        if (updateResponse.success) {
                          updateReference(
                            referenceId,
                            {
                              annotations: updatedAnnotations.map((a) =>
                                a.id === newAnnotation.id ? { ...a, note: pendingReason } : a
                              ),
                            },
                            true
                          );
                          invalidateAnnotationQueries(payload.document_id);
                        }
                      } catch (error) {
                        console.error('Error updating annotation reason:', error);
                      } finally {
                        delete pendingAnnotationReasonsRef.current[annotation.id];
                      }
                    }

                    const pendingComments = pendingAnnotationCommentsRef.current[annotation.id];
                    if (pendingComments && newAnnotation.id) {
                      try {
                        const updatePayload = {
                          annotation_id: newAnnotation.id,
                          comment: pendingComments,
                        };
                        const updateResponse = await referenceManagerService.updateAnnotation(
                          updatePayload as any
                        );

                        if (updateResponse.success) {
                          updateReference(
                            referenceId,
                            {
                              annotations: updatedAnnotations.map((a) =>
                                a.id === newAnnotation.id ? { ...a, comment: pendingComments } : a
                              ),
                            },
                            true
                          );
                          invalidateAnnotationQueries(payload.document_id);
                        }
                      } catch (error) {
                      } finally {
                        delete pendingAnnotationCommentsRef.current[annotation.id];
                      }
                    }
                  } else {
                    console.error('Failed to save annotation:', response);
                  }
                } catch (error) {
                  console.error('Error saving annotation immediately:', error);
                }
              }}
              onUpdateAnnotation={async (annotationId: string, updates: any) => {
                const currentAnnotations = reference?.annotations || [];
                const mappedId = annotationIdMap[annotationId];
                const effectiveId = mappedId || annotationId;
                const updatedAnnotations = currentAnnotations.map((a) =>
                  a.id === effectiveId || a.id === annotationId ? { ...a, ...updates } : a
                );
                updateReference(
                  referenceId,
                  {
                    annotations: updatedAnnotations,
                  },
                  true
                );

                const isTempId = isTempAnnotationId(annotationId);
                if (isTempId && !mappedId) {
                  if (updates.comment !== undefined) {
                    pendingAnnotationCommentsRef.current[annotationId] = updates.comment;
                  }
                  return;
                }

                const payload: any = {
                  annotation_id: effectiveId,
                };

                if (updates.highlightColor !== undefined) {
                  payload.color = updates.highlightColor;
                }
                if (updates.note !== undefined) {
                  payload.reason = updates.note;
                }
                if (updates.comment !== undefined) {
                  payload.comment = updates.comment;
                }

                // Call API to persist changes to database
                try {
                  const response = await referenceManagerService.updateAnnotation(payload);
                  if (response.success) {
                    // Invalidate queries to ensure fresh data
                    invalidateAnnotationQueries(reference?.documentId || referenceId);
                  } else {
                    console.error('[AnnotateFile] Failed to update annotation:', response);
                  }
                } catch (error) {
                  console.error('[AnnotateFile] Error updating annotation:', error);
                }
              }}
              onDeleteAnnotation={async (annotationId: string) => {
                try {
                  const response = await referenceManagerService.deleteAnnotation(annotationId);

                  if (response.success) {
                    const currentAnnotations = reference?.annotations || [];
                    const updatedAnnotations = currentAnnotations.filter(
                      (a) => a.id !== annotationId
                    );
                    updateReference(
                      referenceId,
                      {
                        annotations: updatedAnnotations,
                      },
                      true
                    );
                    invalidateAnnotationQueries(reference?.documentId || referenceId);
                  } else {
                    console.error('[AnotateFile] Failed to delete annotation:', response);
                    alert('Failed to delete annotation. Please try again.');
                  }
                } catch (error) {
                  console.error('[AnotateFile] Error deleting annotation:', error);
                  alert('Error deleting annotation. Please try again.');
                }
              }}
            />
          )}
        </div>

        <InfoPanel
          selectedReference={reference}
          isOpen={infoPanelOpen}
          isAnnotationView={true}
          showMobileScreen={showMobileScreen}
          onClose={() => setInfoPanelOpen(false)}
          defaultTab="notes"
          pendingHighlight={pendingHighlight}
          onSavePendingHighlight={handleSavePendingHighlight}
          onCancelPendingHighlight={() => setPendingHighlight(null)}
          onUpdateReference={updateReference}
          onDeleteNote={deleteNote}
          editNote={editNote}
          onAddNote={addIndependentNote}
          onNoteClick={handleNoteClick}
          onSaveAnnotation={async (annotationId, content) => {
            const annotation = reference?.annotations?.find((a) => a.id === annotationId);
            if (!annotation) return;

            const isTempId = isTempAnnotationId(annotationId);

            if (isTempId) {
              const currentAnnotations = reference?.annotations || [];
              const temp = currentAnnotations.find((a) => a.id === annotationId);
              if (!temp) return;

              const clientRects =
                temp.locationInDocument.coordinatesList &&
                temp.locationInDocument.coordinatesList.length > 0
                  ? temp.locationInDocument.coordinatesList
                  : temp.locationInDocument.coordinates
                    ? [temp.locationInDocument.coordinates]
                    : [];

              const positions = (
                clientRects.length > 0 ? clientRects : [{ x: 0, y: 0, width: 0, height: 0 }]
              ).map((rect) => ({
                bbox: rectToBbox(rect),
                page_number: temp.locationInDocument.page,
              }));

              const payload = {
                annotation_type: 'USER_ANNOTATE',
                color: temp.highlightColor || '#FFEB3B',
                created_by: user?.user_id || 'user_1',
                document_id: reference?.documentId || referenceId,
                positions,
                reason: content,
                text: temp.textSelected || '',
              };

              try {
                const response = await referenceManagerService.createAnnotation(payload as any);
                if (response.success && response.data) {
                  const newAnnotation = response.data.annotation as any;

                  const serverCoordinatesList = (newAnnotation.positions || [])
                    .map((pos: any) => bboxToRect(pos?.bbox))
                    .filter(
                      (
                        rect: any
                      ): rect is { x: number; y: number; width: number; height: number } =>
                        rect !== null
                    );

                  const serverCoordinates = mergeRects(serverCoordinatesList) ||
                    temp.locationInDocument.coordinates || { x: 0, y: 0, width: 0, height: 0 };

                  const serverFirstPageNumber = newAnnotation.positions?.find(
                    (p: any) => typeof p?.page_number === 'number'
                  )?.page_number;
                  const mappedAnnotation: Annotation = {
                    id: newAnnotation.id,
                    type: 'manual_note',
                    textSelected: newAnnotation.text,
                    note: newAnnotation.reason || '',
                    highlightColor: newAnnotation.color,
                    locationInDocument: {
                      page: serverFirstPageNumber || temp.locationInDocument.page,
                      coordinates: serverCoordinates,
                      coordinatesList:
                        serverCoordinatesList.length > 0
                          ? serverCoordinatesList
                          : temp.locationInDocument.coordinatesList,
                      charStart: temp.locationInDocument.charStart,
                      charEnd: temp.locationInDocument.charEnd,
                    },
                    createdBy: newAnnotation.created_by,
                    createdAt: newAnnotation.created_at,
                  };

                  const updatedAnnotations = currentAnnotations.filter((a) => a.id !== temp.id);
                  updatedAnnotations.push(mappedAnnotation);
                  updateReference(referenceId, { annotations: updatedAnnotations }, true);
                  invalidateAnnotationQueries(payload.document_id);
                  setPendingHighlight(null);
                  playSuccess();
                } else {
                  alert('Failed to save annotation. Please try again.');
                  playError();
                }
              } catch (error) {
                alert('Error saving annotation. Please try again.');
                playError();
              }
            } else {
              const payload = {
                annotation_id: annotationId,
                reason: content,
              };

              try {
                const response = await referenceManagerService.updateAnnotation(payload);
                if (response.success && response.data) {
                  const currentAnnotations = reference?.annotations || [];
                  const updatedAnnotations = currentAnnotations.map((a) =>
                    a.id === annotationId ? { ...a, note: content } : a
                  );
                  updateReference(referenceId, { annotations: updatedAnnotations }, true);
                  invalidateAnnotationQueries(reference?.documentId || referenceId);
                } else {
                  console.error('Failed to update annotation:', response);
                  alert('Failed to update annotation. Please try again.');
                }
              } catch (error) {
                console.error('Error updating annotation:', error);
                alert('Error updating annotation. Please try again.');
              }
            }
          }}
          onDeleteAnnotation={async (annotationId) => {
            try {
              const response = await referenceManagerService.deleteAnnotation(annotationId);

              if (response.success) {
                const currentAnnotations = reference?.annotations || [];
                const updatedAnnotations = currentAnnotations.filter((a) => a.id !== annotationId);
                updateReference(
                  referenceId,
                  {
                    annotations: updatedAnnotations,
                  },
                  true
                );
                invalidateAnnotationQueries(reference?.documentId || referenceId);
              } else {
                console.error('[InfoPanel] Failed to delete annotation:', response);
                alert('Failed to delete annotation. Please try again.');
              }
            } catch (error) {
              console.error('[InfoPanel] Error deleting annotation:', error);
              alert('Error deleting annotation. Please try again.');
            }
          }}
          showAutoAnnotateToggle
          onAutoAnnotateQuery={(query) => handleAutoAnnotate(query, false)}
          historyOpen={historyDrawerOpen}
          onHistoryOpenChange={setHistoryDrawerOpen}
          autoAnnotateProgress={autoAnnotateProgress}
        />

        <UnifiedUploadDialog
          open={showUploadDialog}
          onClose={() => setShowUploadDialog(false)}
          uploadMode={uploadMode}
          onAutoAnnotate={handleAutoAnnotate}
          progress={autoAnnotateProgress}
          status={autoAnnotateStatus}
        />
      </div>
    </div>
  );
}
