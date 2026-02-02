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
      <div className="flex flex-col items-center justify-center min-h-[400px] gap-4">
        <VideoLoader width={150} height={150} />
        <p className="text-[#6F7A8F] text-base">Loading Documents</p>
      </div>
    );

  return (
    <main className="min-h-screen w-full">
      <div className="m-0 flex min-h-screen max-w-full">
        <section className="flex flex-col flex-1">
          <Topbar
            mode="search"
            role={profile?.role}
            profileScore={profile?.profile_score || 0}
            onButtonClick={open}
          />
          <div className="flex-1 p-4 sm:p-6 md:p-8">
            <StudentDialog
              isOpen={isOpen}
              onClose={close}
              onSubmit={createStudentProject}
              isLoading={isCreating}
              category={category}
            />
            <div className="m-0 mt-6 w-full max-w-full md:mt-8 md:max-w-[900px]">
              <div className="flex justify-between items-center mb-6 flex-wrap gap-4 md:mb-6 md:gap-4">
                <h1 className="font-[family-name:var(--font-playfair),serif] text-2xl font-medium text-black border-b border-[#d0d0d0] pb-4 w-full max-w-full sm:text-[1.75rem] sm:pb-6 sm:max-w-[350px] md:text-3xl md:pb-[1.7rem] md:w-[350px]">
                  Documents
                </h1>
                <button
                  className="p-2.5 rounded-[5px] border border-[#e0e0e0] bg-transparent transition-all duration-200 cursor-pointer hover:bg-[#f5f5f5] hover:border-[#d0d0d0]"
                  onClick={() => setIsDialogOpen(true)}
                >
                  Add Document
                </button>
              </div>
              <div className="hidden md:grid md:grid-cols-[1fr_1fr_60px] md:p-[12px_22px] items-center p-[12px_16px] bg-[#e8e8ec] rounded-t-lg font-medium text-gray-500">
                <div className="flex items-center text-sm text-black md:text-base">
                  Document Name
                </div>
                <div className="flex items-center text-sm text-black md:text-base">Last Edited</div>
                <div className="hidden md:flex"></div>
              </div>
              <div className="bg-white">
                {documents.length > 0 ? (
                  documents.map((doc) => (
                    <div
                      key={doc.id}
                      className="grid grid-cols-[2fr_1fr] items-start gap-3 p-3.5 rounded-lg mb-2.5 bg-white shadow-[0_1px_3px_rgba(0,0,0,0.08)] transition-colors duration-200 hover:bg-[#f9fafb] md:grid-cols-[1fr_1fr_60px] md:items-center md:p-[16px_22px] md:rounded-none md:mb-0 md:border-b md:border-[#d0d0d0] md:shadow-none"
                    >
                      <button
                        className="flex items-center gap-2 text-left bg-none border-none cursor-pointer w-full sm:gap-2.5"
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
                        <div className="flex items-center justify-center">
                          <Folder size={20} color="black" />
                        </div>
                        <div className="text-sm font-medium text-gray-800 break-all sm:text-base">
                          {doc.file_name}
                        </div>
                      </button>

                      <div className="hidden flex-col items-start justify-center text-sm md:flex md:text-[15px]">
                        <span className="font-medium text-gray-800">
                          {formatDate(doc.uploaded_at || doc.created_at)}
                        </span>
                      </div>

                      <button
                        onClick={() => handleDelete(doc.id)}
                        className="bg-transparent border-none cursor-pointer p-1.5 flex items-center justify-center rounded transition-colors duration-200 hover:bg-red-500/10 sm:p-2"
                        aria-label="Delete document"
                      >
                        <CircleMinus size={26} color="#ef4444" />
                      </button>
                    </div>
                  ))
                ) : (
                  <div className="text-center p-[2rem_1rem] text-[#666] sm:p-[3rem_1.5rem]">
                    <h2 className="mb-2 text-lg sm:text-xl">No Documents Found</h2>
                    <p className="text-sm text-[#999]">Start uploading your first document</p>
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
