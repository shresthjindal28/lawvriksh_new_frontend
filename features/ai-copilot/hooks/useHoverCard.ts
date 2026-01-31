import { useCallback, useRef, useState } from 'react';
import { createRoot, Root } from 'react-dom/client';
import { CardMode } from '@/components/ui/copilot-card';
import { getCardContent } from '@/lib/utils/cardHelper';
import { CopilotResponse } from '@/types/copilot';

export interface HoverCardState {
  visible: boolean;
  mode: CardMode | null;
  blockId: string | null;
  position: { x: number; y: number };
  data: any;
}

export function useHoverCard(
  replaceHighlightedText: (blockId: string, text: string) => void,
  aiCopilotData: CopilotResponse | null
) {
  const hoverCardRef = useRef<HTMLDivElement | null>(null);
  const cardRootRef = useRef<Root | null>(null);
  const [hoverCard, setHoverCard] = useState<HoverCardState>({
    visible: false,
    mode: null,
    blockId: null,
    position: { x: 0, y: 0 },
    data: null,
  });

  const renderCard = useCallback(() => {
    if (!hoverCard.visible || !hoverCard.mode || !hoverCard.data) {
      if (hoverCardRef.current) {
        // Capture refs before async operation
        const cardElement = hoverCardRef.current;
        const rootToUnmount = cardRootRef.current;

        // Schedule cleanup after current render
        setTimeout(() => {
          if (rootToUnmount) {
            try {
              rootToUnmount.unmount();
            } catch (error) {
              console.error('Error unmounting hover card:', error);
            }
          }
          if (cardElement && cardElement.parentNode) {
            cardElement.remove();
          }
        }, 0);

        hoverCardRef.current = null;
        cardRootRef.current = null;
      }
      return;
    }

    if (!hoverCardRef.current) {
      hoverCardRef.current = document.createElement('div');
      hoverCardRef.current.className = 'hover-card-container';
      document.body.appendChild(hoverCardRef.current);
    }

    Object.assign(hoverCardRef.current.style, {
      position: 'fixed',
      left: `${hoverCard.position.x}px`,
      top: `${hoverCard.position.y}px`,
      zIndex: '9999',
    });

    const cardContent = getCardContent(hoverCard, replaceHighlightedText, setHoverCard);

    if (!cardRootRef.current) {
      cardRootRef.current = createRoot(hoverCardRef.current);
    }
    cardRootRef.current.render(cardContent);
  }, [hoverCard, replaceHighlightedText]);

  const cleanup = useCallback(() => {
    setTimeout(() => {
      if (cardRootRef.current) {
        try {
          cardRootRef.current.unmount();
        } catch (error) {
          console.error('Error unmounting hover card on cleanup:', error);
        }
      }
      if (hoverCardRef.current && hoverCardRef.current.parentNode) {
        hoverCardRef.current.remove();
      }
    }, 0);
  }, []);

  return { hoverCard, setHoverCard, renderCard, cleanup };
}
