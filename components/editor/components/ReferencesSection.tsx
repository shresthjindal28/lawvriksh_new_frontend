'use client';

import React, { useState, useMemo, useRef, useEffect } from 'react';
import { WorkspaceReference, Citation } from '@/types/citations';
import { CitationFormatter, CITATION_STYLES } from '@/lib/services/citationFormatter';
import { Search, ChevronDown, Plus } from 'lucide-react';
import type { Editor } from '@tiptap/react';

interface ReferencesSectionProps {
  references: WorkspaceReference[];
  citations: { [blockId: string]: Citation[] };
  onDeleteReference?: (referenceId: string) => Promise<boolean>;
  citationStyle?: string;
  onStyleChange?: (style: string) => void;
  editor?: Editor | null; // TipTap editor instance
  onCiteReference?: (reference: WorkspaceReference) => void; // Callback for citing a reference
}

interface TooltipState {
  visible: boolean;
  x: number;
  y: number;
  reference: WorkspaceReference | null;
  placement?: 'top' | 'bottom';
}

export default function ReferencesSection({
  references,
  citations,
  onDeleteReference,
  citationStyle,
  onStyleChange,
  editor,
  onCiteReference,
}: ReferencesSectionProps) {
  // Use prop if provided, else use local state
  const [localSelectedStyle, setLocalSelectedStyle] = useState('bluebook');
  const selectedStyle = citationStyle ?? localSelectedStyle;
  const setSelectedStyle = (style: string) => {
    if (onStyleChange) {
      onStyleChange(style);
    } else {
      setLocalSelectedStyle(style);
    }
  };

  const [tooltip, setTooltip] = useState<TooltipState>({
    visible: false,
    x: 0,
    y: 0,
    reference: null,
    placement: 'bottom',
  });
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [styleSearchQuery, setStyleSearchQuery] = useState('');
  const [editorUpdateKey, setEditorUpdateKey] = useState(0);
  const hideTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const formatter = CitationFormatter.getInstance();

  // Listen for editor content updates to refresh citation numbers
  useEffect(() => {
    if (!editor) return;

    const handleUpdate = () => {
      setEditorUpdateKey((prev) => prev + 1);
    };

    editor.on('update', handleUpdate);
    return () => {
      editor.off('update', handleUpdate);
    };
  }, [editor]);

  // Filter citation styles based on search query
  const filteredStyles = useMemo(() => {
    if (!styleSearchQuery) return CITATION_STYLES;

    return CITATION_STYLES.filter(
      (style) =>
        style.label.toLowerCase().includes(styleSearchQuery.toLowerCase()) ||
        style.value.toLowerCase().includes(styleSearchQuery.toLowerCase())
    );
  }, [styleSearchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsStyleDropdownOpen(false);
        setStyleSearchQuery('');
      }
    };

    if (isStyleDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isStyleDropdownOpen]);

  // Get all unique references from both sources
  const allReferences = useMemo(() => {
    const refMap = new Map<string, WorkspaceReference>();
    references.forEach((ref) => {
      const key = ref.id || `${ref.title}-${ref.link}`;
      refMap.set(key, ref);
    });
    return Array.from(refMap.values());
  }, [references]);

  // Build a map of referenceId -> citation numbers from editor content
  const citationNumberMap = useMemo(() => {
    const map = new Map<string, number[]>();
    if (!editor) return map;

    const html = editor.getHTML();
    // Match all inline-citation spans and extract reference-id and citation-number
    const regex = /data-reference-id="([^"]+)"[^>]*data-citation-number="(\d+)"/g;
    let match;
    while ((match = regex.exec(html)) !== null) {
      const refId = match[1];
      const citNum = parseInt(match[2], 10);
      if (refId && !isNaN(citNum)) {
        if (!map.has(refId)) {
          map.set(refId, []);
        }
        map.get(refId)!.push(citNum);
      }
    }
    // Sort citation numbers for each reference
    map.forEach((nums) => nums.sort((a, b) => a - b));
    return map;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editor, allReferences, editorUpdateKey]);

  // Sort references by their first citation number (if available)
  const sortedReferences = useMemo(() => {
    return [...allReferences].sort((a, b) => {
      const aNum = citationNumberMap.get(a.id || '')?.[0] ?? Infinity;
      const bNum = citationNumberMap.get(b.id || '')?.[0] ?? Infinity;
      return aNum - bNum;
    });
  }, [allReferences, citationNumberMap]);

  // Helper functions for tooltip
  const startHideTooltip = () => {
    hideTimeoutRef.current = setTimeout(() => {
      setTooltip((prev) => ({ ...prev, visible: false }));
    }, 250);
  };

  const cancelHideTooltip = () => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
  };

  // Handle mouseover for tooltip - using event delegation on the editor DOM
  useEffect(() => {
    if (!editor || !editor.view) return;

    const dom = editor.view.dom;

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      // Check if the target is or is inside an inline-citation
      const citationSpan = target.closest('.inline-citation') as HTMLElement;

      if (citationSpan) {
        const referenceId = citationSpan.getAttribute('data-reference-id');
        if (referenceId) {
          const reference = allReferences.find((r) => r.id === referenceId);
          if (reference) {
            // Position tooltip relative to the span
            const rect = citationSpan.getBoundingClientRect();
            // Create a fake mouse event object with coordinates for showTooltip
            const fakeEvent = {
              currentTarget: citationSpan,
              target: citationSpan,
              getClientBoundingRect: () => rect,
            } as unknown as React.MouseEvent;

            showTooltip(fakeEvent, reference);
          }
        }
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      const citationSpan = target.closest('.inline-citation');

      // Only hide if we're moving out of a citation span
      if (citationSpan) {
        startHideTooltip();
      }
    };

    dom.addEventListener('mouseover', handleMouseOver);
    dom.addEventListener('mouseout', handleMouseOut);

    return () => {
      dom.removeEventListener('mouseover', handleMouseOver);
      dom.removeEventListener('mouseout', handleMouseOut);
    };
  }, [editor, allReferences]);

  // Format reference based on selected citation style
  const formatReference = (ref: WorkspaceReference, index: number): string => {
    const currentYear = ref.created_at
      ? new Date(ref.created_at).getFullYear()
      : new Date().getFullYear();
    const author = ref.source || 'Unknown';
    const title = ref.title || '';

    switch (selectedStyle) {
      case 'bluebook':
        return `${author}, ${title} (${currentYear})`;
      case 'apa':
        return `${author}. (${currentYear}). ${title}.`;
      case 'mla':
        return `${author}. "${title}." ${currentYear}.`;
      case 'chicago':
        return `${author}. "${title}." ${currentYear}.`;
      case 'harvard':
        return `${author} (${currentYear}) '${title}'.`;
      default:
        return `${author}, ${title} (${currentYear})`;
    }
  };

  const showTooltip = (e: React.MouseEvent, ref: WorkspaceReference) => {
    if (hideTimeoutRef.current) {
      clearTimeout(hideTimeoutRef.current);
      hideTimeoutRef.current = null;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    const tooltipHeight = 150; // Approximate tooltip height
    const tooltipWidth = 320; // Approximate tooltip width

    // Try to position above the text (4px gap)
    let y = rect.top - tooltipHeight - 10;

    // Position vertically
    // If not enough space above, show BELOW the text
    if (y < 80) {
      // arbitrary buffer
      y = rect.bottom + 10;
    }

    // Keep tooltip within horizontal viewport
    let x = rect.left + rect.width / 2 - tooltipWidth / 2; // Center horizontally

    if (x + tooltipWidth > window.innerWidth) {
      x = window.innerWidth - tooltipWidth - 20;
    }
    if (x < 20) x = 20;

    setTooltip({
      visible: true,
      x,
      y,
      reference: ref,
    });
  };

  // Remove citation marks from TipTap editor
  const removeCitationsFromTiptap = (referenceId: string) => {
    if (!editor) return;

    // We must update the editor content via API to ensure state is synchronized
    // Using simple regex replacement on HTML string for now as we don't have a custom extension
    const currentHTML = editor.getHTML();

    // Create a DOMParser to safely manipulate the HTML
    const parser = new DOMParser();
    const doc = parser.parseFromString(currentHTML, 'text/html');

    // Find all citation spans with the matching reference ID
    const spans = doc.querySelectorAll(`span.inline-citation[data-reference-id="${referenceId}"]`);

    let modified = false;
    spans.forEach((span) => {
      span.remove(); // Removes the element AND its content
      modified = true;
    });

    if (modified) {
      // Allow some empty tags that might be stripped by serializer
      const newContent = doc.body.innerHTML;
      editor.commands.setContent(newContent);
    }
  };

  const handleDelete = async () => {
    if (!tooltip.reference?.id || !onDeleteReference) return;

    const referenceId = tooltip.reference.id;

    setDeletingId(referenceId);
    try {
      const success = await onDeleteReference(referenceId);
      if (success) {
        // Remove corresponding citation spans from the TipTap editor
        removeCitationsFromTiptap(referenceId);
        setTooltip({ visible: false, x: 0, y: 0, reference: null });
      }
    } finally {
      setDeletingId(null);
    }
  };

  // Always render the section, even if empty (show at bottom of editor)
  // Removed: if (allReferences.length === 0) { return null; }

  return (
    <div
      className="references-section"
      style={{
        marginTop: '48px',
        paddingTop: '24px',
        paddingLeft: '90px',
        paddingRight: '20px',
        paddingBottom: '60px',
        borderTop: '2px solid #e5e7eb',
        fontFamily: 'Georgia, "Times New Roman", serif',
        flexShrink: 0,
        width: '100%',
        boxSizing: 'border-box',
      }}
    >
      {/* Header with title and style selector */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '24px',
        }}
      >
        <h2
          style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#1f2937',
            margin: 0,
          }}
        >
          References
        </h2>
        {/* Custom dropdown matching EditorToolbar style */}
        <div ref={dropdownRef} style={{ position: 'relative' }}>
          <button
            type="button"
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 12px',
              borderRadius: '8px',
              border: '1px solid #d1d5db',
              backgroundColor: 'white',
              fontSize: '14px',
              color: '#374151',
              cursor: 'pointer',
              outline: 'none',
            }}
          >
            <span>
              {CITATION_STYLES.find((s) => s.value === selectedStyle)?.label || 'Citation Style'}
            </span>
            <ChevronDown size={14} />
          </button>

          {isStyleDropdownOpen && (
            <div
              style={{
                position: 'absolute',
                top: '100%',
                right: 0,
                marginTop: '4px',
                width: '250px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: 'white',
                borderRadius: '8px',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
                border: '1px solid #e5e7eb',
                zIndex: 100,
              }}
            >
              {/* Search bar */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '8px 12px',
                  borderBottom: '1px solid #e5e7eb',
                }}
              >
                <Search size={14} style={{ color: '#9ca3af' }} />
                <input
                  type="text"
                  placeholder="Search citation styles..."
                  value={styleSearchQuery}
                  onChange={(e) => setStyleSearchQuery(e.target.value)}
                  onClick={(e) => e.stopPropagation()}
                  style={{
                    flex: 1,
                    border: 'none',
                    outline: 'none',
                    fontSize: '14px',
                    backgroundColor: 'transparent',
                  }}
                />
              </div>

              {/* Style options */}
              {filteredStyles.length > 0 ? (
                filteredStyles.map((style) => (
                  <button
                    key={style.value}
                    type="button"
                    onClick={() => {
                      setSelectedStyle(style.value);
                      setIsStyleDropdownOpen(false);
                      setStyleSearchQuery('');
                    }}
                    style={{
                      display: 'block',
                      width: '100%',
                      padding: '10px 12px',
                      textAlign: 'left',
                      border: 'none',
                      backgroundColor: selectedStyle === style.value ? '#f3f4f6' : 'transparent',
                      cursor: 'pointer',
                      fontSize: '14px',
                      color: '#374151',
                    }}
                    onMouseEnter={(e) => {
                      if (selectedStyle !== style.value) {
                        e.currentTarget.style.backgroundColor = '#f9fafb';
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (selectedStyle !== style.value) {
                        e.currentTarget.style.backgroundColor = 'transparent';
                      }
                    }}
                  >
                    {style.label}
                  </button>
                ))
              ) : (
                <div
                  style={{
                    padding: '10px 12px',
                    color: '#9ca3af',
                    fontSize: '14px',
                  }}
                >
                  No citation styles found
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* References list - with empty state */}
      {allReferences.length === 0 ? (
        <div
          style={{
            textAlign: 'center',
            padding: '32px 16px',
            color: '#9ca3af',
            fontSize: '14px',
          }}
        >
          <p style={{ margin: 0 }}>No citations added yet.</p>
          <p style={{ margin: '8px 0 0 0', fontSize: '13px' }}>
            Select text in the editor and click "Cite" to add citations.
          </p>
        </div>
      ) : (
        <div
          style={{
            paddingLeft: '0',
            margin: 0,
          }}
        >
          {sortedReferences.map((ref, index) => {
            // Get citation numbers for this reference
            const citNums = citationNumberMap.get(ref.id || '');
            const citationPrefix = citNums && citNums.length > 0 ? `[${citNums.join(', ')}] ` : '';

            return (
              <div
                key={ref.id || `ref-${index}`}
                style={{
                  marginBottom: '12px',
                  lineHeight: '1.6',
                  color: '#1C73FF',
                  fontSize: '14px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  gap: '12px',
                }}
                onMouseEnter={(e) => showTooltip(e, ref)}
                onMouseLeave={startHideTooltip}
              >
                <span style={{ flex: 1 }}>
                  <span style={{ fontWeight: 600, marginRight: '4px' }}>{citationPrefix}</span>
                  {ref.link ? (
                    <a
                      rel="noopener noreferrer"
                      style={{
                        color: '#1C73FF',
                        textDecoration: 'none',
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.textDecoration = 'underline';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.textDecoration = 'none';
                      }}
                    >
                      {formatReference(ref, index)}
                    </a>
                  ) : (
                    <span style={{ color: '#1C73FF' }}>{formatReference(ref, index)}</span>
                  )}
                </span>
                {/* Cite button removed from list */}
              </div>
            );
          })}
        </div>
      )}

      {/* Hover Tooltip Card */}
      {tooltip.visible && tooltip.reference && (
        <div
          style={{
            position: 'fixed',
            top: `${tooltip.y}px`,
            left: `${tooltip.x}px`,
            zIndex: 10000,
            backgroundColor: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '10px',
            padding: '16px',
            boxShadow: '0 8px 24px rgba(0, 0, 0, 0.12)',
            maxWidth: '320px',
            fontFamily: 'system-ui, -apple-system, sans-serif',
          }}
          onMouseEnter={cancelHideTooltip}
          onMouseLeave={startHideTooltip}
        >
          {/* Title */}
          <div
            style={{
              fontWeight: 500,
              fontSize: '14px',
              marginBottom: '12px',
              color: '#1f2937',
              lineHeight: 1.4,
            }}
          >
            {tooltip.reference.title}
          </div>

          {/* Source with icon */}
          <div
            style={{
              color: '#6b7280',
              fontSize: '13px',
              marginBottom: '6px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
            }}
          >
            <svg
              width="14"
              height="14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#6b7280"
              strokeWidth="2"
            >
              <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
              <polyline points="9 22 9 12 15 12 15 22" />
            </svg>
            <span>{tooltip.reference.source}</span>
          </div>

          {/* Date with calendar icon */}
          {tooltip.reference.created_at && (
            <div
              style={{
                color: '#6b7280',
                fontSize: '13px',
                marginBottom: '6px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              >
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
              <span>
                {new Date(tooltip.reference.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
          )}

          {/* Link with icon */}
          {tooltip.reference.link && (
            <div
              style={{
                color: '#6b7280',
                fontSize: '13px',
                marginBottom: '12px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
              }}
            >
              <svg
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#6b7280"
                strokeWidth="2"
              >
                <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
                <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
              </svg>
              <a
                href={tooltip.reference.link}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#6b7280',
                  textDecoration: 'none',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                  display: 'inline-block',
                }}
              >
                {(() => {
                  try {
                    return new URL(tooltip.reference.link).hostname;
                  } catch {
                    return tooltip.reference.link;
                  }
                })()}
              </a>
            </div>
          )}

          {/* Cite Button Removed as per request */}

          {/* Actions Row - Delete button only */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'flex-start',
              marginTop: '4px',
            }}
          >
            <button
              onClick={handleDelete}
              disabled={deletingId === tooltip.reference.id}
              style={{
                backgroundColor: '#12271D',
                color: 'white',
                border: 'none',
                borderRadius: '6px',
                padding: '8px 16px',
                fontSize: '13px',
                fontWeight: 500,
                cursor: deletingId === tooltip.reference.id ? 'not-allowed' : 'pointer',
                opacity: deletingId === tooltip.reference.id ? 0.7 : 1,
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
              }}
            >
              {deletingId === tooltip.reference.id ? 'Deleting...' : 'Delete'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
