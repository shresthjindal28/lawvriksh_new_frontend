import stringSimilarity from 'string-similarity';

/**
 * Normalizes text by removing extra whitespace, special characters, and converting to lowercase.
 * Also handles common formatting variations from API responses.
 */
function normalizeForMatching(text: string): string {
  return text
    .replace(/\u00A0/g, ' ') // Non-breaking space
    .replace(/[""]/g, '"') // Smart quotes
    .replace(/['']/g, "'") // Smart apostrophes
    .replace(/[—–]/g, '-') // Em/en dashes
    .replace(/\s+/g, ' ') // Multiple spaces
    .replace(/[^\w\s'-]/g, '') // Remove special chars except common ones
    .trim()
    .toLowerCase();
}

/**
 * Levenshtein distance for character-level fuzzy matching
 */
function levenshteinDistance(a: string, b: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // substitution
          matrix[i][j - 1] + 1, // insertion
          matrix[i - 1][j] + 1 // deletion
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

/**
 * Calculate similarity based on Levenshtein distance
 */
function levenshteinSimilarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length);
  if (maxLen === 0) return 1;
  return 1 - levenshteinDistance(a, b) / maxLen;
}

/**
 * Finds the closest-matching text segment within a block of text.
 * This helps locate a phrase even if it's slightly edited, missing words, or reordered.
 * Enhanced with multiple fallback strategies for better fuzzy matching.
 *
 * @param blockText - Full text content of the Editor.js block.
 * @param targetText - The text we want to highlight (from Copilot or AI response).
 * @param minWords - Minimum window size to compare.
 * @param maxWords - Maximum window size to compare.
 * @param threshold - Minimum similarity score (0–1) required to accept a match.
 * @returns { startIndex, matchText, score } or null if no close match found.
 */
export function findClosestTextSegment(
  blockText: string,
  targetText: string,
  minWords = 3,
  maxWords = 20,
  threshold = 0.35
): { startIndex: number; matchText: string; score: number } | null {
  if (!blockText?.trim() || !targetText?.trim()) return null;

  // Normalize both sides
  const normalizedBlock = normalizeForMatching(blockText);
  const normalizedTarget = normalizeForMatching(targetText);

  // Strategy 1: Exact substring match (case-insensitive)
  const exactIndex = normalizedBlock.indexOf(normalizedTarget);
  if (exactIndex !== -1) {
    // Find the actual position in original text
    const originalIndex = findOriginalIndex(blockText, targetText, exactIndex);
    return {
      startIndex: originalIndex,
      matchText: blockText.substring(originalIndex, originalIndex + targetText.length),
      score: 1.0,
    };
  }

  // Strategy 2: Partial substring match (target is contained in block or vice versa)
  // Check if significant portion of target exists in block
  const targetWords = normalizedTarget.split(' ').filter((w) => w.length > 2);
  const blockWords = normalizedBlock.split(' ');

  // Try to find a contiguous sequence of matching words
  const sequenceMatch = findLongestMatchingSequence(blockWords, targetWords);
  if (sequenceMatch && sequenceMatch.score >= 0.7) {
    const matchText = sequenceMatch.words.join(' ');
    const charIndex = findCharIndexForWords(normalizedBlock, sequenceMatch.startIndex);
    const originalIndex = findOriginalIndex(blockText, matchText, charIndex);
    return {
      startIndex: originalIndex,
      matchText: getOriginalCaseText(blockText, originalIndex, matchText.length),
      score: sequenceMatch.score,
    };
  }

  // Strategy 3: Sliding window with dynamic sizing based on target length
  const targetWordCount = targetWords.length;
  const adaptiveMinWords = Math.max(2, Math.floor(targetWordCount * 0.5));
  const adaptiveMaxWords = Math.min(blockWords.length, Math.ceil(targetWordCount * 1.5));

  let bestScore = 0;
  let bestStartWordIndex = 0;
  let bestWindowSize = 0;

  for (let i = 0; i < blockWords.length; i++) {
    const maxWindow = Math.min(adaptiveMaxWords, blockWords.length - i);

    for (let windowSize = adaptiveMinWords; windowSize <= maxWindow; windowSize++) {
      const segment = blockWords.slice(i, i + windowSize).join(' ');

      // Use multiple similarity metrics and combine them
      const trigramScore = stringSimilarity.compareTwoStrings(segment, normalizedTarget);
      const levenScore = levenshteinSimilarity(segment, normalizedTarget);

      // Word overlap score (Jaccard-like)
      const segmentWordSet = new Set(segment.split(' '));
      const targetWordSet = new Set(normalizedTarget.split(' '));
      const intersection = [...segmentWordSet].filter((w) => targetWordSet.has(w)).length;
      const union = new Set([...segmentWordSet, ...targetWordSet]).size;
      const wordOverlapScore = union > 0 ? intersection / union : 0;

      // Weighted combination of scores
      const combinedScore = trigramScore * 0.4 + levenScore * 0.3 + wordOverlapScore * 0.3;

      if (combinedScore > bestScore) {
        bestScore = combinedScore;
        bestStartWordIndex = i;
        bestWindowSize = windowSize;
      }
    }
  }

  // Strategy 4: First few words match (for truncated or reformatted text)
  if (bestScore < threshold && targetWords.length >= 3) {
    const firstThreeWords = targetWords.slice(0, 3).join(' ');
    for (let i = 0; i < blockWords.length - 2; i++) {
      const blockSegment = blockWords.slice(i, i + 3).join(' ');
      const similarity = stringSimilarity.compareTwoStrings(blockSegment, firstThreeWords);
      if (similarity > 0.7) {
        // Found a match at the start, extend to find the full segment
        const extendedWindowSize = Math.min(targetWords.length + 2, blockWords.length - i);
        const extendedSegment = blockWords.slice(i, i + extendedWindowSize).join(' ');
        const charIndex = findCharIndexForWords(normalizedBlock, i);
        const originalIndex = findOriginalIndex(blockText, extendedSegment, charIndex);
        return {
          startIndex: originalIndex,
          matchText: getOriginalCaseText(blockText, originalIndex, extendedSegment.length),
          score: similarity,
        };
      }
    }
  }

  // Strategy 5: Key phrase extraction - find the most distinctive phrase
  if (bestScore < threshold) {
    const keyPhrases = extractKeyPhrases(normalizedTarget);
    for (const phrase of keyPhrases) {
      const phraseIndex = normalizedBlock.indexOf(phrase);
      if (phraseIndex !== -1) {
        // Expand around the key phrase
        const startWordIdx = normalizedBlock.substring(0, phraseIndex).split(' ').length - 1;
        const expandLeft = Math.max(0, startWordIdx - 2);
        const expandRight = Math.min(
          blockWords.length,
          startWordIdx + phrase.split(' ').length + 2
        );
        const expandedSegment = blockWords.slice(expandLeft, expandRight).join(' ');
        const charIndex = findCharIndexForWords(normalizedBlock, expandLeft);
        const originalIndex = findOriginalIndex(blockText, expandedSegment, charIndex);
        return {
          startIndex: originalIndex,
          matchText: getOriginalCaseText(blockText, originalIndex, expandedSegment.length),
          score: 0.6, // Moderate confidence
        };
      }
    }
  }

  // Reject poor matches
  if (bestScore < threshold) {
    console.warn(
      `No close enough match found for "${targetText.substring(0, 50)}..." (best score: ${bestScore.toFixed(2)})`
    );
    return null;
  }

  // Calculate result from best sliding window match
  const bestMatchSegment = blockWords
    .slice(bestStartWordIndex, bestStartWordIndex + bestWindowSize)
    .join(' ');
  const charIndex = findCharIndexForWords(normalizedBlock, bestStartWordIndex);
  const originalIndex = findOriginalIndex(blockText, bestMatchSegment, charIndex);

  return {
    startIndex: originalIndex,
    matchText: getOriginalCaseText(blockText, originalIndex, bestMatchSegment.length),
    score: bestScore,
  };
}

/**
 * Find the longest contiguous sequence of matching words
 */
function findLongestMatchingSequence(
  blockWords: string[],
  targetWords: string[]
): { words: string[]; startIndex: number; score: number } | null {
  let longestMatch: { words: string[]; startIndex: number; score: number } | null = null;

  for (let i = 0; i < blockWords.length; i++) {
    let matchCount = 0;
    let j = 0;

    while (i + matchCount < blockWords.length && j < targetWords.length) {
      if (blockWords[i + matchCount] === targetWords[j]) {
        matchCount++;
        j++;
      } else if (matchCount > 0) {
        // Allow one skip for minor variations
        j++;
      } else {
        break;
      }
    }

    if (matchCount >= 3) {
      const score = matchCount / targetWords.length;
      if (!longestMatch || matchCount > longestMatch.words.length) {
        longestMatch = {
          words: blockWords.slice(i, i + matchCount),
          startIndex: i,
          score,
        };
      }
    }
  }

  return longestMatch;
}

/**
 * Find character index for word index in normalized text
 */
function findCharIndexForWords(normalizedText: string, wordIndex: number): number {
  const words = normalizedText.split(' ');
  if (wordIndex === 0) return 0;

  const prefix = words.slice(0, wordIndex).join(' ');
  return prefix.length + 1; // +1 for the space after prefix
}

/**
 * Find the original index in the non-normalized text
 */
function findOriginalIndex(
  originalText: string,
  matchText: string,
  approximateIndex: number
): number {
  // Try exact match first around the approximate index
  const searchStart = Math.max(0, approximateIndex - 20);
  const searchEnd = Math.min(originalText.length, approximateIndex + matchText.length + 20);
  const searchArea = originalText.substring(searchStart, searchEnd).toLowerCase();
  const normalizedMatch = matchText.toLowerCase();

  const foundIndex = searchArea.indexOf(normalizedMatch);
  if (foundIndex !== -1) {
    return searchStart + foundIndex;
  }

  // Fallback to approximate index
  return Math.max(0, approximateIndex);
}

/**
 * Get the original case text from the block
 */
function getOriginalCaseText(originalText: string, startIndex: number, length: number): string {
  return originalText.substring(startIndex, startIndex + length);
}

/**
 * Extract key phrases (3-4 word sequences) from text that might be distinctive
 */
function extractKeyPhrases(text: string): string[] {
  const words = text.split(' ').filter((w) => w.length > 2);
  const phrases: string[] = [];

  // Get 3-word phrases from start, middle, and end
  if (words.length >= 3) {
    phrases.push(words.slice(0, 3).join(' ')); // start
    if (words.length >= 6) {
      const mid = Math.floor(words.length / 2);
      phrases.push(words.slice(mid - 1, mid + 2).join(' ')); // middle
    }
    if (words.length >= 4) {
      phrases.push(words.slice(-3).join(' ')); // end
    }
  }

  return phrases;
}
