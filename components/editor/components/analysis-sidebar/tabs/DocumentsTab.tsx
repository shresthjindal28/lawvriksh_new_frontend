'use client';

import {
  Search,
  Plus,
  FileText,
  ShieldCheck,
  MoreVertical,
  Eye,
  Download,
  Trash2,
  Clock,
} from 'lucide-react';
import type { AnalysisDocument } from '@/types/analysis-sidebar';
import VideoLoader from '@/components/ui/VideoLoader';
import { truncateText } from '../utils';

interface DocumentsTabProps {
  documentSearchQuery: string;
  setDocumentSearchQuery: React.Dispatch<React.SetStateAction<string>>;
  analysisDocuments: AnalysisDocument[];
  analysisDocsLoading: boolean;
  analysisDocsUploading: boolean;
  openMenuId: string | null;
  setOpenMenuId: React.Dispatch<React.SetStateAction<string | null>>;
  setIsAnalysisUploadOpen: React.Dispatch<React.SetStateAction<boolean>>;
  viewAnalysisDocument: (id: string) => Promise<string | null>;
  downloadAnalysisDocument: (id: string) => Promise<string | null>;
  deleteAnalysisDocument: (id: string) => Promise<boolean>;
  addToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

// File icon component
const FileIcon = ({ extension }: { extension: string }) => {
  const ext = extension.toLowerCase();

  if (ext === 'pdf') {
    return (
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path
          d="M12 0H2C0.9 0 0 0.9 0 2V22C0 23.1 0.9 24 2 24H18C19.1 24 20 23.1 20 22V8L12 0Z"
          fill="#E53935"
        />
        <path d="M12 0V8H20L12 0Z" fill="#FFCDD2" />
        <text x="10" y="18" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
          PDF
        </text>
      </svg>
    );
  } else if (ext === 'doc' || ext === 'docx') {
    return (
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path
          d="M12 0H2C0.9 0 0 0.9 0 2V22C0 23.1 0.9 24 2 24H18C19.1 24 20 23.1 20 22V8L12 0Z"
          fill="#2B579A"
        />
        <path d="M12 0V8H20L12 0Z" fill="#E8F1FF" />
        <text x="10" y="18" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
          DOC
        </text>
      </svg>
    );
  } else if (ext === 'txt') {
    return (
      <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
        <path
          d="M12 0H2C0.9 0 0 0.9 0 2V22C0 23.1 0.9 24 2 24H18C19.1 24 20 23.1 20 22V8L12 0Z"
          fill="#757575"
        />
        <path d="M12 0V8H20L12 0Z" fill="#E0E0E0" />
        <text x="10" y="18" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
          TXT
        </text>
      </svg>
    );
  }

  // Default file icon
  return (
    <svg width="20" height="24" viewBox="0 0 20 24" fill="none">
      <path
        d="M12 0H2C0.9 0 0 0.9 0 2V22C0 23.1 0.9 24 2 24H18C19.1 24 20 23.1 20 22V8L12 0Z"
        fill="#9E9E9E"
      />
      <path d="M12 0V8H20L12 0Z" fill="#EEEEEE" />
      <text x="10" y="18" textAnchor="middle" fill="white" fontSize="6" fontWeight="bold">
        FILE
      </text>
    </svg>
  );
};

export default function DocumentsTab({
  documentSearchQuery,
  setDocumentSearchQuery,
  analysisDocuments,
  analysisDocsLoading,
  analysisDocsUploading,
  openMenuId,
  setOpenMenuId,
  setIsAnalysisUploadOpen,
  viewAnalysisDocument,
  downloadAnalysisDocument,
  deleteAnalysisDocument,
  addToast,
}: DocumentsTabProps) {
  const handleDocumentMenuToggle = (id: string) => {
    setOpenMenuId(openMenuId === id ? null : id);
  };

  return (
    <div className="documents-content-wrapper">
      {/* Documents tab header */}
      <div className="documents-header">
        <div className="documents-search-box">
          <Search className="documents-search-icon" size={16} />
          <input
            type="text"
            placeholder="Search documents"
            value={documentSearchQuery}
            onChange={(e) => setDocumentSearchQuery(e.target.value)}
            className="documents-search-input"
          />
        </div>
        <button
          className="new-document-btn"
          onClick={() => setIsAnalysisUploadOpen(true)}
          disabled={analysisDocsUploading}
        >
          <Plus size={14} />
          New
        </button>
      </div>

      {/* Loading State */}
      {analysisDocsLoading && (
        <div className="documents-loading">
          <VideoLoader width={80} height={80} />
          <span>Loading documents...</span>
        </div>
      )}

      {/* Empty State */}
      {!analysisDocsLoading && analysisDocuments.length === 0 && (
        <div className="documents-empty-state">
          <FileText size={48} className="documents-empty-icon" />
          <p className="documents-empty-text">No documents uploaded yet</p>
          <p className="documents-empty-subtext">
            Upload reference documents or custom compliance rules
          </p>
          <button
            className="documents-empty-upload-btn"
            onClick={() => setIsAnalysisUploadOpen(true)}
          >
            <Plus size={16} />
            Upload Document
          </button>
        </div>
      )}

      {/* Documents List */}
      <div className="documents-list">
        {analysisDocuments
          .filter(
            (doc) =>
              documentSearchQuery === '' ||
              doc.fileName.toLowerCase().includes(documentSearchQuery.toLowerCase())
          )
          .map((doc) => (
            <div key={doc.id} className="document-row">
              <div className="document-row-left">
                <div className="document-icon">
                  <FileIcon extension={doc.fileName.split('.').pop() || ''} />
                </div>
                <div className="document-info">
                  <span className="document-name">{truncateText(doc.fileName, 22)}</span>
                  <div className="document-meta">
                    <span className={`document-type-tag ${doc.documentType}`}>
                      {doc.documentType === 'compliance' ? (
                        <>
                          <ShieldCheck size={10} />
                          Compliance
                        </>
                      ) : (
                        <>
                          <FileText size={10} />
                          General
                        </>
                      )}
                    </span>
                    {doc.status && doc.status !== 'completed' && (
                      <span className={`document-status-tag ${doc.status}`}>
                        {doc.status === 'processing' && <Clock size={10} />}
                        {doc.status}
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <div className="document-row-right">
                <span className="document-date">
                  {new Date(doc.createdAt).toLocaleDateString()}
                </span>
                <div className="document-menu-container">
                  <button
                    className="document-menu-btn"
                    onClick={() => handleDocumentMenuToggle(doc.id)}
                  >
                    <MoreVertical size={16} />
                  </button>
                  {openMenuId === doc.id && (
                    <div className="document-menu-dropdown">
                      <button
                        className="document-menu-item"
                        onClick={async () => {
                          const url = await viewAnalysisDocument(doc.id);
                          if (url) {
                            window.open(url, '_blank');
                          } else {
                            addToast('Could not get document URL', 'error');
                          }
                          setOpenMenuId(null);
                        }}
                      >
                        <Eye size={16} />
                        View file
                      </button>
                      <button
                        className="document-menu-item"
                        onClick={async () => {
                          const url = await downloadAnalysisDocument(doc.id);
                          if (url) {
                            const link = document.createElement('a');
                            link.href = url;
                            link.download = doc.fileName;
                            document.body.appendChild(link);
                            link.click();
                            document.body.removeChild(link);
                          } else {
                            addToast('Could not download document', 'error');
                          }
                          setOpenMenuId(null);
                        }}
                      >
                        <Download size={16} />
                        Download
                      </button>
                      <button
                        className="document-menu-item document-menu-item-delete"
                        onClick={async () => {
                          const success = await deleteAnalysisDocument(doc.id);
                          if (success) {
                            addToast('Document deleted successfully', 'success');
                          } else {
                            addToast('Failed to delete document', 'error');
                          }
                          setOpenMenuId(null);
                        }}
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
      </div>
    </div>
  );
}
