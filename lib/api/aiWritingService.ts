import { API_ENDPOINTS } from '@/lib/constants/routes';
import { FetchClient } from './fetchClient';
import {
  ImproveWritingRequest,
  ImproveWritingResponse,
  ParaphraseRequest,
  ParaphraseResponse,
  TranslateRequest,
  TranslateResponse,
  GenerateParagraphRequest,
  GenerateParagraphResponse,
} from '@/types/aiWriting';

class AIWritingServiceClass {
  async improveWriting(data: ImproveWritingRequest): Promise<ImproveWritingResponse> {
    try {
      const res = await FetchClient.makeRequest<ImproveWritingResponse>(
        `${API_ENDPOINTS.AI_IMPROVE}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.data!;
    } catch (error) {
      console.error('AI improve writing error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to improve writing: ${error.message}`);
      }
      throw new Error('Failed to improve writing: Unknown error');
    }
  }

  async paraphrase(data: ParaphraseRequest): Promise<ParaphraseResponse> {
    try {
      const res = await FetchClient.makeRequest<ParaphraseResponse>(
        `${API_ENDPOINTS.AI_PARAPHRASE}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.data!;
    } catch (error) {
      console.error('AI paraphrase error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to paraphrase text: ${error.message}`);
      }
      throw new Error('Failed to paraphrase text: Unknown error');
    }
  }

  async translate(data: TranslateRequest): Promise<TranslateResponse> {
    try {
      const res = await FetchClient.makeRequest<TranslateResponse>(
        `${API_ENDPOINTS.AI_TRANSLATE}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.data!;
    } catch (error) {
      console.error('AI translate error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to translate text: ${error.message}`);
      }
      throw new Error('Failed to translate text: Unknown error');
    }
  }

  async generateParagraph(data: GenerateParagraphRequest): Promise<GenerateParagraphResponse> {
    try {
      const res = await FetchClient.makeRequest<GenerateParagraphResponse>(
        `${API_ENDPOINTS.AI_GENERATE_PARAGRAPH}`,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return res.data!;
    } catch (error) {
      console.error('AI generate paragraph error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to generate paragraph: ${error.message}`);
      }
      throw new Error('Failed to generate paragraph: Unknown error');
    }
  }
}

export const AIWritingService = new AIWritingServiceClass();
