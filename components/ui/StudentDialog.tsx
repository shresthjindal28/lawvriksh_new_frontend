'use client';

import type React from 'react';
import { useCallback, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Plus,
  X,
  UploadCloud,
  Loader2,
  Sparkles,
  ArrowLeft,
  ChevronDown,
  CheckCircle,
  AlertCircle,
} from 'lucide-react';
import DocumentDraftingModal from '../dashboard/home/DocumentDraftingModal';
import Dialog from './Dialog';
import { useToast } from '@/lib/contexts/ToastContext';
import { DOCUMENT_TYPES, FormField } from '@/lib/config/documenrConfig';
import { DocumentType, ProjectCategory, ProjectType } from '@/types/project';
import { Privacy } from '@/types/workspace';
import { validators } from '@/lib/utils/validators';
import { FileUploadProgress } from '@/lib/api/uploadService';
import projectService from '@/lib/api/projectService';
import { createProjectRequestSchema } from '@/lib/validators/project/project.schemas';
import { useStudentDialogUIStore } from '@/store/zustand/useStudentDialogUIStore';
import { cn } from '@/lib/utils';
interface SingleFile {
  name: string;
  size: number;
  type: string;
}

interface FileError {
  name?: string;
  invalidFiles?: SingleFile[];
}

const EMPTY_FILES: File[] = [];
const EMPTY_FORM_DATA: Record<string, string | string[]> = {};
const EMPTY_INPUT_VALUES: Record<string, string> = {};
const EMPTY_INVALID_FILES: SingleFile[] = [];
const DEFAULT_ERRORS: FileError = { invalidFiles: EMPTY_INVALID_FILES };
const DEFAULT_DROPDOWN_POSITION = { top: 0, left: 0, width: 0 };

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

interface StudentDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (data: StudentProjectFormData) => Promise<void>;
  isLoading?: boolean;
  category: ProjectCategory;
  dialogKey?: string;
}

export interface StudentProjectFormData {
  name: string;
  type: 'scratch' | 'upload' | 'template';
  files: File[];
  documentType?: DocumentType;
  templateData?: Record<string, string | string[]>;
  category: ProjectCategory;
}

