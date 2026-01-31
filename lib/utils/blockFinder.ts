import { OutputData } from '@editorjs/editorjs';
import stringSimilarity from 'string-similarity';
import { CopilotResponse, FactChecker, Compliance, ArgumentLogic } from '@/types/copilot';

//Normalizes text for better matching
export function normalizeText(str: string): string {
  return str
    .replace(/\u00A0/g, ' ')
    .replace(/[""]/g, '"')
    .replace(/['']/g, "'")
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();
}

function wordSimilarity(a: string, b: string): number {
  const wordsA = new Set(a.split(/\s+/));
  const wordsB = new Set(b.split(/\s+/));

  const intersection = [...wordsA].filter((w) => wordsB.has(w)).length;
  const union = new Set([...wordsA, ...wordsB]).size;

  return union === 0 ? 0 : intersection / union;
}

//Extracts text content from an Editor.js block
export function getBlockText(block: any): string {
  if (!block || !block.data) return '';

  switch (block.type) {
    case 'paragraph':
    case 'header':
      return block.data.text || '';
    case 'list':
      return (block.data.items || [])
        .map((i: any) => {
          // Handle nested list items which might be objects
          if (typeof i === 'string') return i;
          if (i?.content) return i.content;
          if (i?.text) return i.text;
          return '';
        })
        .join(' ');
    case 'quote':
      return block.data.text || '';
    case 'table':
      return (block.data.content || []).flat().join(' ');
    default:
      return JSON.stringify(block.data);
  }
}

//Finds the best matching block for a given text statement
export function findBlockByText(
  editorData: OutputData,
  searchText: string,
  threshold: number = 0.55
): string | null {
  if (!editorData.blocks?.length) return null;
  const normalizedSearch = normalizeText(searchText);
  let blockTexts = editorData.blocks.map((b) => normalizeText(getBlockText(b)));
  let listTexts = editorData.blocks
    .filter((b) => b.type === 'list')
    .map((b) =>
      b.data.items
        .map((i: any) => {
          if (typeof i === 'string') return normalizeText(i);
          if (i?.content) return normalizeText(i.content);
          if (i?.text) return normalizeText(i.text);
          return '';
        })
        .join(' ')
    );

  blockTexts = [...blockTexts, ...listTexts];

  let bestScore = 0;
  let bestIndex = -1;

  blockTexts.forEach((blockText, index) => {
    // Compare trigram (char-based) similarity
    const trigramScore = stringSimilarity.compareTwoStrings(normalizedSearch, blockText);

    // Compare token-based Jaccard similarity
    const tokenScore = wordSimilarity(normalizedSearch, blockText);

    // Combine both scores (weight token similarity higher)
    const combinedScore = trigramScore * 0.4 + tokenScore * 0.6;

    if (combinedScore > bestScore) {
      bestScore = combinedScore;
      bestIndex = index;
    }
  });

  // If best match passes threshold, return it
  if (bestScore >= threshold) {
    return editorData.blocks[bestIndex].id || '';
  }

  // Fallback: try partial word sequence (first few words)
  const firstFive = normalizedSearch.split(' ').slice(0, 5).join(' ');
  for (const block of editorData.blocks) {
    const blockText = normalizeText(getBlockText(block));
    if (blockText.includes(firstFive)) {
      return block.id || '';
    }
  }

  // Still not found
  return null;
}

//Finds multiple blocks that contain parts of the text
export function findAllMatchingBlocks(
  editorData: OutputData,
  searchText: string,
  threshold: number = 0.55
): Array<{ blockId: string; confidence: number }> {
  if (!editorData.blocks || editorData.blocks.length === 0) {
    return [];
  }

  const normalizedSearch = normalizeText(searchText);
  const matches: Array<{ blockId: string; confidence: number }> = [];

  for (const block of editorData.blocks) {
    const blockText = normalizeText(getBlockText(block));

    // Exact substring match gets highest confidence
    if (blockText.includes(normalizedSearch)) {
      matches.push({ blockId: block.id || '', confidence: 1.0 });
      continue;
    }

    // Partial match using similarity
    const similarity = stringSimilarity.compareTwoStrings(normalizedSearch, blockText);
    if (similarity >= threshold) {
      matches.push({ blockId: block.id || '', confidence: similarity });
    }
  }

  // Sort by confidence (highest first)
  return matches.sort((a, b) => b.confidence - a.confidence);
}

