'use client';

import { Mark, mergeAttributes } from '@tiptap/core';

export const VariableExtension = Mark.create({
  name: 'variable',

  addAttributes() {
    return {
      name: {
        default: null,
        renderHTML: (attributes) => ({
          'data-var-name': attributes.name,
        }),
      },
      label: {
        default: null,
        renderHTML: (attributes) => ({
          'data-var-label': attributes.label,
        }),
      },
      value: {
        default: '',
        renderHTML: (attributes) => ({
          'data-var-value': attributes.value,
        }),
      },
      type: {
        default: 'text',
        renderHTML: (attributes) => ({
          'data-var-type': attributes.type,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span[data-type="variable"]',
        getAttrs: (node) => {
          if (typeof node === 'string') return {};
          const element = node as HTMLElement;
          return {
            name: element.getAttribute('data-var-name') || element.getAttribute('data-name'),
            label: element.getAttribute('data-var-label') || element.getAttribute('data-label'),
            value: element.getAttribute('data-var-value') || element.getAttribute('data-value'),
            type: element.getAttribute('data-var-type') || element.getAttribute('data-type-attr'),
          };
        },
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      'span',
      mergeAttributes(
        {
          'data-type': 'variable',
          class: 'variable-chip',
          style:
            'background-color: #e0f2fe; color: #0369a1; padding: 2px 6px; border-radius: 4px; border: 1px solid #7dd3fc; display: inline-block; cursor: pointer;',
        },
        HTMLAttributes
      ),
      0,
    ];
  },
});
