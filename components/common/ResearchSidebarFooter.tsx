'use client';
import { Paperclip, Globe, CircleArrowRight, X } from 'lucide-react';
import { SelectedContext } from '@/types/editor';

interface ResearchSidebarFooterProps {
  message: string;
  setMessage: (message: string) => void;
  textareaRef: React.RefObject<HTMLTextAreaElement | null>;
  handleSend: () => void;
  handleKeyDown: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
  selectedContext: SelectedContext | null;
  onClearContext: () => void;
  onAttachFile: (e: React.MouseEvent<HTMLButtonElement>) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export default function ResearchSidebarFooter({
  message,
  setMessage,
  textareaRef,
  handleSend,
  handleKeyDown,
  selectedContext,
  onClearContext,
  onAttachFile,
  fileInputRef,
  handleFileChange,
}: ResearchSidebarFooterProps) {
  return (
    <div className="chat-input-container">
      {selectedContext && (
        <div className="tag-container">
          <div className="at-symbol">@</div>
          <div className="file-tag">
            <span>Block {selectedContext.blockIndex + 1}</span>
            <button className="tag-close-btn" onClick={onClearContext} aria-label="Remove context">
              <X size={14} />
            </button>
          </div>
        </div>
      )}

      <div className="input-wrapper">
        <textarea
          ref={textareaRef}
          className="chat-input"
          placeholder={selectedContext ? 'Ask about this selection...' : 'Ask Anything from me...'}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyDown={handleKeyDown}
          rows={1}
        />
      </div>

      <div className="action-bar">
        <div className="left-actions">
          <input
            type="file"
            style={{ display: 'none' }}
            ref={fileInputRef}
            onChange={handleFileChange}
          />
          <button className="icon-button" onClick={onAttachFile} aria-label="Attach file">
            <Paperclip size={20} />
          </button>
          <button className="icon-button" aria-label="Search web">
            <Globe size={20} />
          </button>
        </div>

        <button
          className={`send-button ${message.trim() ? 'active' : ''}`}
          onClick={handleSend}
          aria-label="Send message"
        >
          <CircleArrowRight size={20} />
        </button>
      </div>
    </div>
  );
}
