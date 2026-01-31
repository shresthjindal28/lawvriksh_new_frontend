'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { GripVertical, Plus } from 'lucide-react';
import { NodeViewContent, NodeViewProps, NodeViewWrapper } from '@tiptap/react';
import BlockTypeMenu from './BlockTypeMenu';
import BlockActionsMenu from './BlockActionsMenu';

/**
 * RootBlockComponent - Custom Node View for block-based editing
 *
 * Renders each block with:
 * - Plus button (+) to show block type menu for adding new blocks
 * - Drag handle (⋮⋮) to drag OR click to show block actions menu
 * - Content area with the actual block content
 */
const RootBlockComponent: React.FC<NodeViewProps> = ({ node, getPos, editor, extension }) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showActionsMenu, setShowActionsMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const plusButtonRef = useRef<HTMLButtonElement>(null);
  const dragButtonRef = useRef<HTMLButtonElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  // Get callbacks from extension options
  const onSlash = extension?.options?.onSlash;
  const onAskAI = extension?.options?.onAskAI;

  // Derive empty state directly from node
  const isBlockEmpty = !node.textContent || node.textContent.trim() === '';

  // Listen for slash command event to open menu
  useEffect(() => {
    const handleOpenBlockMenu = (e: Event) => {
      const customEvent = e as CustomEvent;
      const { cursorPos, position, onSlash: slashCallback } = customEvent.detail;

      // Check if cursor is in this block
      const pos = getPos();
      if (typeof pos !== 'number') return;
      const nodeEnd = pos + node.nodeSize;

      if (cursorPos >= pos && cursorPos < nodeEnd) {
        // This is the block with the cursor - open the menu
        setMenuPosition(position);
        setShowAddMenu(true);

        // Store the onSlash callback for Continue with AI
        if (slashCallback) {
          (window as unknown as Record<string, unknown>).__blockMenuSlashCallback = slashCallback;
        }
      }
    };

    document.addEventListener('openBlockTypeMenu', handleOpenBlockMenu);
    return () => {
      document.removeEventListener('openBlockTypeMenu', handleOpenBlockMenu);
    };
  }, [getPos, node.nodeSize]);

  // Determine if controls should be visible
  const showControls = isHovered || showAddMenu || showActionsMenu;

  /**
   * Open the + menu at a given position
   */
  const openAddMenu = useCallback((anchorRect?: DOMRect) => {
    if (anchorRect) {
      setMenuPosition({
        top: anchorRect.bottom + 4,
        left: anchorRect.left,
      });
    } else if (plusButtonRef.current) {
      const rect = plusButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }
    setShowActionsMenu(false);
    setShowAddMenu(true);
  }, []);

  /**
   * Handle plus button click - show block type menu
   */
  const handlePlusClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    e.preventDefault();
    openAddMenu();
  };

  /**
   * Handle drag handle click - show block actions menu
   */
  const handleDragClick = (e: React.MouseEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      return;
    }

    e.stopPropagation();
    e.preventDefault();

    if (dragButtonRef.current) {
      const rect = dragButtonRef.current.getBoundingClientRect();
      setMenuPosition({
        top: rect.bottom + 4,
        left: rect.left,
      });
    }

    const currentPos = getPos();
    if (typeof currentPos === 'number') {
      editor.commands.setNodeSelection(currentPos);
    }

    setShowAddMenu(false);
    setShowActionsMenu(true);
  };

  const handleDragStart = () => {
    isDraggingRef.current = true;
  };

  const handleCloseAddMenu = () => {
    setShowAddMenu(false);
  };

  const handleCloseActionsMenu = () => {
    setShowActionsMenu(false);
  };

  const getInsertPosition = () => {
    const currentPos = getPos();
    if (typeof currentPos !== 'number') return 0;
    return currentPos + node.nodeSize;
  };

  const getBlockPosition = () => {
    const currentPos = getPos();
    if (typeof currentPos !== 'number') return 0;
    return currentPos;
  };

  const getCurrentBlockType = () => {
    if (node.firstChild) {
      const childType = node.firstChild.type.name;
      if (childType === 'heading') {
        const level = node.firstChild.attrs.level || 1;
        return `heading${level}`;
      }
      return childType;
    }
    return 'paragraph';
  };

  /**
   * Handle Continue with AI - triggers the AI drafting section
   */
  const handleContinueWithAI = () => {
    setShowAddMenu(false);
    if (onSlash) {
      onSlash();
    }
  };

  /**
   * Handle Ask AI from actions menu - selects block content and shows AI popup
   */
  const handleAskAIFromActionsMenu = () => {
    setShowActionsMenu(false);
    const pos = getPos();
    if (typeof pos === 'number' && node) {
      editor
        .chain()
        .focus()
        .setTextSelection({ from: pos + 1, to: pos + node.nodeSize - 1 })
        .run();
    }
    if (onAskAI) {
      onAskAI();
    }
  };

  return (
    <NodeViewWrapper
      as="div"
      ref={wrapperRef}
      className="group relative w-full rootblock-wrapper"
      onMouseEnter={(e: any) => {
        e.stopPropagation();
        setIsHovered(true);
      }}
      onMouseLeave={(e: any) => {
        e.stopPropagation();
        setIsHovered(false);
      }}
    >
      {/* Left controls - visible only on cursor position, NOT on hover */}
      <div
        className={`block-controls absolute top-0 flex items-start gap-0.5 transition-opacity duration-150 ${
          showControls ? 'opacity-100' : 'opacity-0'
        }`}
        contentEditable={false}
        aria-label="Block controls"
      >
        <button
          ref={plusButtonRef}
          type="button"
          onClick={handlePlusClick}
          className="p-1 rounded hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors"
          title="Add block"
        >
          <Plus size={16} strokeWidth={2} />
        </button>

        <button
          ref={dragButtonRef}
          type="button"
          draggable
          data-drag-handle
          onDragStart={handleDragStart}
          onClick={handleDragClick}
          className="p-1 rounded cursor-grab hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-colors active:cursor-grabbing"
          title="Drag to move or click for options"
        >
          <GripVertical size={16} strokeWidth={2} />
        </button>
      </div>

      <NodeViewContent className="w-full rootblock-content" />

      {showAddMenu && (
        <BlockTypeMenu
          editor={editor}
          position={getInsertPosition()}
          blockPos={getBlockPosition()}
          nodeSize={node.nodeSize}
          onClose={handleCloseAddMenu}
          anchorPosition={menuPosition}
          isCurrentBlockEmpty={isBlockEmpty}
          onContinueWithAI={handleContinueWithAI}
        />
      )}

      {showActionsMenu && (
        <BlockActionsMenu
          editor={editor}
          blockPos={getBlockPosition()}
          onClose={handleCloseActionsMenu}
          anchorPosition={menuPosition}
          currentBlockType={getCurrentBlockType()}
          onAskAI={handleAskAIFromActionsMenu}
        />
      )}
    </NodeViewWrapper>
  );
};

export default RootBlockComponent;
