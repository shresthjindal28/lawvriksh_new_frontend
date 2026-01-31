'use client';

import { useEffect, useRef, useState } from 'react';
import { ChevronsRight, X } from 'lucide-react';
import '@/styles/common-styles/research-sidebar.css';
import ResearchSidebarFooter from './ResearchSidebarFooter';
import { SelectedContext } from '@/types/editor';

interface ResearchSidebarProps {
  selectedContext: SelectedContext | null;
  onClearContext: () => void;
  onSendMessage: (message: string, context: SelectedContext | null) => void;
  messages: Array<{ text: string; context?: SelectedContext }>;
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;
}

export default function ResearchSidebar({
  selectedContext,
  onClearContext,
  onSendMessage,
  messages,
  isSidebarOpen,
  setIsSidebarOpen,
}: ResearchSidebarProps) {
  const [message, setMessage] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const autoResize = () => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = textarea.scrollHeight + 'px';
    }
  };

  useEffect(() => {
    autoResize();
  }, [message]);

  const handleSend = () => {
    if (message.trim()) {
      onSendMessage(message, selectedContext);
      setMessage('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleFileAttach = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    fileInputRef.current?.click();
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    console.log('Selected file:', file);
  };

  return (
    <div className="research-sidebar">
      <div className="sidebar-header">
        <button className="collapse-button" onClick={() => setIsSidebarOpen(!isSidebarOpen)}>
          <ChevronsRight className="icon-small" />
        </button>
      </div>

      <div className="sidebar-content">
        {messages.length === 0 ? (
          <>
            <p className="sidebar-title">Research About Anything..</p>
            <svg
              width="454"
              height="554"
              viewBox="0 0 454 554"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M46.168 484.75C46.168 415.5 88.8721 361.023 163.431 346.25C219.293 335.17 277.001 300.083 300.085 277M253.923 461.667C213.39 461.79 174.291 446.674 144.382 419.318C114.472 391.963 95.9354 354.365 92.4491 313.982C88.9628 273.599 100.781 233.381 125.56 201.304C150.339 169.227 186.269 147.634 226.223 140.808C357.798 115.417 392.423 103.413 438.59 46.1667C461.673 92.3334 484.756 142.655 484.756 230.833C484.756 357.792 374.418 461.667 253.923 461.667Z"
                stroke="#E1E1E1"
                strokeOpacity="0.54"
                strokeWidth="8"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </>
        ) : (
          <div className="messages-container">
            {messages.map((msg, idx) => (
              <div key={idx} className="message-item">
                {msg.context && (
                  <div className="message-context">
                    Block {msg.context.blockIndex + 1} ({msg.context.blockType})
                  </div>
                )}
                <div className="message-text">{msg.text}</div>
                {msg.context && (
                  <div className="message-excerpt">"{msg.context.text.substring(0, 100)}..."</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="sidebar-footer">
        <ResearchSidebarFooter
          message={message}
          setMessage={setMessage}
          textareaRef={textareaRef}
          handleSend={handleSend}
          handleKeyDown={handleKeyDown}
          selectedContext={selectedContext}
          onClearContext={onClearContext}
          onAttachFile={handleFileAttach}
          fileInputRef={fileInputRef}
          handleFileChange={handleFileChange}
        />
      </div>
    </div>
  );
}
