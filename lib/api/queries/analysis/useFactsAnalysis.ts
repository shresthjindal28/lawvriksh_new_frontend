'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useCallback, useRef } from 'react';
import { analysisService } from '@/lib/api/analysisService';
import CopilotService from '@/lib/api/copilotService';
import { analysisKeys, generateContentHash } from './analysisQueryKeys';
import type { FactChecker, FactCheckSummary } from '@/types/copilot';

// ========== RESPONSE TYPES ==========

export interface FactsAnalysisResult {
  facts: FactChecker[];
  summary: FactCheckSummary;
  score: number;
  correctedContent: string;
  correctionsApplied: number;
}

interface UseFactsAnalysisOptions {
  projectId: string;
  onSuccess?: (data: FactsAnalysisResult) => void;
  onError?: (error: Error) => void;
}

/**
 * TanStack Query hook for Facts Analysis
 *
 * Features:
 * - Manual trigger via `analyze()` mutation
 * - Automatic abort on unmount or re-trigger
 * - Request deduplication via query keys
 * - Optimistic UI support
 */
export function useFactsAnalysis({ projectId, onSuccess, onError }: UseFactsAnalysisOptions) {
  const queryClient = useQueryClient();
  const abortControllerRef = useRef<AbortController | null>(null);
  const currentContentHashRef = useRef<string>('');

  // Mutation for triggering analysis
  const mutation = useMutation({
    mutationKey: ['analysis', 'facts', 'mutation', projectId],
    mutationFn: async ({
      content,
    }: {
      content: string;
      signal?: AbortSignal;
    }): Promise<FactsAnalysisResult> => {
      const contentHash = generateContentHash(content);
      currentContentHashRef.current = contentHash;

      // Check cache first
      const cached = queryClient.getQueryData<FactsAnalysisResult>(
        analysisKeys.facts(projectId, contentHash)
      );
      if (cached) {
        return cached;
      }

      // Prepare and send request
      const request = analysisService.prepareFactCheckRequest(content);
      const response = await analysisService.checkFacts(request);

      if (!response.success || !response.data) {
        throw new Error(response.message || 'Failed to analyze facts');
      }

      // Process response using existing CopilotService logic
      const processed = CopilotService.processFactCheck(response.data);

      // Handle null processed result
      if (!processed) {
        return {
          facts: [],
          summary: {
            totalClaims: 0,
            verifiedClaims: 0,
            unverifiableClaims: 0,
            accuracyScore: 100,
            confidenceScore: 100,
            recommendations: [],
          },
          score: 100,
          correctedContent: '',
          correctionsApplied: 0,
        };
      }

      const result: FactsAnalysisResult = {
        facts: processed.factCheckers || [],
        summary: processed.summary || {
          totalClaims: 0,
          verifiedClaims: 0,
          unverifiableClaims: 0,
          accuracyScore: 100,
          confidenceScore: 100,
          recommendations: [],
        },
        score: processed.score || 100,
        correctedContent: processed.correctedContent || '',
        correctionsApplied: processed.correctionsApplied || 0,
      };

      // Cache the result
      queryClient.setQueryData(analysisKeys.facts(projectId, contentHash), result);

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
      // Abort any in-flight request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      // Create new abort controller
      abortControllerRef.current = new AbortController();

      try {
        return await mutation.mutateAsync({
          content,
          signal: abortControllerRef.current.signal,
        });
      } catch (error) {
        if ((error as Error).name === 'AbortError') {
          // Silently handle abort
          return null;
        }
        throw error;
      }
    },
    [mutation]
  );

  // Abort current request
  const abort = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  // Clear cached results
  const clear = useCallback(() => {
    queryClient.removeQueries({
      queryKey: analysisKeys.facts(projectId, currentContentHashRef.current),
    });
    mutation.reset();
    currentContentHashRef.current = '';
  }, [queryClient, projectId, mutation]);

  return {
    // Data
    data: mutation.data,
    facts: mutation.data?.facts || [],
    score: mutation.data?.score || 0,
    summary: mutation.data?.summary,
    correctedContent: mutation.data?.correctedContent || '',
    correctionsApplied: mutation.data?.correctionsApplied || 0,

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
