import type React from 'react';
import '@/styles/ui-styles/explore-more-button.css';
import { Compass } from 'lucide-react';

export type ExploreMoreButtonProps = {
  label?: string;
  onClickHandler: () => void;
};

export function ExploreMoreButton({
  label = 'Explore More',
  onClickHandler,
}: ExploreMoreButtonProps) {
  return (
    <div onClick={onClickHandler} className="explore-more-button">
      <Compass size={33} color="white" strokeWidth={1.4} />

      <span className="progress-badge__label">{label}</span>
    </div>
  );
}

export default ExploreMoreButton;
