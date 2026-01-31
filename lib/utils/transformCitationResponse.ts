import { CitationsDisplayData, Citation } from '@/types/citations';
import { findClosestTextSegment } from '@/lib/utils/findClosestTextSegment';

export interface LineCitation {
  line: string;
  line_number: number;
  citation_type: string;
  legal_entities: string[];
  priority: string;
  citations: {
    source: string;
    title: string;
    court?: string;
    date?: string;
    link?: string;
    reliability_score?: number;
    ethics_score?: number;
    compliance_score?: number;
    validation_status?: string;
    format_type?: string;
  }[];
  citations_count: number;
}

export interface BackendCitationResponse {
  success: boolean;
  detected_lines: number;
  line_citations: LineCitation[];
  total_citations: number;
  summary: {
    high_priority_lines: number;
    medium_priority_lines: number;
    low_priority_lines: number;
    average_citations_per_line: number;
  };
}

/**
 * Transforms backend citation response (line_citations-based) into
 * block-based CitationsDisplayData for UI.
 */
export function transformCitationResponse(
  editorBlocks: { id: string; text: string }[],
  backendData: BackendCitationResponse
): CitationsDisplayData[] {
  if (!backendData?.line_citations) return [];

  // Initialize empty mapped blocks
  const mappedBlocks: CitationsDisplayData[] = editorBlocks.map((block) => ({
    id: block.id,
    wordCounts: block.text.split(' ').length,
    data: [],
  }));

  // For each line of backend citations
  backendData.line_citations.forEach((lineItem) => {
    let bestMatchBlock: CitationsDisplayData | null = null;
    let bestScore = 0;

    // Find which editor block the line text best matches
    editorBlocks.forEach((block) => {
      const match = findClosestTextSegment(block.text, lineItem.line);
      const score = match?.score || 0;

      if (score > bestScore) {
        bestScore = score;
        bestMatchBlock = mappedBlocks.find((b) => b.id === block.id) || null;
      }
    });

    // If a block matches this line of text
    if (bestMatchBlock && bestScore > 0.35) {
      // Add all the line’s citations
      lineItem.citations.forEach((c, idx) => {
        const newCitation: Citation = {
          id: `${bestMatchBlock!.id}-${lineItem.line_number}-${idx}`,
          source: c.source,
          title: c.title,
          author: c.court || 'Unknown',
          link: c.link || '',
          position: undefined,
        };
        bestMatchBlock!.data.push(newCitation);
      });
    }
  });

  return mappedBlocks;
}
