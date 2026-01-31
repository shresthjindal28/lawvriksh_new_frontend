'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import {
  smartSuggestionService,
  ReferenceDoc,
  StartSessionResponse,
  GenerateSuggestionResponse,
  Suggestion,
} from '@/lib/api/smartSuggestionService';

interface UseSmartSuggestionProps {
  projectId: string;
  userId: string;
}

interface SuggestionPosition {
  top: number;
  left: number;
  lineHeight?: number;
  fontSize?: number;
}

interface UseSmartSuggestionReturn {
  // State
  sessionId: string | null;
  isSessionReady: boolean;
  isSessionLoading: boolean;
  suggestion: string | null;
  suggestionPosition: SuggestionPosition | null;
  isSuggestionLoading: boolean;
  currentSuggestions: Suggestion[];
  currentSuggestionIndex: number;

  // Methods
  initSession: (draftText: string, references: any[]) => Promise<void>;
  fetchSuggestion: (draftText: string) => Promise<void>;
  setSuggestionWithPosition: (text: string | null, position: SuggestionPosition | null) => void;
  acceptSuggestion: () => string | null;
  dismissSuggestion: () => void;
  closeSession: () => Promise<void>;
  cycleSuggestion: () => void;
}

// Minimum word count required for session start
const MIN_WORDS_FOR_SESSION = 0;
// Minimum word count for generating suggestions
const MIN_WORDS_FOR_SUGGESTION = 0;

