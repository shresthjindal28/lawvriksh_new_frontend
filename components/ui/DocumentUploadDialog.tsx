'use client';

import React, { useRef, useState, useCallback } from 'react';
import { UploadCloud, X } from 'lucide-react';
import Dialog from './Dialog';
import '@/styles/ui-styles/document-dialog.css';
import { useToast } from '@/lib/contexts/ToastContext';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { Document } from '@/types/library';

interface DocumentUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  uploadDocument?: (file: File, metadata?: Record<string, any>) => Promise<Document | null>;
  uploadMultipleDocuments?: (
    files: File[],
    metadata?: Record<string, any>
  ) => Promise<Document[] | null>;
}

const DocumentUploadDialog: React.FC<DocumentUploadDialogProps> = ({
  isOpen,
  onClose,
  uploadDocument,
  uploadMultipleDocuments,
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState<string>('');
  const [category, setCategory] = useState('');
  const { addToast } = useToast();

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

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      addToast('Please select at least one file.', 'error');
      return;
    }

    const supportedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain',
    ];
    const invalidFiles = selectedFiles.filter((file) => !supportedTypes.includes(file.type));

    if (invalidFiles.length > 0) {
      addToast('Only PDF, DOC, DOCX, and TXT files are allowed.', 'error');
      return;
    }

    const maxSize = 50 * 1024 * 1024; // 50MB
    const oversizedFiles = selectedFiles.filter((file) => file.size > maxSize);

    if (oversizedFiles.length > 0) {
      addToast('Some files exceed the 50MB limit.', 'error');
      return;
    }

    setIsUploading(true);

    try {
      const metadata = category ? { category } : undefined;

      // Use batch upload if multiple files and function available
      if (selectedFiles.length > 1 && uploadMultipleDocuments) {
        const uploaded = await uploadMultipleDocuments(selectedFiles, metadata);

        if (uploaded && uploaded.length > 0) {
          addToast(
            `${uploaded.length} document${uploaded.length > 1 ? 's' : ''} uploaded successfully!`,
            'success'
          );
          setSelectedFiles([]);
          setCategory('');
          onClose();
        } else {
          addToast('Failed to upload documents.', 'error');
        }
      }
      // Single file upload or fallback for multiple files
      else if (uploadDocument) {
        let successCount = 0;
        let failCount = 0;

        for (const file of selectedFiles) {
          try {
            const uploaded = await uploadDocument(file, metadata);
            if (uploaded) {
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
            `${successCount} document${successCount > 1 ? 's' : ''} uploaded successfully!`,
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
      } else {
        addToast('Upload function not available.', 'error');
      }
    } catch (err) {
      console.error('Upload error:', err);
      addToast('Failed to upload documents.', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      size="md"
      closable
      overlayClosable
      className="project-dialog"
    >
      <form
        className="document-form"
        onSubmit={(e) => {
          e.preventDefault();
          handleUpload();
        }}
      >
        <div className="project-input-group">
          <input
            type="text"
            placeholder="Enter Category (optional)..."
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="project-name-input"
          />
        </div>

        <div
          className={`project-upload-drag-drop project-upload-option ${isDragging ? 'drag-active' : ''}`}
          onClick={() => fileInputRef.current?.click()}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <div className="project-option-icon">
            <UploadCloud size={30} />
          </div>
          <span className="project-option-text">
            {selectedFiles.length > 0
              ? `${selectedFiles.length} file${selectedFiles.length > 1 ? 's' : ''} selected`
              : 'Drag & Drop or Browse Files'}
          </span>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            className="project-hidden-input"
            onChange={handleFileSelect}
            accept=".pdf"
          />
        </div>

        {selectedFiles.length > 0 && (
          <div
            style={{
              maxHeight: '150px',
              overflowY: 'auto',
              marginTop: '12px',
              padding: '8px',
              border: '1px solid #e0e0e0',
              borderRadius: '6px',
            }}
          >
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px',
                  marginBottom: '4px',
                  backgroundColor: '#f5f5f5',
                  borderRadius: '4px',
                }}
              >
                <span
                  style={{
                    fontSize: '14px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    flex: 1,
                  }}
                >
                  {file.name}
                </span>
                <span
                  style={{
                    fontSize: '12px',
                    color: '#666',
                    marginLeft: '8px',
                    marginRight: '8px',
                  }}
                >
                  {(file.size / 1024 / 1024).toFixed(2)} MB
                </span>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeFile(index);
                  }}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: '4px',
                    display: 'flex',
                    alignItems: 'center',
                  }}
                >
                  <X size={16} />
                </button>
              </div>
            ))}
          </div>
        )}

        {isUploading && (
          <div style={{ marginTop: '16px' }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginBottom: '4px',
                fontSize: '14px',
                color: '#666',
              }}
            >
              <span>{uploadStatus}</span>
              <span>{uploadProgress}%</span>
            </div>
            <div
              style={{
                width: '100%',
                height: '8px',
                backgroundColor: '#f0f0f0',
                borderRadius: '4px',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  width: `${uploadProgress}%`,
                  height: '100%',
                  backgroundColor: '#4caf50',
                  transition: 'width 0.3s ease',
                }}
              />
            </div>
          </div>
        )}

        {/* Warning / Validation */}
        {/* <div className="invalid-files-container">
                    <p className="project-warning">
                        Please upload PDF, DOC, DOCX, or TXT files under 50MB each
                    </p>
                </div> */}

        {/* Bottom Actions */}
        <div className="project-actions">
          <button
            type="button"
            className="project-cancel-button"
            onClick={onClose}
            disabled={isUploading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="project-create-button"
            disabled={isUploading || selectedFiles.length === 0}
          >
            {isUploading
              ? 'Uploading...'
              : `Upload ${selectedFiles.length > 0 ? `(${selectedFiles.length})` : ''}`}
          </button>
        </div>
      </form>
    </Dialog>
  );
};

export default DocumentUploadDialog;
