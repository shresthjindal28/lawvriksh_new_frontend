import { useCallback, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CSS_CLASSES } from '@/lib/constants/editor';

export interface SpellCardState {
  visible: boolean;
  blockId: string | null;
  word: string | null;
  position: { x: number; y: number };
  suggestions: string[];
}

export function useSpellCard(
  replaceHighlightedText: (blockId: string, correctedText: string) => void
) {
  const spellCardRef = useRef<HTMLDivElement | null>(null);
  const cardRootRef = useRef<Root | null>(null);

  const [spellCard, setSpellCard] = useState<SpellCardState>({
    visible: false,
    blockId: null,
    word: null,
    position: { x: 0, y: 0 },
    suggestions: [],
  });

  const renderSpellCard = useCallback(() => {
    if (!spellCard.visible || !spellCard.word || !spellCard.blockId) {
      // cleanup old card
      if (spellCardRef.current) {
        const element = spellCardRef.current;
        const rootToUnmount = cardRootRef.current;

        setTimeout(() => {
          try {
            rootToUnmount?.unmount();
          } catch (e) {
            console.error('Unmount error:', e);
          }
          element.remove();
        }, 0);

        spellCardRef.current = null;
        cardRootRef.current = null;
      }
      return;
    }

    // Create or reuse container
    if (!spellCardRef.current) {
      spellCardRef.current = document.createElement('div');
      spellCardRef.current.className = 'hover-card-container spell-card';
      document.body.appendChild(spellCardRef.current);
    }

    Object.assign(spellCardRef.current.style, {
      position: 'fixed',
      left: `${spellCard.position.x}px`,
      top: `${spellCard.position.y}px`,
      zIndex: '9999',
    });

    // ✅ Render card content
    const cardContent = (
      <div className="bg-white border rounded-lg shadow-lg p-3 w-64 font-sans text-sm">
        <div className="font-semibold text-red-600 mb-2">Misspelled: {spellCard.word}</div>

        {spellCard.suggestions.length > 0 ? (
          <div className="flex flex-col space-y-1">
            {spellCard.suggestions.map((s, i) => (
              <button
                key={i}
                onClick={() => replaceHighlightedText(spellCard.blockId!, s)}
                className="text-blue-600 hover:underline text-left"
              >
                Replace with “{s}”
              </button>
            ))}
          </div>
        ) : (
          <div className="text-gray-500 italic">No suggestions available</div>
        )}
      </div>
    );

    if (!cardRootRef.current) {
      cardRootRef.current = createRoot(spellCardRef.current);
    }
    cardRootRef.current.render(cardContent);
  }, [spellCard, replaceHighlightedText]);

  const cleanup = useCallback(() => {
    setTimeout(() => {
      try {
        cardRootRef.current?.unmount();
      } catch (e) {
        console.error('Cleanup error:', e);
      }
      spellCardRef.current?.remove();
    }, 0);
  }, []);

  return { spellCard, setSpellCard, renderSpellCard, cleanup };
}