export function useSmartSuggestion({
  projectId,
  userId,
}: UseSmartSuggestionProps): UseSmartSuggestionReturn {
  // Session state
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [isSessionReady, setIsSessionReady] = useState(false);
  const [isSessionLoading, setIsSessionLoading] = useState(false);

  // Suggestion state
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [suggestionPosition, setSuggestionPosition] = useState<SuggestionPosition | null>(null);
  const [isSuggestionLoading, setIsSuggestionLoading] = useState(false);
  const [currentSuggestions, setCurrentSuggestions] = useState<Suggestion[]>([]);

  const [currentSuggestionIndex, setCurrentSuggestionIndex] = useState(0);

  // Refs for cleanup
  const sessionIdRef = useRef<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Transform workspace references to API format
  const transformReferences = useCallback(
    (references: any[]): ReferenceDoc[] => {
      if (!references || references.length === 0) return [];

      return references.map((ref, index) => ({
        ref_id: ref.id || `ref_${index}`,
        title: ref.title || 'Untitled Reference',
        // API requires summary to have at least 1 character
        summary: ref.summary || ref.description || ref.title || 'Reference document',
        s3_key: ref.s3_key || ref.link || `refs/${userId}/${ref.id}`,
        metadata: {
          source: ref.source || 'unknown',
          ...(ref.metadata || {}),
        },
      }));
    },
    [userId]
  );

  // Count words in text
  const countWords = useCallback((text: string): number => {
    return text
      .trim()
      .split(/\s+/)
      .filter((word) => word.length > 0).length;
  }, []);

  /**
   * Initialize a smart suggestion session
   */
  const initSession = useCallback(
    async (draftText: string, references: any[]) => {
      // Skip if already loading or session exists
      if (isSessionLoading || sessionIdRef.current) {
        console.log('[SmartSuggestion] Session already exists or loading');
        return;
      }

      const wordCount = countWords(draftText);
      if (wordCount < MIN_WORDS_FOR_SESSION) {
        console.log(
          `[SmartSuggestion] Not enough words for session (${wordCount}/${MIN_WORDS_FOR_SESSION})`
        );
        // Don't start session yet, but mark as ready to retry later
        return;
      }

      setIsSessionLoading(true);

      try {
        const refDocs = transformReferences(references);

        const response: StartSessionResponse = await smartSuggestionService.startSession({
          user_id: userId,
          context_id: projectId,
          draft_text: draftText,
          reference_docs: refDocs,
          force_refresh: false,
        });

        if (response.session?.session_id) {
          setSessionId(response.session.session_id);
          sessionIdRef.current = response.session.session_id;
          setIsSessionReady(true);
          console.log('[SmartSuggestion] Session started:', response.session.session_id);

          if (response.warnings && response.warnings.length > 0) {
            console.warn('[SmartSuggestion] Warnings:', response.warnings);
          }
        }
      } catch (error) {
        console.error('[SmartSuggestion] Failed to init session:', error);
        // Don't throw - allow app to continue without suggestions
      } finally {
        setIsSessionLoading(false);
      }
    },
    [projectId, userId, transformReferences, countWords, isSessionLoading]
  );

  /**
   * Fetch a suggestion from the API
   */
  const fetchSuggestion = useCallback(
    async (draftText: string) => {
      // Check if session is ready
      if (!sessionIdRef.current) {
        console.log('[SmartSuggestion] No active session for suggestion');
        return;
      }

      const wordCount = countWords(draftText);
      if (wordCount < MIN_WORDS_FOR_SUGGESTION) {
        console.log(
          `[SmartSuggestion] Not enough words for suggestion (${wordCount}/${MIN_WORDS_FOR_SUGGESTION})`
        );
        return;
      }

      // Cancel any in-progress request
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      abortControllerRef.current = new AbortController();

      setIsSuggestionLoading(true);

      try {
        const response: GenerateSuggestionResponse =
          await smartSuggestionService.generateSuggestions({
            session_id: sessionIdRef.current,
            draft_text: draftText,
            max_suggestions: 3,
          });

        if (response.suggestions && response.suggestions.length > 0) {
          setCurrentSuggestions(response.suggestions);
          setCurrentSuggestionIndex(0);
          // Use the first suggestion (facts-focused) by default
          const primarySuggestion = response.suggestions[0];
          setSuggestion(primarySuggestion.text);
          console.log(
            '[SmartSuggestion] Got suggestion:',
            primarySuggestion.text.substring(0, 50) + '...'
          );
        } else {
          console.log('[SmartSuggestion] No suggestions returned');
        }
      } catch (error: any) {
        if (error.name !== 'AbortError') {
          console.error('[SmartSuggestion] Failed to fetch suggestion:', error);
        }
      } finally {
        setIsSuggestionLoading(false);
      }
    },
    [countWords]
  );

  /**
   * Cycle to next suggestion
   */
  const cycleSuggestion = useCallback(() => {
    if (currentSuggestions.length === 0) return;
    const nextIndex = (currentSuggestionIndex + 1) % currentSuggestions.length;
    setCurrentSuggestionIndex(nextIndex);
    setSuggestion(currentSuggestions[nextIndex].text);
  }, [currentSuggestions, currentSuggestionIndex]);

  /**
   * Set suggestion with position (for DOM integration)
   */
  const setSuggestionWithPosition = useCallback(
    (text: string | null, position: SuggestionPosition | null) => {
      setSuggestion(text);
      setSuggestionPosition(position);
    },
    []
  );

  /**
   * Accept the current suggestion
   * Returns the suggestion text to be inserted
   */
  const acceptSuggestion = useCallback((): string | null => {
    const text = suggestion;
    setSuggestion(null);
    setSuggestionPosition(null);
    setCurrentSuggestions([]);
    return text;
  }, [suggestion]);

  /**
   * Dismiss the current suggestion without accepting
   */
  const dismissSuggestion = useCallback(() => {
    setSuggestion(null);
    setSuggestionPosition(null);
  }, []);

  /**
   * Close the session
   */
  const closeSession = useCallback(async () => {
    if (!sessionIdRef.current) return;

    try {
      await smartSuggestionService.closeSession({
        session_id: sessionIdRef.current,
        delete_user_files: false,
      });
      console.log('[SmartSuggestion] Session closed');
    } catch (error) {
      console.error('[SmartSuggestion] Error closing session:', error);
    } finally {
      setSessionId(null);
      sessionIdRef.current = null;
      setIsSessionReady(false);
      setSuggestion(null);
      setSuggestionPosition(null);
      setCurrentSuggestions([]);
    }
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      // Close session on unmount
      if (sessionIdRef.current) {
        smartSuggestionService
          .closeSession({
            session_id: sessionIdRef.current,
            delete_user_files: false,
          })
          .catch(() => {});
      }
    };
  }, []);

  return {
    // State
    sessionId,
    isSessionReady,
    isSessionLoading,
    suggestion,
    suggestionPosition,
    isSuggestionLoading,
    currentSuggestions,
    currentSuggestionIndex,

    // Methods
    initSession,
    fetchSuggestion,
    setSuggestionWithPosition,
    acceptSuggestion,
    dismissSuggestion,
    closeSession,
    cycleSuggestion,
  };
}

export default useSmartSuggestion;