//Enriches copilot response data with block IDs
export function enrichCopilotResponseWithBlockIds(
  copilotResponse: CopilotResponse,
  editorData: OutputData
): CopilotResponse {
  const enriched: CopilotResponse = {
    ...copilotResponse,
    // Preserve factSummary
    factSummary: copilotResponse.factSummary,
  };

  // Enrich fact checker - handle both single and array
  if (enriched.fact) {
    const facts = Array.isArray(enriched.fact) ? enriched.fact : [enriched.fact];

    enriched.fact = facts.map((factItem, index) => {
      const blockId = findBlockByText(editorData, factItem.fact.wrongStatement, 0.55);

      return {
        ...factItem,
        fact: {
          ...factItem.fact,
          block_id: blockId || factItem.fact.block_id || '',
        },
      };
    });
  }

  // Enrich compliance - handle both single and array
  if (enriched.compliance) {
    const compliances = Array.isArray(enriched.compliance)
      ? enriched.compliance
      : [enriched.compliance];

    enriched.compliance = compliances.map((compItem, index) => {
      const blockId = findBlockByText(editorData, compItem.statement.wrongStatement, 0.55);

      return {
        ...compItem,
        statement: {
          ...compItem.statement,
          block_id: blockId || compItem.statement.block_id || '',
        },
      };
    });
  }

  // Enrich argument logic - handle both single and array
  if (enriched.argumentLogic) {
    const argumentSets = Array.isArray(enriched.argumentLogic)
      ? enriched.argumentLogic
      : [enriched.argumentLogic];

    enriched.argumentLogic = argumentSets.map((argSet) => {
      return {
        ...argSet,
        sets: argSet.sets.map((set) => ({
          ...set,
          contradictions: set.contradictions.map((contradiction) => {
            const blockId1 = findBlockByText(editorData, contradiction.line1?.text || '', 0.55);
            const blockId2 = findBlockByText(editorData, contradiction.line2?.text || '', 0.55);
            return {
              ...contradiction,
              line1: {
                ...contradiction.line1,
                id: blockId1 || contradiction.line1?.id || '',
              },
              line2: {
                ...contradiction.line2,
                id: blockId2 || contradiction.line2?.id || '',
              },
            };
          }),
        })),
      };
    });
  }

  return enriched;
}

//Gets the block ID for a specific sentence/claim from the editor
export function getBlockIdForClaim(editorData: OutputData, claim: string): string | null {
  return findBlockByText(editorData, claim, 0.65);
}

//Searches for text within blocks and returns position info
export function findTextInBlocks(
  editorData: OutputData,
  searchText: string
): Array<{
  blockId: string;
  blockIndex: number;
  startPos: number;
  endPos: number;
  matchedText: string;
}> {
  const results: Array<any> = [];
  const normalizedSearch = normalizeText(searchText);

  editorData.blocks?.forEach((block, index) => {
    const blockText = getBlockText(block);
    const normalizedBlockText = normalizeText(blockText);

    let pos = 0;
    while (pos < normalizedBlockText.length) {
      const foundPos = normalizedBlockText.indexOf(normalizedSearch, pos);
      if (foundPos === -1) break;

      results.push({
        blockId: block.id || '',
        blockIndex: index,
        startPos: foundPos,
        endPos: foundPos + normalizedSearch.length,
        matchedText: blockText.substring(foundPos, foundPos + searchText.length),
      });

      pos = foundPos + normalizedSearch.length;
    }
  });

  return results;
}

//Helper function to enrich a single FactChecker
function enrichFactChecker(factItem: FactChecker, editorData: OutputData): FactChecker {
  const blockId = findBlockByText(editorData, factItem.fact.wrongStatement, 0.55);

  return {
    ...factItem,
    fact: {
      ...factItem.fact,
      block_id: blockId || factItem.fact.block_id || '',
    },
  };
}

//Helper function to enrich a single Compliance
function enrichCompliance(compItem: Compliance, editorData: OutputData): Compliance {
  const blockId = findBlockByText(editorData, compItem.statement.wrongStatement, 0.55);

  return {
    ...compItem,
    statement: {
      ...compItem.statement,
      block_id: blockId || compItem.statement.block_id || '',
    },
  };
}

//Helper function to enrich a single ArgumentLogic
function enrichArgumentLogic(argSet: ArgumentLogic, editorData: OutputData): ArgumentLogic {
  return {
    ...argSet,
    sets: argSet.sets.map((set) => ({
      ...set,
      contradictions: set.contradictions.map((contradiction) => {
        const blockId1 = findBlockByText(editorData, contradiction.line1?.text || '', 0.55);
        const blockId2 = findBlockByText(editorData, contradiction.line2?.text || '', 0.55);
        return {
          ...contradiction,
          line1: {
            ...contradiction.line1,
            id: blockId1 || contradiction.line1?.id || '',
          },
          line2: {
            ...contradiction.line2,
            id: blockId2 || contradiction.line2?.id || '',
          },
        };
      }),
    })),
  };
}
