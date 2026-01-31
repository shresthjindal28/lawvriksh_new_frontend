/**
 * Analysis Query Hooks - Barrel Export
 *
 * Centralizes all analysis-related TanStack Query hooks
 */

// Query Keys
export { analysisKeys, generateContentHash } from './analysisQueryKeys';
export type { AnalysisQueryKey } from './analysisQueryKeys';

// Analysis Hooks
export { useFactsAnalysis } from './useFactsAnalysis';
export type { FactsAnalysisResult } from './useFactsAnalysis';

export { useComplianceAnalysis } from './useComplianceAnalysis';
export type { ComplianceAnalysisResult } from './useComplianceAnalysis';

export { useArgumentAnalysis } from './useArgumentAnalysis';
export type { ArgumentAnalysisResult } from './useArgumentAnalysis';

export { usePlagiarismAnalysis } from './usePlagiarismAnalysis';
export type { PlagiarismAnalysisResult } from './usePlagiarismAnalysis';

export { useAiDetectionAnalysis } from './useAiDetectionAnalysis';
export type { AiDetectionAnalysisResult } from './useAiDetectionAnalysis';
