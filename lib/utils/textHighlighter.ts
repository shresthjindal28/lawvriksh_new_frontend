import { CSS_CLASSES, TIMING } from '@/lib/constants/editor';
import stringSimilarity from 'string-similarity';

class TextHighlighter {
  static findTextNode(
    editableElement: Element,
    targetIndex: number
  ): { node: Text; offset: number } | null {
    const walker = document.createTreeWalker(editableElement, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let targetNode: Text | null = null;

    while ((targetNode = walker.nextNode() as Text)) {
      const nodeLength = targetNode.nodeValue?.length || 0;
      if (!nodeLength) continue;

      if (charCount <= targetIndex && targetIndex < charCount + nodeLength) {
        return { node: targetNode, offset: targetIndex - charCount };
      }
      charCount += nodeLength;
    }
    return null;
  }

  static highlightRange(
    editableElement: Element,
    startIndex: number,
    length: number,
    className: string,
    attributes?: Record<string, string>
  ): HTMLSpanElement[] {
    const textContent = editableElement.textContent || '';
    if (!textContent.trim()) return [];

    // ---------- Normalize ----------
    const normalizedContent = textContent.replace(/\s+/g, ' ').trim().toLowerCase();
    const normalizedTarget = attributes?.['data-original-text']
      ? attributes['data-original-text'].replace(/\s+/g, ' ').trim().toLowerCase()
      : '';

    // ---------- Try direct match ----------
    let actualIndex = textContent.indexOf(attributes?.['data-original-text'] || '');

    // ---------- If not found → fuzzy ----------
    if (actualIndex === -1 && normalizedTarget) {
      const contentWords = normalizedContent.split(' ');
      const targetWords = normalizedTarget.split(' ');

      let bestScore = 0;
      let bestIndex = -1;

      for (let i = 0; i <= contentWords.length - targetWords.length; i++) {
        const segment = contentWords.slice(i, i + targetWords.length).join(' ');
        const score = stringSimilarity.compareTwoStrings(segment, normalizedTarget);
        if (score > bestScore) {
          bestScore = score;
          bestIndex = i;
        }
      }

      if (bestScore >= 0.55 && bestIndex !== -1) {
        const wordsBefore = contentWords.slice(0, bestIndex).join(' ');
        actualIndex =
          textContent.toLowerCase().indexOf(wordsBefore) +
          wordsBefore.length +
          (wordsBefore.length > 0 ? 1 : 0);
      }
    }

    if (actualIndex === -1) return [];

    // ---------- Resolve text node ----------
    const result = this.findTextNode(editableElement, actualIndex);
    if (!result) return [];

    const { node, offset } = result;
    const endOffset = Math.min(offset + length, node.nodeValue?.length || 0);

    const range = document.createRange();
    range.setStart(node, offset);
    range.setEnd(node, endOffset);

    // ---------- IMPORTANT ----------
    // Get per-line rectangles
    const rects = Array.from(range.getClientRects());

    const highlights: HTMLSpanElement[] = [];

    rects.forEach((rect) => {
      const span = document.createElement('span');
      span.className = className;

      if (attributes) {
        Object.entries(attributes).forEach(([k, v]) => span.setAttribute(k, v));
      }

      Object.assign(span.style, {
        position: 'absolute',
        top: rect.top + window.scrollY + 'px',
        left: rect.left + window.scrollX + 'px',
        width: rect.width + 'px',
        height: rect.height + 'px',
        backgroundColor: 'yellow',
        opacity: '0.35',
        borderRadius: '3px',
        pointerEvents: 'none',
        zIndex: '10',
      });

      document.body.appendChild(span);
      highlights.push(span);
    });

    return highlights;
  }

  static removeHighlights(selectors: string[]) {
    const highlights = document.querySelectorAll(selectors.join(', '));
    highlights.forEach((span) => {
      const text = document.createTextNode(span.textContent || '');
      span.parentNode?.replaceChild(text, span);
    });
  }

  static highlightWord(editableElement: Element, word: string, position?: number) {
    const textContent = editableElement.textContent || '';
    if (!textContent.trim()) return;

    const normalizedContent = textContent.toLowerCase();
    const normalizedWord = word.toLowerCase();

    // If no position provided, try to find index
    let index = typeof position === 'number' ? position : normalizedContent.indexOf(normalizedWord);

    // If exact match not found, fallback to fuzzy search
    if (index === -1) {
      const words = normalizedContent.split(/\s+/);
      let bestScore = 0,
        bestStart = -1;
      const targetWords = normalizedWord.split(' ');

      for (let i = 0; i < words.length - targetWords.length + 1; i++) {
        const segment = words.slice(i, i + targetWords.length).join(' ');
        const score = window.stringSimilarity
          ? window.stringSimilarity.compareTwoStrings(segment, normalizedWord)
          : 0; // use global if not imported here

        if (score > bestScore) {
          bestScore = score;
          // Recalculate approximate char index
          const prefix = words.slice(0, i).join(' ');
          bestStart = normalizedContent.indexOf(prefix) + prefix.length + 1;
        }
      }

      if (bestScore >= 0.55 && bestStart !== -1) {
        index = bestStart;
      }
    }

    if (index === -1) return; // still not found

    const range = document.createRange();
    const walker = document.createTreeWalker(editableElement, NodeFilter.SHOW_TEXT, null);
    let charCount = 0;
    let targetNode: Text | null = null;

    while ((targetNode = walker.nextNode() as Text)) {
      const nodeLength = targetNode.nodeValue?.length || 0;
      if (charCount + nodeLength < index) {
        charCount += nodeLength;
        continue;
      }

      const startOffset = index - charCount;
      const endOffset = Math.min(startOffset + word.length, nodeLength);

      // Ensure valid range
      if (startOffset >= 0 && endOffset <= nodeLength) {
        range.setStart(targetNode, startOffset);
        range.setEnd(targetNode, endOffset);
      }
      break;
    }

    if (!range || range.collapsed) return;

    const span = document.createElement('span');
    span.className = CSS_CLASSES.HIGHLIGHT.WORD;
    span.setAttribute('data-spell-word', word);
    span.setAttribute(
      'data-highlight-id',
      editableElement.closest('[data-id]')?.getAttribute('data-id') || ''
    );
    span.setAttribute('data-suggestions', JSON.stringify(['example', 'corrected', 'text']));

    // Use highlight pseudo-element technique
    const rects = range.getClientRects();
    for (const rect of rects) {
      const overlay = span.cloneNode() as HTMLElement;
      overlay.style.position = 'absolute';
      overlay.style.left = `${rect.left + window.scrollX}px`;
      overlay.style.top = `${rect.top + window.scrollY}px`;
      overlay.style.width = `${rect.width}px`;
      overlay.style.height = `${rect.height}px`;
      overlay.style.backgroundColor = 'rgba(255, 0, 0, 0.2)';
      overlay.style.borderRadius = '2px';
      overlay.style.pointerEvents = 'none';
      overlay.style.zIndex = '1';
      overlay.classList.add('spell-highlight-overlay');
      document.body.appendChild(overlay);

      // Optionally fade out after highlight animation
      setTimeout(() => overlay.remove(), TIMING.HIGHLIGHT + 2000);
    }
  }

  static highlightGrammarCorrection(
    editableElement: Element,
    wrongText: string,
    correctedText: string
  ): HTMLSpanElement | null {
    try {
      const raw = editableElement.textContent || '';
      if (!raw.trim() || !wrongText || !wrongText.trim()) return null;

      const normalizedContent = raw.replace(/\s+/g, ' ').trim().toLowerCase();
      const normalizedWrong = wrongText.replace(/\s+/g, ' ').trim().toLowerCase();

      // Quick exact search first
      let charIndex = normalizedContent.indexOf(normalizedWrong);

      // If exact not found, do sliding-window fuzzy search
      if (charIndex === -1) {
        const contentWords = normalizedContent.split(' ');
        const targetWords = normalizedWrong.split(' ');
        let bestScore = 0;
        let bestWordIndex = -1;

        for (let i = 0; i <= contentWords.length - targetWords.length; i++) {
          const segment = contentWords.slice(i, i + targetWords.length).join(' ');
          const score = stringSimilarity.compareTwoStrings(segment, normalizedWrong);
          if (score > bestScore) {
            bestScore = score;
            bestWordIndex = i;
          }
        }

        if (bestScore >= 0.5 && bestWordIndex !== -1) {
          // Convert best word index back to char offset in normalizedContent
          const wordsBefore = contentWords.slice(0, bestWordIndex).join(' ');
          // position after wordsBefore (if empty, 0)
          charIndex = wordsBefore
            ? normalizedContent.indexOf(wordsBefore) + wordsBefore.length + 1
            : 0;
        }
      }

      if (charIndex === -1) {
        console.debug('highlightGrammarCorrection: no match found (fuzzy) for:', wrongText);
        return null;
      }

      // Map normalized charIndex back to real raw string index.
      // Because normalizedContent may have collapsed spaces, find a best-effort mapping:
      // We'll search for a window around the guessed substring in raw (case-insensitive).
      const guess = normalizedWrong;
      // Build a substring from normalizedContent starting at charIndex with same length in words
      // Fallback to searching for the first word of guess in raw if mapping fails.
      const possible = normalizedContent.substr(charIndex, Math.min(guess.length, 200));
      // Find possible in raw (case-insensitive)
      const rawLower = raw.toLowerCase();
      let realIndex = rawLower.indexOf(possible);
      if (realIndex === -1) {
        // fallback: search for first few characters (or first word)
        const firstToken = guess.split(' ').slice(0, 3).join(' ');
        realIndex = rawLower.indexOf(firstToken);
      }
      if (realIndex === -1) {
        // fallback: search for entire wrongText lowercased
        realIndex = rawLower.indexOf(guess);
      }
      if (realIndex === -1) {
        console.debug(
          'highlightGrammarCorrection: failed to map normalized index to raw index for:',
          wrongText
        );
        return null;
      }

      const matchLength = Math.min(wrongText.length, raw.length - realIndex);

      // Walk text nodes to find start and end nodes for the range
      const walker = document.createTreeWalker(editableElement, NodeFilter.SHOW_TEXT, null);
      let charCount = 0;
      let startNode: Text | null = null;
      let endNode: Text | null = null;
      let startOffset = 0;
      let endOffset = 0;
      let node: Text | null = null;

      while ((node = walker.nextNode() as Text)) {
        const nodeLen = node.nodeValue?.length || 0;
        if (!nodeLen) continue;

        // start node found
        if (startNode === null && charCount + nodeLen > realIndex) {
          startNode = node;
          startOffset = realIndex - charCount;
        }

        // end node found (when cumulative reaches realIndex + matchLength)
        if (startNode && charCount + nodeLen >= realIndex + matchLength) {
          endNode = node;
          endOffset = realIndex + matchLength - charCount;
          break;
        }

        charCount += nodeLen;
      }

      if (!startNode) {
        console.debug('highlightGrammarCorrection: startNode not found', {
          realIndex,
          wrongText,
        });
        return null;
      }
      if (!endNode) {
        // If endNode wasn't found, set it to last visited node (safe fallback)
        endNode = startNode;
        endOffset = Math.min(startOffset + matchLength, startNode.nodeValue?.length || 0);
      }

      const range = document.createRange();
      range.setStart(startNode, startOffset);
      range.setEnd(endNode, endOffset);

      if (editableElement.querySelector(`[data-grammar-id="${wrongText}::${correctedText}"]`)) {
        return null;
      }
      const blockId = editableElement.closest('[data-id]')?.getAttribute('data-id') || 'unknown';

      // Create span wrapper
      const span = document.createElement('span');
      span.className = 'highlight-grammar-error';
      span.setAttribute('data-grammar-error', wrongText);
      span.setAttribute('data-corrected-text', correctedText);
      span.setAttribute('data-grammar-id', `${wrongText}::${correctedText}`);
      span.setAttribute('data-highlight-id', blockId);

      span.style.background = 'rgba(250, 204, 21, 0.15)'; // subtle highlight
      span.style.borderRadius = '4px';
      span.style.padding = '0 2px';

      // Replace range with span
      range.deleteContents();
      range.insertNode(span);
      // insert original text inside span (preserve original casing/whitespace)
      span.textContent = raw.substr(realIndex, matchLength);

      // Optional: scroll into view or add fade-in
      span.classList.add('grammar-highlight-active');

      // Clean up
      range.detach?.();

      console.debug('highlightGrammarCorrection: highlighted', {
        realIndex,
        matchLength,
        wrongText,
      });
      return span;
    } catch (err) {
      console.error('highlightGrammarCorrection error', err);
      return null;
    }
  }
}

export default TextHighlighter;
