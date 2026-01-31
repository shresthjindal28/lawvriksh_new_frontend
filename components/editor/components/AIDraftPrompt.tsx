'use client';

import React, { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { TemplateType } from '@/types/aiWriting';

interface AIDraftPromptProps {
  onSubmit: (prompt: string, templateType: TemplateType, documentTitle?: string) => void;
  isLoading: boolean;
  visible: boolean;
  documentTitle?: string;
  templateType: TemplateType;
}

// Golden Sparkle AI Icon (same as AIPopup)
const AISparkleIcon = () => (
  <svg width="24" height="24" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_ai_draft)">
      <path
        d="M9.60056 2.27843C9.63058 2.19649 9.68505 2.12574 9.75659 2.07576C9.82813 2.02578 9.91329 1.99898 10.0006 1.99898C10.0878 1.99898 10.173 2.02578 10.2445 2.07576C10.3161 2.12574 10.3705 2.19649 10.4006 2.27843L10.8072 3.39043C11.1268 4.26224 11.6325 5.05396 12.2891 5.71055C12.9457 6.36713 13.7374 6.87281 14.6092 7.19243L15.7212 7.5991C15.8032 7.62912 15.8739 7.68358 15.9239 7.75512C15.9739 7.82666 16.0007 7.91183 16.0007 7.9991C16.0007 8.08637 15.9739 8.17153 15.9239 8.24307C15.8739 8.31461 15.8032 8.36907 15.7212 8.3991L14.6092 8.80576C13.7374 9.12538 12.9457 9.63106 12.2891 10.2876C11.6325 10.9442 11.1268 11.736 10.8072 12.6078L10.4006 13.7198C10.3705 13.8017 10.3161 13.8725 10.2445 13.9224C10.173 13.9724 10.0878 13.9992 10.0006 13.9992C9.91329 13.9992 9.82813 13.9724 9.75659 13.9224C9.68505 13.8725 9.63058 13.8017 9.60056 13.7198L9.19389 12.6078C8.87428 11.736 8.36859 10.9442 7.71201 10.2876C7.05543 9.63106 6.2637 9.12538 5.39189 8.80576L4.27989 8.3991C4.19795 8.36907 4.1272 8.31461 4.07722 8.24307C4.02724 8.17153 4.00044 8.08637 4.00044 7.9991C4.00044 7.91183 4.02724 7.82666 4.07722 7.75512C4.1272 7.68358 4.19795 7.62912 4.27989 7.5991L5.39189 7.19243C6.2637 6.87281 7.05543 6.36713 7.71201 5.71055C8.36859 5.05396 8.87428 4.26224 9.19389 3.39043L9.60056 2.27843ZM5.33389 11.1158C5.34633 11.0815 5.369 11.052 5.39881 11.0311C5.42863 11.0102 5.46415 10.999 5.50056 10.999C5.53697 10.999 5.57249 11.0102 5.60231 11.0311C5.63213 11.052 5.65479 11.0815 5.66723 11.1158L5.83656 11.5784C5.96982 11.9417 6.18053 12.2716 6.45405 12.5452C6.72758 12.8188 7.05738 13.0297 7.42056 13.1631L7.88389 13.3324C7.91811 13.3449 7.94767 13.3675 7.96856 13.3973C7.98945 13.4272 8.00065 13.4627 8.00065 13.4991C8.00065 13.5355 7.98945 13.571 7.96856 13.6008C7.94767 13.6307 7.91811 13.6533 7.88389 13.6658L7.42056 13.8351C7.05738 13.9685 6.72758 14.1794 6.45405 14.453C6.18053 14.7266 5.96982 15.0565 5.83656 15.4198L5.66723 15.8824C5.65479 15.9166 5.63213 15.9462 5.60231 15.9671C5.57249 15.988 5.53697 15.9992 5.50056 15.9992C5.46415 15.9992 5.42863 15.988 5.39881 15.9671C5.369 15.9462 5.34633 15.9166 5.33389 15.8824L5.16456 15.4198C5.0313 15.0565 4.8206 14.7266 4.54707 14.453C4.27354 14.1794 3.94374 13.9685 3.58056 13.8351L3.11723 13.6658C3.08301 13.6533 3.05345 13.6307 3.03256 13.6008C3.01167 13.571 3.00047 13.5355 3.00047 13.4991C3.00047 13.4627 3.01167 13.4272 3.03256 13.3973C3.05345 13.3675 3.08301 13.3449 3.11723 13.3324L3.58056 13.1631C3.94374 13.0297 4.27354 12.8188 4.54707 12.5452C4.8206 12.2716 5.0313 11.9417 5.16456 11.5784L5.33389 11.1158ZM2.80056 0.139096C2.81572 0.0982694 2.843 0.0630581 2.87875 0.0381929C2.91451 0.0133278 2.95701 0 3.00056 0C3.04411 0 3.08662 0.0133278 3.12237 0.0381929C3.15812 0.0630581 3.18541 0.0982694 3.20056 0.139096L3.40389 0.69443C3.5639 1.13032 3.81684 1.52616 4.14517 1.85449C4.47349 2.18282 4.86934 2.43576 5.30523 2.59576L5.86056 2.7991C5.90139 2.81425 5.9366 2.84154 5.96146 2.87729C5.98633 2.91304 5.99966 2.95555 5.99966 2.9991C5.99966 3.04265 5.98633 3.08515 5.96146 3.1209C5.9366 3.15666 5.90139 3.18394 5.86056 3.1991L5.30523 3.40243C4.86934 3.56243 4.47349 3.81537 4.14517 4.1437C3.81684 4.47203 3.5639 4.86788 3.40389 5.30376L3.20056 5.8591C3.18541 5.89992 3.15812 5.93513 3.12237 5.96C3.08662 5.98487 3.04411 5.99819 3.00056 5.99819C2.95701 5.99819 2.91451 5.98487 2.87875 5.96C2.843 5.93513 2.81572 5.89992 2.80056 5.8591L2.59723 5.30376C2.43723 4.86788 2.18428 4.47203 1.85596 4.1437C1.52763 3.81537 1.13178 3.56243 0.695895 3.40243L0.140561 3.1991C0.0997342 3.18394 0.0645229 3.15666 0.0396578 3.1209C0.0147927 3.08515 0.00146484 3.04265 0.00146484 2.9991C0.00146484 2.95555 0.0147927 2.91304 0.0396578 2.87729C0.0645229 2.84154 0.0997342 2.81425 0.140561 2.7991L0.695895 2.59576C1.13178 2.43576 1.52763 2.18282 1.85596 1.85449C2.18428 1.52616 2.43723 1.13032 2.59723 0.69443L2.80056 0.139096Z"
        fill="#BD9000"
      />
    </g>
    <defs>
      <clipPath id="clip0_ai_draft">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

// Loading Dots Animation
const LoadingDots = () => (
  <div className="ai-draft-loading-dots">
    <span className="dot dot-1"></span>
    <span className="dot dot-2"></span>
    <span className="dot dot-3"></span>
  </div>
);

const AIDraftPrompt: React.FC<AIDraftPromptProps> = ({
  onSubmit,
  isLoading,
  visible,
  documentTitle,
  templateType,
}) => {
  const [prompt, setPrompt] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (visible && inputRef.current) {
      inputRef.current.focus();
    }
  }, [visible]);

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    // Shift+Enter for new line
    if (e.key === 'Enter' && e.shiftKey) {
      return; // Allow default behavior (new line)
    }

    // Enter to submit
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (prompt.trim() && !isLoading) {
        onSubmit(prompt.trim(), templateType, documentTitle);
      }
    }
  };

  const handleSubmit = () => {
    if (prompt.trim() && !isLoading) {
      onSubmit(prompt.trim(), templateType, documentTitle);
    }
  };

  if (!visible) return null;

  return (
    <div className="ai-draft-prompt-container">
      <div className="ai-draft-prompt-box">
        <div className="ai-draft-icon">
          <AISparkleIcon />
        </div>
        <textarea
          ref={inputRef}
          className="ai-draft-input"
          placeholder="Here the user will write his wish for drafting..."
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isLoading}
          rows={1}
        />
        {isLoading && <LoadingDots />}
      </div>

      <style>{`
                .ai-draft-prompt-container {
                    display: flex;
                    align-items: flex-start;
                    gap: 12px;
                    padding: 8px 0;
                }

                .ai-draft-prompt-box {
                    display: flex;
                    align-items: center;
                    gap: 12px;
                    background: #ffffff;
                    border: 1px solid #E5E7EB;
                    border-radius: 10px;
                    padding: 12px 16px;
                    width: 100%;
                    max-width: 700px;
                    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
                    transition: border-color 0.2s, box-shadow 0.2s;
                }

                .ai-draft-prompt-box:focus-within {
                    border-color: #BD9000;
                    box-shadow: 0 0 0 3px rgba(189, 144, 0, 0.1);
                }

                .ai-draft-icon {
                    flex-shrink: 0;
                    display: flex;
                    align-items: center;
                    justify-content: center;
                }

                .ai-draft-input {
                    flex: 1;
                    border: none;
                    outline: none;
                    background: transparent;
                    font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
                    font-size: 15px;
                    color: #374151;
                    resize: none;
                    min-height: 24px;
                    max-height: 120px;
                    line-height: 1.5;
                    overflow-y: auto;
                }

                .ai-draft-input::placeholder {
                    color: #9CA3AF;
                }

                .ai-draft-input:disabled {
                    opacity: 0.7;
                }

                /* Loading Dots Animation */
                .ai-draft-loading-dots {
                    display: flex;
                    align-items: center;
                    gap: 4px;
                    padding-right: 4px;
                }

                .ai-draft-loading-dots .dot {
                    width: 8px;
                    height: 8px;
                    border-radius: 50%;
                    background: #3B82F6;
                    animation: dotBounce 1.4s infinite ease-in-out both;
                }

                .ai-draft-loading-dots .dot-1 {
                    animation-delay: -0.32s;
                }

                .ai-draft-loading-dots .dot-2 {
                    animation-delay: -0.16s;
                }

                .ai-draft-loading-dots .dot-3 {
                    animation-delay: 0s;
                }

                @keyframes dotBounce {
                    0%, 80%, 100% {
                        transform: scale(0.6);
                        opacity: 0.5;
                    }
                    40% {
                        transform: scale(1);
                        opacity: 1;
                    }
                }

                /* Responsive styles for mobile/tablet */
                @media (max-width: 800px) {
                    .ai-draft-prompt-container {
                        width: 80%;
                        margin: 0 auto;
                    }
                    
                    .ai-draft-prompt-box {
                        width: 100%;
                        max-width: none;
                        padding: 10px 12px;
                    }
                    
                    .ai-draft-input {
                        font-size: 14px;
                    }
                }

                @media (max-width: 480px) {
                    .ai-draft-prompt-container {
                        width: 90%;
                    }
                    
                    .ai-draft-prompt-box {
                        padding: 8px 10px;
                        gap: 8px;
                    }
                    
                    .ai-draft-input {
                        font-size: 13px;
                    }
                }
            `}</style>
    </div>
  );
};

export default AIDraftPrompt;
