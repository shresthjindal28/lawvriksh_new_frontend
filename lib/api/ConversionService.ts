// lib/api/conversionService.ts
import { API_ENDPOINTS } from '@/lib/constants/routes';
import { APIResponse } from '@/types';
import { FetchClient } from './fetchClient';

export interface ConversionOptions {
  embed_images?: boolean;
  preserve_formatting?: boolean;
  include_headers_footers?: boolean;
}

export interface ConvertTemplateRequest {
  file_content: string; // base64 encoded
  filename: string;
  file_format: 'PDF' | 'DOCX' | 'DOC'; // PDF, DOCX, DOC as strings
  options?: ConversionOptions;
  user_id?: string; // Made optional since HTML test doesn't include it
}

// This matches what's inside the stringified json_result
export interface TemplateStructure {
  document_type: string;
  sections: {
    section_name: string;
    guidance: string[];
    word_count_suggestion: string;
  }[];
}

// This matches the actual API response wrapper
export interface ConvertTemplateResponse {
  analysis_id: string;
  success: boolean;
  json_result: string; // ← Stringified JSON!
  processing_time_ms: number;
}

export interface BatchConvertRequest {
  files: ConvertTemplateRequest[];
  batch_id: string;
  user_id: string;
}

export interface BatchConvertResponse {
  batch_id: string;
  results: TemplateStructure[]; // Changed to parsed structure
  total_files: number;
  successful_conversions: number;
  failed_conversions: number;
  total_processing_time_ms: number;
}

// Response from extract-text API
export interface ExtractTextResponse {
  success: boolean;
  text: string;
  total_pages: number;
  error?: string;
}

class ConversionService {
  async convertTemplate(data: ConvertTemplateRequest): Promise<APIResponse<TemplateStructure>> {
    const response = await FetchClient.makeRequest<ConvertTemplateResponse>(
      API_ENDPOINTS.CONVERT_TEMPLATE,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    // Parse the stringified json_result
    if (response.success && response.data) {
      try {
        const parsedResult: TemplateStructure = JSON.parse(response.data.json_result);
        return {
          success: true,
          data: parsedResult,
          message: response.message,
        } as APIResponse<TemplateStructure>;
      } catch (error) {
        return {
          success: false,
          data: null as any, // or undefined, depending on your APIResponse type
          message: 'Failed to parse conversion result',
        } as APIResponse<TemplateStructure>;
      }
    }

    // Handle failure case
    return {
      success: false,
      data: null as any, // or undefined
      message: response.message || 'Conversion failed',
    } as APIResponse<TemplateStructure>;
  }

  async convertBatch(data: BatchConvertRequest): Promise<APIResponse<BatchConvertResponse>> {
    return FetchClient.makeRequest<BatchConvertResponse>(API_ENDPOINTS.CONVERT_BATCH, {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  // Extract text from PDF/DOC using the new extract-text API
  async extractText(
    file: File,
    options?: { signal?: AbortSignal }
  ): Promise<APIResponse<ExtractTextResponse>> {
    const formData = new FormData();
    formData.append('file', file);

    // Use makeDocumentUploadRequest which doesn't set Content-Type header
    // This allows browser to set proper multipart/form-data with boundary
    return FetchClient.makeDocumentUploadRequest<ExtractTextResponse>(API_ENDPOINTS.EXTRACT_TEXT, {
      method: 'POST',
      body: formData,
      signal: options?.signal,
    });
  }

  // Helper method to convert File object to base64
  async fileToBase64(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => {
        const base64 = (reader.result as string).split(',')[1];
        resolve(base64);
      };
      reader.onerror = (error) => reject(error);
    });
  }

  // Helper method to determine file format from filename
  getFileFormat(filename: string): 'PDF' | 'DOCX' | 'DOC' {
    const extension = filename.toLowerCase().split('.').pop();
    switch (extension) {
      case 'pdf':
        return 'PDF';
      case 'docx':
        return 'DOCX';
      case 'doc':
        return 'DOC';
      default:
        throw new Error(`Unsupported file format: ${extension}`);
    }
  }
}

export const conversionService = new ConversionService();
