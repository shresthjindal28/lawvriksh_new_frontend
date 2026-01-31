'use client';

import { useState, useCallback } from 'react';
import { Editor } from '@tiptap/react';
import {
  parseMarkdownToHTML,
  serializeSelectionToMarkdown,
  serializeSelectionToHTML,
} from '@/components/editor/components/TiptapEditor';

interface AIPopupPosition {
  top: number;
  left: number;
}

interface UseAIPopupManagerReturn {
  // State
  isAIPopupVisible: boolean;
  selectedTextForAI: string;
  selectedHtmlForAI: string;
  aiPopupPosition: AIPopupPosition | null;
  isCentered: boolean;

  // Actions
  handleAi: (
    e: React.MouseEvent | undefined,
    editorInstance: Editor | null,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => void;
  handleAIAction: (
    action: string,
    customText: string | undefined,
    editorInstance: Editor | null
  ) => void;
  closeAIPopup: () => void;
}

/**
 * useAIPopupManager - Manages AI popup (improve, paraphrase, translate) state and actions
 *
 * Handles:
 * 1. Opening AI popup with selected text
 * 2. Processing AI actions (accept/insert)
 * 3. Managing popup visibility and position
 */
export function useAIPopupManager(): UseAIPopupManagerReturn {
  const [isAIPopupVisible, setIsAIPopupVisible] = useState(false);
  const [selectedTextForAI, setSelectedTextForAI] = useState('');
  const [selectedHtmlForAI, setSelectedHtmlForAI] = useState('');
  const [aiPopupPosition, setAIPopupPosition] = useState<AIPopupPosition | null>(null);
  const [isCentered, setIsCentered] = useState(false);

  /**
   * Opens AI popup with current selection or all content
   */
  const handleAi = useCallback(
    (
      e: React.MouseEvent | undefined,
      editorInstance: Editor | null,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      // Try to get structured content from editor (both markdown and HTML)
      let selectedText = '';
      let selectedHtml = '';
      const selection = window.getSelection();

      if (editorInstance && !editorInstance.state.selection.empty) {
        selectedText = serializeSelectionToMarkdown(editorInstance);
        selectedHtml = serializeSelectionToHTML(editorInstance);
      } else {
        selectedText = selection?.toString().trim() || '';
        selectedHtml = selectedText; // Fallback to text if no editor selection
      }

      let isAutoSelect = false;
      let buttonRect: DOMRect | null = null;

      // Capture button rect from event if available
      if (e && e.currentTarget) {
        buttonRect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      }

      if (!selectedText) {
        // If no selection, get all editor content
        if (editorInstance) {
          // Select all content and serialize to both formats
          editorInstance.commands.selectAll();
          selectedText = serializeSelectionToMarkdown(editorInstance);
          selectedHtml = serializeSelectionToHTML(editorInstance);

          // If still empty (editor has no content), show warning
          if (!selectedText.trim()) {
            addToast('No content in editor to process', 'warning');
            return;
          }
        } else {
          addToast('No text selected', 'warning');
          return;
        }

        // Center the popup in the viewport for full document processing
        setIsCentered(true);

        // Center horizontally and vertically in the viewport
        const left = window.innerWidth / 2;
        const top = window.innerHeight / 2;

        setSelectedTextForAI(selectedText);
        setSelectedHtmlForAI(selectedHtml);
        setAIPopupPosition({ top, left });
        setIsAIPopupVisible(true);
        return;
      }

      setIsCentered(false);

      // Position calculation
      let left = 0;
      let top = 0;
      const popupWidth = 561;
      const popupHeight = 350;

      if (isAutoSelect && buttonRect) {
        // Center below button
        left = buttonRect.left + buttonRect.width / 2;
        top = buttonRect.bottom + 10;
      } else {
        // Standard selection anchor
        let rect: DOMRect;
        if (selection && selection.rangeCount > 0) {
          rect = selection.getRangeAt(0).getBoundingClientRect();
        } else if (editorInstance) {
          const editorRect = editorInstance.view.dom.getBoundingClientRect();
          rect = editorRect;
          left = rect.left + rect.width / 2;
          top = rect.top + rect.height / 2;
        } else {
          rect = {
            left: window.innerWidth / 2,
            top: window.innerHeight / 2,
            width: 0,
            height: 0,
            bottom: 0,
            right: 0,
          } as DOMRect;
        }

        if (!isAutoSelect && selection && selection.rangeCount > 0) {
          left = rect.left + rect.width / 2;
          top = rect.bottom + 10;
        }

        // Ensure bottom visibility
        if (top + popupHeight > window.innerHeight) {
          top = rect.top - popupHeight - 10;
        }
      }

      // Global viewport clamps
      if (top < 10) top = 10;
      if (left - popupWidth / 2 < 10) left = popupWidth / 2 + 10;
      if (left + popupWidth / 2 > window.innerWidth - 10)
        left = window.innerWidth - popupWidth / 2 - 10;

      setSelectedTextForAI(selectedText);
      setSelectedHtmlForAI(selectedHtml);
      setAIPopupPosition({ top, left });
      setIsAIPopupVisible(true);
    },
    []
  );

  /**
   * Handles AI action result (accept or insert)
   */
  const handleAIAction = useCallback(
    (action: string, customText: string | undefined, editorInstance: Editor | null) => {
      if (!editorInstance) {
        setIsAIPopupVisible(false);
        return;
      }
      const text = (customText || selectedTextForAI || '').trim();
      if (!text) {
        setIsAIPopupVisible(false);
        return;
      }

      // The result from AI is already HTML, so insert it directly
      // Only use parseMarkdownToHTML if the text doesn't look like HTML
      const isHtml = /<[a-z][\s\S]*>/i.test(text);
      const processedText = isHtml ? text : parseMarkdownToHTML(text);

      if (action === 'accept') {
        editorInstance.chain().focus().deleteSelection().insertContent(processedText).run();
      } else if (action === 'insert') {
        editorInstance
          .chain()
          .focus()
          .setTextSelection(editorInstance.state.selection.to)
          .insertContent('<br/>' + processedText + '<br/>')
          .run();
      }
      setIsAIPopupVisible(false);
    },
    [selectedTextForAI]
  );

  /**
   * Closes the AI popup
   */
  const closeAIPopup = useCallback(() => {
    setIsAIPopupVisible(false);
  }, []);

  return {
    // State
    isAIPopupVisible,
    selectedTextForAI,
    selectedHtmlForAI,
    aiPopupPosition,

    // Actions
    handleAi,
    handleAIAction,
    closeAIPopup,
    isCentered,
  };
}

export default useAIPopupManager;
