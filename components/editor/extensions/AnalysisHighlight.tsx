'use client';

import { Mark, mergeAttributes } from '@tiptap/core';

export interface AnalysisHighlightAttributes {
  type: 'fact' | 'compliance' | 'argument' | 'plagiarism';
  id: string | null;
  color: string;
}

/**
 * Custom TipTap mark for analysis highlighting (fact checker, compliance, argument)
 * Uses colored underlines instead of background color for cleaner appearance
 */
export const AnalysisHighlight = Mark.create({
  name: 'analysisHighlight',

  addOptions() {
    return {
      HTMLAttributes: {},
    };
  },

  addAttributes() {
    return {
      // Type of highlight: 'fact', 'compliance', 'argument'
      type: {
        default: 'fact',
        parseHTML: (element: HTMLElement) => element.getAttribute('data-highlight-type') || 'fact',
        renderHTML: (attributes: AnalysisHighlightAttributes) => ({
          'data-highlight-type': attributes.type,
        }),
      },
      // Unique ID for the highlight
      id: {
        default: null,
        parseHTML: (element: HTMLElement) => element.getAttribute('data-highlight-id'),
        renderHTML: (attributes: AnalysisHighlightAttributes) => ({
          'data-highlight-id': attributes.id,
        }),
      },
      // Custom color for the underline
      color: {
        default: '#ef4444', // Red for facts by default
        parseHTML: (element: HTMLElement) => element.style.borderBottomColor || '#ef4444',
        renderHTML: (attributes: AnalysisHighlightAttributes) => {
          // Determine color based on type if not provided
          let color = attributes.color;
          if (!color || color === '#ef4444') {
            switch (attributes.type) {
              case 'fact':
                color = '#ef4444'; // Red
                break;
              case 'compliance':
                color = '#ff9500'; // Orange
                break;
              case 'argument':
                color = attributes.color || '#2E5BFF'; // Blue (can vary)
                break;
              default:
                color = '#ef4444';
            }
          }
          return {
            style: `border-bottom: 2px solid ${color}; cursor: pointer; transition: border-color 0.2s ease; display: inline;`,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-highlight-type]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
        class: 'analysis-highlight',
      }),
      0,
    ];
  },
});

export default AnalysisHighlight;
