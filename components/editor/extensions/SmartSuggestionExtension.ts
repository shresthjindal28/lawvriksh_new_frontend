import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    smartSuggestion: {
      setSmartSuggestion: (suggestion: string) => ReturnType;
      clearSmartSuggestion: () => ReturnType;
      acceptSmartSuggestion: () => ReturnType;
    };
  }
}

export const SmartSuggestionExtension = Extension.create({
  name: 'smartSuggestion',

  addStorage() {
    return {
      suggestion: null as string | null,
    };
  },

  addCommands() {
    return {
      setSmartSuggestion:
        (suggestion: string) =>
        ({ tr, dispatch }: any) => {
          this.storage.suggestion = suggestion;
          if (dispatch) {
            tr.setMeta('smartSuggestion', { action: 'set', suggestion });
          }
          return true;
        },
      clearSmartSuggestion:
        () =>
        ({ tr, dispatch }: any) => {
          this.storage.suggestion = null;
          if (dispatch) {
            tr.setMeta('smartSuggestion', { action: 'clear' });
          }
          return true;
        },
      acceptSmartSuggestion:
        () =>
        ({ chain, commands }: any) => {
          const suggestion = this.storage.suggestion;
          if (suggestion) {
            // First clear the suggestion to remove decoration
            // Then insert content
            // We use chain to ensure order
            return chain().insertContent(suggestion).clearSmartSuggestion().run();
          }
          return false;
        },
    };
  },

  addKeyboardShortcuts() {
    return {
      Tab: () => {
        if (this.storage.suggestion) {
          return this.editor.commands.acceptSmartSuggestion();
        }
        return false;
      },
      Escape: () => {
        if (this.storage.suggestion) {
          this.editor.commands.clearSmartSuggestion();
          return true;
        }
        return false;
      },
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: new PluginKey('smartSuggestion'),
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply: (tr, oldState) => {
            const meta = tr.getMeta('smartSuggestion');

            if (meta) {
              if (meta.action === 'clear') {
                return DecorationSet.empty;
              }
              if (meta.action === 'set' && meta.suggestion) {
                const { to } = tr.selection;

                const ghost = document.createElement('span');
                ghost.className = 'smart-suggestion-ghost';
                ghost.textContent = meta.suggestion;
                ghost.style.color = '#9CA3AF';
                ghost.style.fontStyle = 'italic';
                ghost.style.opacity = '0.7';
                ghost.style.whiteSpace = 'pre-wrap';
                // Need pointer events for hover
                ghost.style.pointerEvents = 'auto';
                ghost.style.cursor = 'pointer';

                // Dispatch custom events for React component to listen to
                ghost.onmouseenter = () => {
                  const event = new CustomEvent('smart-suggestion-hover-start', {
                    detail: { rect: ghost.getBoundingClientRect() },
                  });
                  document.dispatchEvent(event);
                };

                ghost.onmouseleave = () => {
                  document.dispatchEvent(new CustomEvent('smart-suggestion-hover-end'));
                };

                return DecorationSet.create(tr.doc, [
                  Decoration.widget(to, ghost, {
                    side: 1,
                    // Use text as key to force ProseMirror to re-render when text changes
                    key: `ghost-${meta.suggestion.substring(0, 20)}-${meta.suggestion.length}`,
                  }),
                ]);
              }
            }

            if (tr.docChanged || tr.selectionSet) {
              return DecorationSet.empty;
            }

            return oldState.map(tr.mapping, tr.doc);
          },
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },
});
