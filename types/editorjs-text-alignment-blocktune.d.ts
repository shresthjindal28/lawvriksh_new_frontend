declare module 'editorjs-text-alignment-blocktune' {
  import { BlockTune } from '@editorjs/editorjs';

  export interface AlignmentTuneConfig {
    default?: 'left' | 'center' | 'right' | 'justify';
    blocks?: {
      [key: string]: 'left' | 'center' | 'right' | 'justify';
    };
  }

  export default class AlignmentTuneTool implements BlockTune {
    constructor(config?: { config?: AlignmentTuneConfig });
    static get isTune(): boolean;
    render(): HTMLElement;
    wrap(pluginsContent: HTMLElement): HTMLElement;
    save(): { alignment: 'left' | 'center' | 'right' | 'justify' };
  }
}
