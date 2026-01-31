'use client';

import { Extension } from '@tiptap/core';

// Extend the Commands interface to include block keymap commands
declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    BlockKeymap: {
      handleBlockEnterKey: () => ReturnType;
      selectTextWithinNodeBoundaries: () => ReturnType;
    };
  }
}

/**
 * BlockKeymap Extension - Handles keyboard shortcuts for block-based editing
 *
 * Provides special Enter key handling:
 * - At end of block: Creates new rootblock after current
 * - In middle of block: Splits content and creates new rootblock
 */
const BlockKeymap = Extension.create({
  name: 'BlockKeymap',

  addCommands() {
    return {
      handleBlockEnterKey:
        () =>
        ({ state, chain }) => {
          const { selection, doc } = state;
          const { $from, $to } = selection;

          // Check if we're inside a rootblock
          const rootBlockNode = $from.node(-1);
          if (!rootBlockNode || rootBlockNode.type.name !== 'rootblock') {
            // Not in a rootblock, use default behavior
            return false;
          }

          // Check if cursor is in a block element and no selection
          if (!$from.parent.type.isBlock || $to.pos !== $from.pos) {
            return false;
          }

          // Check if cursor is at the end of the block
          if ($to.pos === $from.end()) {
            // At end - create new rootblock after current
            console.log('[BlockKeymap] Creating new block at end');
            return chain()
              .focus()
              .insertContentAt($from.pos, {
                type: 'rootblock',
                content: [
                  {
                    type: 'paragraph',
                  },
                ],
              })
              .focus($from.pos + 4)
              .run();
          } else {
            // In middle - split content and create new block
            console.log('[BlockKeymap] Splitting block in middle');

            let currentActiveNodeTo = -1;

            // Find the end of the current active node
            doc.descendants((node, pos) => {
              if (currentActiveNodeTo !== -1) return false;
              if (node.type.name === 'rootblock') return;

              const [nodeFrom, nodeTo] = [pos, pos + node.nodeSize];
              if (nodeFrom <= $from.pos && $to.pos <= nodeTo) {
                currentActiveNodeTo = nodeTo;
              }

              return false;
            });

            if (currentActiveNodeTo === -1) {
              currentActiveNodeTo = $from.end();
            }

            // Get content from cursor to end of block
            const content = doc.slice($from.pos, currentActiveNodeTo)?.toJSON().content;

            // Replace remaining content with new rootblock
            return chain()
              .focus()
              .insertContentAt(
                { from: $from.pos, to: currentActiveNodeTo },
                {
                  type: 'rootblock',
                  content,
                }
              )
              .focus($from.pos + 4)
              .run();
          }
        },

      selectTextWithinNodeBoundaries:
        () =>
        ({ editor, commands }) => {
          const { state } = editor;
          const { tr } = state;
          const startNodePos = tr.selection.$from.start();
          const endNodePos = tr.selection.$to.end();
          return commands.setTextSelection({
            from: startNodePos,
            to: endNodePos,
          });
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      // Ctrl/Cmd + A: Select text within node boundaries first
      'Mod-a': ({ editor }) => {
        const { state } = editor;
        const { tr } = state;
        const startSelectionPos = tr.selection.from;
        const endSelectionPos = tr.selection.to;
        const startNodePos = tr.selection.$from.start();
        const endNodePos = tr.selection.$to.end();

        const isNotExtendedToNodeBoundaries =
          startSelectionPos > startNodePos || endSelectionPos < endNodePos;

        if (isNotExtendedToNodeBoundaries) {
          editor.chain().selectTextWithinNodeBoundaries().run();
          return true;
        }
        return false;
      },

      // Enter: Handle block creation
      Enter: ({ editor }) => editor.commands.handleBlockEnterKey(),
    };
  },
});

export default BlockKeymap;
