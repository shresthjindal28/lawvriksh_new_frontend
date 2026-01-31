import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Search, ChevronRight, Eye } from 'lucide-react';
import VideoLoader from '@/components/ui/VideoLoader';
import { draftingTemplateService } from '@/lib/api/draftingTemplateService';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { useToast } from '@/lib/contexts/ToastContext';
import { useQuery } from '@tanstack/react-query';
import styles from './TemplateLibraryModal.module.css';
import type { APIResponse } from '@/types/auth';
import type { PublicPreviewDocumentResponse } from '@/types/reference-manager-api';

const normalizeApiErrorMessage = (error?: string | { message?: string; detail?: string }) =>
  typeof error === 'string' ? error : error?.message || error?.detail || '';

// --- Types ---
interface Template {
  id: string;
  title: string;
  doc_type: string;
  category: string;
  tags: string[];
  s3_key?: string;
  thumbnail?: string;
}

type TemplatePreviewResponse = APIResponse<PublicPreviewDocumentResponse> &
  Partial<PublicPreviewDocumentResponse>;

interface TemplateLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (template: Template) => void;
  onCancel: () => void;
}

// Debounce hook for search
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    console.log('[TemplateLibraryModal] useDebounce - value changed:', {
      value,
      timestamp: new Date().toISOString(),
    });

    const handler = setTimeout(() => {
      console.log('[TemplateLibraryModal] useDebounce - setting debounced value:', {
        debouncedValue: value,
        timestamp: new Date().toISOString(),
      });
      setDebouncedValue(value);
    }, delay);

    return () => {
      console.log('[TemplateLibraryModal] useDebounce - clearing timeout');
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default function TemplateLibraryModal({
  isOpen,
  onClose,
  onSelect,
  onCancel,
}: TemplateLibraryModalProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null);
  const [previewingTemplateId, setPreviewingTemplateId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const { addToast } = useToast();

  // Debounce search query (500ms delay)
  const debouncedSearchQuery = useDebounce(searchQuery, 500);

  console.log('[TemplateLibraryModal] Component render:', {
    isOpen,
    searchQuery,
    debouncedSearchQuery,
    currentPage,
    selectedTemplateId,
    timestamp: new Date().toISOString(),
  });

  // Track previous search query to detect changes
  const [prevSearchQuery, setPrevSearchQuery] = useState(debouncedSearchQuery);

  // Derive effective page - resets to 1 when search query changes
  let effectivePage = currentPage;

  if (prevSearchQuery !== debouncedSearchQuery) {
    const shouldReset = prevSearchQuery !== ''; // Don't reset on initial mount
    setPrevSearchQuery(debouncedSearchQuery);

    if (shouldReset) {
      console.log('[TemplateLibraryModal] Search query changed (debounced), resetting page:', {
        newSearchQuery: debouncedSearchQuery,
        timestamp: new Date().toISOString(),
      });
      setCurrentPage(1);
      effectivePage = 1;
    }
  }

  // Determine if we should use search or list endpoint
  const hasSearchQuery = debouncedSearchQuery.trim().length > 0;
  const queryKey = hasSearchQuery
    ? ['templates', 'search', debouncedSearchQuery.trim(), effectivePage]
    : ['templates', 'list', effectivePage];

  // Use effectivePage for all queries to ensure page resets when search changes
  const pageForQuery = effectivePage;

  console.log('[TemplateLibraryModal] Query configuration:', {
    hasSearchQuery,
    queryKey,
    willUseSearch: hasSearchQuery,
    searchQuery: debouncedSearchQuery.trim(),
    page: currentPage,
    timestamp: new Date().toISOString(),
  });

  const {
    data: queryData,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey,
    queryFn: async () => {
      console.log('[TemplateLibraryModal] Query function called:', {
        hasSearchQuery,
        searchQuery: debouncedSearchQuery.trim(),
        currentPage,
        timestamp: new Date().toISOString(),
      });

      if (hasSearchQuery) {
        // Use search endpoint with OR logic across all properties
        console.log('[TemplateLibraryModal] Calling searchTemplates API:', {
          searchQuery: debouncedSearchQuery.trim(),
          page: currentPage,
          limit: 20,
          note: 'Search query will be applied to all properties (category, language, doc_type, tags, title) with AND operator',
          timestamp: new Date().toISOString(),
        });

        const response = await draftingTemplateService.searchTemplates(
          debouncedSearchQuery.trim(),
          {
            page: pageForQuery,
            limit: 20,
          }
        );

        console.log('[TemplateLibraryModal] Search API response received:', {
          success: response.success,
          hasData: !!response.data,
          templatesCount: response.data?.templates?.length || 0,
          totalCount: response.data?.total_count || 0,
          timestamp: new Date().toISOString(),
        });

        if (!response.success) {
          const errorMessage =
            response.message ||
            normalizeApiErrorMessage(response.error) ||
            'Failed to search templates';
          console.error('[TemplateLibraryModal] Search API error:', {
            errorMessage,
            response,
            timestamp: new Date().toISOString(),
          });
          throw new Error(errorMessage);
        }

        if (!response.data) {
          console.warn('[TemplateLibraryModal] Search API returned no data');
          return { templates: [], total_count: 0, page: currentPage, limit: 20 };
        }

        // Robust data extraction
        const rawData = response.data as any;
        const templatesList = Array.isArray(rawData?.templates)
          ? rawData.templates
          : Array.isArray(rawData?.data?.templates)
            ? rawData.data.templates
            : [];

        const totalCount =
          typeof rawData?.total_count === 'number'
            ? rawData.total_count
            : typeof rawData?.data?.total_count === 'number'
              ? rawData.data.total_count
              : 0;

        console.log('[TemplateLibraryModal] Processed search results:', {
          templatesCount: templatesList.length,
          totalCount,
          page: currentPage,
          limit: 20,
          timestamp: new Date().toISOString(),
        });

        return {
          templates: templatesList.map((t: any) => ({
            id: t.id,
            title: t.title,
            doc_type: t.doc_type || 'Other',
            category: t.category || 'Other',
            tags: t.tags || [],
            s3_key: t.s3_key ?? t.s3Key ?? undefined,
          })),
          total_count: totalCount,
          page: currentPage,
          limit: 20,
        };
      } else {
        // Use list endpoint when no search query
        console.log('[TemplateLibraryModal] Calling listTemplates API (no search query):', {
          page: currentPage,
          limit: 20,
          timestamp: new Date().toISOString(),
        });

        const response = await draftingTemplateService.listTemplates({
          limit: 20,
          page: pageForQuery,
        });

        console.log('[TemplateLibraryModal] List API response received:', {
          success: response.success,
          hasData: !!response.data,
          templatesCount: response.data?.templates?.length || 0,
          totalCount: response.data?.total_count || 0,
          timestamp: new Date().toISOString(),
        });

        if (!response.success) {
          const errorMessage =
            response.message ||
            normalizeApiErrorMessage(response.error) ||
            'Failed to fetch templates';
          console.error('[TemplateLibraryModal] List API error:', {
            errorMessage,
            response,
            timestamp: new Date().toISOString(),
          });
          throw new Error(errorMessage);
        }

        if (!response.data) {
          console.warn('[TemplateLibraryModal] List API returned no data');
          return { templates: [], total_count: 0, page: 1, limit: 20 };
        }

        // Robust data extraction
        const rawData = response.data as any;
        const templatesList = Array.isArray(rawData?.templates)
          ? rawData.templates
          : Array.isArray(rawData?.data?.templates)
            ? rawData.data.templates
            : [];

        const totalCount =
          typeof rawData?.total_count === 'number'
            ? rawData.total_count
            : typeof rawData?.data?.total_count === 'number'
              ? rawData.data.total_count
              : 0;

        console.log('[TemplateLibraryModal] Processed list results:', {
          templatesCount: templatesList.length,
          totalCount,
          page: currentPage,
          limit: 20,
          timestamp: new Date().toISOString(),
        });

        return {
          templates: templatesList.map((t: any) => ({
            id: t.id,
            title: t.title,
            doc_type: t.doc_type || 'Other',
            category: t.category || 'Other',
            tags: t.tags || [],
            s3_key: t.s3_key ?? t.s3Key ?? undefined,
          })),
          total_count: totalCount,
          page: currentPage,
          limit: 20,
        };
      }
    },
    enabled: isOpen,
    staleTime: 5 * 60 * 1000,
  });

  const templates = useMemo(() => {
    const result = queryData?.templates || [];
    console.log('[TemplateLibraryModal] Templates memoized:', {
      count: result.length,
      timestamp: new Date().toISOString(),
    });
    return result;
  }, [queryData?.templates]);

  const totalCount = queryData?.total_count || 0;
  const pageLimit = queryData?.limit || 20;
  const hasNextPage =
    templates.length === pageLimit &&
    (totalCount <= pageLimit || effectivePage * pageLimit < totalCount);
  const hasPrevPage = effectivePage > 1;

  console.log('[TemplateLibraryModal] Pagination state:', {
    templatesCount: templates.length,
    totalCount,
    currentPage,
    pageLimit,
    hasNextPage,
    hasPrevPage,
    timestamp: new Date().toISOString(),
  });

  const handleContinue = () => {
    if (selectedTemplateId) {
      const template = templates.find((t: Template) => t.id === selectedTemplateId);
      if (template) {
        onSelect(template);
      }
    }
  };

  const handlePreviewTemplate = async (
    template: Template,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.stopPropagation();

    if (!template.s3_key) {
      addToast('Preview is not available for this template', 'warning');
      return;
    }

    setPreviewingTemplateId(template.id);

    try {
      const response = await referenceManagerService.publicPreviewDocument(template.s3_key);

      if (!response.success) {
        const failureMessage =
          response.message ||
          (typeof response.error === 'string' ? response.error : (response.error as any)?.detail) ||
          'Failed to fetch preview URL';
        addToast(failureMessage, 'error');
        return;
      }

      const previewResponse = response as TemplatePreviewResponse;
      const previewUrl =
        previewResponse.preview_url?.trim() || previewResponse.data?.preview_url?.trim();

      if (!previewUrl) {
        addToast('Preview URL unavailable. Please try again later.', 'error');
        return;
      }

      if (typeof window !== 'undefined') {
        const newTab = window.open(previewUrl, '_blank', 'noopener,noreferrer');
        if (newTab) {
          newTab.focus();
        } else {
          addToast('Pop-up blocked. Allow new tabs for previews.', 'warning');
        }
      }
    } catch (error) {
      console.error('[TemplateLibraryModal] Failed to open preview:', error);
      addToast('Unable to open template preview. Please try again.', 'error');
    } finally {
      setPreviewingTemplateId(null);
    }
  };

  const handleNextPage = () => {
    if (hasNextPage) {
      console.log('[TemplateLibraryModal] Navigating to next page:', {
        from: currentPage,
        to: currentPage + 1,
        timestamp: new Date().toISOString(),
      });
      setCurrentPage((prev) => prev + 1);
    }
  };

  const handlePrevPage = () => {
    if (hasPrevPage) {
      console.log('[TemplateLibraryModal] Navigating to previous page:', {
        from: currentPage,
        to: currentPage - 1,
        timestamp: new Date().toISOString(),
      });
      setCurrentPage((prev) => Math.max(1, prev - 1));
    }
  };

  // Reset view when modal opens

  useEffect(() => {
    if (!isOpen) return;

    console.log('[TemplateLibraryModal] Modal opened, resetting state:', {
      timestamp: new Date().toISOString(),
    });

    // Reset state when modal opens
    setSearchQuery('');
    setSelectedTemplateId(null);
    setCurrentPage(1);
  }, [isOpen]);

  // Handle search input change
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    console.log('[TemplateLibraryModal] Search input changed:', {
      previousValue: searchQuery,
      newValue,
      timestamp: new Date().toISOString(),
    });
    setSearchQuery(newValue);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.2 }}
        className={styles.overlay}
        onClick={handleBackdropClick}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          transition={{ duration: 0.2 }}
          className={styles.modalContainer}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className={styles.header}>
            <div className={styles.headerTop}>
              <h2 className={styles.title}>Template Library</h2>
              <button onClick={onClose} className={styles.closeButton}>
                <X size={20} color="#6b7280" />
              </button>
            </div>
            <p className={styles.subtitle}>
              Choose the template based on which you want your draft
            </p>
          </div>

          {/* Search Bar */}
          <div className={styles.searchContainer}>
            <div className={styles.searchWrapper}>
              <div className={styles.searchIconWrapper}>
                <Search size={18} color="#9CA3AF" />
              </div>
              <input
                type="text"
                className={styles.searchInput}
                placeholder="Search by title or tags (comma-separated for multiple tags)..."
                value={searchQuery}
                onChange={handleSearchChange}
              />
            </div>
          </div>

          {/* Table Content */}
          <div className={`${styles.contentArea} custom-scrollbar`}>
            {isLoading ? (
              <div className={styles.centeredMessage}>
                <VideoLoader width={150} height={150} />
              </div>
            ) : isError ? (
              <div className={`${styles.centeredMessage} ${styles.errorMessage}`}>
                {(error as Error).message}
              </div>
            ) : templates.length === 0 ? (
              <div className={`${styles.centeredMessage} ${styles.emptyMessage}`}>
                No templates found
              </div>
            ) : (
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th className={styles.tableHeader}>Category</th>
                      <th className={styles.tableHeader}>Title</th>
                      <th className={styles.tableHeader}>Tags</th>
                      <th className={`${styles.tableHeader} ${styles.previewHeader}`}>Preview</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template: Template) => (
                      <tr
                        key={template.id}
                        className={`${styles.tableRow} ${
                          selectedTemplateId === template.id ? styles.tableRowSelected : ''
                        }`}
                        onClick={() => {
                          console.log('[TemplateLibraryModal] Template selected:', {
                            id: template.id,
                            title: template.title,
                            timestamp: new Date().toISOString(),
                          });
                          setSelectedTemplateId(template.id);
                        }}
                      >
                        <td className={styles.tableCell}>{template.category}</td>
                        <td className={styles.tableCell}>
                          <div className={styles.titleCellContent}>
                            <span>{template.title}</span>
                            <button
                              type="button"
                              className={styles.mobilePreviewButton}
                              onClick={(event) => handlePreviewTemplate(template, event)}
                              disabled={!template.s3_key || previewingTemplateId === template.id}
                              aria-label="Preview template"
                            >
                              <Eye size={18} />
                            </button>
                          </div>
                        </td>
                        <td className={styles.tableCell}>
                          <div className={styles.tagsContainer}>
                            {template.tags.length > 0 ? (
                              <>
                                <span className={styles.tag}>{template.tags[0]}</span>
                                {template.tags.length > 1 && (
                                  <span className={styles.tagCountBadge}>
                                    +{template.tags.length - 1}
                                  </span>
                                )}
                              </>
                            ) : (
                              <span className={styles.noTags}>No tags</span>
                            )}
                          </div>
                        </td>
                        <td className={`${styles.tableCell} ${styles.previewCell}`}>
                          <button
                            type="button"
                            className={styles.previewButton}
                            onClick={(event) => handlePreviewTemplate(template, event)}
                            disabled={!template.s3_key || previewingTemplateId === template.id}
                            title={
                              template.s3_key
                                ? 'View template preview in a new tab'
                                : 'Preview not available for this template'
                            }
                          >
                            {previewingTemplateId === template.id ? 'Opening...' : 'View'}
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pagination */}
          {!isLoading && !isError && templates.length > 0 && (
            <div className={styles.pagination}>
              <div className={styles.paginationInfo}>
                Showing {templates.length} of {totalCount} templates
                {hasSearchQuery && (
                  <span style={{ marginLeft: '8px', color: '#6b7280', fontSize: '14px' }}>
                    (search: &quot;{debouncedSearchQuery}&quot;)
                  </span>
                )}
              </div>
              <div className={styles.paginationButtons}>
                {hasPrevPage && (
                  <button
                    onClick={handlePrevPage}
                    className={styles.nextButton}
                    disabled={isLoading}
                  >
                    Previous
                  </button>
                )}
                {hasNextPage && (
                  <button
                    onClick={handleNextPage}
                    className={styles.nextButton}
                    disabled={isLoading}
                  >
                    Next Page
                    <ChevronRight size={16} />
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Footer */}
          <div className={styles.footer}>
            <button onClick={onCancel} className={styles.cancelButton}>
              Cancel
            </button>
            <button
              onClick={handleContinue}
              className={styles.continueButton}
              disabled={!selectedTemplateId}
            >
              Continue
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
