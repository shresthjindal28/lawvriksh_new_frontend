'use client';

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import type { DocumentType } from '@/types/project';

interface FileErrorSingle {
  name?: string;
  invalidFiles?: { name: string; size: number; type: string }[];
}

interface DropdownPosition {
  top: number;
  left: number;
  width: number;
}

interface StudentDialogUIState {
  step: 1 | 2;
  selectedType: DocumentType;
  isDropdownOpen: boolean;
  dropdownPosition: DropdownPosition;
  projectName: string;
  formData: Record<string, string | string[]>;
  inputValues: Record<string, string>;
  creationType: 'scratch' | 'upload' | 'template';
  files: File[];
  dragActive: boolean;
  errors: FileErrorSingle;
  showTemplateUpload: boolean;
  templateFile: File | null;
  showAIDraftForm: boolean;
  shouldTriggerUpload: boolean;
}

interface StudentDialogUIScopedState {
  scopes: Record<string, StudentDialogUIState>;
}

interface StudentDialogUIActions {
  initScope: (scopeKey: string) => void;
  setStep: (scopeKey: string, step: 1 | 2) => void;
  setSelectedType: (scopeKey: string, type: DocumentType) => void;
  setIsDropdownOpen: (scopeKey: string, open: boolean) => void;
  setDropdownPosition: (scopeKey: string, pos: DropdownPosition) => void;
  setProjectName: (scopeKey: string, name: string) => void;
  setCreationType: (scopeKey: string, type: 'scratch' | 'upload' | 'template') => void;
  setFiles: (scopeKey: string, files: File[]) => void;
  addFiles: (scopeKey: string, files: File[]) => void;
  setDragActive: (scopeKey: string, active: boolean) => void;
  addInvalidFiles: (
    scopeKey: string,
    invalidFiles: { name: string; size: number; type: string }[]
  ) => void;
  clearInvalidFiles: (scopeKey: string) => void;
  setShowTemplateUpload: (scopeKey: string, show: boolean) => void;
  setTemplateFile: (scopeKey: string, file: File | null) => void;
  setShowAIDraftForm: (scopeKey: string, show: boolean) => void;
  setShouldTriggerUpload: (scopeKey: string, should: boolean) => void;
  setFormFieldValue: (scopeKey: string, fieldName: string, value: string) => void;
  setMultiEntryInputValue: (scopeKey: string, fieldName: string, value: string) => void;
  addMultiEntryValue: (scopeKey: string, fieldName: string, value: string) => void;
  removeMultiEntryValue: (scopeKey: string, fieldName: string, index: number) => void;
  reset: (scopeKey: string) => void;
}

const initialState: StudentDialogUIState = {
  step: 1,
  selectedType: '',
  isDropdownOpen: false,
  dropdownPosition: { top: 0, left: 0, width: 0 },
  projectName: '',
  formData: {},
  inputValues: {},
  creationType: 'scratch',
  files: [],
  dragActive: false,
  errors: { invalidFiles: [] },
  showTemplateUpload: false,
  templateFile: null,
  showAIDraftForm: false,
  shouldTriggerUpload: false,
};

export const useStudentDialogUIStore = create<
  StudentDialogUIScopedState & StudentDialogUIActions
>()(
  subscribeWithSelector((set, get) => ({
    scopes: {},

    initScope: (scopeKey) =>
      set((state) => {
        if (state.scopes[scopeKey]) return state;
        return { scopes: { ...state.scopes, [scopeKey]: initialState } };
      }),

    setStep: (scopeKey, step) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), step },
        },
      })),

    setSelectedType: (scopeKey, selectedType) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), selectedType },
        },
      })),

    setIsDropdownOpen: (scopeKey, isDropdownOpen) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), isDropdownOpen },
        },
      })),

    setDropdownPosition: (scopeKey, dropdownPosition) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), dropdownPosition },
        },
      })),

    setProjectName: (scopeKey, projectName) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), projectName },
        },
      })),

    setCreationType: (scopeKey, creationType) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), creationType },
        },
      })),

    setFiles: (scopeKey, files) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), files },
        },
      })),

    addFiles: (scopeKey, files) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: { ...current, files: [...current.files, ...files] },
          },
        };
      }),

    setDragActive: (scopeKey, dragActive) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), dragActive },
        },
      })),

    addInvalidFiles: (scopeKey, invalidFiles) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: {
              ...current,
              errors: {
                ...current.errors,
                invalidFiles: [...(current.errors.invalidFiles || []), ...invalidFiles],
              },
            },
          },
        };
      }),

    clearInvalidFiles: (scopeKey) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: { ...current, errors: { invalidFiles: [] } },
          },
        };
      }),

    setShowTemplateUpload: (scopeKey, showTemplateUpload) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), showTemplateUpload },
        },
      })),

    setTemplateFile: (scopeKey, templateFile) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), templateFile },
        },
      })),

    setShowAIDraftForm: (scopeKey, showAIDraftForm) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), showAIDraftForm },
        },
      })),

    setShouldTriggerUpload: (scopeKey, shouldTriggerUpload) =>
      set((state) => ({
        scopes: {
          ...state.scopes,
          [scopeKey]: { ...(state.scopes[scopeKey] ?? initialState), shouldTriggerUpload },
        },
      })),

    setFormFieldValue: (scopeKey, fieldName, value) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: { ...current, formData: { ...current.formData, [fieldName]: value } },
          },
        };
      }),

    setMultiEntryInputValue: (scopeKey, fieldName, value) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: { ...current, inputValues: { ...current.inputValues, [fieldName]: value } },
          },
        };
      }),

    addMultiEntryValue: (scopeKey, fieldName, value) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        const currentArray = Array.isArray(current.formData[fieldName])
          ? (current.formData[fieldName] as string[])
          : [];
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: {
              ...current,
              formData: { ...current.formData, [fieldName]: [...currentArray, value] },
              inputValues: { ...current.inputValues, [fieldName]: '' },
            },
          },
        };
      }),

    removeMultiEntryValue: (scopeKey, fieldName, index) =>
      set((state) => {
        const current = state.scopes[scopeKey] ?? initialState;
        const currentArray = Array.isArray(current.formData[fieldName])
          ? (current.formData[fieldName] as string[])
          : [];
        return {
          scopes: {
            ...state.scopes,
            [scopeKey]: {
              ...current,
              formData: {
                ...current.formData,
                [fieldName]: currentArray.filter((_, i) => i !== index),
              },
            },
          },
        };
      }),

    reset: (scopeKey) =>
      set((state) => ({
        scopes: { ...state.scopes, [scopeKey]: initialState },
      })),
  }))
);
