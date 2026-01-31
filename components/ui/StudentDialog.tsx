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
import styles from './StudentDialog.module.css';
import { useStudentDialogUIStore } from '@/store/zustand/useStudentDialogUIStore';

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
  // Hide AI Powered Draft option for specific categories
  const shouldShowTemplateSelection = !['research_paper', 'article', 'assignment'].includes(
    category
  );

  useEffect(() => {
    if (shouldTriggerUpload && !showAIDraftForm) {
      // Small timeout to ensure DOM is ready
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
    // Skip Step 2 (Metadata) and create immediately
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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
      // Step 1: Data is already generated by the modal
      const draftResponse = {
        success: true,
        data: data,
        message: 'Success',
      };

      // Step 2: Parse the template JSON from API response
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

      // Step 3: Extract variables directly from templateJson
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

      // Robustness: Scan content for {{variable}} patterns and add any missing variables
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

      // Step 4: Create project
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
            variables: variablesMap, // Store variables as a map
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
      <div key={field.name} className={styles.fieldGroup}>
        <label className={styles.fieldLabel}>{field.label}</label>

        {entries.length > 0 && (
          <div className={styles.tagsContainer}>
            {entries.map((entry, index) => (
              <div key={index} className={styles.tag}>
                <span>{entry}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveEntry(field.name, index)}
                  className={styles.tagRemoveBtn}
                  aria-label={`Remove ${entry}`}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className={styles.multiEntryWrapper}>
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
            className={styles.multiEntryInput}
          />
          <button
            type="button"
            onClick={() => handleAddEntry(field.name)}
            className={styles.addEntryBtn}
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
        <div key={field.name} className={styles.fieldGroup}>
          <label className={styles.fieldLabel}>{field.label}</label>
          <input
            type="text"
            placeholder={field.placeholder}
            value={(formData[field.name] as string) || ''}
            onChange={(e) => handleFieldChange(field.name, e.target.value)}
            className={styles.textInput}
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
        className={styles.dialogForm}
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
        <div className={styles.header}>
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
              className={styles.projectNameInput}
              disabled={isLoading}
              required
              autoFocus
            />
          ) : (
            <h2 className={styles.headerTitle}>
              {step === 2
                ? `Configure ${getCurrentDocumentConfig()?.label || 'Project'}`
                : showTemplateUpload
                  ? 'Generate Template'
                  : 'New Project'}
            </h2>
          )}
          {step === 1 && !showTemplateUpload && (
            <p className={styles.headerSubtitle}>Choose how you want to start writing.</p>
          )}
        </div>

        {/* Content Section */}
        <div className={styles.contentSection}>
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
            <div className={styles.templateUploadContainer}>
              <div className={styles.backButtonContainer}>
                <button
                  type="button"
                  onClick={handleBackFromTemplateUpload}
                  className={styles.backButton}
                >
                  <ArrowLeft size={14} /> Back
                </button>
              </div>

              <div
                className={`${styles.uploadZone} ${templateFile ? styles.hasFile : ''}`}
                onClick={() => templateFileInputRef.current?.click()}
              >
                <div className={styles.uploadIconCircle}>
                  <Sparkles size={24} />
                </div>
                <div className={styles.uploadText}>
                  <h3>{templateFile ? templateFile.name : 'Upload Document'}</h3>
                  <p>
                    {templateFile
                      ? formatFileSize(templateFile.size)
                      : 'PDF, DOCX, or TXT (Max 50MB)'}
                  </p>
                </div>
                <input
                  ref={templateFileInputRef}
                  type="file"
                  onChange={handleTemplateFileInput}
                  className={styles.hidden}
                  accept=".pdf,.docx,.doc,.txt"
                />
              </div>
            </div>
          ) : step === 1 ? (
            <div className={styles.optionsList}>
              {/* Option 1: Scratch */}
              <div
                className={`${styles.optionCard} ${creationType === 'scratch' ? styles.selected : ''}`}
                onClick={() => handleCreationTypeChange('scratch')}
              >
                <div className={styles.optionIconWrapper}>
                  <Plus size={20} />
                </div>
                <div className={styles.optionContent}>
                  <h3 className={styles.optionTitle}>Create from Scratch</h3>
                  <p className={styles.optionDescription}>Start with a clean slate</p>
                </div>
                {creationType === 'scratch' && <div className={styles.selectedIndicator}></div>}
              </div>

              {/* Option 2: Import */}
              <div
                className={`${styles.optionCard} ${creationType === 'upload' ? styles.selected : ''} ${dragActive ? styles.dragActive : ''}`}
                onClick={() => fileInputRef.current?.click()}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
              >
                <div className={styles.optionIconWrapper}>
                  <UploadCloud size={20} />
                </div>
                <div className={styles.optionContent}>
                  <h3 className={styles.optionTitle}>Import Text</h3>
                  <p className={styles.optionDescription}>
                    {files.length > 0
                      ? `${files.length} file(s) selected`
                      : 'Extract text from files'}
                  </p>
                </div>
                {creationType === 'upload' && <div className={styles.selectedIndicator}></div>}
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileInput}
                  className={styles.hidden}
                  disabled={isLoading}
                  accept=".pdf,.docx,.doc,.txt"
                  multiple
                />
              </div>

              {/* AI Powered */}
              {shouldShowTemplateSelection && (
                <div
                  className={`${styles.optionCard} ${styles.template} ${creationType === 'template' ? styles.selected : ''}`}
                  onClick={() => {
                    // Always Show AI Draft Form when this option is clicked
                    setShowAIDraftForm(scopeKey, true);
                    setCreationType(scopeKey, 'template');
                  }}
                >
                  <div className={styles.optionIconWrapper}>
                    <Sparkles size={18} />
                  </div>
                  <div className={styles.optionContent}>
                    <div className={styles.templateTitleWrapper}>
                      <h3 className={styles.optionTitle}>AI Powered Draft</h3>
                      <span className={styles.betaBadge}>BETA</span>
                    </div>
                    <p className={styles.optionDescription}>Generate from a template or prompt</p>
                  </div>
                </div>
              )}

              {/* Template Selection Dropdown (Only if needed) */}
              {shouldShowTemplateSelection && !isPreSelected && (
                <div className={styles.dropdownContainer} ref={dropdownRef}>
                  <button
                    type="button"
                    className={styles.dropdownTrigger}
                    onClick={() => setIsDropdownOpen(scopeKey, !isDropdownOpen)}
                  >
                    <span>
                      {selectedType
                        ? DOCUMENT_TYPES.find((t) => t.value === selectedType)?.label
                        : 'Browse Templates...'}
                    </span>
                    <ChevronDown
                      size={16}
                      className={`transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                    />
                  </button>

                  {isDropdownOpen && (
                    <div
                      className={styles.dropdownMenu}
                      style={{
                        top: dropdownPosition.top + 4,
                        left: dropdownPosition.left,
                        width: dropdownPosition.width,
                      }}
                    >
                      {DOCUMENT_TYPES.map((type) => (
                        <button
                          key={type.value}
                          type="button"
                          className={styles.dropdownItem}
                          onClick={async () => {
                            if (!projectName.trim()) {
                              addToast('Please enter a document name', 'error');
                              return;
                            }

                            setIsDropdownOpen(scopeKey, false); // Close dropdown

                            try {
                              const submitData: StudentProjectFormData = {
                                name: projectName.trim(),
                                type: 'template',
                                files: [],
                                documentType: type.value as DocumentType,
                                templateData: {}, // Empty metadata as requested
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
                <div className={styles.errorContainer}>
                  <p className={styles.errorTitle}>Invalid files (Max 50MB, PDF/DOCX/TXT only):</p>
                  <ul className="list-disc list-inside">
                    {errors.invalidFiles.map((f, i) => (
                      <li key={i}>{f.name}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          ) : /* Step 2 (metadata) is completely hidden - render null */
          null}
        </div>

        {/* Footer Actions - Hide when showing AI Draft Form */}
        {!showAIDraftForm && (
          <div className={styles.footer}>
            <button
              type="button"
              className={styles.btnSecondary}
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </button>
            <button
              type="submit"
              className={styles.btnPrimary}
              disabled={!isFormValid() || isLoading}
            >
              {isLoading ? (
                <span className={styles.loader}>
                  <Loader2 size={14} className={styles.animateSpin} /> Processing...
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
