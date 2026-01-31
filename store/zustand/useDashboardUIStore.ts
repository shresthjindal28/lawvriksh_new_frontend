'use client';

import { create } from 'zustand';
import { devtools } from 'zustand/middleware';
import { ProjectCategory } from '@/types/project';

// ============================================================================
// Types
// ============================================================================

interface EditModalState {
  isOpen: boolean;
  projectId: string | null;
  project: any | null; // Preserves existing `editingProject` type
}

interface DeleteModalState {
  isOpen: boolean;
  projectId: string | null;
  projectTitle: string;
  isLoading: boolean;
}

interface DraftingModalState {
  isOpen: boolean;
  isGenerating: boolean;
}

interface DraftCreationState {
  draftName: string;
  prompt: string;
  language: string;
  step: 1 | 2;
  isLanguageDropdownOpen: boolean;
  showTemplateLibrary: boolean;
  showUploadDialog: boolean;
  selectedTemplateId: string | null;
  answers: Record<number, string>;
  interimAnswers: Record<number, string>;
  skippedQuestions: Record<number, true>;
  interimTranscript: string;
}

interface PreviewModalState {
  isOpen: boolean;
  documentId: string | null;
  title: string;
}

interface CreateModalState {
  isOpen: boolean;
  category: ProjectCategory;
}

// ============================================================================
// Store State Interface
// ============================================================================

interface DashboardUIState {
  // Modal States
  editModal: EditModalState;
  deleteModal: DeleteModalState;
  draftingModal: DraftingModalState;
  draftCreation: DraftCreationState;
  previewModal: PreviewModalState;
  createModal: CreateModalState;

  // Tag Tooltip (kept local for now, but available if needed)
  tagTooltip: {
    x: number;
    y: number;
    tags: any[];
    visible: boolean;
  } | null;
}

// ============================================================================
// Store Actions Interface
// ============================================================================

interface DashboardUIActions {
  // Edit Modal Actions
  openEditModal: (project: any) => void;
  closeEditModal: () => void;

  // Delete Modal Actions
  openDeleteModal: (projectId: string, projectTitle: string) => void;
  closeDeleteModal: () => void;
  setDeleteLoading: (isLoading: boolean) => void;

  // Drafting Modal Actions
  openDraftingModal: () => void;
  closeDraftingModal: () => void;
  setDraftingGenerating: (isGenerating: boolean) => void;

  // Draft Creation UI Actions
  resetDraftCreation: () => void;
  setDraftName: (draftName: string) => void;
  setDraftPrompt: (prompt: string) => void;
  setDraftLanguage: (language: string) => void;
  setDraftStep: (step: 1 | 2) => void;
  setLanguageDropdownOpen: (isOpen: boolean) => void;
  setShowTemplateLibrary: (show: boolean) => void;
  setShowUploadDialog: (show: boolean) => void;
  setSelectedTemplateId: (templateId: string | null) => void;
  setDraftAnswer: (index: number, value: string) => void;
  setDraftInterimAnswer: (index: number, value: string) => void;
  setDraftSkippedQuestion: (index: number, skipped: boolean) => void;
  setDraftInterimTranscript: (text: string) => void;

  // Preview Modal Actions
  openPreviewModal: (documentId: string, title: string) => void;
  closePreviewModal: () => void;

  // Create Modal Actions
  openCreateModal: (category?: ProjectCategory) => void;
  closeCreateModal: () => void;
  setCreateCategory: (category: ProjectCategory) => void;

  // Tag Tooltip Actions
  showTagTooltip: (x: number, y: number, tags: any[]) => void;
  hideTagTooltip: () => void;

  // Reset all modals (useful for cleanup)
  resetAllModals: () => void;
}

// ============================================================================
// Initial State
// ============================================================================

const initialState: DashboardUIState = {
  editModal: {
    isOpen: false,
    projectId: null,
    project: null,
  },
  deleteModal: {
    isOpen: false,
    projectId: null,
    projectTitle: '',
    isLoading: false,
  },
  draftingModal: {
    isOpen: false,
    isGenerating: false,
  },
  draftCreation: {
    draftName: '',
    prompt: '',
    language: 'English',
    step: 1,
    isLanguageDropdownOpen: false,
    showTemplateLibrary: false,
    showUploadDialog: false,
    selectedTemplateId: null,
    answers: {},
    interimAnswers: {},
    skippedQuestions: {},
    interimTranscript: '',
  },
  previewModal: {
    isOpen: false,
    documentId: null,
    title: '',
  },
  createModal: {
    isOpen: false,
    category: 'ideation' as ProjectCategory,
  },
  tagTooltip: null,
};

// ============================================================================
// Store Implementation
// ============================================================================

