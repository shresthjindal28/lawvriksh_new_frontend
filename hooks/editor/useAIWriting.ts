import { useState, useCallback } from 'react';
import { AIWritingService } from '@/lib/api/aiWritingService';
import { useToast } from '@/lib/contexts/ToastContext';
import {
  ImproveWritingRequest,
  ParaphraseRequest,
  TranslateRequest,
  GenerateParagraphRequest,
} from '@/types/aiWriting';

export const useAIWriting = () => {
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  const improveWriting = useCallback(
    async (data: ImproveWritingRequest) => {
      setIsLoading(true);
      try {
        const response = await AIWritingService.improveWriting(data);
        if (response.success) {
          return response.improved_text;
        } else {
          addToast(response.error || 'Failed to improve text', 'error');
          return null;
        }
      } catch (error) {
        console.error('Improve writing error:', error);
        addToast('An error occurred while improving text', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const paraphrase = useCallback(
    async (data: ParaphraseRequest) => {
      setIsLoading(true);
      try {
        const response = await AIWritingService.paraphrase(data);
        if (response.success && response.paraphrased_texts.length > 0) {
          return response.paraphrased_texts[0]; // Take the first variation for now
        } else {
          addToast(response.error || 'Failed to paraphrase text', 'error');
          return null;
        }
      } catch (error) {
        console.error('Paraphrase error:', error);
        addToast('An error occurred while paraphrasing text', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const translate = useCallback(
    async (data: TranslateRequest) => {
      setIsLoading(true);
      try {
        const response = await AIWritingService.translate(data);
        if (response.success) {
          return response.translated_text;
        } else {
          addToast(response.error || 'Failed to translate text', 'error');
          return null;
        }
      } catch (error) {
        console.error('Translate error:', error);
        addToast('An error occurred while translating text', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  const generateParagraph = useCallback(
    async (data: GenerateParagraphRequest) => {
      setIsLoading(true);
      try {
        const response = await AIWritingService.generateParagraph(data);
        if (response.success) {
          return response.generated_text;
        } else {
          addToast(response.error || 'Failed to generate paragraph', 'error');
          return null;
        }
      } catch (error) {
        console.error('Generate paragraph error:', error);
        addToast('An error occurred while generating paragraph', 'error');
        return null;
      } finally {
        setIsLoading(false);
      }
    },
    [addToast]
  );

  return {
    isLoading,
    improveWriting,
    paraphrase,
    translate,
    generateParagraph,
  };
};
