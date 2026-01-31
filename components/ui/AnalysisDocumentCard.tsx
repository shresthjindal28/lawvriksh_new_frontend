'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  FileText,
  ShieldCheck,
  MoreVertical,
  Eye,
  Download,
  Pencil,
  Trash2,
  Loader2,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from 'lucide-react';
import { AnalysisDocument } from '@/types/analysisDocument';

interface AnalysisDocumentCardProps {
  doc: AnalysisDocument;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete: (id: string) => void;
  isActioning?: boolean;
}

const AnalysisDocumentCard: React.FC<AnalysisDocumentCardProps> = ({
  doc,
  onView,
  onDownload,
  onRename,
  onDelete,
  isActioning = false,
}) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isMenuOpen]);

  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const getStatusIcon = () => {
    switch (doc.status) {
      case 'pending':
      case 'uploaded':
        return <Clock size={14} className="text-yellow-500" />;
      case 'processing':
        return <Loader2 size={14} className="text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle size={14} className="text-green-500" />;
      case 'failed':
        return <XCircle size={14} className="text-red-500" />;
      default:
        return <AlertCircle size={14} className="text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (doc.status) {
      case 'pending':
        return 'Pending';
      case 'uploaded':
        return 'Uploaded';
      case 'processing':
        return 'Processing';
      case 'completed':
        return 'Ready';
      case 'failed':
        return 'Failed';
      default:
        return doc.status;
    }
  };

  const getDocumentIcon = () => {
    // Red PDF icon for all document types
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
  };

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsMenuOpen(!isMenuOpen);
  };

  const handleAction = (action: () => void) => {
    setIsMenuOpen(false);
    action();
  };

  return (
    <div className="analysis-doc-card">
      {/* Document Icon */}
      <div className="analysis-doc-card-icon">{getDocumentIcon()}</div>

      {/* Document Info */}
      <div className="analysis-doc-card-content">
        <div className="analysis-doc-card-header">
          <span className="analysis-doc-card-name" title={doc.fileName}>
            {doc.fileName}
          </span>
          <span className={`analysis-doc-card-type-badge ${doc.documentType}`}>
            {doc.documentType === 'compliance' ? 'Compliance' : 'General'}
          </span>
        </div>

        <div className="analysis-doc-card-meta">
          <span className="analysis-doc-card-size">{formatFileSize(doc.fileSize)}</span>
          <span className="analysis-doc-card-separator">•</span>
          <span className="analysis-doc-card-date">{formatDate(doc.createdAt)}</span>
          <span className="analysis-doc-card-separator">•</span>
          <span className="analysis-doc-card-status">
            {getStatusIcon()}
            <span>{getStatusText()}</span>
          </span>
        </div>
      </div>

      {/* Actions Menu */}
      <div className="analysis-doc-card-actions" ref={menuRef}>
        <button
          className="analysis-doc-card-menu-btn"
          onClick={handleMenuClick}
          disabled={isActioning}
        >
          {isActioning ? (
            <Loader2 size={16} className="animate-spin" />
          ) : (
            <MoreVertical size={16} />
          )}
        </button>

        {isMenuOpen && (
          <div className="analysis-doc-card-dropdown">
            <button
              className="analysis-doc-card-dropdown-item"
              onClick={() => handleAction(() => onView(doc.id))}
            >
              <Eye size={14} />
              <span>View</span>
            </button>

            <button
              className="analysis-doc-card-dropdown-item"
              onClick={() => handleAction(() => onDownload(doc.id))}
            >
              <Download size={14} />
              <span>Download</span>
            </button>

            {onRename && doc.documentType === 'general' && (
              <button
                className="analysis-doc-card-dropdown-item"
                onClick={() => handleAction(() => onRename(doc.id))}
              >
                <Pencil size={14} />
                <span>Rename</span>
              </button>
            )}

            <div className="analysis-doc-card-dropdown-divider" />

            <button
              className="analysis-doc-card-dropdown-item danger"
              onClick={() => handleAction(() => onDelete(doc.id))}
            >
              <Trash2 size={14} />
              <span>Delete</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default AnalysisDocumentCard;
