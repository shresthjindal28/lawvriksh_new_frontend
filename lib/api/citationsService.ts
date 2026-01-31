import { API_ENDPOINTS } from '@/lib/constants/routes';
import { APIResponse } from '@/types';
import {
  CitationDataRequest,
  CitationSaveDataRequest,
  CombinedRecommendationResponse,
} from '@/types/citations';
import { FetchClient } from './fetchClient';
import { BackendCitationResponse } from '@/lib/utils/transformCitationResponse';

class CitationService {
  async sendDataforCitationsGeneration(
    data: CitationDataRequest
  ): Promise<BackendCitationResponse> {
    try {
      const response = await FetchClient.makeRequest<BackendCitationResponse>(
        API_ENDPOINTS.SEND_DATA_FOR_CITATIONS_GENERATION,
        {
          method: 'POST',
          body: JSON.stringify(data),
        }
      );
      return response.data!;
    } catch (error) {
      console.error('Citation generation error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to generate citations: ${error.message}`);
      }
      throw new Error('Failed to generate citations: Unknown error');
    }
  }

  async saveCitationToDatabase(data: CitationSaveDataRequest): Promise<APIResponse<void>> {
    return FetchClient.makeRequest<void>(API_ENDPOINTS.SAVE_CITATION_TO_DATABASE, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async getCombinedRecommendations(userInput: string): Promise<CombinedRecommendationResponse> {
    try {
      const response = await FetchClient.makeRequest<CombinedRecommendationResponse>(
        API_ENDPOINTS.GET_COMBINED_RECOMMENDATIONS,
        {
          method: 'POST',
          body: JSON.stringify({ user_input: userInput }),
        }
      );
      return response.data!;
    } catch (error) {
      console.error('Combined recommendations error:', error);
      // Re-throw with more specific error message
      if (error instanceof Error) {
        throw new Error(`Failed to get citation recommendations: ${error.message}`);
      }
      throw new Error('Failed to get citation recommendations: Unknown error');
    }
  }
}

const citationService = new CitationService();
export default citationService;
