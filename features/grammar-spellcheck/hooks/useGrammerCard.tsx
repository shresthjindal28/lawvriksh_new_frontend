import { useCallback, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';

export interface GrammarCardState {
  visible: boolean;
  blockId: string | null;
  wrongText: string | null;
  correctedText: string | null;
  position: { x: number; y: number };
}

export function useGrammarCard(
  replaceHighlightedText: (blockId: string, wrongText: string, correctedText: string) => void
) {
  const grammarCardRef = useRef<HTMLDivElement | null>(null);
  const grammarCardRoot = useRef<Root | null>(null);

  const [grammarCard, setGrammarCard] = useState<GrammarCardState>({
    visible: false,
    blockId: null,
    wrongText: null,
    correctedText: null,
    position: { x: 0, y: 0 },
  });

  const renderGrammarCard = useCallback(() => {
    if (!grammarCard.visible || !grammarCard.blockId || !grammarCard.correctedText) {
      // Cleanup old card
      if (grammarCardRef.current) {
        const el = grammarCardRef.current;
        const root = grammarCardRoot.current;
        setTimeout(() => {
          root?.unmount();
          el.remove();
        }, 0);
        grammarCardRef.current = null;
        grammarCardRoot.current = null;
      }
      return;
    }

    // Create container if not exists
    if (!grammarCardRef.current) {
      grammarCardRef.current = document.createElement('div');
      grammarCardRef.current.className = 'hover-card-container grammar-card';
      document.body.appendChild(grammarCardRef.current);
    }

    Object.assign(grammarCardRef.current.style, {
      position: 'fixed',
      left: `${grammarCard.position.x}px`,
      top: `${grammarCard.position.y}px`,
      zIndex: '9999',
    });

    const card = (
      <div className="grammar-card">
        <div className="grammar-card-inner">
          <div className="grammar-title">Grammar Suggestion</div>

          <div className="grammar-label">Correction:</div>

          <div className="grammar-corrected">{grammarCard.correctedText}</div>

          <button
            onClick={() =>
              replaceHighlightedText(
                grammarCard.blockId!,
                grammarCard.wrongText!, // pass wrong text
                grammarCard.correctedText!
              )
            }
            className="apply-button"
          >
            Apply Correction
          </button>
        </div>
      </div>
    );

    if (!grammarCardRoot.current) {
      grammarCardRoot.current = createRoot(grammarCardRef.current);
    }

    grammarCardRoot.current.render(card);
  }, [grammarCard, replaceHighlightedText]);

  const cleanup = useCallback(() => {
    grammarCardRoot.current?.unmount();
    grammarCardRef.current?.remove();
    grammarCardRef.current = null;
    grammarCardRoot.current = null;
  }, []);

  return { grammarCard, setGrammarCard, renderGrammarCard, cleanup };
}
