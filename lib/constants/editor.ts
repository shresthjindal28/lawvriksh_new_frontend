import { OutputData } from '@editorjs/editorjs';

export const WIDGET_STYLES = {
  CONTAINER: `
        height: fit-content;
        display: flex;
        align-items: center;
        justify-content: center;
    `,
  DIVIDER: `
        width: 2px;
        height: 120px;
        background-color: #AEAEAE;
        margin-right: 10px;
    `,
  BUTTON: `
        padding: 0.5rem;
        background-color: black;
        color: white;
        border-radius: 100%;
        cursor: pointer;
    `,
} as const;

export const ICON_SVG = `
    <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-quote">
        <path d="M14 14a2 2 0 0 0 2-2V8h-2"/>
        <path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/>
        <path d="M8 14a2 2 0 0 0 2-2V8H8"/>
    </svg>
`;

export const DEFAULT_EDITOR_DATA: OutputData = {
  time: Date.now(),
  blocks: [
    {
      id: 'start',
      type: 'paragraph',
      data: {
        text: 'Start Writing your Content Here, use the tools above to enhance your content!',
      },
    },
  ],
};

export const TIMING = {
  HIGHLIGHT: 1000,
  FADE_OUT: 2000,
  UNMOUNT_DELAY: 0,
  GRAMMAR_HIGHLIGHT: 3000,
} as const;

export const CSS_CLASSES = {
  HIGHLIGHT: {
    FACT_CHECKER: 'fact-checker-text-highlight',
    COMPLIANCE: 'compliance-text-highlight',
    ARGUMENT_LOGIC_A: 'argument-logic-text-highlight',
    // ARGUMENT_LOGIC_B: 'argument-logic-text-highlight-b',
    WORD: 'highlighted-word',
    GRAMMAR: 'grammar-correction-highlight',
  },
  FADE_OUT: 'fade-out',
  CITATION_HIGHLIGHTED: 'citation-data-highlighted',
} as const;
