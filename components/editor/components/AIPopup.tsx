import React, { useState, useRef, useEffect } from 'react';
import Image from 'next/image';
import { ChevronDown, ChevronUp, Check, CornerRightDown, XCircle, Loader2 } from 'lucide-react';
import { useAIWriting } from '@/hooks/writing-hooks';
import { PromptHistoryService } from '@/lib/api/promptHistoryService';

interface AIPopupProps {
  isVisible: boolean;
  selectedText: string;
  selectedHtml?: string;
  position: { top: number; left: number } | null;
  onClose: () => void;
  onAction: (action: string, customText?: string, language?: string) => void;
  projectId?: string;
}

// AI Service Icon SVG (inline for the prompt input)
const AIServiceIcon = () => (
  <svg width="20" height="20" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
    <g clipPath="url(#clip0_ai_popup)">
      <path
        d="M9.60056 2.27843C9.63058 2.19649 9.68505 2.12574 9.75659 2.07576C9.82813 2.02578 9.91329 1.99898 10.0006 1.99898C10.0878 1.99898 10.173 2.02578 10.2445 2.07576C10.3161 2.12574 10.3705 2.19649 10.4006 2.27843L10.8072 3.39043C11.1268 4.26224 11.6325 5.05396 12.2891 5.71055C12.9457 6.36713 13.7374 6.87281 14.6092 7.19243L15.7212 7.5991C15.8032 7.62912 15.8739 7.68358 15.9239 7.75512C15.9739 7.82666 16.0007 7.91183 16.0007 7.9991C16.0007 8.08637 15.9739 8.17153 15.9239 8.24307C15.8739 8.31461 15.8032 8.36907 15.7212 8.3991L14.6092 8.80576C13.7374 9.12538 12.9457 9.63106 12.2891 10.2876C11.6325 10.9442 11.1268 11.736 10.8072 12.6078L10.4006 13.7198C10.3705 13.8017 10.3161 13.8725 10.2445 13.9224C10.173 13.9724 10.0878 13.9992 10.0006 13.9992C9.91329 13.9992 9.82813 13.9724 9.75659 13.9224C9.68505 13.8725 9.63058 13.8017 9.60056 13.7198L9.19389 12.6078C8.87428 11.736 8.36859 10.9442 7.71201 10.2876C7.05543 9.63106 6.2637 9.12538 5.39189 8.80576L4.27989 8.3991C4.19795 8.36907 4.1272 8.31461 4.07722 8.24307C4.02724 8.17153 4.00044 8.08637 4.00044 7.9991C4.00044 7.91183 4.02724 7.82666 4.07722 7.75512C4.1272 7.68358 4.19795 7.62912 4.27989 7.5991L5.39189 7.19243C6.2637 6.87281 7.05543 6.36713 7.71201 5.71055C8.36859 5.05396 8.87428 4.26224 9.19389 3.39043L9.60056 2.27843ZM5.33389 11.1158C5.34633 11.0815 5.369 11.052 5.39881 11.0311C5.42863 11.0102 5.46415 10.999 5.50056 10.999C5.53697 10.999 5.57249 11.0102 5.60231 11.0311C5.63213 11.052 5.65479 11.0815 5.66723 11.1158L5.83656 11.5784C5.96982 11.9417 6.18053 12.2716 6.45405 12.5452C6.72758 12.8188 7.05738 13.0297 7.42056 13.1631L7.88389 13.3324C7.91811 13.3449 7.94767 13.3675 7.96856 13.3973C7.98945 13.4272 8.00065 13.4627 8.00065 13.4991C8.00065 13.5355 7.98945 13.571 7.96856 13.6008C7.94767 13.6307 7.91811 13.6533 7.88389 13.6658L7.42056 13.8351C7.05738 13.9685 6.72758 14.1794 6.45405 14.453C6.18053 14.7266 5.96982 15.0565 5.83656 15.4198L5.66723 15.8824C5.65479 15.9166 5.63213 15.9462 5.60231 15.9671C5.57249 15.988 5.53697 15.9992 5.50056 15.9992C5.46415 15.9992 5.42863 15.988 5.39881 15.9671C5.369 15.9462 5.34633 15.9166 5.33389 15.8824L5.16456 15.4198C5.0313 15.0565 4.8206 14.7266 4.54707 14.453C4.27354 14.1794 3.94374 13.9685 3.58056 13.8351L3.11723 13.6658C3.08301 13.6533 3.05345 13.6307 3.03256 13.6008C3.01167 13.571 3.00047 13.5355 3.00047 13.4991C3.00047 13.4627 3.01167 13.4272 3.03256 13.3973C3.05345 13.3675 3.08301 13.3449 3.11723 13.3324L3.58056 13.1631C3.94374 13.0297 4.27354 12.8188 4.54707 12.5452C4.8206 12.2716 5.0313 11.9417 5.16456 11.5784L5.33389 11.1158ZM2.80056 0.139096C2.81572 0.0982694 2.843 0.0630581 2.87875 0.0381929C2.91451 0.0133278 2.95701 0 3.00056 0C3.04411 0 3.08662 0.0133278 3.12237 0.0381929C3.15812 0.0630581 3.18541 0.0982694 3.20056 0.139096L3.40389 0.69443C3.5639 1.13032 3.81684 1.52616 4.14517 1.85449C4.47349 2.18282 4.86934 2.43576 5.30523 2.59576L5.86056 2.7991C5.90139 2.81425 5.9366 2.84154 5.96146 2.87729C5.98633 2.91304 5.99966 2.95555 5.99966 2.9991C5.99966 3.04265 5.98633 3.08515 5.96146 3.1209C5.9366 3.15666 5.90139 3.18394 5.86056 3.1991L5.30523 3.40243C4.86934 3.56243 4.47349 3.81537 4.14517 4.1437C3.81684 4.47203 3.5639 4.86788 3.40389 5.30376L3.20056 5.8591C3.18541 5.89992 3.15812 5.93513 3.12237 5.96C3.08662 5.98487 3.04411 5.99819 3.00056 5.99819C2.95701 5.99819 2.91451 5.98487 2.87875 5.96C2.843 5.93513 2.81572 5.89992 2.80056 5.8591L2.59723 5.30376C2.43723 4.86788 2.18428 4.47203 1.85596 4.1437C1.52763 3.81537 1.13178 3.56243 0.695895 3.40243L0.140561 3.1991C0.0997342 3.18394 0.0645229 3.15666 0.0396578 3.1209C0.0147927 3.08515 0.00146484 3.04265 0.00146484 2.9991C0.00146484 2.95555 0.0147927 2.91304 0.0396578 2.87729C0.0645229 2.84154 0.0997342 2.81425 0.140561 2.7991L0.695895 2.59576C1.13178 2.43576 1.52763 2.18282 1.85596 1.85449C2.18428 1.52616 2.43723 1.13032 2.59723 0.69443L2.80056 0.139096Z"
        fill="#BD9000"
      />
    </g>
    <defs>
      <clipPath id="clip0_ai_popup">
        <rect width="16" height="16" fill="white" />
      </clipPath>
    </defs>
  </svg>
);

