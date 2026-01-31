'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, ChevronDown, Sparkles } from 'lucide-react';
import TemplateLibraryModal from './TemplateLibraryModal';
import SpeechToTextButton from '@/components/ui/SpeechToTextButton';
import SequentialVideoLoader from '@/components/ui/SequentialVideoLoader';
import TemplateUploadDialog from './TemplateUploadDialog';
import styles from './DocumentDraftingModal.module.css';
import { draftingService } from '@/lib/api/draftingService';
import { draftingTemplateService } from '@/lib/api/draftingTemplateService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { FileText, X as XIcon } from 'lucide-react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDashboardUIStore } from '@/store/zustand/useDashboardUIStore';

// Removed legacy interface

const LANGUAGES = [
  { value: 'English', label: 'English' },
  { value: 'Hindi', label: 'हिन्दी (Hindi)' },
  { value: 'Bengali', label: 'বাংলা (Bengali)' },
  { value: 'Telugu', label: 'తెలుగు (Telugu)' },
  { value: 'Marathi', label: 'मराठी (Marathi)' },
  { value: 'Tamil', label: 'தமிழ் (Tamil)' },
  { value: 'Gujarati', label: 'ગુજરાતી (Gujarati)' },
  { value: 'Kannada', label: 'ಕನ್ನಡ (Kannada)' },
  { value: 'Malayalam', label: 'മലയാളം (Malayalam)' },
  { value: 'Punjabi', label: 'ਪੰਜਾਬੀ (Punjabi)' },
  { value: 'Odia', label: 'ଓଡ଼ିଆ (Odia)' },
  { value: 'Assamese', label: 'অসমীয়া (Assamese)' },
  { value: 'Urdu', label: 'اردو (Urdu)' },
];

const LANGUAGE_CODES: Record<string, string> = {
  English: 'en',
  Hindi: 'hi',
  Bengali: 'bn',
  Telugu: 'te',
  Marathi: 'mr',
  Tamil: 'ta',
  Gujarati: 'gu',
  Kannada: 'kn',
  Malayalam: 'ml',
  Punjabi: 'pa',
  Odia: 'or',
  Assamese: 'as',
  Urdu: 'ur',
};

