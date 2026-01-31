import React, { useState, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, GripVertical } from 'lucide-react';

interface DraftActionCardProps {
  onAccept: () => void;
  onDiscard: () => void;
  position?: { top: number; left: number };
  onPositionChange?: (newPosition: { top: number; left: number }) => void;
}

const DraftActionCard: React.FC<DraftActionCardProps> = ({
  onAccept,
  onDiscard,
  position,
  onPositionChange,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [initialPosition, setInitialPosition] = useState({ top: 0, left: 0 });
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging || !position) return;

      const deltaX = e.clientX - dragStart.x;
      const deltaY = e.clientY - dragStart.y;

      const newPosition = {
        top: initialPosition.top + deltaY,
        left: initialPosition.left + deltaX,
      };

      onPositionChange?.(newPosition);
    };

    const handleMouseUp = () => {
      setIsDragging(false);
    };

    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = 'none';
      document.body.style.cursor = 'grabbing';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.userSelect = '';
      document.body.style.cursor = '';
    };
  }, [isDragging, dragStart, initialPosition, position, onPositionChange]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!position) return;

    setDragStart({
      x: e.clientX,
      y: e.clientY,
    });

    setInitialPosition({
      top: position.top,
      left: position.left,
    });

    setIsDragging(true);
    e.preventDefault();
    e.stopPropagation();
  };

  return (
    <div
      ref={cardRef}
      className={`draft-action-card bg-white shadow-xl rounded-lg border border-gray-200 p-1 flex flex-col w-40 z-50 ${isDragging ? 'cursor-grabbing opacity-80' : 'cursor-grab'}`}
      style={
        position ? { position: 'absolute', top: position.top, left: position.left } : undefined
      }
    >
      {/* Drag Handle */}
      <div
        className="flex justify-center py-1 cursor-grab hover:bg-gray-50 rounded transition-colors"
        onMouseDown={handleMouseDown}
        title="Drag to reposition"
      >
        <GripVertical size={14} className="text-gray-400" />
      </div>

      {/* Action Buttons */}
      <button
        onClick={onAccept}
        disabled={isDragging}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md text-gray-600 hover:text-green-600 text-sm font-medium transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <CheckCircle2 size={16} />
        <span>Accept</span>
      </button>
      <button
        onClick={onDiscard}
        disabled={isDragging}
        className="flex items-center gap-3 px-3 py-2.5 hover:bg-gray-50 rounded-md text-gray-600 hover:text-red-500 text-sm font-medium transition-colors text-left disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <XCircle size={16} />
        <span>Discard</span>
      </button>
    </div>
  );
};

export default DraftActionCard;
