import { SetStateAction } from 'react';
import { ModeCard } from '@/components/ui/copilot-card';
import { HoverCardState } from '@/features/ai-copilot/hooks/useHoverCard';
import { Compliance, FactChecker } from '@/types/copilot';

export function getCardContent(
  hoverCard: HoverCardState,
  replaceHighlightedText: (blockId: string, text: string) => void,
  setHoverCard: React.Dispatch<SetStateAction<HoverCardState>>
): React.ReactNode {
  if (!hoverCard.mode || !hoverCard.data || !hoverCard.blockId) return null;

  const { mode, data, blockId } = hoverCard;

  switch (mode) {
    case 'fact-checker': {
      const factData = data as FactChecker;
      return (
        <ModeCard
          mode="fact-checker"
          buttonLabel="Use"
          onButtonClick={() => {
            replaceHighlightedText(
              blockId,
              factData.fact.correctedStatement.replace(/<[^>]*>/g, '')
            );
          }}
          fact={factData}
          onClose={() => {
            setHoverCard({
              visible: false,
              mode: null,
              blockId: null,
              position: { x: 0, y: 0 },
              data: null,
            });
          }}
        />
      );
    }
    case 'compliance': {
      const complianceData = data as Compliance;
      return (
        <ModeCard
          mode="compliance"
          compliance={complianceData}
          onClose={() => {
            setHoverCard({
              visible: false,
              mode: null,
              blockId: null,
              position: { x: 0, y: 0 },
              data: null,
            });
          }}
        />
      );
    }
    case 'argument': {
      const argData = data as { statement: any; contradiction_score: number };
      return (
        <ModeCard
          mode="argument"
          buttonLabel="Use"
          contradictionScore={argData.contradiction_score}
          statement={argData.statement.correctedStatement}
          onButtonClick={() => {
            replaceHighlightedText(blockId, argData.statement.correctedStatement);
          }}
          onClose={() => {
            setHoverCard({
              visible: false,
              mode: null,
              blockId: null,
              position: { x: 0, y: 0 },
              data: null,
            });
          }}
        />
      );
    }
    default:
      return null;
  }
}
