import { Mark, mergeAttributes } from '@tiptap/core';

export const CitationExtension = Mark.create({
  name: 'citation',

  addOptions() {
    return {
      HTMLAttributes: {
        class: 'inline-citation',
        style:
          'color: #027FBD; cursor: pointer; text-decoration: underline; border-bottom: 1px solid #027FBD;',
      },
    };
  },

  addAttributes() {
    return {
      referenceId: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-reference-id'),
        renderHTML: (attributes) => {
          if (!attributes.referenceId) {
            return {};
          }
          return {
            'data-reference-id': attributes.referenceId,
          };
        },
      },
      citationNumber: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-number'),
        renderHTML: (attributes) => {
          if (!attributes.citationNumber) {
            return {};
          }
          return {
            'data-citation-number': attributes.citationNumber,
          };
        },
      },
      citationLink: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-link'),
        renderHTML: (attributes) => ({
          'data-citation-link': attributes.citationLink,
        }),
      },
      citationTitle: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-title'),
        renderHTML: (attributes) => ({
          'data-citation-title': attributes.citationTitle,
        }),
      },
      citationAuthor: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-author'),
        renderHTML: (attributes) => ({
          'data-citation-author': attributes.citationAuthor,
        }),
      },
      citationSource: {
        default: null,
        parseHTML: (element) => element.getAttribute('data-citation-source'),
        renderHTML: (attributes) => ({
          'data-citation-source': attributes.citationSource,
        }),
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'span.inline-citation',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return ['span', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes), 0];
  },
});
