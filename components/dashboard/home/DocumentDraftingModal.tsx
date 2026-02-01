'use client';

import React, { useRef, useEffect, useCallback, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Paperclip, ChevronDown, Sparkles, FileText, BookOpen } from 'lucide-react';
import TemplateLibraryModal from './TemplateLibraryModal';
import SpeechToTextButton from '@/components/ui/SpeechToTextButton';
import SequentialVideoLoader from '@/components/ui/SequentialVideoLoader';
import TemplateUploadDialog from './TemplateUploadDialog';
import { draftingService } from '@/lib/api/draftingService';
import { draftingTemplateService } from '@/lib/api/draftingTemplateService';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useDashboardUIStore } from '@/store/zustand/useDashboardUIStore';

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
      <div className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4 shadow-2xl">
          <div className="flex flex-col items-center">
            <SequentialVideoLoader width={500} />
            <p className="mt-6 text-gray-600 font-medium text-center animate-pulse">
              Drafting your document...
            </p>
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
          className="fixed inset-0 bg-neutral-900/40 backdrop-blur-md z-50 flex items-center justify-center p-4 min-h-screen"
          onClick={handleBackdropClick}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: 'spring', duration: 0.4, bounce: 0.3 }}
            className="bg-white rounded-2xl w-full max-w-2xl max-h-[85vh] overflow-y-auto shadow-[0_20px_50px_-12px_rgba(0,0,0,0.25)] flex flex-col relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Gradient Border Top */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-linear-to-r from-lv-accent-gold/60 to-lv-accent-gold opacity-80" />

            {/* Header */}
            <div className="flex items-center justify-between px-6 py-5 border-b border-gray-100 flex-none bg-white z-10 sticky top-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-lv-accent-gold shadow-sm ring-1 ring-orange-100">
                  <Sparkles size={18} />
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900 leading-tight">
                    AI Drafting Assistant
                  </h2>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-gray-500 font-medium tracking-wide">
                      POWERED BY LAWVRIKSH AI
                    </span>
                    <span className="px-1.5 py-0.5 text-dashboard-badge font-bold bg-orange-50 text-lv-accent-gold rounded border border-orange-100 tracking-wider">
                      BETA
                    </span>
                  </div>
                </div>
              </div>
              <button
                onClick={handleClose}
                className="p-2 rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-all duration-200"
              >
                <X size={20} />
              </button>
            </div>

            {/* Content Scrollable Area */}
            <div className="flex-1 overflow-y-auto custom-scrollbar">
              {/* Subtitle */}
              <div className="px-8 py-6 bg-linear-to-b from-gray-50 to-white border-b border-gray-50">
                <p className="text-sm text-gray-600 leading-relaxed max-w-lg">
                  {step === 1
                    ? 'Start by explaining what you need. Provide a project name and a detailed prompt to get the best results.'
                    : 'We need a few more details to customize the document perfectly for your needs.'}
                </p>
              </div>

              <div className="p-8 space-y-8">
                {step === 1 ? (
                  <>
                    {/* Project Name Input */}
                    <div className="space-y-2">
                      <label
                        htmlFor="projectName"
                        className="block text-xs font-bold text-gray-700 uppercase tracking-widest"
                      >
                        Project Name <span className="text-red-500">*</span>
                      </label>
                      <input
                        id="projectName"
                        type="text"
                        value={projectName}
                        onChange={(e) => setProjectName(e.target.value)}
                        placeholder="e.g., Non-Disclosure Agreement for New Hire"
                        disabled={isLoading || isGenerating}
                        className="w-full px-4 py-3.5 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lv-accent-gold/20 focus:border-lv-accent-gold text-gray-900 bg-white shadow-sm transition-all placeholder:text-gray-400 text-sm font-medium"
                      />
                    </div>

                    {/* Prompt Input */}
                    <div className="space-y-2">
                      <label className="block text-xs font-bold text-gray-700 uppercase tracking-widest">
                        Drafting Instructions <span className="text-red-500">*</span>
                      </label>
                      <div className="relative group">
                        <textarea
                          value={prompt}
                          onChange={(e) => {
                            const newValue = e.target.value;
                            setPrompt(newValue);
                            promptBaseRef.current = newValue;
                            setInterimTranscript('');
                          }}
                          placeholder='Example: "Draft a concise NDA between LawVriksh Inc. and John Doe. Include confidentiality clauses, a 2-year duration, and dispute resolution via arbitration in Mumbai."'
                          disabled={isLoading || isGenerating}
                          className={`w-full px-5 py-4 pb-14 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lv-accent-gold/20 focus:border-lv-accent-gold text-gray-900 min-h-dashboard-project-card resize-none bg-white shadow-sm transition-all placeholder:text-gray-400 text-sm leading-relaxed ${interimTranscript ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                        />

                        {/* Interactive Elements floating in textarea */}
                        <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
                          <SpeechToTextButton
                            onTranscript={handleTranscript}
                            onStop={handleStopListening}
                            language={LANGUAGE_CODES[language]}
                            disabled={isLoading || isGenerating}
                            variant="dock"
                            label="Dictate"
                            iconSize={18}
                          />
                        </div>
                        <div className="absolute bottom-4 right-4 z-10">
                          <button
                            onClick={() => setShowUploadDialog(true)}
                            className="p-2 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors flex items-center gap-1.5 border border-transparent hover:border-gray-200 group-hover:block"
                            type="button"
                            title="Attach Reference Template"
                          >
                            <Paperclip size={18} />
                            <span className="text-xs font-medium">Attach</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Footer Controls Row */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-2">
                      {/* Language Selection */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="block text-dashboard-badge font-bold text-gray-500 uppercase tracking-widest">
                            Language
                          </label>
                          <span
                            className={`text-dashboard-badge font-medium transition-colors ${
                              charCount >= minChars ? 'text-green-600' : 'text-gray-400'
                            }`}
                          >
                            {charCount}/{minChars} chars
                          </span>
                        </div>

                        <div className="relative" ref={dropdownRef}>
                          <button
                            onClick={() => setIsLanguageDropdownOpen(!isLanguageDropdownOpen)}
                            type="button"
                            disabled={isLoading || isGenerating}
                            className={`w-full flex items-center justify-between px-4 py-2.5 border rounded-xl text-sm font-medium bg-white transition-all ${
                              isLanguageDropdownOpen
                                ? 'border-lv-accent-gold ring-1 ring-lv-accent-gold text-gray-900'
                                : 'border-gray-200 text-gray-700 hover:border-gray-300 hover:bg-gray-50/50'
                            }`}
                          >
                            <span className="flex items-center gap-2">{language}</span>
                            <ChevronDown
                              size={14}
                              className={`text-gray-400 transition-transform duration-200 ${isLanguageDropdownOpen ? 'rotate-180' : ''}`}
                            />
                          </button>

                          <AnimatePresence>
                            {isLanguageDropdownOpen && (
                              <motion.div
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: 8 }}
                                className="absolute top-full left-0 w-full mt-2 bg-white border border-gray-100 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto p-1.5 custom-scrollbar"
                              >
                                <div className="grid grid-cols-1 gap-0.5">
                                  {LANGUAGES.map((lang) => (
                                    <button
                                      key={lang.value}
                                      type="button"
                                      onClick={() => {
                                        setLanguage(lang.value);
                                        setIsLanguageDropdownOpen(false);
                                      }}
                                      className={`px-3 py-2 text-sm text-left rounded-lg transition-colors flex items-center justify-between ${
                                        language === lang.value
                                          ? 'bg-orange-50 text-lv-accent-gold font-medium'
                                          : 'text-gray-700 hover:bg-gray-50'
                                      }`}
                                    >
                                      {lang.label}
                                      {language === lang.value && (
                                        <div className="w-1.5 h-1.5 rounded-full bg-lv-accent-gold" />
                                      )}
                                    </button>
                                  ))}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      {/* Template Library Button */}
                      <div className="space-y-2">
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                          Refine with Template
                        </label>
                        <button
                          type="button"
                          onClick={() => setShowTemplateLibrary(true)}
                          disabled={isLoading || isGenerating}
                          className="w-full flex items-center justify-between px-4 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-700 bg-white hover:border-gray-300 hover:bg-gray-50/50 transition-all group"
                        >
                          <span className="flex items-center gap-2">
                            <BookOpen
                              size={16}
                              className="text-gray-400 group-hover:text-lv-accent-gold transition-colors"
                            />
                            Browse Library
                          </span>
                        </button>
                      </div>
                    </div>

                    {/* Uploaded Template Indicator */}
                    {(isLoadingTemplate || uploadedTemplate) && (
                      <div className="pt-2">
                        {isLoadingTemplate ? (
                          <div className="w-full flex items-center justify-center py-3 px-4 bg-gray-50 border border-gray-100 rounded-xl animate-pulse">
                            <span className="text-xs text-gray-400 font-medium">
                              Processing template...
                            </span>
                          </div>
                        ) : uploadedTemplate ? (
                          <motion.div
                            initial={{ opacity: 0, scale: 0.98 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="p-3.5 bg-blue-50/50 rounded-xl border border-blue-100 flex items-center gap-3 relative overflow-hidden"
                          >
                            <div className="absolute left-0 top-0 bottom-0 w-1 bg-blue-400/20" />
                            <div className="w-9 h-9 rounded-lg bg-blue-100/50 flex items-center justify-center text-blue-600 shrink-0 border border-blue-200/50">
                              <FileText size={16} />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div
                                className="font-semibold text-gray-900 text-sm truncate"
                                title={uploadedTemplate.title}
                              >
                                {uploadedTemplate.title}
                              </div>
                              <div className="text-xs text-blue-600/70 font-medium mt-0.5">
                                Template Selected
                              </div>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedTemplateId(null);
                                if (onUpload) onUpload();
                              }}
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-blue-400 hover:text-blue-600 transition-colors"
                            >
                              <X size={16} />
                            </button>
                          </motion.div>
                        ) : null}
                      </div>
                    )}
                  </>
                ) : (
                  // Step 2: Clarification Questions
                  <div className="space-y-6">
                    {questions.map((q, i) => (
                      <div
                        key={i}
                        className="space-y-3 p-5 rounded-2xl border border-gray-100 bg-gray-50/30"
                      >
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-full bg-lv-accent-gold/10 text-lv-accent-gold flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                            {i + 1}
                          </div>
                          <p className="text-sm font-medium text-gray-900 pt-0.5 leading-relaxed">
                            {q}
                          </p>
                        </div>

                        <div className="pl-9 relative">
                          <textarea
                            value={answers[i] || ''}
                            onChange={(e) => {
                              const val = e.target.value;
                              setAnswer(i, val);
                              setSkippedQuestion(i, false);
                              answerBaseRefs.current[i] = val;
                            }}
                            placeholder="Type your answer..."
                            className={`w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-lv-accent-gold/20 focus:border-lv-accent-gold text-gray-900 min-h-[100px] resize-none bg-white text-sm transition-all ${interimAnswers[i] ? 'ring-2 ring-red-400 border-red-300' : ''}`}
                          />
                          <div className="absolute bottom-3 right-3 z-10 opacity-70 hover:opacity-100 transition-opacity">
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
                              variant="icon"
                              iconSize={18}
                            />
                          </div>
                        </div>
                        {skippedQuestions[i] && (
                          <div className="pl-9">
                            <p className="text-xs text-orange-500 font-medium bg-orange-50 inline-block px-2 py-1 rounded-md">
                              Skipped (will use context from prompt)
                            </p>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-100 bg-white z-10 rounded-b-2xl">
              {step === 1 ? (
                <div className="flex justify-end">
                  <button
                    onClick={handleInquiry}
                    disabled={!isValid || isLoading || isGenerating}
                    className={`px-8 py-3 text-sm font-semibold rounded-xl shadow-lg shadow-gray-200 transition-all transform hover:-translate-y-0.5 ${
                      isValid && !isLoading && !isGenerating
                        ? 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-gray-300'
                        : 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                    }`}
                  >
                    Continue to Details
                  </button>
                </div>
              ) : (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <button
                      onClick={() => setStep(1)}
                      className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900 font-medium transition-colors"
                    >
                      Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSkipQuestions}
                      disabled={skipButtonDisabled}
                      className="text-xs text-gray-500 hover:text-lv-accent-gold underline decoration-gray-300 hover:decoration-lv-accent-gold underline-offset-4 transition-all"
                    >
                      Skip questions & Generate
                    </button>
                  </div>

                  <button
                    onClick={(e) => handleGenerate(e, false)}
                    disabled={generateButtonDisabled}
                    className={`px-8 py-3 text-sm font-semibold rounded-xl shadow-lg shadow-gray-200 transition-all transform hover:-translate-y-0.5 ${
                      generateButtonDisabled
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed shadow-none'
                        : 'bg-gray-900 text-white hover:bg-gray-800 hover:shadow-gray-300'
                    }`}
                    title={generateButtonTitle}
                  >
                    {isGenerating ? (
                      <span className="flex items-center gap-2">
                        <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Generating...
                      </span>
                    ) : (
                      'Generate Document'
                    )}
                  </button>
                </div>
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
