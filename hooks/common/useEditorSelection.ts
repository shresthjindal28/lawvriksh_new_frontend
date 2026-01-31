import { useState, useCallback } from 'react';
import { SelectedContext } from '@/types/editor';
import { OutputData } from '@editorjs/editorjs';
import { extractTextFromBlock } from '@/lib/utils/helpers';

interface SelectedContextWithPosition extends SelectedContext {
  position?: { top: number; left: number };
}

export function useEditorSelection(editorData: OutputData | null) {
  const [selectedContext, setSelectedContext] = useState<SelectedContextWithPosition | null>(null);

  const getBlockIndexById = useCallback(
    (blockId: string): number => {
      if (!editorData?.blocks) return -1;
      return editorData.blocks.findIndex((block) => block.id === blockId);
    },
    [editorData]
  );

  const handleTextSelection = useCallback(() => {
    const selection = window.getSelection();
    if (!selection || selection.isCollapsed) {
      setSelectedContext(null);
      return;
    }

    const selectedText = selection.toString().trim();
    if (!selectedText || selectedText.length < 3) {
      setSelectedContext(null);
      return;
    }

    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;

    // Get the position of the selection
    const rect = range.getBoundingClientRect();

    // Find the editor container (#editorjs)
    // Find the scroll container (closest .overflow-auto)
    const element =
      container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element);

    let scrollContainer = element as HTMLElement;

    while (scrollContainer && !scrollContainer.classList?.contains('overflow-auto')) {
      scrollContainer = scrollContainer.parentElement as HTMLElement;
    }

    let editorRect: DOMRect | undefined; // Declare for scope access

    // Calculate position
    let topPosition, leftPosition;
    if (scrollContainer) {
      const containerRect = scrollContainer.getBoundingClientRect();
      // Position below the text relative to the scroll container
      topPosition = rect.bottom - containerRect.top + scrollContainer.scrollTop + 10;
      leftPosition = rect.left - containerRect.left + rect.width / 2;
    } else {
      // Fallback to editor container or viewport
      let editorContainer = element;
      while (editorContainer && editorContainer.id !== 'editorjs') {
        editorContainer = editorContainer.parentElement;
      }
      editorRect = editorContainer?.getBoundingClientRect();

      if (editorRect) {
        topPosition = rect.bottom - editorRect.top + 10;
        leftPosition = rect.left - editorRect.left + rect.width / 2;
      } else {
        topPosition = rect.bottom + 10;
        leftPosition = rect.left + rect.width / 2;
      }
    }

    const position = {
      top: topPosition,
      left: leftPosition,
    };

    console.log('Selection position:', {
      rect: {
        top: rect.top,
        left: rect.left,
        width: rect.width,
        height: rect.height,
      },
      editorRect: editorRect
        ? {
            top: editorRect.top,
            left: editorRect.left,
          }
        : null,
      calculatedPosition: position,
    });

    // Find the element from the container for block detection
    let currentElement =
      container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as Element);

    let blockElement: Element | null = null;

    // Look for ce-block class
    while (currentElement && currentElement !== document.body) {
      if (currentElement.classList?.contains('ce-block')) {
        blockElement = currentElement;
        break;
      }
      currentElement = currentElement.parentElement;
    }

    if (blockElement) {
      const blockId =
        (blockElement as any).dataset?.id ||
        blockElement.getAttribute('data-id') ||
        blockElement.id;

      if (blockId && editorData?.blocks) {
        const blockIndex = getBlockIndexById(blockId);
        const block = editorData.blocks[blockIndex];

        if (blockIndex !== -1 && block) {
          setSelectedContext({
            text: selectedText,
            blockId: blockId,
            blockIndex: blockIndex,
            blockType: block.type,
            position: position,
          });
        }
      } else {
        const blocks = editorData?.blocks || [];
        for (let i = 0; i < blocks.length; i++) {
          const block = blocks[i];
          const blockText = extractTextFromBlock(block);

          if (blockText.includes(selectedText)) {
            setSelectedContext({
              text: selectedText,
              blockId: block.id || `block_${i}`,
              blockIndex: i,
              blockType: block.type,
              position: position,
            });
            break;
          }
        }
      }
    }
  }, [editorData, getBlockIndexById]);

  const clearSelection = useCallback(() => {
    setSelectedContext(null);
    window.getSelection()?.removeAllRanges();
  }, []);

  return {
    selectedContext,
    handleTextSelection,
    clearSelection,
  };
}
