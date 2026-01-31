'use client';

import { useRef, useState } from 'react';
import '@/styles/reference-manager/unified-dialog.css';
import { FileUp } from 'lucide-react';
import { primeNotificationSound } from '@/lib/utils/notificationSound';
import { useSettings } from '@/lib/contexts/SettingsContext';

export default function UnifiedUploadDialog(props: {
  open: boolean;
  onClose: () => void;
  uploadMode: 'file' | 'url' | 'ai' | 'image';
  onUploadFile?: (file: File, referenceType?: number) => Promise<void> | void;
  onUploadUrls?: (urls: string[], referenceType?: number) => Promise<void> | void;
  onAutoAnnotate?: (query: string) => Promise<void> | void;
  onUploadImage?: (file: File, referenceId?: string) => Promise<void> | void;
  progress?: number | null;
  status?: string;
}) {
  const { open, onClose, uploadMode, onUploadFile, onUploadUrls, onAutoAnnotate, onUploadImage } =
    props;
  const [file, setFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [urlInput, setUrlInput] = useState('');
  const [aiPrompt, setAiPrompt] = useState('');
  const { settings } = useSettings();

  if (!open) return null;

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);

    const droppedFile = e.dataTransfer.files?.[0];
    if (droppedFile) {
      setFile(droppedFile);
    }
  };

  const isImageFile = (selectedFile: File) => {
    if (selectedFile.type && selectedFile.type.startsWith('image/')) return true;
    const ext = selectedFile.name.split('.').pop()?.toLowerCase();
    return (
      typeof ext === 'string' && ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp', 'svg'].includes(ext)
    );
  };

  const handleUploadClick = () => {
    void primeNotificationSound(settings.notifications.soundChoice);
    if (uploadMode === 'file' && onUploadFile && file) {
      if (isImageFile(file) && onUploadImage) {
        void Promise.resolve(onUploadImage(file));
      } else {
        void Promise.resolve(onUploadFile(file));
      }
      onClose();
      return;
    }

    if (uploadMode === 'image' && onUploadImage && file) {
      void Promise.resolve(onUploadImage(file));
      onClose();
      return;
    }

    if (uploadMode === 'url' && onUploadUrls && urlInput.trim()) {
      const urls = urlInput
        .split(/[,\s]+/)
        .map((u) => u.trim())
        .filter(Boolean);
      if (!urls.length) return;

      void Promise.resolve(onUploadUrls(urls));
      onClose();
      return;
    }

    if (uploadMode === 'ai' && onAutoAnnotate && aiPrompt.trim()) {
      void Promise.resolve(onAutoAnnotate(aiPrompt));
      onClose();
      return;
    }

    onClose();
  };

  return (
    <div className="dialogOverlay">
      <div className="dialogContainer">
        <div className="dialogHeader">
          <h3 className="dialogTitle">
            {uploadMode === 'file'
              ? 'Upload file or image'
              : uploadMode === 'image'
                ? 'Upload image'
                : uploadMode === 'url'
                  ? 'Upload URL'
                  : 'Auto-annotation'}
          </h3>

          <button className="closeBtn" onClick={onClose}>
            ×
          </button>
        </div>

        {(uploadMode === 'file' || uploadMode === 'image') && (
          <div className="dialogBody" onClick={() => fileInputRef.current?.click()}>
            <div
              className={`fileUploadBox ${isDragging ? 'dragActive' : ''}`}
              onDragOver={(e) => {
                e.preventDefault();
                if (!isDragging) setIsDragging(true);
              }}
              onDragLeave={(e) => {
                e.preventDefault();
                setIsDragging(false);
              }}
              onDrop={handleDrop}
            >
              {file ? (
                <p className="uploadText">{file.name}</p>
              ) : (
                <>
                  <FileUp size={24} />

                  <p className="uploadText">Click to upload or drag files or images</p>
                </>
              )}
            </div>
            <input
              ref={fileInputRef}
              style={{ display: 'none' }}
              type="file"
              accept={uploadMode === 'image' ? 'image/*' : 'image/*,.pdf'}
              onChange={(e) => {
                const selectedFile = e.target.files?.[0];
                if (selectedFile) {
                  setFile(selectedFile);
                }
              }}
            />
          </div>
        )}

        {/* URL MODE */}
        {uploadMode === 'url' && (
          <div className="dialogBody">
            <input
              type="text"
              className="urlInput"
              placeholder="Enter URL"
              value={urlInput}
              onChange={(e) => setUrlInput(e.target.value)}
            />
          </div>
        )}

        {uploadMode === 'ai' && (
          <div className="dialogBody">
            <p className="dialogSubtitle">
              Tell the system what to annotate in this PDF. Be specific — the clearer the prompt,
              the better the results.
            </p>
            <textarea
              className="aiInput"
              placeholder="e.g. Highlight all legal citations and case names. Tag parties (Plaintiff/Defendant)"
              value={aiPrompt}
              onChange={(e) => setAiPrompt(e.target.value)}
            />
            <p className="aiInputNote">Minimum 50 Characters</p>
          </div>
        )}

        {/* FOOTER */}
        <div className="dialogFooter">
          <button className="cancelBtn" onClick={onClose}>
            Cancel
          </button>

          <button
            className="uploadBtnDialog"
            onClick={handleUploadClick}
            disabled={
              ((uploadMode === 'file' || uploadMode === 'image') && !file) ||
              (uploadMode === 'url' && !urlInput.trim())
            }
          >
            {uploadMode === 'ai' ? 'Auto-annotate' : 'Upload'}
          </button>
        </div>
      </div>
    </div>
  );
}
