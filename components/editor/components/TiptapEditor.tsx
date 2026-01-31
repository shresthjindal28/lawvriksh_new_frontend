'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
import { DOMSerializer } from '@tiptap/pm/model';
import StarterKit from '@tiptap/starter-kit';
import { TextAlign } from '@tiptap/extension-text-align';
import { Underline } from '@tiptap/extension-underline';
import { Table } from '@tiptap/extension-table';
import { TableRow } from '@tiptap/extension-table-row';
import { TableCell } from '@tiptap/extension-table-cell';
import { TableHeader } from '@tiptap/extension-table-header';
import { Color } from '@tiptap/extension-color';
import { TextStyle } from '@tiptap/extension-text-style';
import Highlight from '@tiptap/extension-highlight';
import Image from '@tiptap/extension-image';
import { useEffect, useCallback, forwardRef, useRef } from 'react';

import { FontSizeExtension } from '../extensions/FontSizeExtension';
import { VariableExtension } from '../extensions/VariableExtension';
import { AnalysisHighlight } from '../extensions/AnalysisHighlight';
import { CitationExtension } from '../extensions/CitationExtension';
import { SmartSuggestionExtension } from '../extensions/SmartSuggestionExtension';
import { CitationFormatter } from '@/lib/services/citationFormatter';
import { Sparkles, Quote } from 'lucide-react';
import { PAGE_FORMATS, Pages } from '@tiptap-pro/extension-pages';
import '@/styles/writing-page/tiptap-editor.css';

/**
 * SlashCommandExtension - Detects '/' typed at start of empty line and triggers callback
 */
const createSlashCommandExtension = (onSlash?: () => void) =>
  Extension.create({
    name: 'slashCommand',
    addKeyboardShortcuts() {
      return {
        '/': ({ editor }) => {
          console.log('[SlashCommand] "/" key pressed, onSlash:', !!onSlash);

          if (!onSlash) return false;

          const { $from } = editor.state.selection;
          const hasNoContent = $from.parent.textContent.length === 0;
          const atStart = $from.parentOffset === 0;

          console.log('[SlashCommand] Conditions:', { hasNoContent, atStart });

          if (hasNoContent && atStart) {
            console.log('[SlashCommand] Triggering onSlash callback');
            // Delay slightly to allow the '/' to be typed first
            setTimeout(() => {
              onSlash();
            }, 10);
            return true; // Prevent the '/' from being typed
          }
          return false;
        },
      };
    },
  });

// Text colors - matching menu options (5 colors for light theme)
const TEXT_COLORS = [
  { id: 'default', label: 'Default', color: '#1a1a1a' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'green', label: 'Green', color: '#16a34a' },
  { id: 'orange', label: 'Orange', color: '#ea580c' },
  { id: 'purple', label: 'Purple', color: '#9333ea' },
];

// Background colors - matching menu options (5 colors for light theme)
const BG_COLORS = [
  { id: 'default', label: 'None', color: 'transparent' },
  { id: 'blue', label: 'Blue', color: '#dbeafe' },
  { id: 'green', label: 'Green', color: '#dcfce7' },
  { id: 'orange', label: 'Orange', color: '#ffedd5' },
  { id: 'purple', label: 'Purple', color: '#f3e8ff' },
];

// Types
type VariableType = 'text' | 'email' | 'number' | 'date' | 'url' | 'currency';

interface TemplateVariable {
  name: string;
  label: string;
  type: VariableType;
  value: string;
  editable: boolean;
}

interface Block {
  id: string;
  type: string;
  data: {
    text: string;
    level?: number;
    alignment?: 'left' | 'center' | 'right' | 'justify';
  };
}

interface TemplateData {
  time: number;
  version?: string;
  blocks?: Block[];
  content?: string;
  variables: Record<
    string,
    {
      value: string;
      editable: boolean;
      type: VariableType;
      label: string;
    }
  >;
}

interface TiptapEditorProps {
  templateData: TemplateData;
  variables: TemplateVariable[];
  onContentChange?: (content: string) => void;
  onEditorReady?: (editor: any) => void;
  citationStyle?: string;
  isAiPopupOpen?: boolean;
  onSlash?: () => void;
  textSize?: string;
  onShowAIPopup?: () => void;
  onCite?: () => void;
  onVariableClick?: (variableName: string) => void;
  zoomLevel?: number;
}

