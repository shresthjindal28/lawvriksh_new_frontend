'use client';

import React, { Dispatch, SetStateAction, useState, useEffect } from 'react';
import { X, ChevronDown, ChevronUp, Download, Mail, ArrowLeft } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { ExportOptions } from '@/types/project';
import { gmailService } from '@/lib/api/gmailService';
import { exportContentToDocx, exportContentToPdf } from '@/lib/utils/pdfExport';

export type ExportType =
  | 'assignment'
  | 'research_paper'
  | 'article'
  | 'scratch'
  | 'ideation'
  | 'draft';

export interface ExportDialogProps {
  exportType: ExportType;
  content: string;
  title: string;
  onExport?: (options: ExportOptions) => void | Promise<void>;
  isLoading?: boolean;
  setIsExportOpen?: Dispatch<SetStateAction<boolean>>;
  projectId?: string;
  citationStyle?: string;
}

import { useToast } from '@/lib/contexts/ToastContext';

const exportTypeConfig: Record<ExportType, { label: string; formats: Array<'pdf' | 'docx'> }> = {
  assignment: {
    label: 'Assignment',
    formats: ['docx', 'pdf'],
  },
  research_paper: {
    label: 'Research Paper',
    formats: ['docx', 'pdf'],
  },
  article: {
    label: 'Article',
    formats: ['docx', 'pdf'],
  },
  scratch: {
    label: 'Scratch',
    formats: ['docx', 'pdf'],
  },
  ideation: {
    label: 'Ideation',
    formats: ['docx', 'pdf'],
  },
  draft: {
    label: 'Legal Draft',
    formats: ['docx', 'pdf'],
  },
};

type ColorScheme = 'ACADEMIC' | 'PROFESSIONAL' | 'FORMAL' | 'NEUTRAL';
type PageSize = 'A4' | 'LETTER' | 'A3';
type ExportStep = 'config' | 'share';

