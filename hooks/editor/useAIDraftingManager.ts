'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { TemplateType } from '@/types/aiWriting';
import { parseMarkdownToHTML } from '@/components/editor/components/TiptapEditor';

interface DraftPromptPosition {
  top: number;
  left: number;
}

interface DraftRange {
  from: number;
  to: number;
}

interface UseAIDraftingManagerReturn {
  // State
  isDraftPromptOpen: boolean;
  isDraftLoading: boolean;
  draftPromptPosition: DraftPromptPosition | null;
  draftContent: string | null;
  draftRange: DraftRange | null;
  draftActionPosition: DraftPromptPosition | null;
  isDraftPending: boolean;
  draftPromptRef: React.RefObject<HTMLDivElement | null>;

  // Actions
  handleSlash: (editorInstance: Editor | null) => void;
  handleDraftSubmit: (
    prompt: string,
    templateType: TemplateType,
    documentTitle: string | undefined,
    editorInstance: Editor | null,
    generateParagraph: (params: any) => Promise<string | null>,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => Promise<void>;
  handleAcceptDraft: (
    editorInstance: Editor | null,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => void;
  handleDiscardDraft: (
    editorInstance: Editor | null,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => void;
  closeDraftPrompt: () => void;
  setDraftActionPosition: React.Dispatch<React.SetStateAction<DraftPromptPosition | null>>;
}

/**
 * useAIDraftingManager - Manages inline AI drafting (slash command) state and actions
 *
 * Handles the full flow of:
 * 1. Opening draft prompt via "/" command
 * 2. Generating content via AI API
 * 3. Inserting draft with blue styling for review
 * 4. Accept/Discard actions
 */
export function useAIDraftingManager(): UseAIDraftingManagerReturn {
  const [isDraftPromptOpen, setIsDraftPromptOpen] = useState(false);
  const [isDraftLoading, setIsDraftLoading] = useState(false);
  const [draftPromptPosition, setDraftPromptPosition] = useState<DraftPromptPosition | null>(null);
  const [draftContent, setDraftContent] = useState<string | null>(null);
  const [draftInsertPosition, setDraftInsertPosition] = useState<number | null>(null);
  const [draftRange, setDraftRange] = useState<DraftRange | null>(null);
  const [draftActionPosition, setDraftActionPosition] = useState<DraftPromptPosition | null>(null);
  const [isDraftPending, setIsDraftPending] = useState(false);

  const draftPromptRef = useRef<HTMLDivElement | null>(null);

  /**
   * Opens AI draft prompt at current cursor position
   */
  const handleSlash = useCallback((editorInstance: Editor | null) => {
    console.log('[AIDraftPrompt] handleSlash triggered');

    if (!editorInstance || editorInstance.isDestroyed || !editorInstance.view) {
      console.log('[AIDraftPrompt] Editor not ready');
      return;
    }

    // Get cursor position
    const { from } = editorInstance.state.selection;
    const start = editorInstance.view.coordsAtPos(from);

    // Position popup at cursor (left-aligned)
    let left = start.left;
    let top = start.bottom + 8;

    // Get responsive width based on viewport
    const viewportWidth = window.innerWidth;
    const popupWidth = viewportWidth < 640 ? viewportWidth - 40 : viewportWidth < 1024 ? 450 : 550;
    const popupHeight = 150;

    // Viewport clamping
    if (top + popupHeight > window.innerHeight) {
      top = start.top - popupHeight - 10;
    }
    if (top < 10) top = 10;

    if (left + popupWidth > viewportWidth - 20) {
      left = viewportWidth - popupWidth - 20;
    }
    if (left < 20) left = 20;

    setDraftPromptPosition({ top, left });
    setIsDraftPromptOpen(true);
  }, []);

  /**
   * Generates and inserts draft content with blue styling
   */
  const handleDraftSubmit = useCallback(
    async (
      prompt: string,
      templateType: TemplateType,
      documentTitle: string | undefined,
      editorInstance: Editor | null,
      generateParagraph: (params: any) => Promise<string | null>,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      if (!editorInstance) return;

      setIsDraftLoading(true);
      try {
        // Get existing content for context
        const existingContent = editorInstance.getText().slice(0, 1000);

        // Call the AI API
        const generatedText = await generateParagraph({
          prompt,
          template_type: templateType,
          existing_content: existingContent || undefined,
          document_title: documentTitle || undefined,
        });

        if (generatedText) {
          // Parse markdown to HTML
          const htmlContent = parseMarkdownToHTML(generatedText);

          // Store the insert position before inserting
          const { from } = editorInstance.state.selection;

          // Wrap content in a span with draft styling (blue color)
          const wrappedContent = `<span class="ai-draft-content" style="color: #3B82F6;">${htmlContent}</span>`;

          // Insert at cursor position
          editorInstance.commands.insertContent(wrappedContent);

          // Calculate the end position
          const { from: newFrom } = editorInstance.state.selection;
          setDraftRange({ from, to: newFrom });

          // Store draft info for Accept/Discard
          setDraftContent(htmlContent);
          setDraftInsertPosition(from);
          setIsDraftPending(true);

          // Position the action card
          if (editorInstance.view) {
            const coords = editorInstance.view.coordsAtPos(from);
            const actionCardPosition = {
              top: coords.bottom + 10,
              left: coords.left + 50,
            };

            if (actionCardPosition.left + 180 > window.innerWidth) {
              actionCardPosition.left = Math.max(20, window.innerWidth - 180);
              actionCardPosition.top += 10;
            }

            setDraftActionPosition(actionCardPosition);
          }

          setIsDraftPromptOpen(false);
          setDraftPromptPosition(null);
          addToast('Draft generated. Review and Accept or Discard.', 'success');
        } else {
          addToast('Failed to generate content', 'error');
        }
      } catch (error) {
        console.error('Draft generation error:', error);
        addToast('Failed to generate content', 'error');
      } finally {
        setIsDraftLoading(false);
      }
    },
    []
  );

  /**
   * Accepts the draft - removes blue styling and keeps content
   */
  const handleAcceptDraft = useCallback(
    (
      editorInstance: Editor | null,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      if (!editorInstance || !draftRange) {
        console.error('No editor or draft range to accept');
        setDraftContent(null);
        setDraftInsertPosition(null);
        setDraftRange(null);
        setDraftActionPosition(null);
        setIsDraftPending(false);
        return;
      }

      // Select the draft range and remove styling
      editorInstance
        .chain()
        .focus()
        .setTextSelection({ from: draftRange.from, to: draftRange.to })
        .unsetMark('textStyle')
        .unsetMark('highlight')
        .unsetColor()
        .run();

      // Clear draft state
      setDraftContent(null);
      setDraftInsertPosition(null);
      setDraftRange(null);
      setDraftActionPosition(null);
      setIsDraftPending(false);

      addToast('Draft accepted', 'success');
    },
    [draftRange]
  );

  /**
   * Discards the draft - removes inserted content
   */
  const handleDiscardDraft = useCallback(
    (
      editorInstance: Editor | null,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      if (!editorInstance || !draftRange) {
        // Fallback DOM cleanup
        const draftElements = document.querySelectorAll('.ai-draft-content');
        draftElements.forEach((el) => el.remove());
        setIsDraftPending(false);
        return;
      }

      // Delete the range
      editorInstance
        .chain()
        .focus()
        .deleteRange({ from: draftRange.from, to: draftRange.to })
        .run();

      // Clear draft state
      setDraftContent(null);
      setDraftInsertPosition(null);
      setDraftRange(null);
      setDraftActionPosition(null);
      setIsDraftPending(false);

      addToast('Draft discarded', 'success');
    },
    [draftRange]
  );

  /**
   * Closes the draft prompt
   */
  const closeDraftPrompt = useCallback(() => {
    setIsDraftPromptOpen(false);
    setDraftPromptPosition(null);
  }, []);

  return {
    // State
    isDraftPromptOpen,
    isDraftLoading,
    draftPromptPosition,
    draftContent,
    draftRange,
    draftActionPosition,
    isDraftPending,
    draftPromptRef,

    // Actions
    handleSlash,
    handleDraftSubmit,
    handleAcceptDraft,
    handleDiscardDraft,
    closeDraftPrompt,
    setDraftActionPosition,
  };
}

export default useAIDraftingManager;
