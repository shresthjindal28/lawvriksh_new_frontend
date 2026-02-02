import type React from 'react';
import { Compass } from 'lucide-react';
import '@/styles/ui-styles/explore-more-button.css';
export type ExploreMoreButtonProps = {
  label?: string;
  onClickHandler: () => void;
};

export function ExploreMoreButton({
  label = 'Explore More',
  onClickHandler,
}: ExploreMoreButtonProps) {
  return (
    <div
      onClick={onClickHandler}
      className="inline-flex items-center gap-2 bg-black text-white rounded-full py-1.5 pl-1.5 pr-2.5 leading-none font-sans border border-black/5 cursor-pointer max-md:w-fit"
    >
      <Compass size={33} color="white" strokeWidth={1.4} />
      <span className="text-sm font-normal whitespace-nowrap max-md:hidden">{label}</span>
    </div>
  );
}

export default ExploreMoreButton;
