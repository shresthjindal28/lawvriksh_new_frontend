'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { analysisService } from '@/lib/api/analysisService';
import { analysisKeys, generateContentHash } from './analysisQueryKeys';
import type { PlagiarismSource } from '@/types/analysis-sidebar';

// ========== RESPONSE TYPES ==========

export interface PlagiarismAnalysisResult {
  score: number;
  sources: PlagiarismSource[];
  sourceCounts: number;
  totalWords: number;
  textWordCounts: number;
}

interface UsePlagiarismAnalysisOptions {
  projectId: string;
  onSuccess?: (data: PlagiarismAnalysisResult) => void;
  onError?: (error: Error) => void;
}

/**
 * TanStack Query hook for Plagiarism Analysis
 *
 * Features:
 * - Manual trigger via `analyze()` mutation
 * - Automatic abort on unmount or re-trigger
 * - Request deduplication via query keys
 */
export function usePlagiarismAnalysis({
  projectId,
  onSuccess,
  onError,
}: UsePlagiarismAnalysisOptions) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentContentHashRef = useRef<string>('');

  // Mutation for triggering analysis
  const mutation = useMutation({
    mutationKey: ['analysis', 'plagiarism', 'mutation', projectId],
    mutationFn: async ({
      content,
    }: {
      content: string;
      signal?: AbortSignal;
    }): Promise<PlagiarismAnalysisResult> => {
      const contentHash = generateContentHash(content);
      currentContentHashRef.current = contentHash;

      // Check cache first
      const cached = queryClient.getQueryData<PlagiarismAnalysisResult>(
        analysisKeys.plagiarism(projectId, contentHash)
      );
      if (cached) {
        return cached;
      }

      // Prepare and send request
      const request = analysisService.preparePlagiarismCheckRequest(content);
      const response = await analysisService.checkPlagiarism(request);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to check plagiarism');
      }

      const resData = response.data as any;
      const result: PlagiarismAnalysisResult = {
        score: resData?.result?.score ?? 0,
        sources: Array.isArray(resData?.sources) ? resData.sources : [],
        sourceCounts: resData?.result?.source_counts ?? 0,
        totalWords: resData?.result?.total_plagiarism_words ?? 0,
        textWordCounts: resData?.result?.text_word_counts ?? 0,
      };

      // Cache the result
      queryClient.setQueryData(analysisKeys.plagiarism(projectId, contentHash), result);

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
      queryKey: analysisKeys.plagiarism(projectId, currentContentHashRef.current),
    });
    mutation.reset();
    currentContentHashRef.current = '';
  }, [queryClient, projectId, mutation]);

  return {
    // Data
    data: mutation.data,
    score: mutation.data?.score || 0,
    sources: mutation.data?.sources || [],
    sourceCounts: mutation.data?.sourceCounts || 0,
    totalWords: mutation.data?.totalWords || 0,
    textWordCounts: mutation.data?.textWordCounts || 0,

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
