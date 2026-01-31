import { useCallback, useState, useRef, useEffect } from 'react';
import { OutputData } from '@editorjs/editorjs';
import { EditorStats } from '@/types/editor';
import { useToast } from '@/lib/contexts/ToastContext';
import { enrichCopilotResponseWithBlockIds } from '@/lib/utils/blockFinder';
import CopilotService from '@/lib/api/copilotService';
import { CopilotResponse } from '@/types/copilot';
import { normalizeCopilotData } from '@/lib/utils/normalizeCopilotResponse';
import { useSettings } from '@/lib/contexts/SettingsContext';

const ANALYSIS_DELAY = 3000;

export default function useAiCopilot({ projectId }: { projectId: string }) {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<CopilotResponse | null>(null);
  const [editorStats, setEditorStats] = useState<EditorStats>({
    wordCount: 0,
    charCount: 0,
    readingTime: 0,
  });

  const latestEditorDataRef = useRef<OutputData | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isAnalyzingRef = useRef(false);
  const { addToast } = useToast();
  const { settings } = useSettings();

  const performAnalysis = useCallback(
    async (editorData: OutputData) => {
      try {
        if (isAnalyzingRef.current) {
          return;
        }

        isAnalyzingRef.current = true;
        setLoading(true);
        setError('');
        latestEditorDataRef.current = editorData;

        const { complianceChecker, citationRecommendations, argumentLogicChecker } = settings.ai;

        const contentText = CopilotService.extractTextFromEditorData(editorData);

        // Build promises dynamically based on settings
        const promises: {
          fact?: Promise<any>;
          compliance?: Promise<any>;
          argument?: Promise<any>;
        } = {};

        if (citationRecommendations) {
          promises.fact = CopilotService.checkFacts({
            blog_content: contentText,
            topic: 'Legal Document Analysis',
            format_style: 1,
            validate_citations: true,
            include_bibliography: true,
            previous_word_count: 0,
            enable_ethics_check: true,
            enable_compliance_check: true,
          });
        }

        if (complianceChecker) {
          promises.compliance = CopilotService.checkCompliance({
            text: contentText,
            request_id: `comp_${projectId}_${Date.now()}`,
            metadata: { document_type: 'legal_document' },
            check_types: ['factual_accuracy', 'legal_compliance', 'professional_language'],
            detailed_analysis: true,
          });
        }

        if (argumentLogicChecker) {
          promises.argument = CopilotService.checkArgumentLogic({
            text: contentText,
            fast_mode: false,
            include_analysis: true,
            contradiction_threshold: 0.7,
          });
        }

        // Run only the enabled promises
        const results = await Promise.allSettled(Object.values(promises));

        // Build CopilotResponse manually
        const finalData: CopilotResponse = {
          projectId,
          fact: null,
          compliance: null,
          argumentLogic: null,
          Analysispercentage: 0,
        };

        const errors: string[] = [];
        let index = 0;

        // Fact API → Fact Data
        if (promises.fact) {
          const r = results[index++];
          if (r.status === 'fulfilled') {
            try {
              const factData = CopilotService.extractFactData(r.value);
              if (factData) {
                // Transform to FactChecker[]
                const factCheckers = CopilotService.transformFactCheckToFactChecker(factData);
                if (factCheckers && factCheckers.length > 0) {
                  finalData.fact = factCheckers;
                }
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Unknown error';
              errors.push(`Fact check processing failed: ${errMsg}`);
              console.error('Fact API processing error:', err);
            }
          } else {
            errors.push(`Fact check API failed: ${r.reason}`);
          }
        }

        // Compliance API → Additional Compliance Data
        if (promises.compliance) {
          const r = results[index++];
          if (r.status === 'fulfilled') {
            try {
              const complianceViolations = CopilotService.transformComplianceViolations(r.value);
              if (complianceViolations && complianceViolations.length > 0) {
                // Merge with existing compliance or replace
                if (finalData.compliance) {
                  finalData.compliance = Array.isArray(finalData.compliance)
                    ? [...finalData.compliance, ...complianceViolations]
                    : [finalData.compliance, ...complianceViolations];
                } else {
                  finalData.compliance = complianceViolations;
                }
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Unknown error';
              errors.push(`Compliance check processing failed: ${errMsg}`);
              console.error('Compliance API processing error:', err);
            }
          } else {
            errors.push(`Compliance check API failed: ${r.reason}`);
          }
        }

        // Argument Logic (unchanged)
        if (promises.argument) {
          const r = results[index++];
          if (r.status === 'fulfilled') {
            try {
              if (r.value && Array.isArray(r.value) && r.value.length > 0) {
                finalData.argumentLogic = r.value;
              }
            } catch (err) {
              const errMsg = err instanceof Error ? err.message : 'Unknown error';
              errors.push(`Argument logic processing failed: ${errMsg}`);
              console.error('Argument Logic processing error:', err);
            }
          } else {
            errors.push(`Argument logic API failed: ${r.reason}`);
          }
        }

        const totalEnabled = [
          citationRecommendations,
          complianceChecker,
          argumentLogicChecker,
        ].filter(Boolean).length;

        const completed = [finalData.fact, finalData.compliance, finalData.argumentLogic].filter(
          Boolean
        ).length;

        // At least one check must succeed
        if (completed === 0) {
          throw new Error(`All analysis checks failed: ${errors.join('; ')}`);
        }

        finalData.Analysispercentage = Math.round((completed / totalEnabled) * 100);

        // Enrich with block IDs (with safety)
        let enriched = finalData;
        try {
          enriched = enrichCopilotResponseWithBlockIds(finalData, editorData);
        } catch (enrichErr) {
          console.warn('Failed to enrich with block IDs, using original data:', enrichErr);
        }

        // Normalize the data (with safety)
        let normalized;
        try {
          normalized = normalizeCopilotData(enriched);
        } catch (normalizeErr) {
          console.warn('Failed to normalize data, using enriched data:', normalizeErr);
          normalized = {
            facts: enriched.fact,
            compliances: enriched.compliance,
            argumentSets: enriched.argumentLogic,
            percentage: enriched.Analysispercentage,
          };
        }

        // Final merged response
        const finalMerged: CopilotResponse = {
          ...enriched,
          fact: normalized.facts || enriched.fact,
          compliance: normalized.compliances || enriched.compliance,
          argumentLogic: normalized.argumentSets || enriched.argumentLogic,
          Analysispercentage: normalized.percentage || enriched.Analysispercentage,
          factSummary: enriched.factSummary,
        };

        setData(finalMerged);

        // Show appropriate toast message
        if (errors.length > 0) {
          addToast?.(
            `Analysis ${finalData.Analysispercentage}% complete with ${errors.length} warning(s)`,
            'warning'
          );
        } else {
          addToast?.('Analysis completed', 'success');
        }
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Analysis failed';
        setError(msg);
        addToast?.(msg, 'error');
        console.error('Analysis error:', err);
      } finally {
        setLoading(false);
        isAnalyzingRef.current = false;
      }
    },
    [settings.ai, projectId, addToast]
  );

  const handleFactAnalysis = useCallback(
    async (editorData: OutputData) => {
      try {
        setLoading(true);
        setError('');

        const contentText = CopilotService.extractTextFromEditorData(editorData);

        const factResult = await CopilotService.checkFacts({
          blog_content: contentText,
          topic: 'Legal Document Analysis',
          format_style: 1,
          validate_citations: true,
          include_bibliography: true,
          previous_word_count: 0,
          enable_ethics_check: true,
          enable_compliance_check: true,
        });

        const factData = CopilotService.extractFactData(factResult);

        const updatedData: CopilotResponse = {
          projectId,
          fact: null,
          compliance: data?.compliance || null,
          argumentLogic: data?.argumentLogic || null,
          Analysispercentage: 33,
          factSummary: undefined,
        };

        if (factData) {
          const factCheckers = CopilotService.transformFactCheckToFactChecker(factData);
          if (factCheckers && factCheckers.length > 0) {
            updatedData.fact = factCheckers;
          }
        }

        try {
          if (factData) {
            updatedData.factSummary = CopilotService.getFactCheckSummary(factData);
            updatedData.factScore = updatedData.factSummary?.accuracyScore;
          }
        } catch (summaryErr) {
          console.warn('Failed to generate fact summary:', summaryErr);
        }

        const enriched = enrichCopilotResponseWithBlockIds(updatedData, editorData);
        const normalized = normalizeCopilotData(enriched);

        const finalData: CopilotResponse = {
          ...enriched,
          fact: normalized.facts || enriched.fact,
          Analysispercentage: normalized.percentage || enriched.Analysispercentage,
        };

        setData(finalData);
        addToast?.('Fact analysis completed', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Fact analysis failed';
        setError(msg);
        addToast?.(msg, 'error');
        console.error('Fact analysis error:', err);
      } finally {
        setLoading(false);
      }
    },
    [projectId, data, addToast]
  );

  const handleComplianceAnalysis = useCallback(
    async (editorData: OutputData) => {
      try {
        setLoading(true);
        setError('');

        const contentText = CopilotService.extractTextFromEditorData(editorData);

        const complianceResult = await CopilotService.checkCompliance({
          text: contentText,
          request_id: `comp_${projectId}_${Date.now()}`,
          metadata: { document_type: 'legal_document' },
          check_types: ['factual_accuracy', 'legal_compliance', 'professional_language'],
          detailed_analysis: true,
        });

        const complianceViolations = CopilotService.transformComplianceViolations(complianceResult);

        const updatedData: CopilotResponse = {
          projectId,
          fact: data?.fact || null,
          compliance: complianceViolations,
          argumentLogic: data?.argumentLogic || null,
          Analysispercentage: 33,
          complianceScore: complianceResult.overall_score,
        };

        if (complianceViolations && complianceViolations.length > 0) {
          // Merge with existing compliance or replace
          if (updatedData.compliance) {
            updatedData.compliance = Array.isArray(updatedData.compliance)
              ? [...updatedData.compliance, ...complianceViolations]
              : [updatedData.compliance, ...complianceViolations];
          } else {
            updatedData.compliance = complianceViolations;
          }
        }

        const enriched = enrichCopilotResponseWithBlockIds(updatedData, editorData);
        const normalized = normalizeCopilotData(enriched);

        const finalData: CopilotResponse = {
          ...enriched,
          compliance: normalized.compliances || enriched.compliance,
          Analysispercentage: normalized.percentage || enriched.Analysispercentage,
        };

        setData(finalData);
        addToast?.('Compliance analysis completed', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Compliance analysis failed';
        setError(msg);
        addToast?.(msg, 'error');
        console.error('Compliance analysis error:', err);
      } finally {
        setLoading(false);
      }
    },
    [projectId, data, addToast]
  );

  const handleArgumentLogic = useCallback(
    async (editorData: OutputData) => {
      try {
        setLoading(true);
        setError('');

        const contentText = CopilotService.extractTextFromEditorData(editorData);

        const argumentResult = await CopilotService.checkArgumentLogic({
          text: contentText,
          fast_mode: false,
          include_analysis: true,
          contradiction_threshold: 0.7,
        });

        // If no contradictions found or no valid data, score is 100% (perfect)
        // If contradictions found with valid scores, calculate average contradiction score
        let argumentScore = 100;
        if (argumentResult && Array.isArray(argumentResult) && argumentResult.length > 0) {
          const validScores = argumentResult
            .filter((item) => item && typeof item.contradiction_score === 'number')
            .map((item) => item.contradiction_score * 100);

          if (validScores.length > 0) {
            argumentScore = validScores.reduce((acc, curr) => acc + curr, 0) / validScores.length;
          }
        }

        const updatedData: CopilotResponse = {
          projectId,
          fact: data?.fact || null,
          compliance: data?.compliance || null,
          argumentLogic: null,
          Analysispercentage: 33,
          argumentScore: argumentScore,
        };

        if (argumentResult && Array.isArray(argumentResult) && argumentResult.length > 0) {
          updatedData.argumentLogic = argumentResult;
        }

        const enriched = enrichCopilotResponseWithBlockIds(updatedData, editorData);
        const normalized = normalizeCopilotData(enriched);

        const finalData: CopilotResponse = {
          ...enriched,
          argumentLogic: normalized.argumentSets || enriched.argumentLogic,
          Analysispercentage: normalized.percentage || enriched.Analysispercentage,
        };

        console.log('finaldata', finalData);
        setData(finalData);
        addToast?.('Argument logic analysis completed', 'success');
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Argument logic analysis failed';
        setError(msg);
        addToast?.(msg, 'error');
        console.error('Argument logic analysis error:', err);
      } finally {
        setLoading(false);
      }
    },
    [projectId, data, addToast]
  );

  const uploadDataForAnalysis = useCallback(
    (data: OutputData, type: string) => {
      if (type === 'facts') {
        handleFactAnalysis(data);
      }
      if (type === 'compliances') {
        handleComplianceAnalysis(data);
      }
      if (type === 'argumentLogic') {
        handleArgumentLogic(data);
      }
    },
    [handleFactAnalysis, handleComplianceAnalysis, handleArgumentLogic]
  );

  const getEditorStats = useCallback((stats: EditorStats) => {
    setEditorStats(stats);
  }, []);

  useEffect(() => {
    const currentTimeoutRef = timeoutRef.current;
    return () => {
      if (currentTimeoutRef) {
        clearTimeout(currentTimeoutRef);
      }
    };
  }, []);

  return {
    uploadDataForAnalysis,
    error,
    loading,
    data,
    getEditorStats,
    setData,
  };
}