const AIPopup: React.FC<AIPopupProps> = ({
  isVisible,
  selectedText,
  selectedHtml,
  position,
  onClose,
  onAction,
  projectId,
}) => {
  // Use HTML content for API calls, fallback to text if not provided
  const contentForApi = selectedHtml || selectedText;
  const [customPrompt, setCustomPrompt] = useState('');
  const [isTranslateExpanded, setIsTranslateExpanded] = useState(false);
  const [mode, setMode] = useState<'input' | 'result'>('input');
  const [mobileView, setMobileView] = useState<'default' | 'translate'>('default');
  const [resultText, setResultText] = useState('');
  const [followUpPrompt, setFollowUpPrompt] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const { isLoading, improveWriting, paraphrase, translate } = useAIWriting();

  const languages = [
    'English',
    'Hindi',
    'Bengali',
    'Marathi',
    'Telugu',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Kannada',
    'Odia',
    'Malayalam',
    'Punjabi',
  ];

  const languageOptions: Record<string, string> = {
    English: 'en',
    Hindi: 'hi',
    Bengali: 'bn',
    Marathi: 'mr',
    Telugu: 'te',
    Tamil: 'ta',
    Gujarati: 'gu',
    Urdu: 'ur',
    Kannada: 'kn',
    Odia: 'or',
    Malayalam: 'ml',
    Punjabi: 'pa',
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(event.target as Node)) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isVisible, onClose]);

  // Animation state - keep mounted during fade out
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setAnimationClass(''); // Reset first
      // Double RAF ensures DOM is painted before animation starts
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationClass('ai-popup-enter');
        });
      });
    } else if (shouldRender) {
      setAnimationClass('ai-popup-exit');
      // Wait for exit animation to complete
      const timer = setTimeout(() => {
        setShouldRender(false);
        setAnimationClass('');
        setMode('input'); // Reset to input mode when closing
        setMobileView('default');
        setResultText('');
        setCustomPrompt('');
        setFollowUpPrompt('');
      }, 200); // Match animation duration
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && mode === 'input') {
      // Small timeout to ensure render and animation start
      const timer = setTimeout(() => {
        inputRef.current?.focus();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isVisible, mode]);

  if (!shouldRender || !position) return null;

  const handleAction = async (action: string, language?: string) => {
    let result = '';
    let promptText = '';
    console.log(`AIPopup - ${action} action - contentForApi:`, contentForApi);
    console.log(`AIPopup - ${action} action - contentForApi length:`, contentForApi.length);

    if (action === 'custom') {
      // Handle custom prompt specifically
      if (!customPrompt.trim()) {
        return; // Don't process empty custom prompts
      }
      promptText = customPrompt;
      result =
        (await improveWriting({
          text: contentForApi,
          improvement_focus: 'all',
          tone: 'legal',
          context: customPrompt,
        })) || '';
    } else if (action === 'improve') {
      console.log('AIPopup - Calling improveWriting with:', contentForApi);
      promptText = `Improve writing: ${contentForApi.substring(0, 200)}${contentForApi.length > 200 ? '...' : ''}`;
      result =
        (await improveWriting({
          text: contentForApi,
          improvement_focus: 'all',
          tone: 'legal',
        })) || '';
    } else if (action === 'paraphrase') {
      console.log('AIPopup - Calling paraphrase with:', contentForApi);
      promptText = `Paraphrase: ${contentForApi.substring(0, 200)}${contentForApi.length > 200 ? '...' : ''}`;
      result =
        (await paraphrase({
          text: contentForApi,
          paraphrase_mode: 'formal',
        })) || '';
    } else if (action === 'translate') {
      console.log('AIPopup - Translate Action - contentForApi:', contentForApi);
      const targetLang = language ? languageOptions[language] || 'hi' : 'hi';
      promptText = `Translate to ${language || 'Hindi'}: ${contentForApi.substring(0, 200)}${contentForApi.length > 200 ? '...' : ''}`;
      // Always use the actual translate API for proper translation
      result =
        (await translate({
          text: contentForApi,
          target_language: targetLang,
          domain: 'legal',
        })) || '';
      console.log('AIPopup - Translate Action - result:', result);
    }

    if (result) {
      console.log(`AIPopup - ${action} result:`, result);

      // Log prompt to history
      PromptHistoryService.logPrompt(
        action === 'custom' ? 'ai-writing' : action,
        promptText,
        result,
        {
          source: 'ai-popup',
          action_type: action,
          input_length: contentForApi.length,
          ...(action === 'translate' && language ? { target_language: language } : {}),
        },
        projectId
      ).catch((err) => console.error('[AIPopup] Failed to log prompt history:', err));

      setResultText(result);
      setMode('result');
      setCustomPrompt('');
    } else if (
      action !== 'custom' &&
      action !== 'improve' &&
      action !== 'paraphrase' &&
      action !== 'translate'
    ) {
      onAction(action, customPrompt || undefined, language);
      setCustomPrompt('');
      setIsTranslateExpanded(false);
    }
  };

  const handleFollowUp = async () => {
    if (!followUpPrompt.trim()) return;

    const result = await improveWriting({
      text: resultText,
      improvement_focus: 'all',
      tone: 'legal',
      context: `Previous draft: ${resultText}\n\nClient instruction for refinement: ${followUpPrompt}`,
    });

    if (result) {
      // Log follow-up prompt to history
      PromptHistoryService.logPrompt(
        'follow-up',
        followUpPrompt,
        result,
        {
          source: 'ai-popup',
          action_type: 'follow-up',
          previous_result_length: resultText.length,
        },
        projectId
      ).catch((err) => console.error('[AIPopup] Failed to log follow-up prompt history:', err));

      setResultText(result);
      setFollowUpPrompt('');
    }
  };

  const handleResultAction = (action: 'accept' | 'insert' | 'discard') => {
    if (action === 'discard') {
      onClose();
    } else {
      // Pass the correct action to the parent
      onAction(action, resultText);
      onClose();
    }
  };

  return (
    <>
      <div
        ref={popupRef}
        className={`ai-popup-container ${animationClass}`}
        style={{
          position: 'fixed',
          top: `${position.top}px`,
          left: `${position.left}px`,
          transform: 'translateX(-50%)',
          zIndex: 10000,
        }}
      >
        {mode === 'input' ? (
          <>
            {/* Prompt Input Container */}
            <div className="ai-popup-prompt-container">
              <div className="ai-popup-icon">
                <AIServiceIcon />
              </div>
              <input
                ref={inputRef}
                type="text"
                className="ai-popup-input"
                placeholder="Ask AI to generate or edit text.."
                value={customPrompt}
                onChange={(e) => setCustomPrompt(e.target.value)}
                disabled={isLoading}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && customPrompt.trim()) {
                    e.preventDefault();
                    handleAction('custom');
                  }
                }}
              />
              {isLoading && <Loader2 size={16} className="ai-loading-spinner" />}
            </div>

            {/* Actions Container */}
            <div className="ai-popup-actions-container">
              <div className="ai-popup-section-title">Edit</div>

              <button
                className="ai-popup-option"
                onClick={() => handleAction('improve')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Image
                  src="/assets/svgs/improvewriting.svg"
                  alt="Improve writing"
                  width={20}
                  height={20}
                  className="option-icon"
                />
                <span>Improve Writing</span>
              </button>

              <button
                className="ai-popup-option"
                onClick={() => handleAction('paraphrase')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Image
                  src="/assets/svgs/paraphrase.svg"
                  alt="Paraphrase"
                  width={20}
                  height={20}
                  className="option-icon"
                />
                <span>Paraphrase</span>
              </button>

              <div className="ai-popup-expandable">
                <button
                  className="ai-popup-option ai-popup-option-expandable"
                  onClick={() => {
                    // Check for mobile width
                    if (window.innerWidth <= 768) {
                      setMobileView('translate');
                    } else {
                      setIsTranslateExpanded(!isTranslateExpanded);
                    }
                  }}
                >
                  <Image
                    src="/assets/svgs/translate.svg"
                    alt="Translate"
                    width={20}
                    height={20}
                    className="option-icon"
                  />
                  <span>Translate</span>
                  {isTranslateExpanded ? (
                    <ChevronUp size={16} className="expand-icon" />
                  ) : (
                    <ChevronDown size={16} className="expand-icon" />
                  )}
                </button>

                {isTranslateExpanded && !mobileView.includes('translate') && (
                  <div className="ai-popup-submenu">
                    {languages.map((language) => (
                      <button
                        key={language}
                        className="ai-popup-submenu-option"
                        onClick={() => handleAction('translate', language)}
                      >
                        {language}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>
            {/* Mobile Translate View Overlay */}
            {mobileView === 'translate' && (
              <div className="ai-popup-actions-container ai-mobile-view">
                <div className="ai-popup-section-title mobile-header">
                  <button className="mobile-back-btn" onClick={() => setMobileView('default')}>
                    <ChevronDown size={20} style={{ transform: 'rotate(90deg)' }} />
                  </button>
                  <span>Select Language</span>
                </div>
                <div className="mobile-language-list">
                  {languages.map((language) => (
                    <button
                      key={language}
                      className="ai-popup-option"
                      onClick={() => {
                        handleAction('translate', language);
                        setMobileView('default');
                      }}
                    >
                      {language}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <>
            {/* Result Content Container */}
            <div className="ai-result-card">
              <div className="ai-result-content" dangerouslySetInnerHTML={{ __html: resultText }} />
              <div className="ai-popup-prompt-container ai-result-followup">
                <div className="ai-popup-icon">
                  <AIServiceIcon />
                </div>
                <input
                  type="text"
                  className="ai-popup-input"
                  placeholder="Tell me what to do next..."
                  value={followUpPrompt}
                  onChange={(e) => setFollowUpPrompt(e.target.value)}
                  disabled={isLoading}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && followUpPrompt.trim()) {
                      e.preventDefault();
                      handleFollowUp();
                    }
                  }}
                />
                {isLoading && <Loader2 size={16} className="ai-loading-spinner" />}
              </div>
            </div>

            {/* Result Action Card */}
            <div className="ai-result-actions-card">
              <button
                className="ai-popup-option"
                onClick={() => handleResultAction('accept')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <Check size={18} className="option-icon result-icon-accept" />
                <span>Accept</span>
              </button>
              <button
                className="ai-popup-option"
                onClick={() => handleResultAction('insert')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <CornerRightDown size={18} className="option-icon" />
                <span>Insert below</span>
              </button>
              <button
                className="ai-popup-option"
                onClick={() => handleResultAction('discard')}
                onMouseDown={(e) => e.preventDefault()}
              >
                <XCircle size={18} className="option-icon" />
                <span>Discard</span>
              </button>
            </div>
          </>
        )}

        <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Roboto:wght@400;500&display=swap');

        /* Animation keyframes */
        @keyframes popupEnter {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
        }

        @keyframes popupExit {
          from {
            opacity: 1;
            transform: translateX(-50%) translateY(0) scale(1);
          }
          to {
            opacity: 0;
            transform: translateX(-50%) translateY(10px) scale(0.95);
          }
        }

        .ai-popup-container {
          display: flex;
          flex-direction: column;
          gap: 7px;
          opacity: 0;
        }

        .ai-popup-container.ai-popup-enter {
          animation: popupEnter 0.2s ease-out forwards;
        }

        .ai-popup-container.ai-popup-exit {
          animation: popupExit 0.2s ease-in forwards;
        }

        .ai-popup-container.centered.ai-popup-enter {
          animation: popupEnterCentered 0.2s ease-out forwards;
        }

        .ai-popup-container.centered.ai-popup-exit {
          animation: popupExitCentered 0.2s ease-in forwards;
        }

        /* Prompt Container - 561px x 51px */
        .ai-popup-prompt-container {
          width: 561px;
          height: 51px;
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 8px;
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 0 16px;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .ai-popup-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        .ai-popup-input {
          flex: 1;
          border: none;
          outline: none;
          background: transparent;
          font-family: Arial, sans-serif;
          font-size: 17px;
          color: #374151;
          height: 100%;
        }

        .ai-popup-input::placeholder {
          color: #919291;
          font-family: Arial, sans-serif;
          font-size: 17px;
        }

        .ai-loading-spinner {
          animation: spin 1s linear infinite;
          color: #BD9000;
          margin-left: 8px;
          flex-shrink: 0;
        }

        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }

        /* Actions Container - 337px x 197px */
        .ai-popup-actions-container {
          width: 337px;
          min-height: 197px;
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 8px;
          padding: 16px;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
        }

        .ai-popup-section-title {
          font-family: 'Roboto', sans-serif;
          font-size: 17px;
          color: #919291;
          margin-bottom: 12px;
        }

        .ai-popup-option {
          display: flex;
          align-items: center;
          gap: 12px;
          width: 100%;
          padding: 12px 8px;
          border: none;
          background: transparent;
          border-radius: 6px;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-family: 'Roboto', sans-serif;
          font-size: 17px;
          color: #5B5B5B;
          text-align: left;
        }

        .ai-popup-option:hover {
          background: #f5f5f5;
        }

        .ai-popup-option-expandable {
          justify-content: flex-start;
        }

        .ai-popup-option-expandable span {
          flex: 1;
        }

        .option-icon {
          width: 16px;
          height: 16px;
          flex-shrink: 0;
        }

        .expand-icon {
          color: #5B5B5B;
          flex-shrink: 0;
        }

        .ai-popup-expandable {
          position: relative;
        }

        .ai-popup-submenu {
          position: absolute;
          left: 100%;
          top: 0;
          width: 195px;
          height: 195px;
          overflow-y: scroll;
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 8px;
          padding: 8px 0;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08), 0 2px 4px rgba(0, 0, 0, 0.04);
          margin-left: 20px;
        }

        .ai-popup-submenu::-webkit-scrollbar {
          width: 6px;
        }

        .ai-popup-submenu::-webkit-scrollbar-track {
          background: #f1f1f1;
          border-radius: 3px;
        }

        .ai-popup-submenu::-webkit-scrollbar-thumb {
          background: #c1c1c1;
          border-radius: 3px;
        }

        .ai-popup-submenu::-webkit-scrollbar-thumb:hover {
          background: #a8a8a8;
        }

        .ai-popup-submenu-option {
          display: block;
          width: 100%;
          padding: 10px 16px;
          border: none;
          background: transparent;
          cursor: pointer;
          transition: background-color 0.15s ease;
          font-family: 'Roboto', sans-serif;
          font-size: 17px;
          color: #5B5B5B;
          text-align: left;
        }

        .ai-popup-submenu-option:hover {
          background: #f5f5f5;
        }

        /* Result View Styles */
        .ai-result-card {
          width: 561px;
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 8px;
          display: flex;
          flex-direction: column;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          overflow: hidden;
        }

        .ai-result-content {
          padding: 20px;
          font-family: Arial, sans-serif;
          font-size: 17px;
          line-height: 1.5;
          color: #374151;
          max-height: 300px;
          overflow-y: auto;
          white-space: pre-wrap;
        }

        .ai-result-followup {
          width: 100% !important;
          border: none !important;
          border-top: 1px solid #E9E9E9 !important;
          border-radius: 0 !important;
          box-shadow: none !important;
        }

        .ai-result-actions-card {
          width: 337px;
          background: white;
          border: 1px solid #E9E9E9;
          border-radius: 8px;
          padding: 8px;
          box-sizing: border-box;
          box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
          display: flex;
          flex-direction: column;
          gap: 2px;
        }

        .result-icon-accept {
          color: #10B981;
        }

        /* Responsive Styles */
        @media (max-width: 768px) {
           .ai-popup-prompt-container,
           .ai-result-card {
             width: 337px !important;
           }
           
           /* Hide the default actions container when in mobile view */
           .ai-popup-actions-container {
              display: ${mobileView === 'translate' ? 'none' : 'block'};
           }

           /* Show the mobile view container when active */
           .ai-popup-actions-container.ai-mobile-view {
              display: flex;
              flex-direction: column;
              height: 300px; /* Fixed height for scrollable list */
              overflow: hidden;
           }

           .mobile-header {
              display: flex;
              align-items: center;
              gap: 8px;
              color: #374151;
              font-weight: 500;
              padding-bottom: 8px;
              border-bottom: 1px solid #eee;
              margin-bottom: 8px;
           }

           .mobile-back-btn {
              background: none;
              border: none;
              cursor: pointer;
              padding: 4px;
              display: flex;
              align-items: center;
              justify-content: center;
              color: #5B5B5B;
           }
           
           .mobile-language-list {
              overflow-y: auto;
              flex: 1;
              display: flex;
              flex-direction: column;
           }
        }
      `}</style>
      </div>
    </>
  );
};

export default AIPopup;
