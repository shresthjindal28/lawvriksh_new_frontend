/**
 * Analysis Query Keys
 *
 * Structured query keys for TanStack Query with:
 * - Type safety via const assertions
 * - Content-hash based cache invalidation
 * - Consistent key structure for deduplication
 */

export const analysisKeys = {
  // Base key for all analysis queries
  all: ['analysis'] as const,

  // Individual analysis type keys with document context
  facts: (projectId: string, contentHash: string) =>
    [...analysisKeys.all, 'facts', projectId, contentHash] as const,

  compliance: (projectId: string, contentHash: string) =>
    [...analysisKeys.all, 'compliance', projectId, contentHash] as const,

  argument: (projectId: string, contentHash: string) =>
    [...analysisKeys.all, 'argument', projectId, contentHash] as const,

  plagiarism: (projectId: string, contentHash: string) =>
    [...analysisKeys.all, 'plagiarism', projectId, contentHash] as const,

  aiDetection: (projectId: string, contentHash: string) =>
    [...analysisKeys.all, 'ai-detection', projectId, contentHash] as const,

  // Project-level keys for invalidation
  byProject: (projectId: string) => [...analysisKeys.all, 'project', projectId] as const,
} as const;

/**
 * Generate a simple hash from document content for cache keying
 * Uses a fast, non-cryptographic hash suitable for cache invalidation
 */
export function generateContentHash(content: string): string {
  if (!content || content.length === 0) return 'empty';

  let hash = 0;
  const len = Math.min(content.length, 5000); // Cap for performance

  for (let i = 0; i < len; i++) {
    const char = content.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Convert to 32bit integer
  }

  // Include content length for better differentiation
  return `${hash.toString(36)}_${content.length}`;
}

/**
 * Type definitions for query key inference
 */
export type AnalysisQueryKey = ReturnType<
  | typeof analysisKeys.facts
  | typeof analysisKeys.compliance
  | typeof analysisKeys.argument
  | typeof analysisKeys.plagiarism
  | typeof analysisKeys.aiDetection
>;
