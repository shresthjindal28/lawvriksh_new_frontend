'use client';

import { Folder, FolderPlus, Plus } from 'lucide-react';
import DocumentUploadDialog from '../ui/DocumentUploadDialog';
import { useState, useCallback } from 'react';
import { useLibraryDocuments } from '@/hooks/common/useLibraryDocuments';
import { Document } from '@/types/library';
import { useToast } from '@/lib/contexts/ToastContext';
import { Skeleton } from '@/components/ui/skeleton';

interface DocumentSidebarProps {
  projectId: string;
  projectDocuments?: Document[];
  documentsLoading: boolean;
}

export default function DocumentSidebar({
  projectId,
  projectDocuments,
  documentsLoading,
}: DocumentSidebarProps) {
  const [isOpen, setIsOpen] = useState(false);
  const { uploadDocument, uploadMultipleDocuments, getViewUrl } = useLibraryDocuments();
  const { addToast } = useToast();

  const handleDocumentClick = useCallback(
    async (documentId: string, fileName: string) => {
      try {
        const url = await getViewUrl(documentId);
        if (url) window.open(url, '_blank');
        else addToast(`Failed to open ${fileName}`, 'error');
      } catch (err) {
        addToast(`Failed to open ${fileName}`, 'error');
        console.error('Error opening document:', err);
      }
    },
    [getViewUrl, addToast]
  );

  const handleUpload = useCallback(
    async (file: File, metadata?: Record<string, any>) => {
      const projectMetadata = { ...metadata, project_id: projectId, source: 'project_upload' };
      return await uploadDocument(file, projectMetadata);
    },
    [uploadDocument, projectId]
  );

  const handleMultipleUpload = useCallback(
    async (files: File[], metadata?: Record<string, any>) => {
      const projectMetadata = { ...metadata, project_id: projectId, source: 'project_upload' };
      return await uploadMultipleDocuments(files, projectMetadata);
    },
    [uploadMultipleDocuments, projectId]
  );

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, doc: Document) => {
    const payload = {
      id: doc.id,
      title: doc.file_name,
      link: doc.file_name || '',
      source: 'User Added Document',
      type: doc.file_type || 'document',
      citationType: 'document',
      documentId: doc.id,
      fileName: doc.file_name,
      fileType: doc.file_type,
    };

    e.dataTransfer.setData('application/x-citation-data', JSON.stringify(payload));

    e.dataTransfer.effectAllowed = 'copyMove';

    e.dataTransfer.setData('text/x-citation', 'true');

    e.currentTarget.classList.add('dragging');
    e.dataTransfer.setDragImage(e.currentTarget, 20, 20);
    console.log('Drag and drop listeners added');
  };
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('dragging');
  };

  return (
    <aside className="document-sidebar" aria-label="Project documents">
      <header className="sidebar-header">
        <div className="sidebar-title">
          <FolderPlus size={18} color="black" />
          <span>Documents</span>
        </div>
        <button
          type="button"
          className="add-btn"
          aria-label="Add document"
          onClick={() => setIsOpen(true)}
        >
          <Plus size={14} strokeWidth={2} />
          <span>Add</span>
        </button>
      </header>

      <ul className="document-list">
        {documentsLoading ? (
          <>
            {[1, 2, 3].map((n) => (
              <li key={n} className="document-list-item" aria-hidden="true">
                <div
                  className="document-item"
                  style={{ display: 'flex', gap: '8px', alignItems: 'center' }}
                >
                  <Skeleton className="h-4 w-4 rounded-sm" />
                  <Skeleton className="h-4 flex-1" />
                </div>
              </li>
            ))}
          </>
        ) : projectDocuments?.length ? (
          projectDocuments.map((doc) => (
            <li key={doc.id} className="document-list-item">
              <div
                className="document-item"
                title={doc.file_name}
                draggable
                onDragStart={(e) => handleDragStart(e, doc)}
                onDragEnd={handleDragEnd}
                onClick={() => handleDocumentClick(doc.id, doc.file_name)}
              >
                <Folder size={15} strokeWidth={1.6} />
                <span className="document-name">{doc.file_name}</span>
              </div>
            </li>
          ))
        ) : (
          <li className="document-list-item">
            <button
              type="button"
              className="document-item"
              aria-label="Add document"
              onClick={() => setIsOpen(true)}
            >
              <FolderPlus size={15} strokeWidth={1.6} />
              <span className="document-name">Add Document</span>
            </button>
          </li>
        )}
      </ul>

      <DocumentUploadDialog
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        uploadDocument={handleUpload}
        uploadMultipleDocuments={handleMultipleUpload}
      />
    </aside>
  );
}
