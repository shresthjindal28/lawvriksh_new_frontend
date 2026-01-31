import { OutputData } from '@editorjs/editorjs';
import { useCallback, useState } from 'react';
import { Citation, CitationsData, CitationsDisplayData } from '@/types/citations';
import citationService from '@/lib/api/citationsService';
import { transformCitationResponse } from '@/lib/utils/transformCitationResponse';

export function CitationsService() {
  const [citationsData, setCitationsData] = useState<CitationsData[]>([]);
  const [suggestedCitations, setSuggestedCitations] = useState<CitationsDisplayData[]>([]);
  const [receivedData, setReceivedData] = useState<CitationsDisplayData[]>([]);
  const [error, setError] = useState('');

  const sendDataforCitationsGeneration = useCallback(async (data: CitationsData[]) => {
    try {
      setError('');
      const response = await citationService.sendDataforCitationsGeneration({
        blog_content: data.map((b) => b.text).join('\n\n'),
      });

      if (response.success) {
        const editorBlocks = data.map((b) => ({ id: b.id, text: b.text }));
        const mappedCitations = transformCitationResponse(editorBlocks, response);
        setSuggestedCitations((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newOnes = mappedCitations.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newOnes];
        });
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'sendDataforCitationsGeneration error');
    }
  }, []);

  const getSavedContentforCitationsGeneration = useCallback(
    (data: OutputData) => {
      if (!data) return;

      const blocks = data.blocks;
      const filteredData = blocks.filter((block) => block.type === 'paragraph');

      const newCitations: CitationsData[] = [];
      filteredData.forEach((block) => {
        const wordCounts = block.data.text.split(' ').length;
        const id = block.id;
        const text = block.data.text;

        if (wordCounts >= 50) {
          newCitations.push({ wordCounts, id, text });
        }
      });

      if (newCitations.length === 0) return;
      if (receivedData.length > 0) {
        const notPresentData = newCitations.filter(
          (citation) => !receivedData.some((data) => data.id === citation.id)
        );
        if (notPresentData.length === 0) return;
        sendDataforCitationsGeneration(notPresentData);
      } else {
        setCitationsData(newCitations);
        sendDataforCitationsGeneration(newCitations);
      }
    },
    [receivedData, sendDataforCitationsGeneration]
  );

  // New method to generate citations for a single block
  const generateCitationsForBlock = useCallback(async (blockId: string, text: string) => {
    try {
      setError('');
      console.log('text', text);
      const response = await citationService.sendDataforCitationsGeneration({
        blog_content: text,
      });

      if (response.success) {
        const editorBlock = [{ id: blockId, text }];
        const mappedCitations = transformCitationResponse(editorBlock, response);

        setSuggestedCitations((prev) => {
          const existingIds = new Set(prev.map((item) => item.id));
          const newOnes = mappedCitations.filter((item) => !existingIds.has(item.id));
          return [...prev, ...newOnes];
        });

        return mappedCitations;
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'generateCitationsForBlock error');
      throw error;
    }
  }, []);

  const handleCitationAdded = (blockId: string, citation: Citation) => {
    setReceivedData((prev) => {
      const updated = [...prev];
      const target = updated.find((b) => b.id === blockId);
      if (target) {
        target.data.push(citation);
      } else {
        updated.push({ id: blockId, wordCounts: 0, data: [citation] });
      }
      return updated;
    });
  };

  const addManualCitation = useCallback((blockId: string, citation: Citation) => {
    console.log('📝 Adding manual citation:', { blockId, citation });

    setReceivedData((prev) => {
      const existingBlock = prev.find((b) => b.id === blockId);

      if (existingBlock) {
        // Check if citation already exists
        const citationExists = existingBlock.data.some((c) => c.id === citation.id);
        if (citationExists) {
          return prev;
        }

        // Add citation to existing block
        return prev.map((block) =>
          block.id === blockId ? { ...block, data: [...block.data, citation] } : block
        );
      } else {
        return [
          ...prev,
          {
            id: blockId,
            wordCounts: 0,
            data: [citation],
          },
        ];
      }
    });
  }, []);

  return {
    citationsData,
    getSavedContentforCitationsGeneration,
    generateCitationsForBlock,
    suggestedCitations,
    error,
    handleCitationAdded,
    addManualCitation,
  };
}