/**
 * Convert EditorJS-style blocks to Tiptap HTML content
 *
 * @param blocks - The blocks to convert
 * @param variables - The template variables
 * @returns The HTML content string
 */
function convertBlocksToHTML(blocks: Block[], variables: TemplateVariable[]): string {
  if (!blocks || blocks.length === 0) {
    return '<p>No content available. Start typing...</p>';
  }

  return blocks
    .map((block) => {
      let text = substituteVariables(block.data.text, variables);
      const alignment = block.data.alignment || 'left';
      const alignStyle = `text-align: ${alignment}`;

      if (block.type === 'header') {
        const level = block.data.level || 2;
        // Add underline decoration for main titles
        if (level === 1 || level === 2) {
          return `<h${level} style="${alignStyle}"><u>${text}</u></h${level}>`;
        }
        return `<h${level} style="${alignStyle}">${text}</h${level}>`;
      }

      // Handle line breaks for signature blocks
      text = text.replace(/<br>/g, '<br/>');

      return `<p style="${alignStyle}">${text}</p>`;
    })
    .join('');
}

/**
 * Substitute template variables in text with custom variable nodes
 */
function substituteVariables(text: string, variables: TemplateVariable[]): string {
  let result = text;
  variables.forEach((v) => {
    const pattern = new RegExp(`{{${v.name}}}`, 'g');
    // Generate HTML that matches our VariableExtension parseHTML
    const safeValue = (v.value || '').replace(/"/g, '&quot;');
    const nodeHTML = `<span data-type="variable" data-var-name="${v.name}" data-var-label="${v.label}" data-var-value="${safeValue}" data-var-type="${v.type}" class="variable-chip">${v.value || `[${v.label}]`}</span>`;
    result = result.replace(pattern, nodeHTML);
  });
  return result;
}

/**
 * Preprocess content to handle markdown-like syntax and proper line breaks.
 * This function converts:
 * - **bold** markdown syntax to <strong> tags
 * - \n newlines to <br/> for proper line breaks within paragraphs
 * - Ensures numbered lists (1., 2., etc.) and alphabetical lists (a), b), etc.) appear on new lines
 */
export function preprocessContent(html: string): string {
  let result = html;

  // Step 0: Normalize line endings
  result = result.replace(/\r\n/g, '\n');

  // Step 1: Convert markdown headings (process longest patterns first)
  result = result.replace(/(?:^|\n)######\s+([^\n<]+)/g, '\n<h6>$1</h6>');
  result = result.replace(/(?:^|\n)#####\s+([^\n<]+)/g, '\n<h5>$1</h5>');
  result = result.replace(/(?:^|\n)####\s+([^\n<]+)/g, '\n<h4>$1</h4>');
  result = result.replace(/(?:^|\n)###\s+([^\n<]+)/g, '\n<h3>$1</h3>');
  result = result.replace(
    /(?:^|\n)##\s+([^\n<]+)/g,
    '\n<h2 style="text-decoration: underline;">$1</h2>'
  );
  result = result.replace(
    /(?:^|\n)#\s+([^\n<]+)/g,
    '\n<h1 style="text-decoration: underline; text-align: center;">$1</h1>'
  );

  // Step 2: Convert **bold** markdown syntax to <strong>
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

  // Step 3: Convert \\n newlines to <br/> for proper line breaks
  result = result.replace(
    /\\n\\n/g,
    '</p><p style="text-align: justify; margin-bottom: 12pt; line-height: 1.4;">'
  );
  result = result.replace(/\\n/g, '<br/>');
  result = result.replace(
    /\n\n/g,
    '</p><p style="text-align: justify; margin-bottom: 12pt; line-height: 1.4;">'
  );
  result = result.replace(/\n/g, '<br/>');

  // Step 4: Clean up any double <br/> tags
  result = result.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br/>');

  // Step 5: Clean up empty paragraphs
  result = result.replace(/<p[^>]*>\s*<\/p>/g, '');

  return result;
}

/**
 * Parse Markdown text to HTML for AI responses
 * Handles headings (#), bullet lists (- or *), and ordered lists (1.)
 */
export function parseMarkdownToHTML(markdown: string): string {
  if (!markdown) return '';
  const lines = markdown.replace(/\r\n/g, '\n').split('\n');
  let result = '';
  let listType: 'ul' | 'ol' | null = null;

  const closeList = () => {
    if (listType === 'ul') result += '</ul>';
    if (listType === 'ol') result += '</ol>';
    listType = null;
  };

  lines.forEach((line) => {
    const trimmed = line.trim();
    if (!trimmed) {
      closeList(); // Close list on empty line
      return;
    }

    // Check for headings (e.g. # Heading)
    const hMatch = line.match(/^(#{1,6})\s+(.+)$/);
    if (hMatch) {
      closeList();
      const level = hMatch[1].length;
      const content = hMatch[2];
      const formatted = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      const style = level <= 2 ? 'text-decoration: underline;' : '';
      const align = level === 1 ? 'text-align: center;' : '';
      result += `<h${level} style="${style} ${align}">${formatted}</h${level}>`;
      return;
    }

    // Check for unordered list (e.g. - Item or * Item)
    const ulMatch = line.match(/^[-*]\s+(.+)$/);
    if (ulMatch) {
      if (listType !== 'ul') {
        closeList();
        result += '<ul>';
        listType = 'ul';
      }
      const content = ulMatch[1];
      const formatted = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      result += `<li>${formatted}</li>`;
      return;
    }

    // Check for ordered list (e.g. 1. Item)
    const olMatch = line.match(/^(\d+)\.\s+(.+)$/);
    if (olMatch) {
      if (listType !== 'ol') {
        closeList();
        result += '<ol>';
        listType = 'ol';
      }
      const content = olMatch[2];
      const formatted = content.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      result += `<li>${formatted}</li>`;
      return;
    }

    // Regular paragraph
    if (!listType) {
      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      result += `<p>${formatted}</p>`;
    } else {
      // If inside list but not matching list item, close list and start paragraph
      closeList();
      const formatted = line.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
      result += `<p>${formatted}</p>`;
    }
  });

  closeList();
  return result;
}

/**
 * Serialize current selection to Markdown for AI context
 * Captures headings and lists structure
 */
export function serializeSelectionToMarkdown(editor: any): string {
  const { state } = editor;
  const { selection } = state;
  const slice = selection.content();

  let markdown = '';

  slice.content.forEach((node: any) => {
    if (node.type.name === 'heading') {
      const level = node.attrs.level || 1;
      const prefix = '#'.repeat(level);
      markdown += `${prefix} ${node.textContent}\n\n`;
    } else if (node.type.name === 'paragraph') {
      markdown += `${node.textContent}\n\n`;
    } else if (node.type.name === 'bulletList') {
      node.content.forEach((listItem: any) => {
        markdown += `- ${listItem.textContent}\n`;
      });
      markdown += '\n';
    } else if (node.type.name === 'orderedList') {
      let index = 1;
      node.content.forEach((listItem: any) => {
        markdown += `${index}. ${listItem.textContent}\n`;
        index++;
      });
      markdown += '\n';
    } else {
      markdown += `${node.textContent}\n\n`;
    }
  });

  return markdown.trim();
}

/**
 * Serialize current selection to HTML for AI processing
 * Preserves formatting and structure
 */
export function serializeSelectionToHTML(editor: any): string {
  const { state } = editor;
  const { selection } = state;

  // Get the selected slice
  const slice = selection.content();

  // Create a serializer from the schema and convert fragment to HTML
  const { schema } = state;
  const serializer = DOMSerializer.fromSchema(schema);

  const tempDiv = document.createElement('div');
  const fragment = serializer.serializeFragment(slice.content);
  tempDiv.appendChild(fragment);

  return tempDiv.innerHTML;
}

/**
 * TiptapEditor - A professional legal document WYSIWYG editor
 *
 * Features:
 * - Fully editable content
 * - A4 page formatting
 * - Times New Roman font
 * - Professional legal document styling
 * - Text alignment controls
 * - Bold, italic, underline, strikethrough
 * - Tables, lists, blockquotes
 */
export const TiptapEditor = forwardRef<HTMLDivElement, TiptapEditorProps>(
  (
    {
      templateData,
      variables,
      onContentChange,
      onEditorReady,
      citationStyle,
      isAiPopupOpen,
      onSlash,
      textSize = 'normal',
      onCite,
      onShowAIPopup,
      onVariableClick,
      zoomLevel = 100,
    },
    ref
  ) => {
    // Use ref to always have current onSlash callback (avoids stale closure in extension)
    const onSlashRef = useRef(onSlash);
    const onVariableClickRef = useRef(onVariableClick);

    useEffect(() => {
      onSlashRef.current = onSlash;
      onVariableClickRef.current = onVariableClick;
    }, [onSlash, onVariableClick]);

    // Add click listener for variable chips
    useEffect(() => {
      const editorElement = (ref as React.MutableRefObject<HTMLDivElement>)?.current;
      if (!editorElement) return;

      const handleClick = (e: MouseEvent) => {
        const target = e.target as HTMLElement;
        if (target.classList.contains('variable-chip')) {
          const varName = target.getAttribute('data-var-name');
          if (varName && onVariableClickRef.current) {
            e.preventDefault();
            e.stopPropagation();
            onVariableClickRef.current(varName);
          }
        }
      };

      editorElement.addEventListener('click', handleClick);
      return () => {
        editorElement.removeEventListener('click', handleClick);
      };
    }, [ref]);

    // Convert blocks to HTML content
    // Determine initial content: prefer raw HTML 'content' if available, otherwise convert blocks
    const rawContent =
      templateData.content || convertBlocksToHTML(templateData.blocks || [], variables);
    // Apply variable substitution to the content, then preprocess for markdown and line breaks
    const substitutedContent = templateData.content
      ? substituteVariables(rawContent, variables)
      : rawContent; // convertBlocksToHTML already does substitution internally for blocks

    // Apply preprocessing to handle **bold** markdown and \n line breaks
    const initialContent = preprocessContent(substitutedContent);

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 700;

    const editor = useEditor({
      extensions: [
        Pages.configure({
          pageFormat: {
            // User requested A4 dimensions to ensure consistent pagination,
            // but with custom "little big" vertical padding.
            width: PAGE_FORMATS.A4.width,
            height: PAGE_FORMATS.A4.height,
            margins: {
              top: 56, // Increased as requested
              right: 40,
              bottom: 96, // Increased as requested
              left: 40,
            },
          },
          headerTopMargin: 24,
          footerBottomMargin: 24,
          pageGap: 24,
          header: `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; width: 100%; font-size: 0.8rem; color: #4b5563;"><div style="text-align: left;"></div><div style="text-align: center;"></div><div style="text-align: right;"></div></div>`,
          footer: `<div style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; width: 100%; font-size: 0.8rem; color: #4b5563;"><div style="text-align: left;"></div><div style="text-align: center;"></div><div style="text-align: right;">{page} of {total}</div></div>`,
          pageBreakBackground: '#e5e7eb',
        }),
        StarterKit.configure({
          heading: {
            levels: [1, 2, 3, 4, 5, 6],
          },
          bulletList: {
            keepMarks: true,
            keepAttributes: false,
          },
          orderedList: {
            keepMarks: true,
            keepAttributes: false,
          },
        }),
        TextAlign.configure({
          types: ['heading', 'paragraph'],
          alignments: ['left', 'center', 'right', 'justify'],
          defaultAlignment: 'justify',
        }),
        Underline,
        Table.configure({
          resizable: true,
        }),
        TableRow,
        TableCell,
        TableHeader,
        VariableExtension,
        TextStyle,
        FontSizeExtension,
        Color,
        Highlight.configure({
          multicolor: true,
        }),
        AnalysisHighlight,
        CitationExtension,
        SmartSuggestionExtension,
        Image.configure({
          inline: true,
          allowBase64: true,
        }),
        // eslint-disable-next-line react-hooks/refs
        createSlashCommandExtension(() => onSlashRef.current?.()),
      ],
      content: initialContent,
      editable: true,
      editorProps: {
        attributes: {
          class: 'tiptap-editor tiptap-base-styles',
          spellcheck: 'true',
        },
      },
      onUpdate: ({ editor }) => {
        if (onContentChange) {
          onContentChange(editor.getHTML());
        }
      },
      immediatelyRender: false,
    });

    // Expose editor instance to parent
    useEffect(() => {
      if (editor && onEditorReady) {
        onEditorReady(editor);
      }
    }, [editor, onEditorReady]);

    // Sync external content changes (demo data or template switch)
    useEffect(() => {
      if (editor && templateData.content) {
        const currentHTML = editor.getHTML();
        const contentText = editor.getText().trim();
        const isEditorEffectivelyEmpty = editor.isEmpty || contentText === '';

        console.log('📝 [Tiptap] Content Sync Check:', {
          editorEmpty: editor.isEmpty,
          isEffectivelyEmpty: isEditorEffectivelyEmpty,
          currentHTMLLength: currentHTML.length,
          newContentLength: templateData.content.length,
          docSize: editor.state.doc.content.size,
          extensions: editor.extensionManager.extensions.map((e) => e.name),
        });

        const isNewContentNotEmpty = templateData.content.replace(/<[^>]*>/g, '').trim() !== '';

        if (isEditorEffectivelyEmpty && isNewContentNotEmpty) {
          console.log('📝 [Tiptap] Applying new content (Editor was empty)');
          editor.commands.setContent(templateData.content);
        }
      }
    }, [templateData.content, editor]);

    // Update editor content when variables change (Mark-based approach)
    useEffect(() => {
      if (!editor || !variables) return;

      const variableMark = editor.schema.marks.variable;
      if (!variableMark) return;

      // Collect all text ranges with variable marks that need updating
      const updates: {
        from: number;
        to: number;
        newText: string;
        attrs: Record<string, unknown>;
      }[] = [];

      editor.state.doc.descendants((node, pos) => {
        if (!node.isText) return;

        node.marks.forEach((mark) => {
          if (mark.type.name === 'variable') {
            const varName = mark.attrs.name;
            const matchingVar = variables.find((v) => v.name === varName);

            if (matchingVar) {
              const currentText = node.text || '';
              const newValue = matchingVar.value || `[${matchingVar.label}]`;

              if (currentText !== newValue) {
                updates.push({
                  from: pos,
                  to: pos + node.nodeSize,
                  newText: newValue,
                  attrs: { ...mark.attrs, value: matchingVar.value },
                });
              }
            }
          }
        });
      });

      // Apply updates in reverse order to preserve positions
      if (updates.length > 0) {
        editor.commands.command(({ tr }) => {
          updates.reverse().forEach((update) => {
            tr.replaceWith(
              update.from,
              update.to,
              editor.schema.text(update.newText, [variableMark.create(update.attrs)])
            );
          });
          return true;
        });
      }
    }, [variables, editor]);

    // Update citations when style changes
    useEffect(() => {
      if (!editor || !citationStyle) return;

      const updateCitations = async () => {
        const citationNodes: { node: any; pos: number; mark: any }[] = [];

        editor.state.doc.descendants((node, pos) => {
          if (!node.isText) return;
          const mark = node.marks.find((m) => m.type.name === 'citation');
          if (mark) {
            citationNodes.push({ node, pos, mark });
          }
        });

        if (citationNodes.length === 0) return;

        const formatter = CitationFormatter.getInstance();
        const updates = await Promise.all(
          citationNodes.map(async ({ node, pos, mark }) => {
            // If citation has a number (new format), preserve it
            const citationNumber = mark.attrs.citationNumber;
            if (citationNumber) {
              const expectedText = `[${citationNumber}]`;
              // Only update if text doesn't match the numbered format
              if (node.text !== expectedText) {
                return {
                  from: pos,
                  to: pos + node.nodeSize,
                  text: expectedText,
                  marks: node.marks,
                };
              }
              return null;
            }

            // Legacy citations without number - use formatter
            const citation = {
              id: mark.attrs.referenceId,
              title: mark.attrs.citationTitle,
              author: mark.attrs.citationAuthor,
              source: mark.attrs.citationSource,
              link: mark.attrs.citationLink,
            };

            const newText = await formatter.formatInTextCitation(citation, citationStyle);

            if (node.text !== newText) {
              return {
                from: pos,
                to: pos + node.nodeSize,
                text: newText,
                marks: node.marks,
              };
            }
            return null;
          })
        );

        const validUpdates = updates.filter((u): u is NonNullable<typeof u> => u !== null);

        if (validUpdates.length > 0) {
          editor.commands.command(({ tr }) => {
            validUpdates.reverse().forEach((u) => {
              tr.replaceWith(u.from, u.to, editor.schema.text(u.text, u.marks));
            });
            return true;
          });
        }
      };

      updateCitations();
    }, [citationStyle, editor]);

    return (
      <div className="tiptap-editor-wrapper" style={{ minWidth: 0 }}>
        {/* Document Container - A4 Page */}
        <div className={`tiptap-editor-bg tiptap-editor-${textSize}`} ref={ref}>
          <div
            className="tiptap-document-container"
            style={{
              transform: `scale(${zoomLevel / 100})`,
              transformOrigin: 'top center',
              transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              /* Ensure width expands to fit scaled content if needed, or rely on container overflow */
              minHeight: '100%',
            }}
          >
            {editor ? (
              <>
                {!isAiPopupOpen && (
                  <BubbleMenu
                    editor={editor}
                    updateDelay={0}
                    shouldShow={({ editor, state }) => {
                      const { selection } = state;
                      const { empty } = selection;
                      return !empty;
                    }}
                    options={{
                      placement: 'top',
                      strategy: 'fixed',
                      offset: { mainAxis: 8 },
                      flip: { fallbackPlacements: ['bottom', 'top-start', 'bottom-start'] },
                      shift: { padding: 16 },
                    }}
                  >
                    <div className="bubble-menu-container">
                      {/* AI Button */}
                      <button
                        onClick={onShowAIPopup}
                        onMouseDown={(e) => e.preventDefault()}
                        className="bubble-menu-button"
                        type="button"
                        title="AI Drafting"
                      >
                        <Sparkles size={14} />
                        AI
                      </button>

                      <div className="bubble-menu-divider" />

                      {/* Cite Button */}
                      <button
                        onClick={onCite}
                        className="bubble-menu-button bubble-menu-button-dark"
                        type="button"
                        title="Add Citation"
                      >
                        <Quote size={14} />
                        Cite
                      </button>

                      <div className="bubble-menu-divider" />

                      {/* Text Color Options */}
                      {TEXT_COLORS.map((c) => (
                        <button
                          key={`text-${c.id}`}
                          onClick={() => editor.chain().focus().setColor(c.color).run()}
                          className={`bubble-menu-color-btn ${
                            editor.isActive('textStyle', { color: c.color }) ? 'active' : 'inactive'
                          }`}
                          style={{
                            color: c.color,
                            backgroundColor: c.id === 'default' ? '#f9fafb' : '#fff',
                          }}
                          title={`${c.label} text`}
                          type="button"
                        >
                          A
                        </button>
                      ))}

                      {/* Divider */}
                      <div className="bubble-menu-divider" />

                      {/* Background Color Options */}
                      {BG_COLORS.map((c) => (
                        <button
                          key={`bg-${c.id}`}
                          onClick={() => {
                            if (c.color === 'transparent') {
                              editor.chain().focus().unsetHighlight().run();
                            } else {
                              editor.chain().focus().setHighlight({ color: c.color }).run();
                            }
                          }}
                          className={`bubble-menu-color-btn ${
                            (c.id === 'default' && !editor.isActive('highlight')) ||
                            editor.isActive('highlight', { color: c.color })
                              ? 'active'
                              : 'inactive'
                          }`}
                          style={{
                            backgroundColor: c.color === 'transparent' ? '#f9fafb' : c.color,
                          }}
                          title={`${c.label} background`}
                          type="button"
                        >
                          {c.id === 'default' && <span className="bubble-menu-remove-icon">✕</span>}
                        </button>
                      ))}
                    </div>
                  </BubbleMenu>
                )}
                <EditorContent editor={editor} />
              </>
            ) : (
              <div className="tiptap-loading">
                <div className="tiptap-loading-spinner" />
                Loading editor...
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }
);

TiptapEditor.displayName = 'TiptapEditor';

export default TiptapEditor;
