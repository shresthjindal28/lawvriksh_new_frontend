'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, X, FileText, ShieldCheck, ChevronDown, Loader2 } from 'lucide-react';
import Dialog from './Dialog';
import '@/styles/ui-styles/document-dialog.css';
import { useToast } from '@/lib/contexts/ToastContext';
import { DocumentType } from '@/types/analysisDocument';

interface AnalysisDocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadDocument: (
    file: File,
    documentType: DocumentType,
    metadata?: Record<string, any>
  ) => Promise<boolean>;
  uploadProgress?: number;
  isUploading?: boolean;
}

const AnalysisDocumentUploadDialog: React.FC<AnalysisDocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  uploadDocument,
  uploadProgress = 0,
  isUploading = false,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [documentType, setDocumentType] = useState<DocumentType>('general');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [category, setCategory] = useState('');
  const [localUploading, setLocalUploading] = useState(false);
  const { addToast } = useToast();

  const documentTypes: {
    value: DocumentType;
    label: string;
    description: string;
    icon: React.ReactNode;
  }[] = [
    {
      value: 'general',
      label: 'General Document',
      description: 'Reference documents (PDF, DOC, DOCX, TXT)',
      icon: <FileText size={18} className="text-blue-500" />,
    },
    {
      value: 'compliance',
      label: 'Compliance Document',
      description: 'Custom compliance rules (PDF, DOC, DOCX, TXT)',
      icon: <ShieldCheck size={18} className="text-green-500" />,
    },
  ];

  const selectedTypeInfo = documentTypes.find((t) => t.value === documentType);

  const handleDragOver = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...files]);
    }
  }, []);

  const handleFileSelect = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setSelectedFiles((prev) => [...prev, ...Array.from(files)]);
    }
  }, []);

  const removeFile = useCallback((index: number) => {
    setSelectedFiles((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getAcceptedTypes = () => {
    // Both general and compliance documents support the same file types
    return '.pdf,.doc,.docx,.txt';
  };

  const getSupportedTypesText = () => {
    return 'Supports PDF, DOC, DOCX, and TXT files';
  };

  const validateFile = (file: File): boolean => {
    const maxSize = 50 * 1024 * 1024; // 50MB

    if (file.size > maxSize) {
      addToast(`File "${file.name}" exceeds 50MB limit.`, 'error');
      return false;
    }

    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];

    if (!supportedTypes.includes(file.type)) {
      addToast(`File type not supported for "${file.name}".`, 'error');
      return false;
    }

    return true;
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast('Please select at least one file.', 'error');
      return;
    }

    // Validate all files
    for (const file of selectedFiles) {
      if (!validateFile(file)) {
        return;
      }
    }

    setLocalUploading(true);

    try {
      const metadata = category ? { category } : undefined;
      let successCount = 0;
      let failCount = 0;

      for (const file of selectedFiles) {
        try {
          const success = await uploadDocument(file, documentType, metadata);
          if (success) {
            successCount++;
          } else {
            failCount++;
          }
        } catch (err) {
          failCount++;
          console.error('Upload error:', err);
        }
      }

      if (successCount > 0) {
        addToast(
          `${successCount} ${documentType === 'compliance' ? 'compliance ' : ''}document${successCount > 1 ? 's' : ''} uploaded successfully!`,
          'success'
        );
      }

      if (failCount > 0) {
        addToast(`${failCount} document${failCount > 1 ? 's' : ''} failed to upload.`, 'error');
      }

      if (successCount > 0) {
        setSelectedFiles([]);
        setCategory('');
        onClose();
      }
    } catch (err) {
      console.error('Upload error:', err);
      addToast('Failed to upload documents.', 'error');
    } finally {
      setLocalUploading(false);
    }
  };

  const resetAndClose = () => {
    setSelectedFiles([]);
    setCategory('');
    setDocumentType('general');
    setIsDropdownOpen(false);
    onClose();
  };

  const uploading = isUploading || localUploading;

  return (
    <Dialog
      isOpen={isOpen}
      onClose={resetAndClose}
      size="md"
      closable
      overlayClosable={!uploading}
      className="project-dialog"
    >
      <form
        className="document-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleUpload();
        }}
      >
        {/* Document Type Selector */}
        <div className="analysis-doc-type-selector">
          <label className="analysis-doc-type-label">Document Type</label>
          <div className="analysis-doc-type-dropdown-container">
            <button
              type="button"
              className="analysis-doc-type-dropdown-trigger"
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              disabled={uploading}
            >
              <div className="analysis-doc-type-selected">
                {selectedTypeInfo?.icon}
                <span>{selectedTypeInfo?.label}</span>
              </div>
              <ChevronDown
                size={18}
                className={`analysis-doc-type-chevron ${isDropdownOpen ? 'rotated' : ''}`}
              />
            </button>

            {isDropdownOpen && (
              <div className="analysis-doc-type-dropdown-menu">
                {documentTypes.map((type) => (
                  <button
                    key={type.value}
                    type="button"
                    className={`analysis-doc-type-option ${documentType === type.value ? 'selected' : ''}`}
                    onClick={() => {
                      setDocumentType(type.value);
                      setIsDropdownOpen(false);
                      setSelectedFiles([]); // Clear files when type changes
                    }}
                  >
                    <div className="analysis-doc-type-option-icon">{type.icon}</div>
                    <div className="analysis-doc-type-option-content">
                      <span className="analysis-doc-type-option-label">{type.label}</span>
                      <span className="analysis-doc-type-option-description">
                        {type.description}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Category Input */}
        <div className="project-input-group">
          <input
            type="text"
            placeholder="Enter Category (optional)..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="project-name-input"
            disabled={uploading}
          />
        </div>

        {/* File Upload Area */}
        <div
          className={`project-upload-drag-drop project-upload-option ${isDragging ? 'drag-active' : ''} ${uploading ? 'disabled' : ''}`}
          onClick={() => !uploading && fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="project-option-icon">
            {uploading ? <Loader2 size={30} className="animate-spin" /> : <UploadCloud size={30} />}
          </div>
          <span className="project-option-text">
            {uploading
              ? `Uploading... ${uploadProgress}%`
              : selectedFiles.length > 0
                ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
                : 'Drag & Drop or Browse Files'}
          </span>
          <span className="project-option-subtext">{getSupportedTypesText()}</span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="project-hidden-input"
            onChange={handleFileSelect}
            accept={getAcceptedTypes()}
            disabled={uploading}
          />
        </div>

        {/* Progress Bar */}
        {uploading && uploadProgress > 0 && (
          <div className="analysis-doc-progress-bar-container">
            <div className="analysis-doc-progress-bar" style={{ width: `${uploadProgress}%` }} />
          </div>
        )}

        {/* Selected Files List */}
        {selectedFiles.length > 0 && !uploading && (
          <div className="analysis-doc-file-list">
            {selectedFiles.map((file, index) => (
              <div key={index} className="analysis-doc-file-item">
                <div className="analysis-doc-file-info">
                  <FileText size={16} />
                  <span className="analysis-doc-file-name">{file.name}</span>
                  <span className="analysis-doc-file-size">
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </span>
                </div>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  className="analysis-doc-file-remove"
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {/* Bottom Actions */}
        <div className="project-actions">
          <button
            type="button"
            className="project-cancel-button"
            onClick={resetAndClose}
            disabled={uploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="project-create-button"
            disabled={uploading || selectedFiles.length === 0}
          >
            {uploading
              ? 'Uploading...'
              : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default AnalysisDocumentUploadDialog;