export default function DocumentDraftingModal({
  isOpen,
  onClose,
  onDraftSuccess,
  onCreateFromScratch,
  onUpload,
  isLoading = false,
}: {
  isOpen: boolean;
  onClose: () => void;
  onDraftSuccess: (data: any, projectName: string) => void | Promise<void>;
  onCreateFromScratch: () => void;
  onUpload?: () => void;
  isLoading?: boolean;
}) {
  const prompt = useDashboardUIStore((state) => state.draftCreation.prompt);
  const projectName = useDashboardUIStore((state) => state.draftCreation.draftName);
  const language = useDashboardUIStore((state) => state.draftCreation.language);
  const showTemplateLibrary = useDashboardUIStore(
    (state) => state.draftCreation.showTemplateLibrary
  );
  const showUploadDialog = useDashboardUIStore((state) => state.draftCreation.showUploadDialog);
  const isLanguageDropdownOpen = useDashboardUIStore(
    (state) => state.draftCreation.isLanguageDropdownOpen
  );
  const selectedTemplateId = useDashboardUIStore((state) => state.draftCreation.selectedTemplateId);
  const step = useDashboardUIStore((state) => state.draftCreation.step);
  const answers = useDashboardUIStore((state) => state.draftCreation.answers);
  const interimAnswers = useDashboardUIStore((state) => state.draftCreation.interimAnswers);
  const skippedQuestions = useDashboardUIStore((state) => state.draftCreation.skippedQuestions);
  const interimTranscript = useDashboardUIStore((state) => state.draftCreation.interimTranscript);

  const [questions, setQuestions] = useState<string[]>([]);

  const resetDraftCreation = useDashboardUIStore.getState().resetDraftCreation;
  const setProjectName = useDashboardUIStore.getState().setDraftName;
  const setPrompt = useDashboardUIStore.getState().setDraftPrompt;
  const setLanguage = useDashboardUIStore.getState().setDraftLanguage;
  const setStep = useDashboardUIStore.getState().setDraftStep;
  const setIsLanguageDropdownOpen = useDashboardUIStore.getState().setLanguageDropdownOpen;
  const setShowTemplateLibrary = useDashboardUIStore.getState().setShowTemplateLibrary;
  const setShowUploadDialog = useDashboardUIStore.getState().setShowUploadDialog;
  const setSelectedTemplateId = useDashboardUIStore.getState().setSelectedTemplateId;
  const setAnswer = useDashboardUIStore.getState().setDraftAnswer;
  const setInterimAnswer = useDashboardUIStore.getState().setDraftInterimAnswer;
  const setSkippedQuestion = useDashboardUIStore.getState().setDraftSkippedQuestion;
  const setInterimTranscript = useDashboardUIStore.getState().setDraftInterimTranscript;

  const answerBaseRefs = useRef<Record<number, string>>({});
  const promptBaseRef = useRef('');
  const inquiryAbortRef = useRef<AbortController | null>(null);
  const generateAbortRef = useRef<AbortController | null>(null);

  const minChars = 50;
  const charCount = prompt.length;
  const isValid = charCount >= minChars && projectName.trim().length > 0;
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { profile } = useAuth(); // Need user profile for API calls

  const abortInFlight = useCallback(() => {
    inquiryAbortRef.current?.abort();
    inquiryAbortRef.current = null;
    generateAbortRef.current?.abort();
    generateAbortRef.current = null;
  }, []);

  useEffect(() => {
    return () => {
      abortInFlight();
    };
  }, [abortInFlight]);

  const handleClickOutside = useCallback(
    (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsLanguageDropdownOpen(false);
      }
    },
    [setIsLanguageDropdownOpen]
  );

  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [handleClickOutside]);

  const templateQuery = useQuery({
    queryKey: ['draftingTemplate', selectedTemplateId],
    enabled: Boolean(selectedTemplateId),
    queryFn: ({ signal }) =>
      draftingTemplateService.getTemplate(selectedTemplateId as string, { signal }),
  });

  const uploadedTemplate = templateQuery.data?.data?.template ?? null;
  const isLoadingTemplate = templateQuery.isFetching;

  const inquiryMutation = useMutation({
    mutationKey: ['draftingInquiry'],
    mutationFn: async ({
      request,
      signal,
    }: {
      request: Parameters<typeof draftingService.draftDocumentInquiry>[0];
      signal: AbortSignal;
    }) => draftingService.draftDocumentInquiry(request, { signal }),
  });

  const generateMutation = useMutation({
    mutationKey: ['draftingGenerate'],
    mutationFn: async ({
      request,
      signal,
    }: {
      request: Parameters<typeof draftingService.generateTemplate>[0];
      signal: AbortSignal;
    }) => draftingService.generateTemplate(request, { signal }),
  });

  const isGenerating = inquiryMutation.isPending || generateMutation.isPending;

  // Step 1: Handle Initial Inquiry
  const handleInquiry = async () => {
    if (!isValid || isLoading || isGenerating) return;

    abortInFlight();
    const controller = new AbortController();
    inquiryAbortRef.current = controller;
    try {
      const response = await inquiryMutation.mutateAsync({
        request: {
          user_prompt: prompt,
          language,
          doc_type_hint: projectName,
          user_profile: {
            preferred_language: language,
            profession: 'User',
            default_state: 'India',
          },
        },
        signal: controller.signal,
      });

      if (response && response.success && response.data) {
        if (
          response.data.clarification_questions &&
          response.data.clarification_questions.length > 0
        ) {
          setQuestions(response.data.clarification_questions);
          setStep(2);
        } else {
          // No questions needed, proceed directly to generation
          await handleGenerate(undefined, true);
        }
      } else {
        // Fallback if API fails or returns no data, try direct generation
        console.warn('Inquiry failed or empty, attempting direct generation');
        await handleGenerate(undefined, true);
      }
    } catch (error: any) {
      if (controller.signal.aborted) return;
      console.error('Error fetching inquiry questions:', error);
      // Fallback to direct generation on error? Or show error?
      // Let's try direct generation as fail-safe
      await handleGenerate(undefined, true);
    } finally {
      if (inquiryAbortRef.current === controller) {
        inquiryAbortRef.current = null;
      }
    }
  };

  // Step 2: Handle Final Generation
  const handleGenerate = async (
    e?: React.MouseEvent,
    skipClarification: boolean = false,
    skipFirstQuestionWithPrompt?: string
  ) => {
    if (isLoading || isGenerating) return;

    abortInFlight();
    const controller = new AbortController();
    generateAbortRef.current = controller;
    try {
      // Map indexed answers to questions logic if needed,
      // but the API expects a Map/Record of Question -> Answer, or just Answer?
      // The API definition says `clarification_answers: Record<string, string>`.
      // We should map the specific question text to the answer.

      const clarificationAnswers: Record<string, string> = {};
      if (!skipClarification && questions.length > 0) {
        questions.forEach((q, idx) => {
          const answerValue = answers[idx]?.trim();
          if (answerValue && answerValue.length > 0) {
            clarificationAnswers[q] = answerValue;
            return;
          }

          if (idx === 0 && skipFirstQuestionWithPrompt !== undefined) {
            clarificationAnswers[q] = skipFirstQuestionWithPrompt;
          }
        });
      }

      const response = await generateMutation.mutateAsync({
        request: {
          user_prompt: prompt,
          user_id: profile?.user_id || 'guest',
          doc_type_hint: projectName,
          language,
          clarification_answers: skipClarification ? undefined : clarificationAnswers,
          skip_clarification: skipClarification,
          s3_key: uploadedTemplate?.s3_key || null,
          metadata: {
            client_name: 'LawVriksh Web',
            timestamp: new Date().toISOString(),
          },
        },
        signal: controller.signal,
      });

      if (response.success && response.data) {
        await onDraftSuccess(response.data, projectName);
      } else {
        console.error('Failed to generate template', response);
      }
    } catch (error: any) {
      if (controller.signal.aborted) return;
      console.error('Error creating draft:', error);
    } finally {
      if (generateAbortRef.current === controller) {
        generateAbortRef.current = null;
      }
    }
  };

  const handleSkipQuestions = () => {
    if (questions.length === 0) {
      handleGenerate(undefined, true);
      return;
    }

    const promptValue = prompt;
    answerBaseRefs.current[0] = promptValue;
    setAnswer(0, promptValue);
    setInterimAnswer(0, '');
    setSkippedQuestion(0, true);
    handleGenerate(undefined, false, promptValue);
  };

  const hasAnsweredQuestion = Object.values(answers).some(
    (answer) => answer && answer.trim().length > 0
  );
  const generateButtonDisabled = isLoading || isGenerating || !hasAnsweredQuestion;
  const generateButtonTitle = hasAnsweredQuestion
    ? 'Generate Draft'
    : 'Please answer at least one question';
  const skipButtonDisabled = isLoading || isGenerating;

  const handleCreateFromScratch = () => {
    setSelectedTemplateId(null);
    setPrompt('');
    setProjectName('');
    onCreateFromScratch();
  };

  const handleTranscript = useCallback(
    (text: string, isFinal: boolean) => {
      if (isFinal) {
        // Final result - append to the base and clear interim
        const newBase = promptBaseRef.current + (promptBaseRef.current ? ' ' : '') + text;
        promptBaseRef.current = newBase;
        setPrompt(newBase);
        setInterimTranscript('');
      } else {
        // Interim result - show live preview
        setInterimTranscript(text);
        setPrompt(promptBaseRef.current + (promptBaseRef.current ? ' ' : '') + text);
      }
    },
    [setInterimTranscript, setPrompt]
  );

  const handleStopListening = useCallback(() => {
    // Clear interim transcript when stopping
    setInterimTranscript('');
    setPrompt(promptBaseRef.current);
  }, [setInterimTranscript, setPrompt]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      abortInFlight();
      onClose();
    }
  };

  const handleClose = () => {
    setQuestions([]);
    promptBaseRef.current = '';
    answerBaseRefs.current = {};
    abortInFlight();
    resetDraftCreation();
    onClose();
  };

  // Handle upload success
  const handleUploadSuccess = (templateId: string) => {
    setShowUploadDialog(false);
    setSelectedTemplateId(templateId);
    if (onUpload) onUpload();
  };

  if (!isOpen) return null;

  if (isGenerating) {
    return (
      <div className={styles.loaderModalWrapper}>
        <div className={styles.loaderModal}>
          <div className={styles.loaderContent}>
            <SequentialVideoLoader width={500} />
            <p className={styles.loaderText}>Generating Draft...</p>
          </div>
        </div>
      </div>
    );
  }

  if (showTemplateLibrary) {
    return (
      <TemplateLibraryModal
        isOpen={true}
        onClose={() => setShowTemplateLibrary(false)}
        onCancel={() => setShowTemplateLibrary(false)}
        onSelect={async (template) => {
          const title = template.title;
          const generatedPrompt = `Draft a professional and legally binding ${title} covering all essential terms, conditions, roles, responsibilities, and legal safeguards appropriate for this type of document.`;

          setProjectName(title);
          setPrompt(generatedPrompt);
          setShowTemplateLibrary(false);

          // Fetch and display template details (same as uploaded template)
          if (template.id) {
            setSelectedTemplateId(template.id);
          }
        }}
      />
    );
  }

  if (showUploadDialog) {
    return (
      <TemplateUploadDialog
        isOpen={true}
        onClose={() => setShowUploadDialog(false)}
        projectName={projectName}
        language={language}
        onSuccess={handleUploadSuccess}
      />
    );
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className={styles.overlay}
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2 }}
            className={styles.modal}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className={styles.header}>
              <div className={styles.headerLeft}>
                <div className={styles.iconContainer}>
                  <Sparkles size={16} />
                </div>
                <h2 className={styles.title}>AI Powered Draft</h2>
                <span className={styles.betaBadge}>BETA</span>
              </div>
              <button onClick={handleClose} className={styles.closeButton}>
                <X size={20} />
              </button>
            </div>

            {/* Subtitle */}
            <p className={styles.subtitle}>
              {step === 1
                ? 'Generate a legal document using AI. Provide a project name and describe what you need.'
                : 'We need a few more details to draft the perfect document for you.'}
            </p>

            {step === 1 ? (
              <>
                {/* Project Name Input */}
                <div className={styles.formGroup}>
                  <label htmlFor="projectName" className={styles.label}>
                    Draft Name <span className={styles.required}>*</span>
                  </label>
                  <input
                    id="projectName"
                    type="text"
                    value={projectName}
                    onChange={(e) => setProjectName(e.target.value)}
                    placeholder="e.g., Non-Disclosure Agreement"
                    disabled={isLoading || isGenerating}
                    className={styles.input}
                  />
                </div>

                {/* Prompt Label */}
                <div className={styles.formGroup}>
                  <label className={styles.label}>
                    Drafting Prompt <span className={styles.required}>*</span>
                  </label>
                </div>

                {/* Textarea */}
                <div className={styles.textareaContainer}>
                  <textarea
                    value={prompt}
                    onChange={(e) => {
                      const newValue = e.target.value;
                      setPrompt(newValue);
                      // Sync the base ref when user types manually
                      promptBaseRef.current = newValue;
                      setInterimTranscript('');
                    }}
                    placeholder='e.g., "Draft a non-disclosure agreement between a software company and a contractor covering confidential information, intellectual property, and a 2-year term"'
                    disabled={isLoading || isGenerating}
                    className={`${styles.textarea} ${interimTranscript ? styles.textareaRecording : ''}`}
                  />
                  <div className={styles.voiceDock}>
                    <SpeechToTextButton
                      onTranscript={handleTranscript}
                      onStop={handleStopListening}
                      language={LANGUAGE_CODES[language]}
                      disabled={isLoading || isGenerating}
                      variant="dock"
                      label="Voice input"
                      iconSize={20}
                    />
                  </div>
                  <div className={styles.attachButtonWrapper}>
                    <button
                      onClick={() => setShowUploadDialog(true)}
                      className={styles.attachButton}
                      type="button"
                    >
                      <Paperclip size={18} />
                    </button>
                  </div>
                </div>

                {/* Language Label and Char Count Row */}
                <div className={styles.metaRow}>
                  <label className={styles.label}>Choose language</label>

                  <span
                    className={`${styles.charCount} ${
                      charCount >= minChars ? styles.charCountValid : styles.charCountInvalid
                    }`}
                  >
                    {charCount}/{minChars} characters minimum
                  </span>
                </div>

                {/* Language Dropdown and Choose from Library Button Row */}
                <div
                  style={{
                    display: 'flex',
                    gap: '12px',
                    alignItems: 'center',
                    marginBottom: '12px',
                  }}
                >
                  {/* Language Dropdown */}
                  <div
                    className={styles.dropdownContainer}
                    ref={dropdownRef}
                    style={{ flex: 1, marginBottom: 0 }}
                  >
                    <div className={styles.dropdownWrapper} style={{ width: '100%' }}>
                      <button
                        onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                        type="button"
                        disabled={isLoading || isGenerating}
                        className={styles.dropdownButton}
                      >
                        <span className={styles.dropdownButtonContent}>{language}</span>
                        <ChevronDown size={14} className={styles.chevronIcon} />
                      </button>

                      <AnimatePresence>
                        {isLanguageDropdownOpen && (
                          <motion.div
                            initial={{ opacity: 0, y: -5 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -5 }}
                            className={styles.dropdownMenu}
                          >
                            {LANGUAGES.map((lang) => (
                              <button
                                key={lang.value}
                                type="button"
                                onClick={() => {
                                  setLanguage(lang.value);
                                  setIsLanguageDropdownOpen(false);
                                }}
                                className={`${styles.dropdownItem} ${
                                  language === lang.value
                                    ? styles.dropdownItemActive
                                    : styles.dropdownItemInactive
                                }`}
                              >
                                {lang.label}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>
                  </div>

                  {/* Choose from Library Button */}
                  <div style={{ flex: 1 }}>
                    <button
                      type="button"
                      onClick={() => setShowTemplateLibrary(true)}
                      disabled={isLoading || isGenerating}
                      className={styles.dropdownButton}
                    >
                      <span className={styles.dropdownButtonContent}>Choose from Library</span>
                    </button>
                  </div>
                </div>

                {/* Uploaded Template Display Row */}
                {(isLoadingTemplate || uploadedTemplate) && (
                  <div style={{ marginBottom: '20px' }}>
                    {isLoadingTemplate ? (
                      <div
                        style={{
                          width: '100%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          padding: '10px 12px',
                          backgroundColor: '#f8fafc',
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px',
                          minHeight: '44px',
                        }}
                      >
                        <span style={{ fontSize: '12px', color: '#64748b' }}>
                          Loading template...
                        </span>
                      </div>
                    ) : uploadedTemplate ? (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.95 }}
                        className={styles.templatePreview}
                      >
                        <div className={styles.templateIcon}>
                          <FileText size={16} color="var(--lv-bg-button-dark)" />
                        </div>
                        <div className={styles.templateInfo}>
                          <div className={styles.templateTitle} title={uploadedTemplate.title}>
                            {uploadedTemplate.title}
                          </div>
                          <div className={styles.templateSubtitle}>Template attached</div>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedTemplateId(null);
                            if (onUpload) onUpload(); // Notify parent if needed
                          }}
                          className={styles.templateCloseButton}
                        >
                          <XIcon size={16} />
                        </button>
                      </motion.div>
                    ) : null}
                  </div>
                )}

                {/* Buttons */}
                <div className={styles.footer}>
                  <button
                    onClick={handleInquiry}
                    disabled={!isValid || isLoading || isGenerating}
                    className={`${styles.primaryButton} ${
                      isValid && !isLoading && !isGenerating
                        ? styles.primaryButtonEnabled
                        : styles.primaryButtonDisabled
                    }`}
                  >
                    Continue
                  </button>
                </div>
              </>
            ) : (
              <>
                <div className={styles.questionsContainer}>
                  {questions.map((q, i) => (
                    <div key={i} className={styles.questionItem}>
                      <p className={styles.questionText}>{q}</p>
                      <div className={styles.questionInputWrapper}>
                        <textarea
                          value={answers[i] || ''}
                          onChange={(e) => {
                            const val = e.target.value;
                            setAnswer(i, val);
                            setSkippedQuestion(i, false);
                            answerBaseRefs.current[i] = val;
                          }}
                          placeholder="Write your answer here...."
                          className={`${styles.questionTextarea} ${interimAnswers[i] ? styles.textareaRecording : ''}`}
                        />
                        <div className={styles.voiceDock}>
                          <SpeechToTextButton
                            onTranscript={(text, isFinal) => {
                              const base = answerBaseRefs.current[i] || '';
                              if (isFinal) {
                                const newBase = base + (base ? ' ' : '') + text;
                                answerBaseRefs.current[i] = newBase;
                                setAnswer(i, newBase);
                                setInterimAnswer(i, '');
                              } else {
                                setInterimAnswer(i, text);
                                setAnswer(i, base + (base ? ' ' : '') + text);
                              }
                            }}
                            onStop={() => {
                              setInterimAnswer(i, '');
                              setAnswer(i, answerBaseRefs.current[i] || '');
                            }}
                            language={LANGUAGE_CODES[language]}
                            disabled={isLoading || isGenerating}
                            variant="dock"
                            label="Answer by voice"
                            iconSize={20}
                          />
                        </div>
                      </div>
                      {skippedQuestions[i] && (
                        <p className={styles.skippedTag}>Question skipped (using prompt text)</p>
                      )}
                    </div>
                  ))}
                </div>
                {/* Buttons */}
                <div className={styles.footerWithBorder}>
                  <div className={styles.leftActions}>
                    <button onClick={() => setStep(1)} className={styles.secondaryButton}>
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipQuestions}
                      disabled={skipButtonDisabled}
                      className={`${styles.secondaryButton} ${styles.skipButton}`}
                    >
                      Skip questions
                    </button>
                  </div>
                  <button
                    onClick={(e) => handleGenerate(e, false)}
                    disabled={generateButtonDisabled}
                    className={`${styles.primaryButton} ${
                      generateButtonDisabled
                        ? styles.primaryButtonDisabled
                        : styles.primaryButtonEnabled
                    }`}
                    title={generateButtonTitle}
                  >
                    {isGenerating ? 'Generating...' : 'Generate Draft'}
                  </button>
                </div>
              </>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
