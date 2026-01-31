'use client';

import React, { useState } from 'react';
import { Plus, FileText, Search, Filter, ChevronDown } from 'lucide-react';
import { AnalysisDocument, DocumentType } from '@/types/analysisDocument';
import AnalysisDocumentCard from './AnalysisDocumentCard';
import VideoLoader from './VideoLoader';

interface AnalysisDocumentListProps {
  documents: AnalysisDocument[];
  isLoading: boolean;
  error: string | null;
  onUploadClick: () => void;
  onView: (id: string) => void;
  onDownload: (id: string) => void;
  onRename?: (id: string) => void;
  onDelete: (id: string) => void;
  actioningDocId?: string | null;
}

const AnalysisDocumentList: React.FC<AnalysisDocumentListProps> = ({
  documents,
  isLoading,
  error,
  onUploadClick,
  onView,
  onDownload,
  onRename,
  onDelete,
  actioningDocId,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<DocumentType | 'all'>('all');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Filter documents
  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch = doc.fileName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = typeFilter === 'all' || doc.documentType === typeFilter;
    return matchesSearch && matchesType;
  });

  const filterOptions: { value: DocumentType | 'all'; label: string }[] = [
    { value: 'all', label: 'All Documents' },
    { value: 'general', label: 'General' },
    { value: 'compliance', label: 'Compliance' },
  ];

  const selectedFilter = filterOptions.find((f) => f.value === typeFilter);

  if (isLoading) {
    return (
      <div className="analysis-doc-list-loading">
        <VideoLoader width={100} height={100} />
        <span>Loading documents...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="analysis-doc-list-error">
        <span>{error}</span>
      </div>
    );
  }

  return (
    <div className="analysis-doc-list">
      {/* Header with Search and Filter */}
      <div className="analysis-doc-list-header">
        <div className="analysis-doc-list-search">
          <Search size={16} className="analysis-doc-list-search-icon" />
          <input
            type="text"
            placeholder="Search documents..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="analysis-doc-list-search-input"
          />
        </div>

        <div className="analysis-doc-list-filter">
          <button
            className="analysis-doc-list-filter-btn"
            onClick={() => setIsFilterOpen(!isFilterOpen)}
          >
            <Filter size={14} />
            <span>{selectedFilter?.label}</span>
            <ChevronDown size={14} className={isFilterOpen ? 'rotated' : ''} />
          </button>

          {isFilterOpen && (
            <div className="analysis-doc-list-filter-dropdown">
              {filterOptions.map((option) => (
                <button
                  key={option.value}
                  className={`analysis-doc-list-filter-option ${typeFilter === option.value ? 'active' : ''}`}
                  onClick={() => {
                    setTypeFilter(option.value);
                    setIsFilterOpen(false);
                  }}
                >
                  {option.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <button className="analysis-doc-list-upload-btn" onClick={onUploadClick}>
          <Plus size={16} />
          <span>Upload</span>
        </button>
      </div>

      {/* Document List */}
      {filteredDocuments.length === 0 ? (
        <div className="analysis-doc-list-empty">
          <FileText size={48} className="analysis-doc-list-empty-icon" />
          <h3>No documents found</h3>
          <p>
            {searchQuery || typeFilter !== 'all'
              ? 'Try adjusting your search or filter'
              : 'Upload your first document to get started'}
          </p>
          {!searchQuery && typeFilter === 'all' && (
            <button className="analysis-doc-list-empty-btn" onClick={onUploadClick}>
              <Plus size={16} />
              <span>Upload Document</span>
            </button>
          )}
        </div>
      ) : (
        <div className="analysis-doc-list-items">
          {filteredDocuments.map((doc) => (
            <AnalysisDocumentCard
              key={doc.id}
              doc={doc}
              onView={onView}
              onDownload={onDownload}
              onRename={onRename}
              onDelete={onDelete}
              isActioning={actioningDocId === doc.id}
            />
          ))}
        </div>
      )}

      {/* Document Count */}
      {filteredDocuments.length > 0 && (
        <div className="analysis-doc-list-footer">
          <span>
            {filteredDocuments.length} document{filteredDocuments.length !== 1 ? 's' : ''}
            {typeFilter !== 'all' && ` (${typeFilter})`}
          </span>
        </div>
      )}
    </div>
  );
};

export default AnalysisDocumentList;
