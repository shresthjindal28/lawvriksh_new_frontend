import { useState, useCallback, useRef, useMemo } from 'react';
import UploadService, { FileUploadProgress } from '@/lib/api/uploadService';
import { DocumentStatusData } from '@/lib/validators/document/document.schemas';
import { useNotificationSound } from '@/hooks/common/useNotificationSound';
import { primeNotificationSound } from '@/lib/utils/notificationSound';
import { useSettings } from '@/lib/contexts/SettingsContext';

interface UseDocumentUploadOptions {
  projectId: string;
  onAllComplete?: (results: UploadResult[]) => void;
  onFileComplete?: (fileId: string, documentData: any) => void;
  onError?: (error: string) => void;
  concurrencyLimit?: number;
}

interface UploadResult {
  file: File;
  documentId?: string;
  success: boolean;
  error?: string;
}

interface UploadState {
  isUploading: boolean;
  progress: Record<string, FileUploadProgress>;
  completedCount: number;
  failedCount: number;
  totalCount: number;
  errors: Record<string, string>;
}

export function useDocumentUpload(options: UseDocumentUploadOptions) {
  const { projectId, onAllComplete, onFileComplete, onError, concurrencyLimit = 3 } = options;

  const [uploadState, setUploadState] = useState<UploadState>({
    isUploading: false,
    progress: {},
    completedCount: 0,
    failedCount: 0,
    totalCount: 0,
    errors: {},
  });

  const uploadServiceRef = useRef<UploadService | null>(null);
  const uploadCountRef = useRef(0);
  const { playSuccess, playError } = useNotificationSound();
  const { settings } = useSettings();

  // Initialize upload service
  const uploadService = useMemo(() => {
    if (uploadServiceRef.current === null) {
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL!;
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL_GRAMMER_SPELL!;
      uploadServiceRef.current = new UploadService({ apiBaseUrl, wsUrl });
    }
    return uploadServiceRef.current;
  }, []);

  //Start uploading files
  const uploadFiles = useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      uploadCountRef.current = files.length;
      if (settings.notifications.soundEnabled) {
        void primeNotificationSound(settings.notifications.soundChoice);
      }

      // Reset state
      setUploadState({
        isUploading: true,
        progress: {},
        completedCount: 0,
        failedCount: 0,
        totalCount: files.length,
        errors: {},
      });

      try {
        await uploadService.uploadFiles(
          projectId,
          files,
          {
            onFileProgress: (fileId, progress) => {
              setUploadState((prev) => ({
                ...prev,
                progress: {
                  ...prev.progress,
                  [fileId]: progress,
                },
              }));
            },
            onFileComplete: (fileId, documentData) => {
              setUploadState((prev) => ({
                ...prev,
                completedCount: prev.completedCount + 1,
              }));
              if (uploadCountRef.current <= 1) {
                playSuccess();
              }
              onFileComplete?.(fileId, documentData);
            },
            onFileError: (fileId, error) => {
              playError();
              setUploadState((prev) => ({
                ...prev,
                failedCount: prev.failedCount + 1,
                errors: {
                  ...prev.errors,
                  [fileId]: error,
                },
              }));
              onError?.(error);
            },
            onAllComplete: (results) => {
              setUploadState((prev) => ({
                ...prev,
                isUploading: false,
              }));
              if (uploadCountRef.current > 1) {
                playSuccess();
              }
              onAllComplete?.(results);
            },
          },
          concurrencyLimit
        );
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Upload failed';
        setUploadState((prev) => ({
          ...prev,
          isUploading: false,
        }));
        onError?.(errorMessage);
      }
    },
    [
      projectId,
      uploadService,
      onFileComplete,
      onError,
      onAllComplete,
      concurrencyLimit,
      playSuccess,
      playError,
      settings.notifications.soundEnabled,
      settings.notifications.soundChoice,
    ]
  );

  //Cancel a specific document upload
  const cancelUpload = useCallback(
    (documentId: string) => {
      uploadService.cancelUpload(documentId);
      setUploadState((prev) => {
        const newProgress = { ...prev.progress };
        delete newProgress[documentId];
        return {
          ...prev,
          progress: newProgress,
        };
      });
    },
    [uploadService]
  );

  //Cancel all ongoing uploads
  const cancelAllUploads = useCallback(() => {
    uploadService.cancelAllUploads();
    setUploadState({
      isUploading: false,
      progress: {},
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
      errors: {},
    });
  }, [uploadService]);

  //RESET Upload State
  const resetUploadState = useCallback(() => {
    setUploadState({
      isUploading: false,
      progress: {},
      completedCount: 0,
      failedCount: 0,
      totalCount: 0,
      errors: {},
    });
  }, []);

  //GET Overall Upload Progress (0-100)
  const overallProgress = useMemo(() => {
    if (uploadState.totalCount === 0) return 0;

    const progressValues = Object.values(uploadState.progress);
    if (progressValues.length === 0) return 0;

    const totalProgress = progressValues.reduce((sum, p) => sum + p.progress, 0);
    return Math.round(totalProgress / uploadState.totalCount);
  }, [uploadState.progress, uploadState.totalCount]);

  //GET Upload Statistics
  const uploadStats = useMemo(
    () => ({
      total: uploadState.totalCount,
      completed: uploadState.completedCount,
      failed: uploadState.failedCount,
      inProgress: uploadState.totalCount - uploadState.completedCount - uploadState.failedCount,
      successRate:
        uploadState.totalCount > 0
          ? Math.round((uploadState.completedCount / uploadState.totalCount) * 100)
          : 0,
    }),
    [uploadState.completedCount, uploadState.failedCount, uploadState.totalCount]
  );

  //GET File by status
  const filesByStatus = useMemo(() => {
    const byStatus: Record<string, FileUploadProgress[]> = {
      initializing: [],
      uploading: [],
      processing: [],
      completed: [],
      failed: [],
    };

    Object.values(uploadState.progress).forEach((progress) => {
      byStatus[progress.status].push(progress);
    });

    return byStatus;
  }, [uploadState.progress]);

  return {
    // State
    isUploading: uploadState.isUploading,
    progress: uploadState.progress,
    errors: uploadState.errors,
    overallProgress,
    uploadStats,
    filesByStatus,

    // Actions
    uploadFiles,
    cancelUpload,
    cancelAllUploads,
    resetUploadState,
  };
}
