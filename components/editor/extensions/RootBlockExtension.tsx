'use client';

import { mergeAttributes, Node } from '@tiptap/core';
import { ReactNodeViewRenderer } from '@tiptap/react';
import RootBlockComponent from '../block-base-editor/RootBlockComponent';

// Extend the Commands interface to include RootBlockCommands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    RootBlockCommands: {
      setRootBlock: (position?: number) => ReturnType;
    };
  }
}

/**
 * RootBlock Extension - Creates a wrapper node for block-based editing
 *
 * Each block in the editor is wrapped in a rootblock node that provides:
 * - Drag handle for reordering blocks
 * - Plus button for adding new blocks
 * - Custom keyboard handling for block creation
 */
export const RootBlockExtension = Node.create({
  name: 'rootblock',
  group: 'rootblock',
  content: 'block', // Each rootblock contains exactly one block element
  draggable: true, // Enable drag-and-drop reordering
  selectable: false, // Node itself isn't selectable, content is
  inline: false, // Block-level element
  priority: 1000, // High priority for node resolution
  defining: true, // This node defines a boundary for operations

  // Default options
  addOptions() {
    return {
      HTMLAttributes: {},
      onSlash: null as (() => void) | null,
      onAskAI: null as (() => void) | null,
    };
  },

  // Define commands for the RootBlock node
  addCommands() {
    return {
      setRootBlock:
        (position) =>
        ({ state, chain }) => {
          const {
            selection: { from },
          } = state;

          // Determine insertion position - use provided position or current cursor
          const pos = position !== undefined && position !== null ? position : from;

          // Insert a new rootblock with an empty paragraph
          return chain()
            .insertContentAt(pos, {
              type: this.name,
              content: [
                {
                  type: 'paragraph',
                },
              ],
            })
            .focus(pos + 4)
            .run();
        },
    };
  },

  // Keyboard shortcuts
  addKeyboardShortcuts() {
    return {
      'Mod-Alt-0': () => this.editor.commands.setRootBlock(),
    };
  },

  // Parse HTML to node
  parseHTML() {
    return [
      {
        tag: 'div[data-type="rootblock"]',
      },
    ];
  },

  // Render node to HTML
  renderHTML({ HTMLAttributes }) {
    return [
      'div',
      mergeAttributes(HTMLAttributes, { 'data-type': 'rootblock' }),
      0, // Hole for content
    ];
  },

  // Use React component for rendering
  addNodeView() {
    return ReactNodeViewRenderer(RootBlockComponent);
  },
});

export default RootBlockExtension;
