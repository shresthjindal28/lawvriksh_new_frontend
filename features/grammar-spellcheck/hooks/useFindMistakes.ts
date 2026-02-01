import { OutputData } from '@editorjs/editorjs';
import EditorJS from '@editorjs/editorjs';
import { useCallback, useRef, useEffect, useState, useMemo } from 'react';
import nspell from 'nspell';
import { extractTextFromBlock, stripHtml } from '@/lib/utils/helpers';
import { CorrectedGrammerMistake, CorrectedMistake, GrammerCheckRequest } from '@/types/spellcheck';
import GrammerSpellCheckService from '@/lib/api/grammerSpellCheckService';
import { EditorStats } from '@/types/editor';
import stringSimilarity from 'string-similarity';
import TextHighlighter from '@/lib/utils/textHighlighter';
import { CSS_CLASSES } from '@/lib/constants/editor';
import { useSettings } from '@/lib/contexts/SettingsContext';

interface useFindMistakesProps {
  stats?: EditorStats;
  isGrammerSpellCheckOn: boolean;
}

export const useFindMistakes = ({ stats, isGrammerSpellCheckOn }: useFindMistakesProps) => {
  const cleanBlocks = useRef<Map<string, string>>(new Map());
  const debounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const grammarDebounceTimers = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const spellChecker = useRef<any>(null);
  const isInitializing = useRef(false);

  // track last text that was SENT to grammar service to avoid re-sends
  const lastSentTextRef = useRef<Map<string, string>>(new Map());

  // track last grammar response fingerprint per block so duplicates are ignored
  const lastGrammarResponseHash = useRef<Map<string, string>>(new Map());
  const lastGrammarMistakesRef = useRef<Map<string, string>>(new Map());

  const [correctedMistakes, setCorrectedMistakes] = useState<CorrectedMistake[]>([]);
  const [correctedGrammerMistakes, setCorrectedGrammerMistakes] = useState<
    CorrectedGrammerMistake[]
  >([]);

  const statsRef = useRef(stats);
  const isGrammarOnRef = useRef(isGrammerSpellCheckOn);
  const { settings } = useSettings();

  useEffect(() => {
    statsRef.current = stats;
    isGrammarOnRef.current = isGrammerSpellCheckOn;
  }, [stats, isGrammerSpellCheckOn]);

  const grammerSpellCheckService = useMemo(() => {
    const wsUrl = process.env.NEXT_PUBLIC_WS_URL_GRAMMER_SPELL!;
    return new GrammerSpellCheckService({ WsUrl: wsUrl });
  }, []);

  const initSpellChecker = useCallback(async () => {
    if (spellChecker.current || isInitializing.current) return;
    isInitializing.current = true;
    try {
      const affUrl = '/dictionaries/index.aff';
      const dicUrl = '/dictionaries/index.dic';
      const [affResponse, dicResponse] = await Promise.all([fetch(affUrl), fetch(dicUrl)]);
      const affData = await affResponse.text();
      const dicData = await dicResponse.text();
      spellChecker.current = nspell({ aff: affData, dic: dicData });
    } catch (error) {
      console.error('Failed to initialize spell checker:', error);
    } finally {
      isInitializing.current = false;
    }
  }, []);

  useEffect(() => {
    initSpellChecker();
  }, [initSpellChecker]);

  const checkForMistakesInText = useCallback(
    async (text: string) => {
      if (!spellChecker.current) {
        await initSpellChecker();
      }
      if (!spellChecker.current) return { hasMistakes: false, mistakes: [] };

      const cleanText = stripHtml(text);
      const wordRegex = /\b[a-zA-Z']+\b/g;
      const mistakes: Array<{ word: string; suggestions: string[]; position?: number }> = [];
      let match;
      while ((match = wordRegex.exec(cleanText)) !== null) {
        const word = match[0];
        const position = match.index;
        if (word.length < 2 || /\d/.test(word)) continue;
        // skip common contractions
        if (word.includes("'")) {
          const commonContractions = [
            "don't",
            "can't",
            "won't",
            "shouldn't",
            "wouldn't",
            "couldn't",
            "isn't",
            "aren't",
            "wasn't",
            "weren't",
            "haven't",
            "hasn't",
            "hadn't",
            "it's",
            "that's",
          ];
          if (commonContractions.includes(word.toLowerCase())) continue;
        }
        const isCorrect = spellChecker.current.correct(word);
        if (!isCorrect) {
          const suggestions = spellChecker.current.suggest(word).slice(0, 5);
          mistakes.push({ word, suggestions, position });
        }
      }
      return { hasMistakes: mistakes.length > 0, mistakes };
    },
    [initSpellChecker]
  );

  const makeGrammarResponseHash = (data: CorrectedGrammerMistake) => {
    const parts = data.correction
      .map((c) => `${(c.wrongText || '').trim()}::${(c.text || '').trim()}`)
      .join('|');
    return parts;
  };

  function findClosestBlockForText(targetText: string, threshold = 0.55) {
    const allBlocks = Array.from(document.querySelectorAll("[data-id] [contenteditable='true']"));
    const normalizedTarget = (targetText || '').replace(/\s+/g, ' ').trim().toLowerCase();
    let bestMatch = { blockId: null as string | null, element: null as Element | null, score: 0 };
    for (const editable of allBlocks) {
      const blockId = editable.closest('[data-id]')?.getAttribute('data-id') || '';
      const text = editable.textContent || '';
      const normalizedText = text.replace(/\s+/g, ' ').trim().toLowerCase();
      const contentWords = normalizedText.split(' ');
      const targetWords = normalizedTarget.split(' ');
      let bestLocalScore = 0;
      for (let i = 0; i <= Math.max(0, contentWords.length - targetWords.length); i++) {
        const segment = contentWords.slice(i, i + targetWords.length).join(' ');
        const score = stringSimilarity.compareTwoStrings(segment, normalizedTarget);
        if (score > bestLocalScore) bestLocalScore = score;
      }
      if (bestLocalScore > bestMatch.score && bestLocalScore >= threshold) {
        bestMatch = { blockId, element: editable, score: bestLocalScore };
      }
    }
    return bestMatch;
  }

  const ensureHighlightUnique = (
    element: Element | null,
    start: number,
    length: number,
    highlightClass: string,
    attrs: Record<string, string>
  ) => {
    if (!element) return;
    const selParts: string[] = [];
    if (attrs['data-original-text'])
      selParts.push(`[data-original-text="${CSSEscape(attrs['data-original-text'])}"]`);
    if (attrs['data-highlight-id'])
      selParts.push(`[data-highlight-id="${CSSEscape(attrs['data-highlight-id'])}"]`);
    if (attrs['data-grammar-error'])
      selParts.push(`[data-grammar-error="${CSSEscape(attrs['data-grammar-error'])}"]`);
    const selector = selParts.join('');
    if (selector && element.querySelector(selector)) return;
    TextHighlighter.highlightRange(element, start, length, highlightClass, attrs);
  };

  function CSSEscape(s: string) {
    return s.replace(/(["'\\])/g, '\\$1');
  }
  const handleSendParagraphForGrammarCheck = useCallback(
    async (text: string, blockId: string) => {
      if (!text?.trim()) return;
      const existingTimer = grammarDebounceTimers.current.get(blockId);
      if (existingTimer) clearTimeout(existingTimer);

      const timer = setTimeout(async () => {
        try {
          const payload: GrammerCheckRequest = { blockId, text };
          await grammerSpellCheckService.sendGrammarCheck(payload);
        } catch (error) {
          console.error('Error sending paragraph for grammar check:', error);
        } finally {
          grammarDebounceTimers.current.delete(blockId);
        }
      }, 5000);

      grammarDebounceTimers.current.set(blockId, timer);
    },
    [grammerSpellCheckService]
  );

  const processBlock = useCallback(
    async (block: any, blockId: string) => {
      const newBlockText = extractTextFromBlock(block);

      const existingTimer = debounceTimers.current.get(blockId);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }

      const lastCleanText = cleanBlocks.current.get(blockId);
      if (newBlockText === lastCleanText) {
        return;
      }

      const timer = setTimeout(async () => {
        try {
          // Local spellcheck (if enabled)
          if (spellChecker.current && settings.editor.spellCheck) {
            const result = await checkForMistakesInText(newBlockText);
            if (result.hasMistakes) {
              cleanBlocks.current.delete(blockId);

              const localCandidate: CorrectedMistake = {
                blockId,
                mistakes: result.mistakes.map((m) => ({
                  word: m.word,
                  suggestions: m.suggestions,
                  position: m.position!,
                })),
              };

              setCorrectedMistakes((prev) => {
                const exists = prev.some(
                  (p) =>
                    p.blockId === localCandidate.blockId &&
                    p.mistakes?.[0]?.word === localCandidate.mistakes?.[0]?.word
                );
                if (exists) return prev;
                return [...prev, localCandidate];
              });
            } else {
              // mark clean and remove local highlights for this block
              cleanBlocks.current.set(blockId, newBlockText);
              TextHighlighter.removeHighlights([`[data-highlight-id="${CSSEscape(blockId)}"]`]);
            }
          }

          // Grammar WS: only send if grammarCheck enabled and text changed since last send
          if (settings.editor.grammarCheck) {
            const lastSent = lastSentTextRef.current.get(blockId) || '';
            const previousMistakesHash = lastGrammarMistakesRef.current.get(blockId) || '';
            const currentText = newBlockText.trim();

            // If text unchanged AND previous mistakes exist → DO NOT SEND AGAIN
            if (lastSent === currentText && previousMistakesHash) {
              return;
            }

            // else send new request
            await handleSendParagraphForGrammarCheck(currentText, blockId);
            lastSentTextRef.current.set(blockId, currentText);
          }
        } catch (err) {
          console.error('processBlock error:', err);
        } finally {
          debounceTimers.current.delete(blockId);
        }
      }, 5000);

      debounceTimers.current.set(blockId, timer);
    },
    [checkForMistakesInText, handleSendParagraphForGrammarCheck, settings.editor]
  );

  const findMistakes = useCallback(
    async (api: EditorJS, event: CustomEvent, getContent: () => Promise<OutputData>) => {
      if (statsRef.current && statsRef.current.wordCount < 100) return;
      if (!isGrammarOnRef.current) return;
      if (!settings.editor.grammarCheck && !settings.editor.spellCheck) return;

      const eventType = event?.type || event?.detail?.type;

      // handle remove
      if (eventType === 'block-removed') {
        const blockId = event?.detail?.target?.id;
        if (blockId) {
          cleanBlocks.current.delete(blockId);
          const timer = debounceTimers.current.get(blockId);
          if (timer) {
            clearTimeout(timer);
            debounceTimers.current.delete(blockId);
          }
          lastSentTextRef.current.delete(blockId);
          lastGrammarResponseHash.current.delete(blockId);
        }
        return;
      }

      if (
        eventType !== 'block-changed' &&
        eventType !== 'block-added' &&
        eventType !== 'block-updated'
      ) {
        return;
      }

      try {
        const savedData = await getContent();
        const blockIndex = event?.detail?.index ?? event?.detail?.detail?.index;

        if (blockIndex === undefined || blockIndex === null) {
          for (let i = 0; i < savedData.blocks.length; i++) {
            const block = savedData.blocks[i];
            if (block && block.id) {
              processBlock(block, block.id).catch(console.error);
            }
          }
          return;
        }

        const changedBlock = savedData.blocks[blockIndex];
        if (!changedBlock || !changedBlock.id) return;
        await processBlock(changedBlock, changedBlock.id);
      } catch (error) {
        console.error('Error in findMistakes:', error);
      }
    },
    [processBlock, settings.editor]
  );

  useEffect(() => {
    grammerSpellCheckService.setOnSpellHandler((data: CorrectedMistake) => {
      let blockId = data.blockId;
      if (!blockId || blockId === 'unknown') {
        const targetWord = data.mistakes?.[0]?.word;
        if (targetWord) {
          const found = findClosestBlockForText(targetWord);
          blockId = found.blockId || 'unknown';
          if (found.element && blockId !== 'unknown') {
            ensureHighlightUnique(found.element, 0, targetWord.length, CSS_CLASSES.HIGHLIGHT.WORD, {
              'data-original-text': targetWord,
              'data-highlight-id': blockId,
              'data-spell-word': targetWord,
            });
          }
        }
      }
      const updatedData = { ...data, blockId };
      setCorrectedMistakes((prev) => {
        const exists = prev.some(
          (item) =>
            item.blockId === updatedData.blockId &&
            item.mistakes?.[0]?.word === updatedData.mistakes?.[0]?.word
        );
        if (exists) return prev;
        return [...prev, updatedData];
      });
    });

    grammerSpellCheckService.setOnGrammarHandler((data: CorrectedGrammerMistake) => {
      const wrongText = data.correction[0]?.wrongText ?? '';
      const match = findClosestBlockForText(wrongText);
      const resolvedBlockId = match.blockId || 'unknown';
      const updated: CorrectedGrammerMistake = {
        blockId: resolvedBlockId,
        correction: data.correction,
      };

      const fingerprint = makeGrammarResponseHash(updated);
      const lastFingerprint = lastGrammarResponseHash.current.get(resolvedBlockId);
      lastGrammarMistakesRef.current.set(resolvedBlockId, fingerprint);

      if (lastFingerprint === fingerprint) {
        return;
      }

      lastGrammarResponseHash.current.set(resolvedBlockId, fingerprint);

      setCorrectedGrammerMistakes((prev) => {
        const exists = prev.some(
          (item) =>
            item.blockId === updated.blockId &&
            item.correction[0]?.wrongText === updated.correction[0]?.wrongText &&
            item.correction[0]?.text === updated.correction[0]?.text
        );
        if (exists) return prev;

        // safe highlighting in matched element
        if (match.element) {
          updated.correction.forEach((c) => {
            ensureHighlightUnique(
              match.element,
              0,
              (c.wrongText || '').length,
              CSS_CLASSES.HIGHLIGHT.WORD,
              {
                'data-original-text': c.wrongText || '',
                'data-highlight-id': updated.blockId,
                'data-grammar-error': c.wrongText || '',
                'data-corrected-text': c.text || '',
              }
            );
          });
        }

        return [...prev, updated];
      });
    });

    return () => grammerSpellCheckService.close();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [grammerSpellCheckService]);

  // ---------- cleanup ----------
  const cleanup = useCallback(() => {
    debounceTimers.current.forEach((timer) => clearTimeout(timer));
    debounceTimers.current.clear();
    grammarDebounceTimers.current.forEach((timer) => clearTimeout(timer));
    grammarDebounceTimers.current.clear();
    cleanBlocks.current.clear();
    lastSentTextRef.current.clear();
    lastGrammarResponseHash.current.clear();
    TextHighlighter.removeHighlights([
      `.${CSS_CLASSES.HIGHLIGHT.WORD}`,
      `.${CSS_CLASSES.HIGHLIGHT.GRAMMAR}`,
    ]);
  }, []);

  return {
    findMistakes,
    cleanup,
    isReady: !!spellChecker.current,
    correctedMistakes,
    setCorrectedMistakes,
    setCorrectedGrammerMistakes,
    correctedGrammerMistakes,
    handleSendParagraphForGrammarCheck,
  };
};