const StudentDialog: React.FC<StudentDialogProps> = ({
  isOpen,
  onClose,
  onSubmit,
  isLoading = false,
  category,
  dialogKey,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const templateFileInputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const scopeKey = dialogKey ?? 'default';

  useEffect(() => {
    useStudentDialogUIStore.getState().initScope(scopeKey);
  }, [scopeKey]);

  const step = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.step ?? 1);
  const selectedType = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.selectedType ?? '');
  const isDropdownOpen = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.isDropdownOpen ?? false
  );
  const dropdownPosition = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.dropdownPosition ?? DEFAULT_DROPDOWN_POSITION
  );
  const projectName = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.projectName ?? '');
  const formData = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.formData ?? EMPTY_FORM_DATA);
  const inputValues = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.inputValues ?? EMPTY_INPUT_VALUES
  );
  const creationType = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.creationType ?? 'scratch'
  );
  const files = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.files ?? EMPTY_FILES);
  const dragActive = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.dragActive ?? false);
  const errors = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.errors ?? DEFAULT_ERRORS);
  const showTemplateUpload = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.showTemplateUpload ?? false
  );
  const templateFile = useStudentDialogUIStore((s) => s.scopes[scopeKey]?.templateFile ?? null);
  const showAIDraftForm = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.showAIDraftForm ?? false
  );
  const shouldTriggerUpload = useStudentDialogUIStore(
    (s) => s.scopes[scopeKey]?.shouldTriggerUpload ?? false
  );

  const setStep = useStudentDialogUIStore.getState().setStep;
  const setSelectedType = useStudentDialogUIStore.getState().setSelectedType;
  const setIsDropdownOpen = useStudentDialogUIStore.getState().setIsDropdownOpen;
  const setDropdownPosition = useStudentDialogUIStore.getState().setDropdownPosition;
  const setProjectName = useStudentDialogUIStore.getState().setProjectName;
  const setCreationType = useStudentDialogUIStore.getState().setCreationType;
  const addFiles = useStudentDialogUIStore.getState().addFiles;
  const setFiles = useStudentDialogUIStore.getState().setFiles;
  const setDragActive = useStudentDialogUIStore.getState().setDragActive;
  const addInvalidFiles = useStudentDialogUIStore.getState().addInvalidFiles;
  const setShowTemplateUpload = useStudentDialogUIStore.getState().setShowTemplateUpload;
  const setTemplateFile = useStudentDialogUIStore.getState().setTemplateFile;
  const setShowAIDraftForm = useStudentDialogUIStore.getState().setShowAIDraftForm;
  const setShouldTriggerUpload = useStudentDialogUIStore.getState().setShouldTriggerUpload;
  const setFormFieldValue = useStudentDialogUIStore.getState().setFormFieldValue;
  const setMultiEntryInputValue = useStudentDialogUIStore.getState().setMultiEntryInputValue;
  const addMultiEntryValue = useStudentDialogUIStore.getState().addMultiEntryValue;
  const removeMultiEntryValue = useStudentDialogUIStore.getState().removeMultiEntryValue;
  const resetDialogState = useStudentDialogUIStore.getState().reset;

  const { addToast } = useToast();

  const isPreSelected = category && DOCUMENT_TYPES.some((t) => t.value === category);
  const shouldShowTemplateSelection = !['research_paper', 'article', 'assignment'].includes(
    category
  );

  useEffect(() => {
    if (shouldTriggerUpload && !showAIDraftForm) {
      const timer = setTimeout(() => {
        fileInputRef.current?.click();
        setShouldTriggerUpload(scopeKey, false);
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [shouldTriggerUpload, showAIDraftForm, setShouldTriggerUpload, scopeKey]);

  useEffect(() => {
    if (isOpen && category) {
      setStep(scopeKey, 1);
      if (isPreSelected) {
        setCreationType(scopeKey, 'template');
        setSelectedType(scopeKey, category as DocumentType);
      } else {
        setCreationType(scopeKey, 'scratch');
        setSelectedType(scopeKey, '');
      }
    }
  }, [isOpen, category, isPreSelected, setCreationType, setSelectedType, setStep, scopeKey]);

  const handleFilesSelect = useCallback(
    (selectedFiles: FileList | null) => {
      if (selectedFiles && selectedFiles.length > 0) {
        const validFiles: File[] = [];
        const invalidFiles: SingleFile[] = [];

        Array.from(selectedFiles).forEach((file) => {
          const result = validators.validateFile(file);
          if (result.isValid) {
            validFiles.push(file);
          } else {
            invalidFiles.push({
              name: file.name,
              size: file.size,
              type: file.type,
            });
          }
        });

        if (validFiles.length > 0) {
          addFiles(scopeKey, validFiles);
          setCreationType(scopeKey, 'upload');
        }

        if (invalidFiles.length > 0) {
          addInvalidFiles(scopeKey, invalidFiles);
        }
      }
    },
    [addFiles, addInvalidFiles, setCreationType, scopeKey]
  );

  const handleDrag = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (e.type === 'dragenter' || e.type === 'dragover') {
        setDragActive(scopeKey, true);
      } else if (e.type === 'dragleave') {
        setDragActive(scopeKey, false);
      }
    },
    [setDragActive, scopeKey]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setDragActive(scopeKey, false);
      handleFilesSelect(e.dataTransfer.files);
    },
    [handleFilesSelect, scopeKey, setDragActive]
  );

  const handleFileInput = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      handleFilesSelect(e.target.files);
    },
    [handleFilesSelect]
  );

  useEffect(() => {
    if (isDropdownOpen && dropdownRef.current) {
      const rect = dropdownRef.current.getBoundingClientRect();
      setDropdownPosition(scopeKey, {
        top: rect.bottom,
        left: rect.left,
        width: rect.width,
      });
    }
  }, [isDropdownOpen, setDropdownPosition, scopeKey]);

  const handleSelect = () => {
    handleCreate();
  };

  const handleBack = () => {
    setStep(scopeKey, 1);
  };

  const handleClose = () => {
    if (!isLoading) {
      resetDialogState(scopeKey);
      onClose();
    }
  };

  const handleCreate = useCallback(async () => {
    if (!projectName.trim()) {
      addToast('Please enter a document name', 'error');
      return;
    }

    if (creationType === 'upload' && files.length === 0) {
      addToast('Please select at least one file', 'error');
      return;
    }

    if (showTemplateUpload && !templateFile) {
      addToast('Please select a template file', 'error');
      return;
    }

    try {
      const submitData: StudentProjectFormData = {
        name: projectName.trim(),
        type: creationType,
        files: showTemplateUpload && templateFile ? [templateFile] : files,
        documentType: creationType === 'template' ? selectedType : undefined,
        templateData: creationType === 'template' ? formData : undefined,
        category: category,
      };

      await onSubmit(submitData);
      handleClose();
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof Error && error.name === 'AbortError') return;
      addToast('Failed to create project', 'error');
    }
  }, [
    projectName,
    creationType,
    files,
    selectedType,
    formData,
    onSubmit,
    category,
    showTemplateUpload,
    templateFile,
    addToast,
    showAIDraftForm,
  ]);

  const router = useRouter();

  const handleAIDraftSubmit = async (data: any, projectName: string) => {
    try {
      const draftResponse = {
        success: true,
        data: data,
        message: 'Success',
      };

      let templateJson;
      try {
        templateJson =
          typeof draftResponse.data.template_json === 'string'
            ? JSON.parse(draftResponse.data.template_json)
            : draftResponse.data.template_json;
      } catch (e) {
        console.error('Error parsing template JSON', e);
        templateJson = {};
      }

      const safeTemplateJson = templateJson || {};
      const variablesArray = safeTemplateJson.variables || [];
      const variablesMap: Record<string, any> = {};

      if (Array.isArray(variablesArray)) {
        variablesArray.forEach((v: any) => {
          if (v.variable_name) {
            variablesMap[v.variable_name] = {
              value: v.value || '',
              editable: v.editable !== false,
              type: v.type || 'text',
              label: v.label || v.variable_name,
            };
          }
        });
      }

      const htmlContent = draftResponse.data.html_content || '';
      const variableRegex = /{{([^}]+)}}/g;
      let match;
      const extractedVariables = new Set<string>();

      while ((match = variableRegex.exec(htmlContent)) !== null) {
        const varName = match[1].trim();
        if (varName && !variablesMap[varName] && !extractedVariables.has(varName)) {
          variablesMap[varName] = {
            value: '',
            editable: true,
            type: 'text',
            label: varName.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase()),
          };
          extractedVariables.add(varName);
        }
      }

      const requestData = {
        title: projectName,
        category: 'draft' as const,
        access_type: Privacy.PRIVATE,
        content: {
          data: {
            blocks: [
              {
                id: 'draft-content',
                type: 'paragraph',
                data: {
                  text: draftResponse.data.html_content,
                },
              },
            ],
            variables: variablesMap,
            time: Date.now(),
            version: '2.0',
          },
        },
        metadata: {
          data: {
            data: {
              type: ProjectType.TEMPLATE,
              aiGenerated: true,
              prompt: 'AI Generated Draft',
              docMetadata: draftResponse.data.doc_metadata,
              generationMetrics: draftResponse.data.pipeline_metrics,
              citations: {},
            },
          },
        },
      };

      const validatedData = createProjectRequestSchema.safeParse(requestData);
      if (!validatedData.success) {
        throw new Error(validatedData.error.message);
      }

      const projectResponse = await projectService.createProject(validatedData.data);

      if (!projectResponse.success || !projectResponse.data?.workspace) {
        throw new Error(projectResponse.message || 'Failed to create project');
      }

      const projectId = projectResponse.data.workspace.id;

      if (!projectId) {
        throw new Error('Project ID not returned from server');
      }

      addToast('AI Draft created successfully!', 'success');
      handleClose();
      router.push(
        `/AIDrafting/writing-section/${projectId}?title=${encodeURIComponent(projectName)}&new=true`
      );
    } catch (error) {
      console.error('Error submitting AI draft:', error);
      addToast('Failed to create project', 'error');
    }
  };

  const handleTemplateFileSelect = (selectedFile: File | null) => {
    if (selectedFile) {
      const result = validators.validateFile(selectedFile);
      if (result.isValid) {
        setTemplateFile(scopeKey, selectedFile);
      } else {
        addToast('Please select a valid PDF, DOCX, or TXT file under 50MB', 'error');
      }
    }
  };

  const handleTemplateFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    handleTemplateFileSelect(file);
  };

  const handleBackFromTemplateUpload = () => {
    setShowTemplateUpload(scopeKey, false);
    setTemplateFile(scopeKey, null);
  };

  const handleFieldChange = (fieldName: string, value: string) => {
    setFormFieldValue(scopeKey, fieldName, value);
  };

  const handleMultiEntryInputChange = (fieldName: string, value: string) => {
    setMultiEntryInputValue(scopeKey, fieldName, value);
  };

  const handleCreationTypeChange = (type: 'scratch' | 'upload' | 'template') => {
    setCreationType(scopeKey, type);
    if (type === 'scratch' || type === 'upload') {
      setSelectedType(scopeKey, '');
    }
    if (type !== 'upload') {
      setFiles(scopeKey, []);
    }
  };

  const handleAddEntry = (fieldName: string) => {
    const value = inputValues[fieldName]?.trim();
    if (!value) return;
    addMultiEntryValue(scopeKey, fieldName, value);
  };

  const handleRemoveEntry = (fieldName: string, index: number) => {
    removeMultiEntryValue(scopeKey, fieldName, index);
  };

  const getCurrentDocumentConfig = () => {
    return DOCUMENT_TYPES.find((type) => type.value === selectedType);
  };

  const isFormValid = () => {
    if (!projectName) return false;

    if (step === 1) {
      if (creationType === 'scratch') return true;
      if (creationType === 'upload') return files.length > 0;
      if (creationType === 'template') return !!selectedType;
      return false;
    }

    if (step === 2 && creationType === 'template') {
      const config = getCurrentDocumentConfig();
      if (!config) return false;

      return config.fields.every((field) => {
        if (!field.required) return true;

        if (field.type === 'multi-entry') {
          const value = formData[field.name];
          return Array.isArray(value) && value.length > 0;
        }

        return !!formData[field.name]?.toString().trim();
      });
    }

    return true;
  };

  const renderMultiEntryField = (field: FormField) => {
    const entries = Array.isArray(formData[field.name]) ? (formData[field.name] as string[]) : [];
    const inputValue = inputValues[field.name] || '';

    return (
      <div key={field.name} className="flex flex-col gap-2">
        <label className="text-sm font-medium text-gray-700">{field.label}</label>

        {entries.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {entries.map((entry, index) => (
              <div
                key={index}
                className="inline-flex items-center gap-1 px-3 py-1 bg-gray-100 rounded-full text-sm"
              >
                <span>{entry}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(field.name, index)}
                  className="p-0.5 hover:bg-gray-200 rounded-full"
                  aria-label={`Remove ${entry}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex gap-2">
          <input
            type="text"
            placeholder={field.placeholder}
            value={inputValue}
            onChange={(e) => handleMultiEntryInputChange(field.name, e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddEntry(field.name);
              }
            }}
            className="flex-1 px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[--lv-accent-gold]"
          />
          <button
            type="button"
            onClick={() => handleAddEntry(field.name)}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-800"
            aria-label={`Add ${field.label}`}
          >
            <Plus size={16} strokeWidth={3} />
          </button>
        </div>
      </div>
    );
  };

  const renderFormFields = () => {
    const config = getCurrentDocumentConfig();
    if (!config) return null;

    return config.fields.map((field) => {
      if (field.type === 'multi-entry') {
        return renderMultiEntryField(field);
      }

      return (
        <div key={field.name} className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">{field.label}</label>
          <input
            type="text"
            placeholder={field.placeholder}
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className="px-4 py-3 border-2 border-gray-200 rounded-lg focus:outline-none focus:border-[--lv-accent-gold]"
            required={field.required}
          />
        </div>
      );
    });
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={handleClose}
      size="md"
      closable={!isLoading}
      overlayClosable={!isLoading}
    >
      <form
        className="flex flex-col gap-6 font-sans p-1 sm:p-0"
        onSubmit={(e) => {
          e.preventDefault();
          if (step === 1) {
            handleSelect();
          } else {
            handleCreate();
          }
        }}
      >
        {/* Header Section */}
        <div className="flex flex-col gap-1">
          {step === 1 && !showTemplateUpload ? (
            <input
              type="text"
              placeholder={
                category === 'research_paper'
                  ? 'Write your Research paper title'
                  : category === 'article'
                    ? 'Write your article title'
                    : 'Untitled Project'
              }
              value={projectName}
              onChange={(e) => setProjectName(scopeKey, e.target.value)}
              className="w-full px-0 py-2 text-2xl font-semibold border-none border-b-2 border-gray-200 focus:outline-none focus:border-[--lv-accent-gold] bg-transparent"
              disabled={isLoading}
              required
              autoFocus
            />
          ) : (
            <h2 className="text-xl font-semibold text-gray-900">
              {step === 2
                ? `Configure ${getCurrentDocumentConfig()?.label || 'Project'}`
                : showTemplateUpload
                  ? 'Generate Template'
                  : 'New Project'}
            </h2>
          )}
          {step === 1 && !showTemplateUpload && (
            <p className="text-sm text-gray-500">Choose how you want to start writing.</p>
          )}
        </div>

        {/* Content Section */}
        <div className="flex flex-col gap-4">
          {showAIDraftForm ? (
            <DocumentDraftingModal
              isOpen={showAIDraftForm}
              onClose={() => setShowAIDraftForm(scopeKey, false)}
              onDraftSuccess={handleAIDraftSubmit}
              onCreateFromScratch={() => {
                setShowAIDraftForm(scopeKey, false);
                setCreationType(scopeKey, 'scratch');
              }}
              onUpload={() => {
                setShowAIDraftForm(scopeKey, false);
                setShouldTriggerUpload(scopeKey, true);
              }}
              isLoading={isLoading}
            />
          ) : showTemplateUpload ? (
            <div className="flex flex-col gap-4">
              <div>
                <button
                  type="button"
                  onClick={handleBackFromTemplateUpload}
                  className="inline-flex items-center gap-1 text-sm text-gray-600 hover:text-gray-900"
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              <div
                className={cn(
                  'flex flex-col items-center justify-center gap-4 p-8 border-2 border-dashed rounded-xl cursor-pointer transition-colors',
                  templateFile
                    ? 'border-[--lv-accent-gold] bg-[--lv-accent-gold]/5'
                    : 'border-gray-300 hover:border-gray-400'
                )}
                onClick={() => templateFileInputRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center">
                  <Sparkles size={24} className="text-gray-600" />
                </div>
                <div className="text-center">
                  <h3 className="font-medium text-gray-900">
                    {templateFile ? templateFile.name : 'Upload Document'}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {templateFile
                      ? formatFileSize(templateFile.size)
                      : 'PDF, DOCX, or TXT (Max 50MB)'}
                  </p>
                </div>
                <input
                  ref={templateFileInputRef}
                  type="file"
                  onChange={handleTemplateFileInput}
                  className="hidden"
                  accept=".pdf,.docx,.doc,.txt"
                />
              </div>
            </div>
          ) : step === 1 ? (
            <div className="flex flex-col gap-3">
              {/* Option 1: Scratch */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all',
                  creationType === 'scratch'
                    ? 'border-[--lv-accent-gold] bg-[--lv-accent-gold]/5'
                    : 'border-gray-200 hover:border-gray-300'
                )}
                onClick={() => handleCreationTypeChange('scratch')}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <Plus size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Create from Scratch</h3>
                  <p className="text-sm text-gray-500">Start with a clean slate</p>
                </div>
                {creationType === 'scratch' && (
                  <div className="w-2 h-2 rounded-full bg-[--lv-accent-gold]" />
                )}
              </div>

              {/* Option 2: Import */}
              <div
                className={cn(
                  'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all',
                  creationType === 'upload'
                    ? 'border-[--lv-accent-gold] bg-[--lv-accent-gold]/5'
                    : 'border-gray-200 hover:border-gray-300',
                  dragActive && 'border-blue-500 bg-blue-50'
                )}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className="w-10 h-10 rounded-lg bg-gray-100 flex items-center justify-center">
                  <UploadCloud size={20} className="text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-medium text-gray-900">Import Text</h3>
                  <p className="text-sm text-gray-500">
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : 'Extract text from files'}
                  </p>
                </div>
                {creationType === 'upload' && (
                  <div className="w-2 h-2 rounded-full bg-[--lv-accent-gold]" />
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  className="hidden"
                  disabled={isLoading}
                  accept=".pdf,.docx,.doc,.txt"
                  multiple
                />
              </div>

              {/* AI Powered */}
              {shouldShowTemplateSelection && (
                <div
                  className={cn(
                    'flex items-center gap-4 p-4 border-2 rounded-xl cursor-pointer transition-all',
                    creationType === 'template'
                      ? 'border-[--lv-accent-gold] bg-[--lv-accent-gold]/5'
                      : 'border-gray-200 hover:border-gray-300'
                  )}
                  onClick={() => {
                    setShowAIDraftForm(scopeKey, true);
                    setCreationType(scopeKey, 'template');
                  }}
                >
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-purple-100 to-blue-100 flex items-center justify-center">
                    <Sparkles size={18} className="text-purple-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900">AI Powered Draft</h3>
                      <span className="px-2 py-0.5 text-xs font-medium bg-purple-100 text-purple-700 rounded-full">
                        BETA
                      </span>
                    </div>
                    <p className="text-sm text-gray-500">Generate from a template or prompt</p>
                  </div>
                </div>
              )}

              {/* Template Selection Dropdown */}
              {shouldShowTemplateSelection && !isPreSelected && (
                <div className="relative" ref={dropdownRef}>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 border border-gray-200 rounded-lg text-left hover:border-gray-300"
                    onClick={() => setIsDropdownOpen(scopeKey, !isDropdownOpen)}
                  >
                    <span className="text-gray-700">
                      {selectedType
                        ? DOCUMENT_TYPES.find((t) => t.value === selectedType)?.label
                        : 'Browse Templates...'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={cn(
                        'transition-transform text-gray-500',
                        isDropdownOpen && 'rotate-180'
                      )}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg overflow-hidden">
                      {DOCUMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className="w-full px-4 py-3 text-left hover:bg-gray-50 text-gray-700"
                          onClick={async () => {
                            if (!projectName.trim()) {
                              addToast('Please enter a document name', 'error');
                              return;
                            }

                            setIsDropdownOpen(scopeKey, false);

                            try {
                              const submitData: StudentProjectFormData = {
                                name: projectName.trim(),
                                type: 'template',
                                files: [],
                                documentType: type.value as DocumentType,
                                templateData: {},
                                category: category,
                              };

                              await onSubmit(submitData);
                              handleClose();
                            } catch (error) {
                              addToast('Failed to create project', 'error');
                            }
                          }}
                        >
                          {type.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* File Errors */}
              {errors.invalidFiles && errors.invalidFiles.length > 0 && (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm font-medium text-red-700">
                    Invalid files (Max 50MB, PDF/DOCX/TXT only):
                  </p>
                  <ul className="list-disc list-inside text-sm text-red-600 mt-1">
                    {errors.invalidFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : null}
        </div>

        {/* Footer Actions */}
        {!showAIDraftForm && (
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 text-white bg-gray-900 rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" /> Processing...
                </span>
              ) : (
                'Create Project'
              )}
            </button>
          </div>
        )}
      </form>
    </Dialog>
  );
};

export default StudentDialog;
