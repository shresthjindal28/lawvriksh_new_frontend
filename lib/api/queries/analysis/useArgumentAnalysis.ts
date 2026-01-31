'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { analysisService } from '@/lib/api/analysisService';
import CopilotService from '@/lib/api/copilotService';
import { analysisKeys, generateContentHash } from './analysisQueryKeys';
import type { ArgumentLogic } from '@/types/copilot';

// ========== RESPONSE TYPES ==========

export interface ArgumentAnalysisResult {
  argumentLogics: ArgumentLogic[];
  score: number;
}

interface UseArgumentAnalysisOptions {
  projectId: string;
  onSuccess?: (data: ArgumentAnalysisResult) => void;
  onError?: (error: Error) => void;
}

/**
 * TanStack Query hook for Argument/Logic Analysis
 *
 * Features:
 * - Manual trigger via `analyze()` mutation
 * - Automatic abort on unmount or re-trigger
 * - Request deduplication via query keys
 */
export function useArgumentAnalysis({ projectId, onSuccess, onError }: UseArgumentAnalysisOptions) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentContentHashRef = useRef<string>('');

  // Mutation for triggering analysis
  const mutation = useMutation({
    mutationKey: ['analysis', 'argument', 'mutation', projectId],
    mutationFn: async ({
      content,
    }: {
      content: string;
      signal?: AbortSignal;
    }): Promise<ArgumentAnalysisResult> => {
      const contentHash = generateContentHash(content);
      currentContentHashRef.current = contentHash;

      // Check cache first
      const cached = queryClient.getQueryData<ArgumentAnalysisResult>(
        analysisKeys.argument(projectId, contentHash)
      );
      if (cached) {
        return cached;
      }

      // Prepare and send request
      const request = analysisService.prepareArgumentLogicRequest(content, projectId);
      const response = await analysisService.checkArgumentLogic(request);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to analyze arguments');
      }

      // Process response using existing CopilotService logic
      const { argumentLogic, score } = await CopilotService.processArgumentLogic(response.data);

      const result: ArgumentAnalysisResult = {
        argumentLogics: argumentLogic ? [argumentLogic] : [],
        score: score || 100,
      };

      // Cache the result
      queryClient.setQueryData(analysisKeys.argument(projectId, contentHash), result);

      return result;
    },
    onSuccess: (data) => {
      onSuccess?.(data);
    },
    onError: (error: Error) => {
      onError?.(error);
    },
  });

  // Analyze function with abort support
  const analyze = useCallback(
    async (content: string) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      try {
        return await mutation.mutateAsync({
          content,
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          return null;
        }
        throw error;
      }
    },
    [mutation]
  );

  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const clear = useCallback(() => {
    queryClient.removeQueries({
      queryKey: analysisKeys.argument(projectId, currentContentHashRef.current),
    });
    mutation.reset();
    currentContentHashRef.current = '';
  }, [queryClient, projectId, mutation]);

  return {
    // Data
    data: mutation.data,
    argumentLogics: mutation.data?.argumentLogics || [],
    score: mutation.data?.score || 0,

    // Status
    isLoading: mutation.isPending,
    isError: mutation.isError,
    isSuccess: mutation.isSuccess,
    error: mutation.error,

    // Actions
    analyze,
    abort,
    clear,
    reset: mutation.reset,
  };
}
