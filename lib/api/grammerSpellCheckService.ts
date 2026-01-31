import { STORAGE_KEYS } from '@/lib/constants/storage-keys';
import {
  CorrectedGrammerMistake,
  CorrectedMistake,
  GrammerCheckRequest,
  SpellMistake,
} from '@/types/spellcheck';

interface Config {
  WsUrl: string;
}

type OnSpellHandler = (data: CorrectedMistake) => void;
type OnGrammarHandler = (data: CorrectedGrammerMistake) => void;

export default class GrammerSpellCheckService {
  private ws: WebSocket | null = null;
  private config: Config;
  private reconnectTimer: any = null;

  private onSpellHandler: OnSpellHandler | null = null;
  private onGrammarHandler: OnGrammarHandler | null = null;

  constructor(config: Config) {
    this.config = config;
  }

  setOnSpellHandler(handler: OnSpellHandler | null) {
    this.onSpellHandler = handler;
  }

  setOnGrammarHandler(handler: OnGrammarHandler | null) {
    this.onGrammarHandler = handler;
  }

  async connect(): Promise<void> {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) return;

    return new Promise((resolve, reject) => {
      let token = '';
      if (typeof document !== 'undefined') {
        const cookies = document.cookie.split(';');
        for (const cookie of cookies) {
          const [name, ...rest] = cookie.trim().split('=');
          if (name === STORAGE_KEYS.ACCESS_TOKEN) {
            token = decodeURIComponent(rest.join('='));
            break;
          }
        }
      }

      const url = `${this.config.WsUrl}?token=${token}`;
      this.ws = new WebSocket(url);

      this.ws.onopen = () => {
        clearTimeout(this.reconnectTimer);
        resolve();
      };

      this.ws.onmessage = (ev) => this._handleRawMessage(ev.data);

      this.ws.onclose = () => {
        this.ws = null;
        this.reconnectTimer = setTimeout(() => this.connect().catch(() => {}), 2000);
      };

      this.ws.onerror = (err) => {
        console.error('⚠️ WebSocket error:', err);
      };
    });
  }

  async sendSpellCheck(payload: SpellMistake) {
    await this.connect();
    if (this.ws?.readyState === WebSocket.OPEN) {
      const text = payload.mistakes.map((m) => m.word).join(' ');
      const message = {
        type: 'SPELLCHECK_REQUEST',
        data: { text },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  async sendGrammarCheck(payload: GrammerCheckRequest) {
    await this.connect();
    if (this.ws?.readyState === WebSocket.OPEN) {
      const message = {
        type: 'GRAMMERCHECK_REQUEST',
        data: { text: payload.text },
      };
      this.ws.send(JSON.stringify(message));
    }
  }

  private _handleRawMessage(raw: string) {
    try {
      const parsed = JSON.parse(raw);
      console.log('Received WebSocket message:', parsed);

      switch (parsed?.type) {
        case 'CORRECTSENTENCE_RESPONSE': {
          const corrected: CorrectedMistake = {
            blockId: 'unknown',
            mistakes: [
              {
                word: parsed.data.corrected_text,
                position: 0,
              },
            ],
          };
          this.onSpellHandler?.(corrected);
          break;
        }

        case 'ANALYZELEGALDOCUMENT_RESPONSE': {
          const grammarData: CorrectedGrammerMistake = {
            blockId: 'unknown',
            correction:
              parsed.data.grammar_errors?.map((g: any) => ({
                text: g.corrected_sentence,
                wrongText: g.original_sentence,
              })) ||
              parsed.data.tone_errors?.map((g: any) => ({
                text: g.corrected_sentence,
                wrongText: g.original_sentence,
              })),
          };
          this.onGrammarHandler?.(grammarData);
          break;
        }

        default:
          console.warn('Unhandled message:', parsed?.type, parsed);
      }
    } catch (err) {
      console.error('Failed to parse WebSocket message:', err);
    }
  }

  close() {
    try {
      this.ws?.close();
    } catch (err) {
      console.error(err);
    }
    this.ws = null;
    clearTimeout(this.reconnectTimer);
    this.reconnectTimer = null;
  }
}
