import React, { useState, useCallback, memo } from 'react';
import { ChevronDown, Loader2, Send } from 'lucide-react';
import type { Editor } from '@tiptap/react';
import { usePromptHistory } from '@/hooks/editor/usePromptHistory';
import { useAIWriting } from '@/hooks/writing-hooks';
import { useToast } from '@/lib/contexts/ToastContext';
import { PromptHistoryList, PromptHistoryLoadingSkeleton } from '../components/PromptHistoryItem';
import {
  serializeSelectionToMarkdown,
  serializeSelectionToHTML,
  parseMarkdownToHTML,
} from '../../TiptapEditor';
import { PromptHistoryService } from '@/lib/api/promptHistoryService';

// ============================================================================
// Types
// ============================================================================

interface AITabProps {
  projectId?: string;
  editor?: Editor | null;
}

// ============================================================================
// Input Section Component (Memoized)
// ============================================================================

interface AIInputSectionProps {
  inputText: string;
  isSubmitting: boolean;
  onInputChange: (value: string) => void;
  onSubmit: () => void;
}

const AIInputSection = memo<AIInputSectionProps>(
  ({ inputText, isSubmitting, onInputChange, onSubmit }) => {
    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        onSubmit();
      }
    };

    return (
      <div className="ai-input-section">
        <div className="ai-input-wrapper-simple">
          <textarea
            className="ai-input-area-simple"
            placeholder="Write here to draft or edit the pages"
            value={inputText}
            onChange={(e) => onInputChange(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={isSubmitting}
            rows={2}
          />
          <button className="ai-page-selector-simple" disabled={isSubmitting}>
            <span>@ Select any page</span>
          </button>
        </div>
      </div>
    );
  }
);

AIInputSection.displayName = 'AIInputSection';

// ============================================================================
// Actions Section Header (Memoized)
// ============================================================================

interface ActionsHeaderProps {
  isOpen: boolean;
  onToggle: () => void;
}

const ActionsHeader = memo<ActionsHeaderProps>(({ isOpen, onToggle }) => (
  <button className="ai-actions-header" onClick={onToggle}>
    <span>Actions</span>
    <ChevronDown size={18} className={`transition-transform ${isOpen ? '' : '-rotate-90'}`} />
  </button>
));

ActionsHeader.displayName = 'ActionsHeader';

// ============================================================================
// Main Component
// ============================================================================

/**
 * AITab component for displaying prompt history and accepting new prompts.
 * Now integrated with AI writing services to process editor content.
 *
 * Performance optimizations:
 * - Uses Zustand store with O(1) indexed lookups by projectId
 * - Pre-computed groupings (computed once on data change, not on render)
 * - Memoized child components for isolated re-renders
 * - Selective state subscriptions prevent global re-renders
 */
export default function AITab({ projectId, editor }: AITabProps) {
  // Local UI state for input (isolated from history)
  const [isActionsOpen, setIsActionsOpen] = useState(true);
  const [inputText, setInputText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Debug: Log editor availability
  console.log('[AITab] Editor available:', !!editor, editor);

  // Use optimized prompt history hook - O(1) lookups, pre-computed groupings
  const { items, isLoading, toggleExpanded, addPrompt } = usePromptHistory(projectId);

  // AI Writing hook for API calls
  const { isLoading: isAILoading, improveWriting } = useAIWriting();

  // Toast for notifications
  const { addToast } = useToast();

  // Stable callback for toggling actions
  const handleToggleActions = useCallback(() => {
    setIsActionsOpen((prev) => !prev);
  }, []);

  // Stable callback for input changes
  const handleInputChange = useCallback((value: string) => {
    setInputText(value);
  }, []);

  // Stable callback for toggling expand
  const handleToggleExpand = useCallback(
    (id: string) => {
      toggleExpanded(id);
    },
    [toggleExpanded]
  );

  // Handle prompt submission - now processes through AI and applies to editor
  const handleSubmit = useCallback(async () => {
    const trimmedText = inputText.trim();
    if (!trimmedText || isSubmitting) return;

    if (!editor) {
      addToast('Editor is still loading. Please wait a moment and try again.', 'warning');
      console.warn('[AITab] Editor not available when submitting. Editor prop:', editor);
      return;
    }

    setIsSubmitting(true);
    const promptText = inputText;
    setInputText('');

    try {
      // Get content from editor (selected text or all content)
      let contentForApi = '';
      let contentHtml = '';

      if (!editor.state.selection.empty) {
        // Use selected text
        contentForApi = serializeSelectionToMarkdown(editor);
        contentHtml = serializeSelectionToHTML(editor);
      } else {
        // Select all and get content
        editor.commands.selectAll();
        contentForApi = serializeSelectionToMarkdown(editor);
        contentHtml = serializeSelectionToHTML(editor);
      }

      if (!contentForApi.trim()) {
        addToast('No content in editor to process', 'warning');
        setIsSubmitting(false);
        return;
      }

      // Call AI service with the custom prompt as context
      const result = await improveWriting({
        text: contentHtml || contentForApi,
        improvement_focus: 'all',
        tone: 'legal',
        context: promptText,
      });

      if (result) {
        // Insert the AI result into the editor
        const isHtml = /<[a-z][\s\S]*>/i.test(result);
        const processedText = isHtml ? result : parseMarkdownToHTML(result);

        // Replace selection with AI result
        editor.chain().focus().deleteSelection().insertContent(processedText).run();

        // Add prompt to history AFTER successful response
        const completedPrompt = {
          id: `local-${Date.now()}`,
          text: promptText,
          status: 'completed' as const,
          createdAt: new Date().toISOString(),
        };
        addPrompt(completedPrompt);

        addToast('AI response applied to editor', 'success');

        // Log to prompt history service
        PromptHistoryService.logPrompt(
          'ai-writing',
          promptText,
          result,
          {
            source: 'ai-tab',
            action_type: 'custom',
            input_length: contentForApi.length,
          },
          projectId
        ).catch((err) => console.error('[AITab] Failed to log prompt history:', err));
      } else {
        addToast('AI processing failed', 'error');
      }
    } catch (error) {
      console.error('[AITab] Error processing prompt:', error);
      addToast('An error occurred while processing', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }, [inputText, isSubmitting, editor, addToast, improveWriting, addPrompt, projectId]);

  return (
    <div className="ai-tab-container">
      <div className="ai-actions-section">
        <ActionsHeader isOpen={isActionsOpen} onToggle={handleToggleActions} />

        {isActionsOpen && (
          <div className="ai-actions-list">
            {isLoading ? (
              <PromptHistoryLoadingSkeleton />
            ) : (
              <>
                <PromptHistoryList
                  items={items}
                  onToggleExpand={handleToggleExpand}
                  emptyMessage="No prompt history yet"
                />
                {/* Show Generating indicator at bottom when submitting - follows timeline pattern */}
                {isSubmitting && (
                  <div className="ai-action-item generating">
                    <div className="ai-action-timeline">
                      <div className="ai-action-icon loading">
                        <div className="loading-circle" />
                      </div>
                    </div>
                    <div className="ai-action-content">
                      <p className="ai-action-text generating-text">Generating...</p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        )}
      </div>

      <AIInputSection
        inputText={inputText}
        isSubmitting={isSubmitting}
        onInputChange={handleInputChange}
        onSubmit={handleSubmit}
      />
    </div>
  );
}