export const useDashboardUIStore = create<DashboardUIState & DashboardUIActions>()(
  devtools(
    (set) => ({
      ...initialState,

      // ======================================================================
      // Edit Modal Actions
      // ======================================================================
      openEditModal: (project) =>
        set(
          {
            editModal: {
              isOpen: true,
              projectId: project?.id || null,
              project,
            },
          },
          false,
          'editModal/open'
        ),

      closeEditModal: () =>
        set(
          {
            editModal: {
              isOpen: false,
              projectId: null,
              project: null,
            },
          },
          false,
          'editModal/close'
        ),

      // ======================================================================
      // Delete Modal Actions
      // ======================================================================
      openDeleteModal: (projectId, projectTitle) =>
        set(
          {
            deleteModal: {
              isOpen: true,
              projectId,
              projectTitle,
              isLoading: false,
            },
          },
          false,
          'deleteModal/open'
        ),

      closeDeleteModal: () =>
        set(
          {
            deleteModal: {
              isOpen: false,
              projectId: null,
              projectTitle: '',
              isLoading: false,
            },
          },
          false,
          'deleteModal/close'
        ),

      setDeleteLoading: (isLoading) =>
        set(
          (state) => ({
            deleteModal: {
              ...state.deleteModal,
              isLoading,
            },
          }),
          false,
          'deleteModal/setLoading'
        ),

      // ======================================================================
      // Drafting Modal Actions
      // ======================================================================
      openDraftingModal: () =>
        set(
          {
            draftingModal: {
              isOpen: true,
              isGenerating: false,
            },
          },
          false,
          'draftingModal/open'
        ),

      closeDraftingModal: () =>
        set(
          {
            draftingModal: {
              isOpen: false,
              isGenerating: false,
            },
          },
          false,
          'draftingModal/close'
        ),

      setDraftingGenerating: (isGenerating) =>
        set(
          (state) => ({
            draftingModal: {
              ...state.draftingModal,
              isGenerating,
            },
          }),
          false,
          'draftingModal/setGenerating'
        ),

      resetDraftCreation: () =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              draftName: '',
              prompt: '',
              language: 'English',
              step: 1,
              isLanguageDropdownOpen: false,
              showTemplateLibrary: false,
              showUploadDialog: false,
              selectedTemplateId: null,
              answers: {},
              interimAnswers: {},
              skippedQuestions: {},
              interimTranscript: '',
            },
          }),
          false,
          'draftCreation/reset'
        ),

      setDraftName: (draftName) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              draftName,
            },
          }),
          false,
          'draftCreation/setDraftName'
        ),

      setDraftPrompt: (prompt) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              prompt,
            },
          }),
          false,
          'draftCreation/setPrompt'
        ),

      setDraftLanguage: (language) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              language,
            },
          }),
          false,
          'draftCreation/setLanguage'
        ),

      setDraftStep: (step) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              step,
            },
          }),
          false,
          'draftCreation/setStep'
        ),

      setLanguageDropdownOpen: (isOpen) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              isLanguageDropdownOpen: isOpen,
            },
          }),
          false,
          'draftCreation/setLanguageDropdownOpen'
        ),

      setShowTemplateLibrary: (show) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              showTemplateLibrary: show,
            },
          }),
          false,
          'draftCreation/setShowTemplateLibrary'
        ),

      setShowUploadDialog: (show) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              showUploadDialog: show,
            },
          }),
          false,
          'draftCreation/setShowUploadDialog'
        ),

      setSelectedTemplateId: (templateId) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              selectedTemplateId: templateId,
            },
          }),
          false,
          'draftCreation/setSelectedTemplateId'
        ),

      setDraftAnswer: (index, value) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              answers: {
                ...state.draftCreation.answers,
                [index]: value,
              },
            },
          }),
          false,
          'draftCreation/setAnswer'
        ),

      setDraftInterimAnswer: (index, value) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              interimAnswers: {
                ...state.draftCreation.interimAnswers,
                [index]: value,
              },
            },
          }),
          false,
          'draftCreation/setInterimAnswer'
        ),

      setDraftSkippedQuestion: (index, skipped) =>
        set(
          (state) => {
            const nextSkipped = { ...state.draftCreation.skippedQuestions };
            if (skipped) nextSkipped[index] = true;
            else delete nextSkipped[index];

            return {
              draftCreation: {
                ...state.draftCreation,
                skippedQuestions: nextSkipped,
              },
            };
          },
          false,
          'draftCreation/setSkippedQuestion'
        ),

      setDraftInterimTranscript: (text) =>
        set(
          (state) => ({
            draftCreation: {
              ...state.draftCreation,
              interimTranscript: text,
            },
          }),
          false,
          'draftCreation/setInterimTranscript'
        ),

      // ======================================================================
      // Preview Modal Actions
      // ======================================================================
      openPreviewModal: (documentId, title) =>
        set(
          {
            previewModal: {
              isOpen: true,
              documentId,
              title,
            },
          },
          false,
          'previewModal/open'
        ),

      closePreviewModal: () =>
        set(
          {
            previewModal: {
              isOpen: false,
              documentId: null,
              title: '',
            },
          },
          false,
          'previewModal/close'
        ),

      // ======================================================================
      // Create Modal Actions
      // ======================================================================
      openCreateModal: (category = 'ideation' as ProjectCategory) =>
        set(
          {
            createModal: {
              isOpen: true,
              category,
            },
          },
          false,
          'createModal/open'
        ),

      closeCreateModal: () =>
        set(
          {
            createModal: {
              isOpen: false,
              category: 'ideation' as ProjectCategory,
            },
          },
          false,
          'createModal/close'
        ),

      setCreateCategory: (category) =>
        set(
          (state) => ({
            createModal: {
              ...state.createModal,
              category,
            },
          }),
          false,
          'createModal/setCategory'
        ),

      // ======================================================================
      // Tag Tooltip Actions
      // ======================================================================
      showTagTooltip: (x, y, tags) =>
        set(
          {
            tagTooltip: { x, y, tags, visible: true },
          },
          false,
          'tagTooltip/show'
        ),

      hideTagTooltip: () =>
        set(
          {
            tagTooltip: null,
          },
          false,
          'tagTooltip/hide'
        ),

      // ======================================================================
      // Reset All Modals
      // ======================================================================
      resetAllModals: () => set(initialState, false, 'resetAllModals'),
    }),
    {
      name: 'dashboard-ui-store',
      enabled: process.env.NODE_ENV === 'development',
    }
  )
);

