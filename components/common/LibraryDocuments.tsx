'use client';

import { useState, useCallback } from 'react';
import { Topbar } from '../layout/Topbar.client';
import { CircleMinus, Folder } from 'lucide-react';
import { useLibraryDocuments } from '@/hooks/common/useLibraryDocuments';
import { useToast } from '@/lib/contexts/ToastContext';
import VideoLoader from '../ui/VideoLoader';
import DocumentUploadDialog from '../ui/DocumentUploadDialog';
import { useAuth } from '@/lib/contexts/AuthContext';
import { ProjectCategory } from '@/types/project';
import StudentDialog from '../ui/StudentDialog';
import { useDialog } from '@/hooks/common/useDialog';
import { useWorkspace } from '@/lib/contexts/WorkspaceContext';

export default function LibraryDocuments() {
  const { documents, loading, error, pagination, uploadDocument, deleteDocument, getViewUrl } =
    useLibraryDocuments({
      autoFetch: true,
      initialParams: {
        page: 1,
        page_size: 20,
        status: 'completed', // Only show completed documents
      },
    });
  const { profile } = useAuth();
  const { isOpen, open, close } = useDialog();
  const { isCreating, createStudentProject } = useWorkspace();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { addToast } = useToast();
  const [category, setCategory] = useState<ProjectCategory>('ideation');

  const handleDelete = useCallback(
    async (id: string) => {
      const success = await deleteDocument(id, true); // true = delete from S3
      if (success) {
        addToast('Document deleted successfully', 'success');
      } else {
        addToast('Failed to delete document', 'error');
      }
    },
    [deleteDocument, addToast]
  );

  const handleDocumentClick = useCallback(
    async (id: string) => {
      try {
        const url = await getViewUrl(id);
        if (url) {
          window.open(url, '_blank');
        } else {
          addToast('Failed to get document URL', 'error');
        }
      } catch (err) {
        addToast('Failed to open document', 'error');
      }
    },
    [getViewUrl, addToast]
  );

  // Format date helper
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  if (loading)
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: '400px',
          gap: '16px',
        }}
      >
        <VideoLoader width={150} height={150} />
        <p style={{ color: '#6F7A8F', fontSize: '16px' }}>Loading Documents</p>
      </div>
    );

  return (
    <main className="main-container">
      <div className="page-wrapper">
        <section className="content-section">
          <Topbar
            mode="search"
            role={profile?.role}
            profileScore={profile?.profile_score || 0}
            onButtonClick={open}
          />
          <div className="main-content">
            <StudentDialog
              isOpen={isOpen}
              onClose={close}
              onSubmit={createStudentProject}
              isLoading={isCreating}
              category={category}
            />
            <div className="library-document-wrapper">
              <div className="document-header">
                <h1 className="page-title">Documents</h1>
                <button className="add-document" onClick={() => setIsDialogOpen(true)}>
                  Add Document
                </button>
              </div>
              <div className="header">
                <div className="headerCell">Document Name</div>
                <div className="headerCell">Last Edited</div>
                <div className="headerCellAction"></div>
              </div>
              <div className="documentList">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div key={doc.id} className="documentCard">
                      <button
                        className="documentInfo"
                        onClick={() => handleDocumentClick(doc.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '12px',
                          flex: 1,
                        }}
                      >
                        <div className="documentIcon">
                          <Folder size={20} color="black" />
                        </div>
                        <div className="documentName">{doc.file_name}</div>
                      </button>

                      <div className="lastEdited">
                        <span className="lastEditedDate">
                          {formatDate(doc.uploaded_at || doc.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="deleteButton"
                        aria-label="Delete document"
                      >
                        <CircleMinus size={26} color="#ef4444" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="no-items-container">
                    <h2>No Documents Found</h2>
                    <p>Start uploading your first document</p>
                  </div>
                )}
              </div>
              <DocumentUploadDialog
                isOpen={isDialogOpen}
                onClose={() => setIsDialogOpen(false)}
                uploadDocument={uploadDocument}
              />
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}
