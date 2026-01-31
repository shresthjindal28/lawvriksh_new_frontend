'use client';

import { useState, useEffect, useRef, useLayoutEffect } from 'react';
import { createPortal } from 'react-dom';
import { Scale, Calendar, Link2, Plus, Check, Quote, Search, Loader2, X } from 'lucide-react';
import {
  Citation,
  CombinedRecommendationResponse,
  CombinedRecommendation,
} from '@/types/citations';
import { useCitations } from '@/hooks/writing-hooks';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import VideoLoader from '@/components/ui/VideoLoader';

interface CitePopupCardProps {
  isVisible: boolean;
  position: { x: number; y: number };
  selectedText: string;
  blockId: string;
  showAllLibrary?: boolean;
  onClose: () => void;
  onAddCitation: (citation: Citation) => void;
  onAddWorkspaceReference?: (citation: Citation) => Promise<string | null>;
  citations?: Citation[];
}

export default function CitePopupCard({
  isVisible,
  position,
  selectedText,
  blockId,
  showAllLibrary = false,
  onClose,
  onAddCitation,
  onAddWorkspaceReference,
  citations,
}: CitePopupCardProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'web' | 'library'>('all');
  const [isAdding, setIsAdding] = useState(false);
  const [addedCitations, setAddedCitations] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const popupRef = useRef<HTMLDivElement>(null);
  const [libraryReferences, setLibraryReferences] = useState<CombinedRecommendation[]>([]);
  const [isLoadingLibrary, setIsLoadingLibrary] = useState(false);

  // Viewport adjustment state - removed as we now center the modal
  // const [adjustedPosition, setAdjustedPosition] = useState(position);

  // useLayoutEffect removed - using CSS centering instead

  const {
    isLoading: isFetching,
    recommendations,
    fetchRecommendations,
    clearRecommendations,
    addToLibrary,
    isAddingToLibrary,
    uploadStatus,
    uploadProgress,
  } = useCitations();
  const [addedToLibrary, setAddedToLibrary] = useState<Set<string>>(new Set());

  // Helper to map API response to CombinedRecommendation
  const mapApiItemToRecommendation = (item: any): CombinedRecommendation => {
    // Handle both wrapped structure { reference: ..., documents: ... } and flat structure
    const refData = item.reference || item;
    const docs = item.documents || item.documents || [];
    const firstDoc = Array.isArray(docs) && docs.length > 0 ? docs[0] : {};

    // Parse metadata safely
    let metadata: Record<string, any> = {};
    let docMetadata: Record<string, any> = {};

    try {
      metadata =
        typeof refData.metadata === 'string'
          ? JSON.parse(refData.metadata)
          : refData.metadata || {};
    } catch (e) {
      console.warn('Failed to parse reference metadata', e);
    }

    try {
      docMetadata =
        typeof firstDoc.metadata === 'string'
          ? JSON.parse(firstDoc.metadata)
          : firstDoc.metadata || {};
    } catch (e) {
      console.warn('Failed to parse document metadata', e);
    }

    const title = refData.title || firstDoc.title || 'Untitled Reference';
    const id = refData.id || firstDoc.id || '';

    const link =
      metadata.url ||
      metadata.web_url ||
      metadata.link ||
      docMetadata.web_url ||
      docMetadata.url ||
      docMetadata.source_url ||
      '';

    const date =
      metadata.date ||
      metadata.dateDecided ||
      metadata.dateEnacted ||
      metadata.enforcementDate ||
      metadata.accessDate ||
      docMetadata.Date ||
      undefined;

    const court =
      metadata.court ||
      metadata.author ||
      metadata.publisher ||
      metadata.institution ||
      metadata.legislativeBody ||
      'Library';

    const summary =
      metadata.abstract ||
      metadata.note ||
      docMetadata.abstract ||
      docMetadata.summary ||
      firstDoc.summary ||
      '';

    const source =
      metadata.publication ||
      metadata.publisher ||
      metadata.institution ||
      metadata.genre ||
      docMetadata.source ||
      refData.ref_type ||
      'Library';

    return {
      ref_id: id,
      title,
      summary: summary || '',
      relevance_score: 1,
      source: source || 'Library',
      rank: 0,
      link,
      court,
      metadata: JSON.stringify({ ...metadata, ...docMetadata }),
      date,
    };
  };

  useEffect(() => {
    if (isVisible && !showAllLibrary && selectedText) {
      // Clear old recommendations before fetching new ones
      clearRecommendations();
      fetchRecommendations(selectedText);
    }
  }, [isVisible, selectedText, fetchRecommendations, clearRecommendations, showAllLibrary]);

  useEffect(() => {
    const fetchLibraryReferences = async () => {
      setIsLoadingLibrary(true);
      try {
        const pageSize = 100;
        let skip = 0;
        let totalCount = Number.POSITIVE_INFINITY;
        const all: CombinedRecommendation[] = [];
        const seen = new Set<string>();

        while (skip < totalCount) {
          const res = await referenceManagerService.listReferences({ skip, limit: pageSize });
          if (!res.success || !res.data?.references) {
            break;
          }

          totalCount = res.data.total_count ?? 0;

          // Cast to any[] to handle the wrapper structure mismatch
          const rawRefs = res.data.references as any[];

          for (const item of rawRefs) {
            // Determine ID
            const refData = item.reference || item;
            const id = refData.id;

            if (!id) continue;
            if (seen.has(id)) continue;
            seen.add(id);

            all.push(mapApiItemToRecommendation(item));
          }

          if (rawRefs.length < pageSize) {
            break;
          }

          skip += pageSize;
        }

        setLibraryReferences(all);
      } catch (err) {
        console.error('Error fetching library references:', err);
      } finally {
        setIsLoadingLibrary(false);
      }
    };

    if (isVisible && showAllLibrary) {
      setActiveTab('library');
      fetchLibraryReferences();
    }
  }, [isVisible, showAllLibrary]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isVisible, onClose]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isVisible) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isVisible, onClose]);

  // Animation state
  const [shouldRender, setShouldRender] = useState(isVisible);
  const [animationClass, setAnimationClass] = useState('');

  useEffect(() => {
    if (isVisible) {
      setShouldRender(true);
      setAnimationClass('');
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimationClass('cite-popup-enter');
        });
      });
    } else if (shouldRender) {
      setAnimationClass('cite-popup-exit');
      const timer = setTimeout(() => {
        setShouldRender(false);
        setAnimationClass('');
      }, 200);
      return () => clearTimeout(timer);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isVisible]);

  const getFilteredList = (): CombinedRecommendation[] => {
    switch (activeTab) {
      case 'web':
        return showAllLibrary ? [] : recommendations?.online_only || [];
      case 'library': {
        const list = showAllLibrary ? libraryReferences : recommendations?.personal_only || [];
        if (!searchTerm.trim()) return list;
        return list.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.court && item.court.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
      default: {
        const allList = showAllLibrary ? [] : recommendations?.combined_ranked || [];
        if (!searchTerm.trim()) return allList;
        return allList.filter(
          (item) =>
            (item.title && item.title.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.summary && item.summary.toLowerCase().includes(searchTerm.toLowerCase())) ||
            (item.court && item.court.toLowerCase().includes(searchTerm.toLowerCase()))
        );
      }
    }
  };

  const handleAddToLibrary = async (rec: CombinedRecommendation) => {
    // Unique key for tracking
    const uniqueKey = `${rec.title}-${rec.link}`;

    // Call the hook function
    const refId = await addToLibrary(rec);

    if (refId) {
      setAddedToLibrary((prev) => {
        const next = new Set(prev);
        next.add(uniqueKey);
        return next;
      });
    }
  };

  const handleCite = async (rec: CombinedRecommendation) => {
    // Use a unique key based on title and link to track added citations
    const uniqueKey = `${rec.title}-${rec.link}`;

    setIsAdding(true);
    try {
      // Map CombinedRecommendation to the expected Citation type
      const baseCitation: Citation = {
        id: rec.ref_id,
        title: rec.title,
        author: rec.court || 'Unknown',
        source: rec.source,
        link: rec.link,
      };

      // Call backend to create reference and get the reference ID
      let referenceId: string | null = null;
      if (onAddWorkspaceReference) {
        referenceId = await onAddWorkspaceReference(baseCitation);
      }

      // Create citation with reference binding
      const newCitation: Citation = {
        ...baseCitation,
        id: `${blockId}_${Date.now()}`,
        reference_id: referenceId || undefined,
      };
      await onAddCitation(newCitation);
      setAddedCitations((prev) => {
        const next = new Set(prev);
        next.add(uniqueKey);
        return next;
      });
    } catch (error) {
    } finally {
      setIsAdding(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Local search already happens via state update in getFilteredList
  };

  if (!shouldRender) return null;

  const getTabWidths = { all: '141px', web: '124px', library: '79px' };

  const getTabStyle = (tab: 'all' | 'web' | 'library'): React.CSSProperties => {
    const isActive = activeTab === tab;
    return {
      width: getTabWidths[tab],
      height: '40px',
      fontSize: '16px',
      fontFamily: 'Arial, sans-serif',
      fontWeight: 400,
      borderRadius: '8px',
      border: isActive ? 'none' : '1px solid #BFBFBF',
      backgroundColor: isActive ? '#027FBD' : 'white',
      color: isActive ? 'white' : '#595959',
      cursor: 'pointer',
      transition: 'all 0.2s ease',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    };
  };

  const recommendationsList = getFilteredList();

  if (showAllLibrary) {
    if (typeof document === 'undefined') return null;
    return createPortal(
      <div
        style={{
          position: 'fixed',
          top: 0,
          right: 0,
          bottom: 0,
          width: '420px',
          maxWidth: '90vw',
          backgroundColor: 'white',
          borderLeft: '1px solid #E5E7EB',
          boxShadow: '-8px 0 24px rgba(0,0,0,0.08)',
          zIndex: 2147483647,
          display: 'flex',
          flexDirection: 'column',
          fontFamily: 'Arial, sans-serif',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '16px 16px',
            borderBottom: '1px solid #F0F2F5',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <span style={{ fontSize: '16px', fontWeight: 700, color: '#111827' }}>References</span>
            <span style={{ fontSize: '12px', color: '#6B7280' }}>
              {isLoadingLibrary ? 'Loading…' : `${libraryReferences.length} items`}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              width: '36px',
              height: '36px',
              borderRadius: '10px',
              border: '1px solid #E5E7EB',
              backgroundColor: 'white',
              cursor: 'pointer',
              zIndex: 2147483647,
            }}
            aria-label="Close"
            title="Close"
          >
            <X size={18} />
          </button>
        </div>

        <div style={{ padding: '12px 16px', borderBottom: '1px solid #F0F2F5' }}>
          <div style={{ position: 'relative' }}>
            <Search
              size={16}
              style={{
                position: 'absolute',
                left: '12px',
                top: '50%',
                transform: 'translateY(-50%)',
                color: '#6F7A8F',
              }}
            />
            <input
              type="text"
              placeholder="Search references..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{
                width: '100%',
                padding: '10px 12px 10px 36px',
                borderRadius: '10px',
                border: '1px solid #DCE3F0',
                fontSize: '14px',
                outline: 'none',
                fontFamily: 'Arial, sans-serif',
              }}
            />
          </div>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 16px' }}>
          {isLoadingLibrary ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '80px 0',
                gap: '12px',
              }}
            >
              <VideoLoader width={80} height={80} />
              <span style={{ color: '#6F7A8F', fontSize: '14px' }}>Loading your references...</span>
            </div>
          ) : recommendationsList.length === 0 ? (
            <div
              style={{
                textAlign: 'center',
                padding: '80px 12px',
                color: '#6F7A8F',
                fontSize: '14px',
              }}
            >
              No references found.
            </div>
          ) : (
            <div>
              {recommendationsList.map((rec, index) => (
                <div
                  key={rec.ref_id || `ref-${index}-${rec.title?.slice(0, 20)}`}
                  style={{
                    padding: '16px 0',
                    borderBottom:
                      index < (recommendationsList.length || 0) - 1 ? '1px solid #F0F2F5' : 'none',
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'flex-start',
                      gap: '12px',
                    }}
                  >
                    <h3
                      style={{
                        fontSize: '14px',
                        fontFamily: 'Arial, sans-serif',
                        fontWeight: 700,
                        color: '#111827',
                        marginBottom: '6px',
                        lineHeight: '1.35',
                        flex: 1,
                      }}
                    >
                      {rec.title}
                    </h3>
                  </div>

                  {rec.summary && (
                    <p
                      style={{
                        fontSize: '12px',
                        color: '#4B5563',
                        lineHeight: '1.5',
                        marginBottom: '10px',
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {rec.summary}
                    </p>
                  )}

                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      gap: '6px',
                      marginBottom: '10px',
                      fontSize: '12px',
                      color: '#6B7280',
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Scale size={13} />
                      <span>{rec.court || 'Library'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Calendar size={13} />
                      <span>{rec.date || '-'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <Link2 size={13} />
                      <span
                        style={{
                          maxWidth: '280px',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                          whiteSpace: 'nowrap',
                        }}
                        title={rec.source || ''}
                      >
                        {rec.source || 'Library'}
                      </span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start' }}>
                    {addedCitations.has(`${rec.title}-${rec.link}`) ? (
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          color: '#22c55e',
                          fontWeight: 600,
                        }}
                      >
                        <Check size={16} />
                        <span>Citation added</span>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleCite(rec)}
                        disabled={isAdding}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '6px',
                          fontSize: '13px',
                          fontWeight: 600,
                          color: '#1C73FF',
                          background: 'none',
                          border: 'none',
                          cursor: isAdding ? 'not-allowed' : 'pointer',
                          opacity: isAdding ? 0.6 : 1,
                          padding: '6px 10px',
                          borderRadius: '8px',
                          transition: 'background-color 0.2s ease',
                        }}
                        onMouseEnter={(e) => {
                          if (!isAdding) {
                            e.currentTarget.style.backgroundColor = '#f0f7ff';
                          }
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent';
                        }}
                      >
                        <Quote size={16} />
                        <span>Cite</span>
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>,
      document.body
    );
  }

  return (
    <>
      <style>{`
        @keyframes citePopupEnter {
          from { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
          to { opacity: 1; transform: translate(-50%, -50%) scale(1); }
        }
        @keyframes citePopupExit {
          from { opacity: 1; transform: translate(-50%, -50%) scale(1); }
          to { opacity: 0; transform: translate(-50%, -45%) scale(0.95); }
        }
        .cite-popup-wrapper { opacity: 0; }
        .cite-popup-wrapper.cite-popup-enter { animation: citePopupEnter 0.2s ease-out forwards; }
        .cite-popup-wrapper.cite-popup-exit { animation: citePopupExit 0.2s ease-in forwards; }
      `}</style>
      <div
        className={`cite-popup-wrapper fixed z-[9999] ${animationClass}`}
        style={{
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <div
          ref={popupRef}
          style={{
            width: '425px',
            maxHeight: '650px',
            minHeight: '600px',
            backgroundColor: 'white',
            borderRadius: '16px',
            boxShadow: '0 4px 10.1px #BFBFBF',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
            fontFamily: 'Arial, sans-serif',
          }}
        >
          {/* Tabs */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '20px 24px',
              borderBottom: '1px solid #DCE3F0',
            }}
          >
            <button onClick={() => setActiveTab('all')} style={getTabStyle('all')}>
              All Suggestions
            </button>
            <button onClick={() => setActiveTab('web')} style={getTabStyle('web')}>
              Web Search
            </button>
            <button onClick={() => setActiveTab('library')} style={getTabStyle('library')}>
              Library
            </button>
          </div>

          {/* Search Bar - Visible ONLY in Library tab */}
          {activeTab === 'library' && (
            <div
              style={{
                padding: '16px 24px',
                display: 'flex',
                gap: '8px',
                borderBottom: '1px solid #F0F2F5',
              }}
            >
              <div
                style={{
                  position: 'relative',
                  flex: 1,
                }}
              >
                <Search
                  size={16}
                  style={{
                    position: 'absolute',
                    left: '12px',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    color: '#6F7A8F',
                  }}
                />
                <input
                  type="text"
                  placeholder="Filter your library results..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '10px 12px 10px 36px',
                    borderRadius: '8px',
                    border: '1px solid #DCE3F0',
                    fontSize: '14px',
                    outline: 'none',
                    fontFamily: 'Arial, sans-serif',
                  }}
                />
              </div>
            </div>
          )}

          {/* Citations List */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '0 24px' }}>
            {isFetching && !recommendations ? (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '100px 0',
                  gap: '16px',
                }}
              >
                <VideoLoader width={100} height={100} />
                <span style={{ color: '#6F7A8F', fontSize: '14px' }}>
                  Analyzing content for recommendations...
                </span>
              </div>
            ) : !recommendationsList || recommendationsList.length === 0 ? (
              <div
                style={{
                  textAlign: 'center',
                  padding: '100px 20px',
                  color: '#6F7A8F',
                  fontSize: '15px',
                }}
              >
                {!selectedText && !recommendations ? (
                  <>
                    <Scale
                      size={48}
                      style={{ opacity: 0.2, marginBottom: '16px', margin: '0 auto' }}
                    />
                    <p>
                      Select text in the editor to see
                      <br />
                      intelligent case recommendations.
                    </p>
                  </>
                ) : (
                  <p>No matching citations found in this source.</p>
                )}
              </div>
            ) : (
              <div>
                {recommendationsList?.map((rec, index) => (
                  <div
                    key={rec.ref_id || `rec-${index}-${rec.title?.slice(0, 20)}`}
                    style={{
                      padding: '20px 0',
                      borderBottom:
                        index < (recommendationsList?.length || 0) - 1
                          ? '1px solid #DCE3F0'
                          : 'none',
                    }}
                  >
                    {/* Citation Title */}
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        gap: '12px',
                      }}
                    >
                      <h3
                        style={{
                          fontSize: '16px',
                          fontFamily: 'Arial, sans-serif',
                          fontWeight: 600,
                          color: '#1F2937',
                          marginBottom: '8px',
                          lineHeight: '1.4',
                          flex: 1,
                        }}
                      >
                        {rec.title}
                      </h3>
                      {rec.relevance_score > 0.8 && (
                        <div
                          style={{
                            backgroundColor: '#EEF2FF',
                            color: '#4F46E5',
                            fontSize: '10px',
                            padding: '2px 8px',
                            borderRadius: '12px',
                            fontWeight: 600,
                            whiteSpace: 'nowrap',
                          }}
                        >
                          High Match
                        </div>
                      )}
                    </div>

                    {/* Summary snippets if available */}
                    {rec.summary && (
                      <p
                        style={{
                          fontSize: '13px',
                          color: '#4B5563',
                          lineHeight: '1.5',
                          marginBottom: '12px',
                          display: '-webkit-box',
                          WebkitLineClamp: 2,
                          WebkitBoxOrient: 'vertical',
                          overflow: 'hidden',
                        }}
                      >
                        {rec.summary}
                      </p>
                    )}

                    {/* Citation Properties */}
                    <div
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '6px',
                        marginBottom: '16px',
                        fontSize: '14px',
                        color: '#6B7280',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Scale size={14} />
                        <span>{rec.court || 'Supreme Court'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Calendar size={14} />
                        <span>{rec.date || '2024'}</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                        <Link2 size={14} />
                        <span
                          style={{
                            maxWidth: '200px',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                          }}
                        >
                          {rec.source || 'Legal Database'}
                        </span>
                      </div>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'start' }}>
                      {addedCitations.has(`${rec.title}-${rec.link}`) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          <Check size={16} />
                          <span>Citation added</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleCite(rec)}
                          disabled={isAdding || isAddingToLibrary}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1C73FF',
                            background: 'none',
                            border: 'none',
                            cursor: isAdding || isAddingToLibrary ? 'not-allowed' : 'pointer',
                            opacity: isAdding || isAddingToLibrary ? 0.6 : 1,
                            padding: '6px 12px',
                            borderRadius: '6px',
                            transition: 'background-color 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isAdding && !isAddingToLibrary) {
                              e.currentTarget.style.backgroundColor = '#f0f7ff';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                          }}
                        >
                          <Quote size={16} />
                          <span>Cite</span>
                        </button>
                      )}

                      {addedToLibrary.has(`${rec.title}-${rec.link}`) ? (
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            color: '#22c55e',
                            fontWeight: 500,
                          }}
                        >
                          <Check size={16} />
                          <span>Added to library</span>
                        </div>
                      ) : (
                        <button
                          onClick={() => handleAddToLibrary(rec)}
                          disabled={isAdding || isAddingToLibrary}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '6px',
                            fontSize: '14px',
                            fontWeight: 500,
                            color: '#1C73FF',
                            background: 'none',
                            cursor: isAdding || isAddingToLibrary ? 'not-allowed' : 'pointer',
                            opacity: isAdding || isAddingToLibrary ? 0.6 : 1,
                            padding: '6px 12px',
                            transition: 'all 0.2s ease',
                          }}
                          onMouseEnter={(e) => {
                            if (!isAdding && !isAddingToLibrary) {
                              e.currentTarget.style.backgroundColor = '#f9fafb';
                              e.currentTarget.style.borderColor = '#9CA3AF';
                            }
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.backgroundColor = 'transparent';
                            e.currentTarget.style.borderColor = '#D1D5DB';
                          }}
                        >
                          <Plus size={16} />
                          <span>Add to library</span>
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Progress Overlay */}
          {isAddingToLibrary && (
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                zIndex: 10,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '16px',
              }}
            >
              <VideoLoader width={100} height={100} />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '8px',
                  minWidth: '200px',
                }}
              >
                <span style={{ fontSize: '14px', fontWeight: 600, color: '#1F2937' }}>
                  {uploadStatus || 'Processing...'}
                </span>
                {uploadProgress !== null && (
                  <div
                    style={{
                      width: '100%',
                      height: '4px',
                      backgroundColor: '#E5E7EB',
                      borderRadius: '2px',
                      overflow: 'hidden',
                    }}
                  >
                    <div
                      style={{
                        width: `${uploadProgress}%`,
                        height: '100%',
                        backgroundColor: '#027FBD',
                        transition: 'width 0.3s ease',
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
