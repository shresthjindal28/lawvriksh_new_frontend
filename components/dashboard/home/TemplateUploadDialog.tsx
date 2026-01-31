'use client';

import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Upload, FileText, CheckCircle, AlertCircle } from 'lucide-react';
import { draftingTemplateService } from '@/lib/api/draftingTemplateService';
import { FetchClient } from '@/lib/api/fetchClient';

// Tailwind class mappings (converted from CSS Module)
const styles = {
  overlay: 'fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4 backdrop-blur-sm',
  modal: 'bg-white rounded-2xl w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl',
  header: 'flex items-center justify-between p-4 border-b border-gray-100',
  headerLeft: 'flex items-center gap-3',
  iconContainer: 'w-8 h-8 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600',
  title: 'text-lg font-semibold text-gray-900',
  closeButton:
    'p-2 rounded-lg hover:bg-gray-100 text-gray-500 hover:text-gray-700 transition-colors',
  subtitle: 'px-4 py-3 text-sm text-gray-600',
  footer: 'flex items-center justify-end gap-3 p-4 border-t border-gray-100',
  secondaryButton:
    'px-4 py-2 text-sm text-gray-700 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors',
  primaryButton: 'px-4 py-2 text-sm font-medium rounded-lg transition-colors',
  primaryButtonEnabled: 'bg-gray-900 text-white hover:bg-gray-800',
  primaryButtonDisabled: 'bg-gray-300 text-gray-500 cursor-not-allowed',
};

interface TemplateUploadDialogProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  language: string;
  onSuccess: (templateId: string) => void;
}

export default function TemplateUploadDialog({
  isOpen,
  onClose,
  projectName,
  language,
  onSuccess,
}: TemplateUploadDialogProps) {
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      const allowedTypes = [
        'application/pdf',
        'application/msword',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ];

      if (!allowedTypes.includes(selectedFile.type)) {
        setError('Please upload only PDF or Word documents (.pdf, .doc, .docx)');
        return;
      }

      setFile(selectedFile);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setIsUploading(true);
    setError(null);
    setUploadProgress(0);

    try {
      // 1. Initialize Upload
      const initRes = await draftingTemplateService.initUpload({
        title: projectName || file.name.split('.')[0],
        language: language === 'English' ? 'en' : language.toLowerCase().substring(0, 2),
        doc_type: 'Draft', // Default doc type
        category: 'Legal', // Default category
        file_name: file.name,
        file_size: file.size,
        file_type: file.type,
        is_public: false, // Always set to false
      });

      if (
        !initRes.success ||
        !initRes.data ||
        !initRes.data.upload_url ||
        !initRes.data.template_id ||
        !initRes.data.s3_key
      ) {
        throw new Error(initRes.message || 'Failed to initialize upload');
      }

      const { upload_url, template_id, s3_key } = initRes.data;

      // 2. Upload to S3
      await FetchClient.upload({
        url: upload_url,
        file: file,
        signal: new AbortController().signal,
        onProgress: (progress) => setUploadProgress(progress),
        isS3: true,
        method: 'PUT',
      });

      // 3. Complete Upload
      const completeRes = await draftingTemplateService.completeUpload({
        template_id,
        s3_key,
      });

      if (!completeRes.success) {
        throw new Error(completeRes.message || 'Failed to complete upload');
      }

      onSuccess(template_id);
    } catch (err: any) {
      console.error('Upload error:', err);
      setError(err.message || 'An error occurred during upload');
    } finally {
      setIsUploading(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className={styles.overlay}
        style={{ zIndex: 1100 }}
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className={styles.modal}
          style={{ maxWidth: '500px' }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.header}>
            <div className={styles.headerLeft}>
              <div className={styles.iconContainer}>
                <Upload size={16} />
              </div>
              <h2 className={styles.title}>Upload Your Draft</h2>
            </div>
            <button onClick={onClose} className={styles.closeButton} disabled={isUploading}>
              <X size={20} />
            </button>
          </div>

          <div style={{ padding: '20px' }}>
            <p className={styles.subtitle} style={{ marginBottom: '20px' }}>
              Upload your own document as a template for this project.
            </p>

            <div
              onClick={() => !isUploading && fileInputRef.current?.click()}
              style={{
                border: '2px dashed #e2e8f0',
                borderRadius: '12px',
                padding: '40px 20px',
                textAlign: 'center',
                cursor: isUploading ? 'not-allowed' : 'pointer',
                backgroundColor: file ? '#f8fafc' : 'transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileChange}
                accept=".pdf,.doc,.docx"
                style={{ display: 'none' }}
              />

              {file ? (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <FileText size={48} color="#64748b" style={{ marginBottom: '12px' }} />
                  <p style={{ fontWeight: 500, color: '#1e293b', marginBottom: '4px' }}>
                    {file.name}
                  </p>
                  <p style={{ fontSize: '12px', color: '#64748b' }}>
                    {(file.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <Upload size={48} color="#cbd5e1" style={{ marginBottom: '12px' }} />
                  <p style={{ fontWeight: 500, color: '#475569', marginBottom: '4px' }}>
                    Click to upload or drag and drop
                  </p>
                  <p style={{ fontSize: '12px', color: '#94a3b8' }}>
                    PDF, DOC, or DOCX (max. 10MB)
                  </p>
                </div>
              )}
            </div>

            {isUploading && (
              <div style={{ marginTop: '20px' }}>
                <div
                  style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}
                >
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                    Uploading...
                  </span>
                  <span style={{ fontSize: '14px', fontWeight: 500, color: '#475569' }}>
                    {uploadProgress}%
                  </span>
                </div>
                <div
                  style={{
                    width: '100%',
                    height: '8px',
                    backgroundColor: '#f1f5f9',
                    borderRadius: '4px',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      width: `${uploadProgress}%`,
                      height: '100%',
                      backgroundColor: '#3b82f6',
                      transition: 'width 0.2s ease',
                    }}
                  />
                </div>
              </div>
            )}

            {error && (
              <div
                style={{
                  marginTop: '16px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  color: '#ef4444',
                  backgroundColor: '#fef2f2',
                  padding: '12px',
                  borderRadius: '8px',
                }}
              >
                <AlertCircle size={18} />
                <span style={{ fontSize: '14px' }}>{error}</span>
              </div>
            )}
          </div>

          <div
            className={styles.footer}
            style={{ borderTop: '1px solid #f1f5f9', padding: '16px 20px' }}
          >
            <button
              onClick={onClose}
              className={styles.secondaryButton}
              disabled={isUploading}
              style={{ marginRight: '12px' }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={!file || isUploading}
              className={`${styles.primaryButton} ${
                file && !isUploading ? styles.primaryButtonEnabled : styles.primaryButtonDisabled
              }`}
            >
              {isUploading ? 'Uploading...' : 'Upload Draft'}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
