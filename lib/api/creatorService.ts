// Creator service
import { FetchClient } from './fetchClient';
import { API_ENDPOINTS } from '@/lib/constants/routes';
import type { APIResponse } from '@/types/auth';
import {
  ApplyForCreatorEligiblity,
  CreatorApplicationRequest,
  CreatorApplicationResponse,
  CreatorApplicationsData,
} from '@/types/creator';
import { CreatorApplicationRequestSchema } from '@/lib/validators/creator/requests';

class CreatorService {
  async eligibleForCreator(): Promise<APIResponse<ApplyForCreatorEligiblity>> {
    return FetchClient.makeRequest<ApplyForCreatorEligiblity>(API_ENDPOINTS.ELIGIBLE_FOR_CREATOR, {
      method: 'GET',
    });
  }

  async applyForCreator(
    data: CreatorApplicationRequest
  ): Promise<APIResponse<CreatorApplicationResponse>> {
    const validated = CreatorApplicationRequestSchema.parse(data);
    return FetchClient.makeRequest<CreatorApplicationResponse>(API_ENDPOINTS.APPLY_CREATOR, {
      method: 'POST',
      body: JSON.stringify(validated),
    });
  }

  async getMyCreatorApplications(): Promise<APIResponse<CreatorApplicationsData>> {
    return FetchClient.makeRequest<CreatorApplicationsData>(API_ENDPOINTS.GET_MY_APPLICATIONS, {
      method: 'GET',
    });
  }
}

export const creatorService = new CreatorService();