// ============================================================================
// Selectors (O(1) access, prevents unnecessary re-renders)
// ============================================================================

// Individual modal selectors - components subscribe only to what they need
export const selectEditModal = (state: DashboardUIState & DashboardUIActions) => state.editModal;
export const selectDeleteModal = (state: DashboardUIState & DashboardUIActions) =>
  state.deleteModal;
export const selectDraftingModal = (state: DashboardUIState & DashboardUIActions) =>
  state.draftingModal;
export const selectDraftCreation = (state: DashboardUIState & DashboardUIActions) =>
  state.draftCreation;
export const selectPreviewModal = (state: DashboardUIState & DashboardUIActions) =>
  state.previewModal;
export const selectCreateModal = (state: DashboardUIState & DashboardUIActions) =>
  state.createModal;
export const selectTagTooltip = (state: DashboardUIState & DashboardUIActions) => state.tagTooltip;

// Computed selectors
export const selectIsAnyModalOpen = (state: DashboardUIState & DashboardUIActions) =>
  state.editModal.isOpen ||
  state.deleteModal.isOpen ||
  state.draftingModal.isOpen ||
  state.previewModal.isOpen ||
  state.createModal.isOpen;

// Action selectors (for components that only need actions)
export const selectEditModalActions = (state: DashboardUIState & DashboardUIActions) => ({
  open: state.openEditModal,
  close: state.closeEditModal,
});

export const selectDeleteModalActions = (state: DashboardUIState & DashboardUIActions) => ({
  open: state.openDeleteModal,
  close: state.closeDeleteModal,
  setLoading: state.setDeleteLoading,
});

export const selectDraftingModalActions = (state: DashboardUIState & DashboardUIActions) => ({
  open: state.openDraftingModal,
  close: state.closeDraftingModal,
  setGenerating: state.setDraftingGenerating,
});

export const selectDraftCreationActions = (state: DashboardUIState & DashboardUIActions) => ({
  reset: state.resetDraftCreation,
  setDraftName: state.setDraftName,
  setPrompt: state.setDraftPrompt,
  setLanguage: state.setDraftLanguage,
  setStep: state.setDraftStep,
  setLanguageDropdownOpen: state.setLanguageDropdownOpen,
  setShowTemplateLibrary: state.setShowTemplateLibrary,
  setShowUploadDialog: state.setShowUploadDialog,
  setSelectedTemplateId: state.setSelectedTemplateId,
  setAnswer: state.setDraftAnswer,
  setInterimAnswer: state.setDraftInterimAnswer,
  setSkippedQuestion: state.setDraftSkippedQuestion,
  setInterimTranscript: state.setDraftInterimTranscript,
});

export const selectPreviewModalActions = (state: DashboardUIState & DashboardUIActions) => ({
  open: state.openPreviewModal,
  close: state.closePreviewModal,
});

export const selectCreateModalActions = (state: DashboardUIState & DashboardUIActions) => ({
  open: state.openCreateModal,
  close: state.closeCreateModal,
  setCategory: state.setCreateCategory,
});
