'use client';

import { useEditor, EditorContent, Extension } from '@tiptap/react';
import { BubbleMenu } from '@tiptap/react/menus';
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
import { PAGE_FORMATS, Pages } from '@tiptap-pro/extension-pages';
import { Document } from '@tiptap/extension-document';
import { useEffect, forwardRef, useRef, useMemo, memo, useState } from 'react';
import { useCitationStore } from '@/store/zustand/useCitationStore';

import { VariableExtension } from '../extensions/VariableExtension';
import { FontSizeExtension } from '../extensions/FontSizeExtension';
import { AnalysisHighlight } from '../extensions/AnalysisHighlight';
import { CitationExtension } from '../extensions/CitationExtension';
import { SmartSuggestionExtension } from '../extensions/SmartSuggestionExtension';
import { RootBlockExtension } from '../extensions/RootBlockExtension';
import BlockKeymap from '../extensions/BlockKeymap';
import { CitationFormatter } from '@/lib/services/citationFormatter';
import { Sparkles, Quote } from 'lucide-react';
import '@/styles/writing-page/tiptap-editor.css';
import '@/styles/writing-page/block-editor.css';

/**
 * SlashCommandExtension - Detects '/' typed at start of empty line
 * Dispatches custom event to open the block type menu
 */
const createSlashCommandExtension = (onSlash?: () => void) =>
  Extension.create({
    name: 'slashCommand',
    addKeyboardShortcuts() {
      return {
        '/': ({ editor }) => {
          const { $from } = editor.state.selection;
          const hasNoContent = $from.parent.textContent.length === 0;
          const atStart = $from.parentOffset === 0;

          if (hasNoContent && atStart) {
            // Get the cursor position to find the block
            const selection = window.getSelection();
            if (selection && selection.rangeCount > 0) {
              const range = selection.getRangeAt(0);
              const rect = range.getBoundingClientRect();

              // Dispatch custom event that RootBlockComponent listens to
              const event = new CustomEvent('openBlockTypeMenu', {
                detail: {
                  position: { top: rect.bottom + 4, left: rect.left },
                  cursorPos: $from.pos,
                  onSlash: onSlash, // Pass onSlash for Continue with AI
                },
                bubbles: true,
              });
              document.dispatchEvent(event);
            }
            return true; // Prevent "/" from being typed
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

interface BlockBasedTiptapEditorProps {
  templateData: TemplateData;
  variables: TemplateVariable[];
  onContentChange?: (content: string) => void;
  onEditorReady?: (editor: any) => void;
  citationStyle?: string;
  isAiPopupOpen?: boolean;
  onSlash?: () => void;
  onShowAIPopup?: () => void;
  textSize?: string;
  onCite?: () => void;
  onVariableClick?: (variableName: string) => void;
  zoomLevel?: number;
}

// Custom Document node that uses rootblock as top-level content
const BlockDocument = Document.extend({
  content: 'rootblock+',
});

/**
 * Convert HTML content to block-based structure
 * Wraps each top-level block element in a rootblock
 */
function wrapContentInRootBlocks(html: string): string {
  if (!html || html.trim() === '') {
    return '<div data-type="rootblock"><p>Start writing here...</p></div>';
  }

  // Check if content is already wrapped in rootblocks
  if (html.includes('data-type="rootblock"')) {
    return html;
  }

  // Parse HTML and wrap each top-level element in rootblock
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = html;

  let result = '';
  const children = tempDiv.childNodes;

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (child.nodeType === Node.ELEMENT_NODE) {
      const element = child as HTMLElement;
      result += `<div data-type="rootblock">${element.outerHTML}</div>`;
    } else if (child.nodeType === Node.TEXT_NODE && child.textContent?.trim()) {
      // Wrap text nodes in a paragraph inside rootblock
      result += `<div data-type="rootblock"><p>${child.textContent}</p></div>`;
    }
  }

  return result || '<div data-type="rootblock"><p>Start writing here...</p></div>';
}

/**
 * Substitute template variables in text
 */
function substituteVariables(text: string, variables: TemplateVariable[]): string {
  let result = text;
  variables.forEach((v) => {
    const pattern = new RegExp(`{{${v.name}}}`, 'g');
    const safeValue = (v.value || '').replace(/"/g, '&quot;');
    const nodeHTML = `<span data-type="variable" data-var-name="${v.name}" data-var-label="${v.label}" data-var-value="${safeValue}" data-var-type="${v.type}" class="variable-chip">${v.value || `[${v.label}]`}</span>`;
    result = result.replace(pattern, nodeHTML);
  });
  return result;
}

/**
 * Convert blocks to HTML
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
        if (level === 1 || level === 2) {
          return `<h${level} style="${alignStyle}"><u>${text}</u></h${level}>`;
        }
        return `<h${level} style="${alignStyle}">${text}</h${level}>`;
      }

      text = text.replace(/<br>/g, '<br/>');
      return `<p style="${alignStyle}">${text}</p>`;
    })
    .join('');
}

/**
 * Preprocess content for markdown-like syntax
 */
function preprocessContent(html: string): string {
  let result = html;

  result = result.replace(/\r\n/g, '\n');
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
  result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
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
  result = result.replace(/<br\s*\/?>\s*<br\s*\/?>/g, '<br/>');
  result = result.replace(/<p[^>]*>\s*<\/p>/g, '');

  return result;
}

/**
 * BlockBasedTiptapEditor - A block-based editor with Notion-style drag handles and add buttons
 */
export const BlockBasedTiptapEditor = memo(
  forwardRef<HTMLDivElement, BlockBasedTiptapEditorProps>(
    (
      {
        templateData,
        variables,
        onContentChange,
        onEditorReady,
        citationStyle,
        isAiPopupOpen,
        onSlash,
        onShowAIPopup,
        textSize = 'normal',
        onCite,
        onVariableClick,
        zoomLevel = 100,
      },
      ref
    ) => {
      const onSlashRef = useRef(onSlash);
      const onShowAIPopupRef = useRef(onShowAIPopup);
      const onVariableClickRef = useRef(onVariableClick);

      useEffect(() => {
        onSlashRef.current = onSlash;
        onShowAIPopupRef.current = onShowAIPopup;
        onVariableClickRef.current = onVariableClick;
      }, [onSlash, onShowAIPopup, onVariableClick]);

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

      // Prepare content
      const rawContent =
        templateData.content || convertBlocksToHTML(templateData.blocks || [], variables);
      const substitutedContent = templateData.content
        ? substituteVariables(rawContent, variables)
        : rawContent;
      const preprocessedContent = preprocessContent(substitutedContent);
      const initialContent = wrapContentInRootBlocks(preprocessedContent);

      const isMobile = typeof window !== 'undefined' && window.innerWidth < 900;

      const editor = useEditor(
        {
          extensions: [
            Pages.configure({
              pageFormat: {
                // User requested A4 dimensions to ensure consistent pagination,
                // but with custom "little big" vertical padding.
                width: PAGE_FORMATS.A4.width,
                height: PAGE_FORMATS.A4.height,
                margins: {
                  top: 56, // Increased as requested
                  right: 56,
                  bottom: 96, // Increased as requested
                  left: 30,
                },
              },
              headerTopMargin: 24,
              footerBottomMargin: 24,
              pageGap: 24,
              header: `<div contenteditable="false" style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; width: 100%; font-size: 0.8rem; color: #4b5563; user-select: none;"><div style="text-align: left;"></div><div style="text-align: center;"></div><div style="text-align: right;"></div></div>`,
              footer: `<div contenteditable="false" style="display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; width: 100%; font-size: 0.8rem; color: #4b5563; user-select: none;"><div style="text-align: left;"></div><div style="text-align: center;"></div><div style="text-align: right;">{page} of {total}</div></div>`,
              pageBreakBackground: '#e5e7eb',
            }),
            BlockDocument,
            RootBlockExtension.configure({
              onSlash: () => onSlashRef.current?.(),
              onAskAI: () => onShowAIPopupRef.current?.(),
            }),
            BlockKeymap,
            StarterKit.configure({
              document: false, // Use our custom BlockDocument
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
            CitationExtension,
            SmartSuggestionExtension,
            RootBlockExtension,
            BlockKeymap,
            Image.configure({
              inline: true,
              allowBase64: true,
            }),
            createSlashCommandExtension(() => onSlashRef.current?.()),
          ],
          content: initialContent,
          editable: true,
          editorProps: {
            attributes: {
              class: 'tiptap-editor block-based-editor tiptap-base-styles',
              spellcheck: 'true',
            },
          },
          onUpdate: ({ editor }) => {
            if (onContentChange) {
              onContentChange(editor.getHTML());
            }
          },
          immediatelyRender: false,
        },
        []
      );

      // Get citations from store (includes pageNumber and title)
      const citations = useCitationStore((state) => state.citations);

      // Track editor updates to trigger citationMap refresh
      const [editorVersion, setEditorVersion] = useState(0);

      // Listen for editor updates to refresh citation display
      useEffect(() => {
        if (!editor) return;
        const handleUpdate = () => setEditorVersion((v) => v + 1);
        editor.on('update', handleUpdate);
        return () => {
          editor.off('update', handleUpdate);
        };
      }, [editor]);

      // Create a map of pageNumber -> array of citation numbers for quick lookup
      // Collects ALL citations on each page
      const citationMap = useMemo(() => {
        const map = new Map<number, string[]>();

        // Method 1: From Zustand store (primary source)
        citations.forEach((citation, index) => {
          // Use document order (index + 1) for numbering: [1], [2], etc.
          // Format: [1] Title
          // Clean title if it already starts with numbering to avoid duplicate [1] [1] Title
          const cleanTitle = citation.title.replace(/^\[\d+\]\s*/, '');
          const citationDisplay = `[${index + 1}] ${cleanTitle}`;

          if (!map.has(citation.pageNumber)) {
            map.set(citation.pageNumber, [citationDisplay]);
          } else {
            const existing = map.get(citation.pageNumber)!;
            existing.push(citationDisplay);
          }
        });

        // Method 2: Fallback - extract from editor HTML if store is empty
        // This ensures citations are visible even before store is synced
        if (map.size === 0 && editor) {
          const html = editor.getHTML();
          const regex = /data-citation-number="(\d+)"[^>]*data-citation-title="([^"]*)"/g;
          let match;
          while ((match = regex.exec(html)) !== null) {
            const citationNumber = parseInt(match[1], 10);
            const title = match[2] || 'Citation';
            const cleanTitle = title.replace(/^\[\d+\]\s*/, '');
            const display = `[${citationNumber}] ${cleanTitle}`;
            // Default to page 1 if we can't determine page
            if (!map.has(1)) map.set(1, []);
            map.get(1)!.push(display);
          }
        }

        return map;
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [citations, editor, editorVersion]);

      // Update footers to add citation titles on pages with citations and ensure page numbers on all pages
      useEffect(() => {
        if (!editor?.view?.dom) {
          return;
        }

        let isUpdating = false; // Prevent infinite loops
        const updateFooters = (): boolean => {
          if (isUpdating) return false; // Skip if already updating
          isUpdating = true;
          let footersFound = false;

          // Find the document container first
          const container =
            editor.view.dom.closest('.tiptap-document-container') || editor.view.dom;

          // Find all page footers - try multiple selectors
          const footers = container.querySelectorAll('.tiptap-page-footer');

          if (footers.length === 0) {
            // Try finding footers within page elements
            const pages = container.querySelectorAll('.page');
            if (pages.length === 0) {
              isUpdating = false;
              return false; // No pages found
            }
            pages.forEach((page, index) => {
              const footer =
                page.querySelector('.tiptap-page-footer') ||
                page.querySelector('[class*="footer"]');
              if (footer) {
                // Protect footer from editing to prevent crashes on double-click
                footer.setAttribute('contenteditable', 'false');
                (footer as HTMLElement).style.userSelect = 'none';
                (footer as HTMLElement).style.pointerEvents = 'none';

                const pageNumber = index + 1;
                const totalPages = pages.length;
                const pageNumberText = `${pageNumber} of ${totalPages}`;

                // Find or create grid container
                let gridContainer =
                  footer.querySelector('div[style*="display: grid"]') ||
                  (footer.firstElementChild as HTMLElement);

                if (!gridContainer || !gridContainer.getAttribute('style')?.includes('grid')) {
                  // Create the grid structure if it doesn't exist
                  gridContainer = document.createElement('div');
                  gridContainer.setAttribute(
                    'style',
                    'display: grid; grid-template-columns: 1fr 1fr 1fr; align-items: center; width: 100%; font-size: 0.8rem; color: #4b5563;'
                  );
                  footer.innerHTML = '';
                  footer.appendChild(gridContainer);
                }

                // Remove duplicate right divs
                const allRightDivs = gridContainer.querySelectorAll(
                  'div[style*="text-align: right"]'
                );
                if (allRightDivs.length > 1) {
                  for (let i = 1; i < allRightDivs.length; i++) {
                    allRightDivs[i].remove();
                  }
                }

                // Ensure LEFT div has page numbers for ALL pages - SWAPPED POSITION
                let leftDiv = gridContainer.querySelector(
                  'div[style*="text-align: left"]'
                ) as HTMLElement;
                if (leftDiv) {
                  leftDiv.textContent = pageNumberText;
                } else {
                  leftDiv = document.createElement('div');
                  leftDiv.style.textAlign = 'left';
                  leftDiv.textContent = pageNumberText;
                  gridContainer.insertBefore(leftDiv, gridContainer.firstChild);
                }

                // Handle citations - RIGHT div
                const citationTexts = citationMap.get(pageNumber);
                // Join multiple citations with space if needed, though usually one per line is better?
                // User asked for [[1]title] [[2]title], so space separated is fine.
                const citationDisplay =
                  citationTexts && citationTexts.length > 0 ? citationTexts.join(' ') : '';

                let rightDiv = gridContainer.querySelector(
                  'div[style*="text-align: right"]'
                ) as HTMLElement;

                if (citationDisplay) {
                  if (rightDiv) {
                    if (rightDiv.textContent !== citationDisplay) {
                      rightDiv.textContent = citationDisplay;
                      rightDiv.style.color = '#027FBD';
                      rightDiv.style.fontSize = '0.7rem';
                    }
                  } else {
                    rightDiv = document.createElement('div');
                    rightDiv.style.textAlign = 'right';
                    rightDiv.style.color = '#027FBD';
                    rightDiv.style.fontSize = '0.7rem';
                    rightDiv.textContent = citationDisplay;
                    gridContainer.appendChild(rightDiv);
                  }
                } else if (rightDiv && rightDiv.textContent) {
                  rightDiv.textContent = '';
                }
              }
            });
            footersFound = true;
            isUpdating = false;
            return true;
          }

          footers.forEach((footer, index) => {
            // Protect footer from editing to prevent crashes on double-click
            footer.setAttribute('contenteditable', 'false');
            (footer as HTMLElement).style.userSelect = 'none';
            (footer as HTMLElement).style.pointerEvents = 'none';

            // Find the page number from the footer text (format: "{page} of {total}")
            const footerText = footer.textContent || '';
            const pageMatch = footerText.match(/(\d+)\s+of\s+\d+/);

            let pageNumber: number;
            if (pageMatch) {
              pageNumber = parseInt(pageMatch[1], 10);
            } else {
              // Fallback: use index + 1
              pageNumber = index + 1;
            }

            const totalPages = footers.length;
            const pageNumberText = `${pageNumber} of ${totalPages}`;

            // Find the grid container div (the one with display: grid)
            const gridContainer =
              footer.querySelector('div[style*="display: grid"]') ||
              (footer.firstElementChild as HTMLElement);

            if (gridContainer) {
              // Find ALL left and right divs to remove duplicates
              const allLeftDivs = gridContainer.querySelectorAll('div[style*="text-align: left"]');
              const allRightDivs = gridContainer.querySelectorAll(
                'div[style*="text-align: right"]'
              );

              // Remove duplicate left divs - keep only the first one
              if (allLeftDivs.length > 1) {
                for (let i = 1; i < allLeftDivs.length; i++) {
                  allLeftDivs[i].remove();
                }
              }

              // Remove duplicate right divs - keep only the first one
              if (allRightDivs.length > 1) {
                for (let i = 1; i < allRightDivs.length; i++) {
                  allRightDivs[i].remove();
                }
              }

              // Find or create the LEFT div with page numbers (for ALL pages) - SWAPPED POSITION
              let leftDiv = gridContainer.querySelector(
                'div[style*="text-align: left"]'
              ) as HTMLElement;

              // Ensure left div has page numbers for ALL pages
              if (leftDiv) {
                if (leftDiv.textContent !== pageNumberText) {
                  leftDiv.textContent = pageNumberText;
                }
              } else {
                // Create left div if it doesn't exist
                const newLeftDiv = document.createElement('div');
                newLeftDiv.style.textAlign = 'left';
                newLeftDiv.textContent = pageNumberText;
                gridContainer.insertBefore(newLeftDiv, gridContainer.firstChild);
              }

              // Also check for any duplicate page number text in the footer
              const footerText = footer.textContent || '';
              const pageNumberMatches = footerText.match(/\d+\s+of\s+\d+/g);
              if (pageNumberMatches && pageNumberMatches.length > 1) {
                // Keep only the correct page number in the left div
                if (leftDiv) {
                  leftDiv.textContent = pageNumberText;
                }
              }

              // Check if this page has citations and update RIGHT div
              const citationTexts = citationMap.get(pageNumber);
              const citationDisplay =
                citationTexts && citationTexts.length > 0 ? citationTexts.join(' ') : '';

              // Find or create the right div
              let rightDiv = (gridContainer.querySelector('div[style*="text-align: right"]') ||
                gridContainer.querySelector('div:last-child')) as HTMLElement;

              if (citationDisplay) {
                if (rightDiv) {
                  if (rightDiv.textContent !== citationDisplay) {
                    rightDiv.textContent = citationDisplay;
                    rightDiv.style.color = '#027FBD';
                    rightDiv.style.fontSize = '0.7rem';
                  }
                } else {
                  const newRightDiv = document.createElement('div');
                  newRightDiv.style.textAlign = 'right';
                  newRightDiv.style.color = '#027FBD';
                  newRightDiv.style.fontSize = '0.7rem';
                  newRightDiv.textContent = citationDisplay;
                  gridContainer.appendChild(newRightDiv);
                }
              } else if (rightDiv && rightDiv.textContent) {
                rightDiv.textContent = '';
              }
            } else {
              // If no grid container exists, find or create elements directly
              // First, remove any duplicate divs
              const allLeftDivs = footer.querySelectorAll('div[style*="text-align: left"]');
              const allRightDivs = footer.querySelectorAll('div[style*="text-align: right"]');
              if (allLeftDivs.length > 1) {
                for (let i = 1; i < allLeftDivs.length; i++) {
                  allLeftDivs[i].remove();
                }
              }
              if (allRightDivs.length > 1) {
                for (let i = 1; i < allRightDivs.length; i++) {
                  allRightDivs[i].remove();
                }
              }

              // LEFT div for page numbers - SWAPPED POSITION
              let leftDiv =
                footer.querySelector('div[style*="text-align: left"]') ||
                (footer.querySelector('div:first-child') as HTMLElement);

              // Ensure left div has page numbers
              if (leftDiv) {
                if (leftDiv.textContent !== pageNumberText) {
                  leftDiv.textContent = pageNumberText;
                }
              } else {
                // Create left div if it doesn't exist
                const newLeftDiv = document.createElement('div');
                newLeftDiv.style.textAlign = 'left';
                newLeftDiv.textContent = pageNumberText;
                footer.insertBefore(newLeftDiv, footer.firstChild);
              }

              // Check for duplicate page number text
              const footerText = footer.textContent || '';
              const pageNumberMatches = footerText.match(/\d+\s+of\s+\d+/g);
              if (pageNumberMatches && pageNumberMatches.length > 1) {
                if (leftDiv) {
                  leftDiv.textContent = pageNumberText;
                }
              }

              // RIGHT div for citations
              const citationTexts = citationMap.get(pageNumber);
              const citationDisplay =
                citationTexts && citationTexts.length > 0 ? citationTexts.join(' ') : '';

              let rightDiv = (footer.querySelector('div[style*="text-align: right"]') ||
                footer.querySelector('div:last-child')) as HTMLElement;

              if (citationDisplay) {
                if (rightDiv) {
                  if (rightDiv.textContent !== citationDisplay) {
                    rightDiv.textContent = citationDisplay;
                    rightDiv.style.color = '#027FBD';
                    rightDiv.style.fontSize = '0.7rem';
                  }
                } else {
                  const newRightDiv = document.createElement('div');
                  newRightDiv.style.textAlign = 'right';
                  newRightDiv.style.color = '#027FBD';
                  newRightDiv.style.fontSize = '0.7rem';
                  newRightDiv.textContent = citationDisplay;
                  footer.appendChild(newRightDiv);
                }
              } else if (rightDiv && rightDiv.textContent) {
                rightDiv.textContent = '';
              }
            }
          });

          isUpdating = false;
          return footersFound;
        };

        const tryUpdate = () => {
          const found = updateFooters();
          return found;
        };

        // 1. Unconditionally try to update immediately (for case where pages already exist)
        // Use requestAnimationFrame to ensure we're in sync with paint cycles
        // Optimization: Only delay if no pages are found (initial load)
        const containerRef = editor.view.dom.closest('.tiptap-document-container');
        const hasPages = containerRef?.querySelector('.page');

        let initialTimer: NodeJS.Timeout | null = null;

        if (hasPages) {
          setTimeout(() => {
            requestAnimationFrame(() => {
              tryUpdate();
            });
          }, 50);
          requestAnimationFrame(() => {
            tryUpdate();
          });
        } else {
          // Add a small delay to ensure Tiptap has flushed its initial render
          initialTimer = setTimeout(() => {
            requestAnimationFrame(() => {
              tryUpdate();
            });
          }, 50);
        }

        // 2. Setup MutationObserver to handle dynamic page loading/re-rendering
        const observer = new MutationObserver((mutations) => {
          const hasPageChanges = mutations.some(
            (m) =>
              Array.from(m.addedNodes).some((n) => (n as Element).classList?.contains('page')) ||
              Array.from(m.removedNodes).some((n) => (n as Element).classList?.contains('page'))
          );

          if (hasPageChanges) {
            tryUpdate();
          }
        });

        const container = editor.view.dom.closest('.tiptap-document-container') || editor.view.dom;
        if (container) {
          observer.observe(container, {
            childList: true,
            subtree: true, // Monitor subtree to catch pages nested in wrappers
          });
        }

        return () => {
          if (initialTimer) clearTimeout(initialTimer);
          observer.disconnect();
        };
      }, [editor, citationMap]);

      // Expose editor to parent
      useEffect(() => {
        if (editor && onEditorReady) {
          onEditorReady(editor);
        }
      }, [editor, onEditorReady]);

      // Sync content changes
      useEffect(() => {
        if (editor && templateData.content) {
          const currentHTML = editor.getHTML();
          const contentText = editor.getText().trim();
          const isEditorEffectivelyEmpty =
            editor.isEmpty ||
            contentText === '' ||
            currentHTML === '<p></p>' ||
            currentHTML === '<p style="text-align: justify;"></p>' ||
            currentHTML.includes('<div data-type="rootblock"><p></p></div>');

          const isNewContentNotEmpty = templateData.content.replace(/<[^>]*>/g, '').trim() !== '';

          if (isEditorEffectivelyEmpty && isNewContentNotEmpty) {
            const wrappedContent = wrapContentInRootBlocks(templateData.content);
            editor.commands.setContent(wrappedContent);
          }
        }
      }, [templateData.content, editor]);

      // Update variable marks
      useEffect(() => {
        if (!editor || !variables) return;

        const variableMark = editor.schema.marks.variable;
        if (!variableMark) return;

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

      // Update citations on style change
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
        <div className="tiptap-editor-wrapper block-based-wrapper" style={{ minWidth: 0 }}>
          <div className={`tiptap-editor-bg tiptap-editor-${textSize}`} ref={ref}>
            <div
              className="tiptap-document-container"
              style={{
                transform: `scale(${zoomLevel / 100})`,
                transformOrigin: 'top center',
                transition: 'transform 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                minHeight: '100%',
                margin: '0 auto',
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
                              editor.isActive('textStyle', { color: c.color })
                                ? 'active'
                                : 'inactive'
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
                            {c.id === 'default' && (
                              <span className="bubble-menu-remove-icon">✕</span>
                            )}
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
  ),
  (prevProps, nextProps) => {
    // Custom comparison to prevent re-renders unless actually necessary
    if (
      prevProps.citationStyle !== nextProps.citationStyle ||
      prevProps.textSize !== nextProps.textSize ||
      prevProps.zoomLevel !== nextProps.zoomLevel ||
      prevProps.isAiPopupOpen !== nextProps.isAiPopupOpen
    ) {
      return false;
    }

    // Check content equality
    if (prevProps.templateData?.content !== nextProps.templateData?.content) {
      return false;
    }

    return true; // Props are equal enough
  }
);

BlockBasedTiptapEditor.displayName = 'BlockBasedTiptapEditor';

export default BlockBasedTiptapEditor;
