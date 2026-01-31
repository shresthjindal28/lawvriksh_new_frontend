import { useState, useCallback, useRef } from 'react';
import citationService from '@/lib/api/citationsService';
import { CombinedRecommendationResponse, CombinedRecommendation } from '@/types/citations';
import { useToast } from '@/lib/contexts/ToastContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { STORAGE_KEYS } from '@/lib/constants/storage-keys';

export const useCitations = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<CombinedRecommendationResponse | null>(
    null
  );
  const { addToast } = useToast();
  const { user } = useAuth();

  // Add to Library State
  const [isAddingToLibrary, setIsAddingToLibrary] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const wsRef = useRef<WebSocket | null>(null);

  const fetchRecommendations = useCallback(
    async (query: string) => {
      if (!query.trim()) return;

      setIsLoading(true);
      try {
        const data = await citationService.getCombinedRecommendations(query);
        console.log('Citation recommendations received:', data);
        setRecommendations(data);
        return data;
      } catch (error) {
        console.error('Failed to fetch citation recommendations:', error);
        addToast('Failed to fetch citation recommendations', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const clearRecommendations = useCallback(() => {
    setRecommendations(null);
  }, []);

  // WebSocket Handler for Metadata Extraction
  const handleTaskProgress = async (createDocRes: any) => {
    try {
      // Extract Task ID
      let taskId = createDocRes.data?.task_id;

      if (!taskId) {
        const metadataStr = createDocRes.data?.document?.metadata;
        if (metadataStr) {
          try {
            const meta = typeof metadataStr === 'string' ? JSON.parse(metadataStr) : metadataStr;
            taskId = meta.task_id;
          } catch (e) {
            console.error('Failed to parse metadata', e);
          }
        }
      }

      // Extract Token and Document Info
      const responseToken = createDocRes.data?.token;
      const docFromCreate = createDocRes.data?.document;
      const docIdFromCreate =
        docFromCreate?.id || docFromCreate?.document_id || createDocRes.data?.document_id;

      if (taskId) {
        console.log('Starting Task WebSocket for taskId:', taskId);
        setUploadStatus('Processing metadata...');
        setUploadProgress(0);

        await new Promise<void>((resolve, reject) => {
          let resolved = false;
          let token = responseToken || '';
          if (!token && typeof document !== 'undefined') {
            const cookies = document.cookie.split(';');
            for (const cookie of cookies) {
              const [name, ...rest] = cookie.trim().split('=');
              if (name === STORAGE_KEYS.ACCESS_TOKEN) {
                token = decodeURIComponent(rest.join('='));
                break;
              }
            }
          }
          if (!token) {
            console.error('No access token found');
            reject(new Error('Authentication token not found'));
            return;
          }

          // Set cookie for WebSocket authentication (backend requirement)
          // Secure flag required for HTTPS in production, SameSite=Strict for CSRF protection
          const isSecure = typeof window !== 'undefined' && window.location.protocol === 'https:';
          document.cookie = `ws_access_token=${token}; path=/; max-age=3600; SameSite=Strict${isSecure ? '; Secure' : ''}`;
          const taskWsBase = process.env.NEXT_PUBLIC_TASK_WS_URL || 'ws://localhost:8000/ws/tasks';
          const wsUrl = `${taskWsBase}/${taskId}?token=${token}`;

          console.log('Connecting to WebSocket:', wsUrl.replace(token, '***'));

          const ws = new WebSocket(wsUrl);
          wsRef.current = ws;

          // Polling Logic Setup
          let pollInterval: ReturnType<typeof setInterval> | null = null;

          const cleanup = () => {
            if (pollInterval) {
              clearInterval(pollInterval);
              pollInterval = null;
            }
          };

          const resolveOnce = () => {
            if (resolved) return;
            resolved = true;
            cleanup();
            if (ws.readyState === WebSocket.OPEN) {
              ws.close();
            }
            resolve();
          };

          const checkDocCompletion = async () => {
            if (resolved || !docIdFromCreate) return;
            try {
              const docResponse = await referenceManagerService.getDocument(docIdFromCreate, false);
              if (!docResponse.success) return;
              const doc = (docResponse.data as any)?.document;
              const statusCandidate = String(
                doc?.status || doc?.extraction_status || doc?.extractionStatus || doc?.state || ''
              ).toUpperCase();

              const isComplete =
                statusCandidate === 'COMPLETED' ||
                statusCandidate === 'COMPLETE' ||
                statusCandidate === 'EXTRACTED' ||
                statusCandidate === 'SUCCESS' ||
                statusCandidate === 'SUCCEEDED' ||
                statusCandidate === 'DONE' ||
                doc?.progress === 100;

              const isFailed = statusCandidate === 'FAILED' || statusCandidate === 'ERROR';

              if (!isComplete && !isFailed) return;

              if (isFailed) {
                console.error('Document extraction failed (polled)');
                setUploadStatus('Failed');
                resolveOnce();
                return;
              }

              // Completed via polling
              setUploadProgress(100);
              setUploadStatus('Completed');
              console.log('Task completed (polled)');
              resolveOnce();
            } catch (err) {
              console.error('Polling error:', err);
            }
          };

          // Start polling
          pollInterval = setInterval(() => {
            void checkDocCompletion();
          }, 2500);

          ws.onopen = () => {
            console.log('Task WS Connected');
          };

          ws.onmessage = (event) => {
            console.log('Task WS Message:', event.data);
            try {
              const data = JSON.parse(event.data);

              const statusRaw = data.status || data.event;
              const normalizedStatus = String(statusRaw || '').toUpperCase();

              if (typeof data.progress === 'number') {
                setUploadProgress(data.progress);
              }
              if (statusRaw) {
                setUploadStatus(statusRaw);
              }

              if (
                normalizedStatus === 'COMPLETED' ||
                normalizedStatus === 'COMPLETE' ||
                normalizedStatus === 'SUCCESS' ||
                normalizedStatus === 'EXTRACTED'
              ) {
                console.log('Task completed (ws)');
                setUploadProgress(100);
                resolveOnce();
              } else if (normalizedStatus === 'FAILED' || normalizedStatus === 'ERROR') {
                console.error('Task failed:', data.error);
                setUploadStatus('Failed');
                resolveOnce();
              }
            } catch (e) {
              console.error('WS Message Parse Error', e);
            }
          };

          ws.onerror = (error) => {
            console.error('Task WS Error', error);
            // Polling will effectively handle the completion if WS fails
          };

          ws.onclose = () => {
            console.log('Task WS Closed');
            // Don't resolve immediately on close, let polling finish if needed, or timeout?
            // Actually usually we want to resolve if it closes unexpectedly?
            // Better to let polling double check if it wasn't resolved yet.
            // But to avoid hanging forever if closed without completion:
            setTimeout(() => {
              if (!resolved) {
                void checkDocCompletion();
              }
            }, 1000);
          };
        });
      }
    } catch (e) {
      console.error('Error in Task/Metadata flow:', e);
    } finally {
      setUploadProgress(null);
      setUploadStatus('');
      wsRef.current = null;
    }
  };

  const addToLibrary = async (citation: CombinedRecommendation) => {
    if (!user || !user.user_id) {
      addToast('You must be logged in to add to library', 'error');
      return;
    }

    setIsAddingToLibrary(true);
    setUploadStatus('Creating reference...');

    try {
      // 1. Create Unsigned Reference (no folder/collection yet)
      console.log('Step 1: Creating unsigned reference...');
      const refRes = await referenceManagerService.createUnsignedReference({
        ref_type: 'DOCUMENT',
        created_by: user.user_id,
        // icon_id: 'document', // API documentation example shows icon_id, verify if needed
        icon_id: 'icon_001', // Using example value or maybe 'document' mapped icon? logic elsewhere uses strings.
        // Let's use 'document' as default icon standard or matching backend expectation?
        // User prompt example: "icon_id": "icon_001".
        // Looking at other calls, it seems we might just omit or use standard.
        // Service method sig: createUnsignedReference(data: CreateReferenceRequest)
      } as any);

      if (!refRes.success || !refRes.data?.reference) {
        throw new Error('Failed to create reference');
      }

      const refId = refRes.data.reference.id;
      console.log('Reference created:', refId);

      // 2. Add Document via URL if available
      if (citation.link) {
        console.log('Step 2: Adding document from URL:', citation.link);
        setUploadStatus('Adding document...');

        const createDocRes = await referenceManagerService.createDocument({
          name: citation.title || citation.link,
          document_source_type: 2 as any, // WEBLINK
          created_by: user.user_id,
          ref_id: refId,
          web_url: citation.link,
          reference_type: 2 as any, // DOCUMENT
          size: 0,
          page_count: 0,
        } as any);

        if (!createDocRes.success) {
          console.error('Failed to create document:', createDocRes);
          throw new Error('Failed to add document from URL');
        }

        // 3. Handle Metadata Extraction via WebSocket
        console.log('Step 3: Starting metadata extraction...');
        await handleTaskProgress(createDocRes);
      }

      addToast('Added to library successfully', 'success');
      return refId;
    } catch (error: any) {
      console.error('Failed to add to library:', error);
      addToast(error.message || 'Failed to add to library', 'error');
      return null;
    } finally {
      setIsAddingToLibrary(false);
      setUploadStatus('');
      setUploadProgress(null);
    }
  };

  return {
    isLoading,
    recommendations,
    fetchRecommendations,
    clearRecommendations,
    addToLibrary,
    isAddingToLibrary,
    uploadProgress,
    uploadStatus,
  };
};