export const ExportDialog: React.FC<ExportDialogProps> = ({
  exportType,
  content,
  title,
  onExport,
  isLoading: externalLoading,
  setIsExportOpen,
  projectId,
  citationStyle = 'bluebook',
}) => {
  const [exportStep, setExportStep] = useState<ExportStep>('config');
  const [exportResult, setExportResult] = useState<{
    blob: Blob;
    url: string;
    filename: string;
  } | null>(null);

  const [selectedFormat, setSelectedFormat] = useState<'pdf' | 'docx'>('docx');
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [includeCoverPage, setIncludeCoverPage] = useState(false);

  const [includePageNumbers, setIncludePageNumbers] = useState(true);
  const [includeToc, setIncludeToc] = useState(false);
  const [colorScheme, setColorScheme] = useState<ColorScheme>('ACADEMIC');
  const [fontFamily, setFontFamily] = useState('Times New Roman');
  const [lineHeight, setLineHeight] = useState(1.5);
  const [margins, setMargins] = useState(20);
  const [showAdvanced, setShowAdvanced] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();

  // Editable metadata fields
  const [documentTitle, setDocumentTitle] = useState(title || 'Untitled Document');
  const [authorName, setAuthorName] = useState('LawVriksh User');
  const [subject, setSubject] = useState('');

  const config = exportTypeConfig[exportType];
  const availableFormats = config.formats;

  // Sync title prop with documentTitle state
  useEffect(() => {
    if (title) {
      setDocumentTitle(title);
      setSubject(title);
    }
  }, [title]);

  useEffect(() => {
    if (!availableFormats.includes(selectedFormat)) {
      setSelectedFormat(availableFormats[0]);
    }
  }, [exportType, availableFormats, selectedFormat]);

  const handleExport = async () => {
    try {
      setIsLoading(true);
      const filename = `${documentTitle.replace(/[^a-z0-9]/gi, '_').toLowerCase()}`;

      if (selectedFormat === 'pdf') {
        const blob = await exportContentToPdf(content, `${filename}.pdf`, []);
        if (blob) {
          setExportResult({
            blob,
            url: URL.createObjectURL(blob),
            filename: `${filename}.pdf`,
          });
        }
        setExportStep('share');
        addToast('PDF exported successfully!', 'success');
      } else if (selectedFormat === 'docx') {
        const blob = await exportContentToDocx(content, `${filename}.docx`, []);
        if (blob) {
          setExportResult({
            blob,
            url: URL.createObjectURL(blob),
            filename: `${filename}.docx`,
          });
        }
        setExportStep('share');
        addToast('DOCX exported successfully!', 'success');
      }
    } catch (error) {
      console.error('Export failed:', error);
      addToast('Export failed. Please try again.', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = () => {
    if (exportResult) {
      const a = document.createElement('a');
      a.href = exportResult.url;
      a.download = exportResult.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      addToast('File downloaded successfully', 'success');
    } else {
      addToast('No file to download. Please export first.', 'warning');
    }
  };

  const handleEmail = async () => {
    if (exportResult) {
      await handleSendEmailWithAttachment(exportResult.blob, exportResult.filename);
    } else {
      addToast('No file to email. Please export first.', 'warning');
    }
  };

  /**
   * Fallback: Open Gmail compose window without attachment
   */
  const openGmailComposeFallback = (exportResult: { blob: Blob; filename: string } | null) => {
    // Download file for manual attachment
    if (exportResult) {
      const url = URL.createObjectURL(exportResult.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = exportResult.filename;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }

    const subject = `Document: ${documentTitle}`;
    const body = `Please find the document attached.\n\n(Note: Please manually attach the downloaded file)`;
    gmailService.openGmailCompose(subject, body);
  };

  /**
   * Send email with file attachment using Gmail API
   */
  const handleSendEmailWithAttachment = async (blob: Blob, filename: string) => {
    setIsLoading(true);
    addToast('Preparing email with attachment...', 'info', 3000);

    try {
      // Convert blob to base64
      const base64Data = await gmailService.blobToBase64(blob);

      // Prompt user for recipient email
      const recipientEmail = window.prompt('Enter recipient email address:', '');

      if (!recipientEmail) {
        addToast('Email cancelled - no recipient provided.', 'warning');
        setIsLoading(false);
        return;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(recipientEmail)) {
        addToast('Invalid email address format.', 'error');
        setIsLoading(false);
        return;
      }

      const emailSubject = `Document: ${documentTitle}`;
      const emailBody = `Please find the attached document: ${filename}`;

      // Send email with attachment
      const result = await gmailService.sendEmail({
        to: recipientEmail,
        subject: emailSubject,
        body: emailBody,
        attachments: [
          {
            filename: filename,
            mimeType: blob.type || 'application/octet-stream',
            data: base64Data,
          },
        ],
      });

      if (result.success) {
        addToast(`Email sent successfully to ${recipientEmail}!`, 'success', 5000);
      } else {
        console.error('Failed to send email:', result.error);

        // If auth expired, try to re-authenticate
        if (result.error?.includes('expired') || result.error?.includes('authenticate')) {
          gmailService.clearTokens();
          addToast('Gmail session expired. Please try again.', 'warning');
        } else {
          addToast(`Failed to send email: ${result.error}`, 'error');
        }
      }
    } catch (error) {
      console.error('Error sending email:', error);
      addToast('Failed to send email. Opening Gmail compose instead.', 'error');

      // Fallback to Gmail compose
      const subject = `Document: ${documentTitle}`;
      const body = `Please find the document attached.`;
      gmailService.openGmailCompose(subject, body);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="export-overlay">
      <AnimatePresence mode="wait">
        {exportStep === 'config' ? (
          <motion.div
            key="config"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.2 }}
            className="export-dialog export-dialog-enhanced"
          >
            <div className="export-header">
              <h2 className="export-title">Export Document</h2>
              <button
                className="export-close-btn"
                onClick={() => setIsExportOpen?.(false)}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
            <div className="export-divider"></div>

            <div className="export-content">
              {/* Document Title, Author, and Subject fields are hidden as per user request */}

              {/* Format Selection */}
              <div className="export-form-group">
                <label className="export-label">Format</label>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value as 'pdf' | 'docx')}
                  className="export-select"
                  disabled={isLoading || externalLoading}
                >
                  {availableFormats.map((format) => (
                    <option key={format} value={format}>
                      {format.toUpperCase()}
                    </option>
                  ))}
                </select>
              </div>

              {/* Page Size */}
              <div className="export-form-group">
                <label className="export-label">Page Size</label>
                <select
                  value={pageSize}
                  onChange={(e) => setPageSize(e.target.value as PageSize)}
                  className="export-select"
                  disabled={isLoading || externalLoading}
                >
                  <option value="A4">A4</option>
                  <option value="LETTER">Letter</option>
                  <option value="A3">A3</option>
                </select>
              </div>

              {/* Color Scheme */}
              <div className="export-form-group">
                <label className="export-label">Color Scheme</label>
                <select
                  value={colorScheme}
                  onChange={(e) => setColorScheme(e.target.value as ColorScheme)}
                  className="export-select"
                  disabled={isLoading || externalLoading}
                >
                  <option value="ACADEMIC">Academic</option>
                  <option value="PROFESSIONAL">Professional</option>
                  <option value="FORMAL">Formal</option>
                  <option value="NEUTRAL">Neutral</option>
                </select>
              </div>

              {/* Basic Toggles - Only shown for PDF format */}
              {selectedFormat === 'pdf' && (
                <>
                  <div className="export-toggle-group">
                    <label className="export-label">Include Cover Page</label>
                    <button
                      className={`export-toggle ${includeCoverPage ? 'export-toggle-active' : ''}`}
                      onClick={() => setIncludeCoverPage(!includeCoverPage)}
                      disabled={isLoading || externalLoading}
                      type="button"
                    >
                      <span className="export-toggle-slider"></span>
                    </button>
                  </div>

                  <div className="export-toggle-group">
                    <label className="export-label">Include Page Numbers</label>
                    <button
                      className={`export-toggle ${includePageNumbers ? 'export-toggle-active' : ''}`}
                      onClick={() => setIncludePageNumbers(!includePageNumbers)}
                      disabled={isLoading || externalLoading}
                      type="button"
                    >
                      <span className="export-toggle-slider"></span>
                    </button>
                  </div>

                  <div className="export-toggle-group">
                    <label className="export-label">Include Table of Contents</label>
                    <button
                      className={`export-toggle ${includeToc ? 'export-toggle-active' : ''}`}
                      onClick={() => setIncludeToc(!includeToc)}
                      disabled={isLoading || externalLoading}
                      type="button"
                    >
                      <span className="export-toggle-slider"></span>
                    </button>
                  </div>
                </>
              )}

              {/* Advanced Options Toggle */}
              <button
                className="export-advanced-toggle"
                onClick={() => setShowAdvanced(!showAdvanced)}
                type="button"
              >
                <span>Advanced Options</span>
                {showAdvanced ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
              </button>

              {/* Advanced Options Section */}
              {showAdvanced && (
                <div className="export-advanced-section">
                  {/* Font Family */}
                  <div className="export-form-group">
                    <label className="export-label">Font Family</label>
                    <select
                      value={fontFamily}
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="export-select"
                      disabled={isLoading || externalLoading}
                    >
                      <option value="Times New Roman">Times New Roman</option>
                      <option value="Arial">Arial</option>
                      <option value="Georgia">Georgia</option>
                      <option value="Helvetica">Helvetica</option>
                      <option value="Courier New">Courier New</option>
                    </select>
                  </div>

                  {/* Line Height */}
                  <div className="export-slider-group">
                    <div className="export-slider-header">
                      <label className="export-label">Line Height</label>
                      <span className="export-slider-value">{lineHeight}</span>
                    </div>
                    <input
                      type="range"
                      min="1.0"
                      max="2.5"
                      step="0.1"
                      value={lineHeight}
                      onChange={(e) => setLineHeight(parseFloat(e.target.value))}
                      className="export-slider"
                      disabled={isLoading || externalLoading}
                    />
                  </div>

                  {/* Margins */}
                  <div className="export-slider-group">
                    <div className="export-slider-header">
                      <label className="export-label">Margins (mm)</label>
                      <span className="export-slider-value">{margins}</span>
                    </div>
                    <input
                      type="range"
                      min="10"
                      max="50"
                      step="5"
                      value={margins}
                      onChange={(e) => setMargins(parseInt(e.target.value))}
                      className="export-slider"
                      disabled={isLoading || externalLoading}
                    />
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={handleExport}
              disabled={isLoading || externalLoading}
              className="export-create-button"
            >
              {isLoading ? 'Exporting...' : 'Export'}
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="share"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.2 }}
            className="export-dialog export-dialog-enhanced"
          >
            <div className="export-header">
              <button
                className="export-back-btn"
                onClick={() => setExportStep('config')}
                type="button"
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  padding: '4px',
                  display: 'flex',
                  alignItems: 'center',
                  marginRight: '8px',
                }}
              >
                <ArrowLeft size={24} color="#666" />
              </button>
              <h2 className="export-title" style={{ marginBottom: 0 }}>
                Share Document
              </h2>
              <button
                className="export-close-btn"
                onClick={() => setIsExportOpen?.(false)}
                type="button"
              >
                <X size={24} />
              </button>
            </div>
            <div className="export-divider" style={{ marginTop: '16px' }}></div>

            <div className="share-options-grid">
              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#333333' }}
                whileTap={{ scale: 0.98 }}
                className="share-option-btn"
                onClick={handleDownload}
              >
                <div className="share-icon-wrapper">
                  <Download size={24} color="#ffffff" />
                </div>
                <span className="share-label">Download</span>
              </motion.button>

              <motion.button
                whileHover={{ scale: 1.02, backgroundColor: '#333333' }}
                whileTap={{ scale: 0.98 }}
                className="share-option-btn"
                onClick={handleEmail}
              >
                <div className="share-icon-wrapper">
                  <Mail size={24} color="#ffffff" />
                </div>
                <span className="share-label">Email</span>
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
