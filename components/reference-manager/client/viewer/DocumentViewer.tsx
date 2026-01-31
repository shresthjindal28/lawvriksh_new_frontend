'use client';

import {
  Edit,
  Trash2,
  X,
  MoreHorizontal,
  MessageSquare,
  Send,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import Image from 'next/image';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import type { PDFDocumentProxy } from 'pdfjs-dist';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
import { Annotation } from '@/types/reference-manager';
import { highlightColors } from '../content/DocumentHeader';
import { createTempAnnotationId, darken } from '@/lib/utils/helpers';
import { Skeleton } from '@/components/ui/skeleton';

// Dynamically import react-pdf to avoid SSR issues with pdfjs-dist
const PdfDocument = dynamic(
  () =>
    import('react-pdf').then((mod) => {
      // Set worker source after module loads
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      return mod.Document;
    }),
  { ssr: false }
);

const PdfPage = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

interface DocumentViewerProps {
  highlightColor?: string | null;
  documentUrl: string;
  fileType?: 'pdf' | 'docx' | 'doc' | 'txt' | 'image';
  initialAnnotations?: Annotation[];
  onCreateAnnotation?: (annotation: Annotation) => void;
  onUpdateAnnotation?: (annotationId: string, updates: Partial<Annotation>) => void;
  onDeleteAnnotation?: (annotationId: string) => void;
  setPendingHighlight?: (highlight: any) => void;
  // Page/Zoom state callbacks for header integration
  onPageChange?: (page: number) => void;
  onNumPagesChange?: (numPages: number) => void;
  onScaleChange?: (scale: number) => void;
  externalCurrentPage?: number;
  externalScale?: number;
  scrollToAnnotationId?: string; // Annotation ID to scroll to
}

interface Highlight {
  id: string;
  pageNumber: number;
  text: string;
  color: string;
  comment: string;
  commentList?: string[];
  // PDF-native coordinates (scale-independent)
  pdfPosition: { x: number; y: number; width: number; height: number };
  pdfPositions?: { x: number; y: number; width: number; height: number }[];
  // Character positions for precise mapping
  charStart?: number;
  charEnd?: number;
  type?: 'manual_highlight' | 'manual_note' | 'auto_annotate';
  refined?: boolean;
}

interface TextItem {
  str: string;
  transform: number[];
  width: number;
  height: number;
}

const mergePdfRects = (rects: { x: number; y: number; width: number; height: number }[]) => {
  if (rects.length === 0) return { x: 0, y: 0, width: 0, height: 0 };
  let minX = Number.POSITIVE_INFINITY;
  let minY = Number.POSITIVE_INFINITY;
  let maxX = Number.NEGATIVE_INFINITY;
  let maxY = Number.NEGATIVE_INFINITY;

  for (const r of rects) {
    minX = Math.min(minX, r.x);
    minY = Math.min(minY, r.y);
    maxX = Math.max(maxX, r.x + r.width);
    maxY = Math.max(maxY, r.y + r.height);
  }

  return { x: minX, y: minY, width: Math.max(0, maxX - minX), height: Math.max(0, maxY - minY) };
};

const mergeRectsByLine = (rects: { x: number; y: number; width: number; height: number }[]) => {
  if (rects.length === 0) return [];

  // Sort rects by Y (primary) and X (secondary)
  const sortedRects = [...rects].sort((a, b) => a.y - b.y || a.x - b.x);

  const lines: { x: number; y: number; width: number; height: number }[][] = [];
  let currentLine: typeof rects = [];
  let currentY = sortedRects[0]?.y;

  // Tolerance for line grouping (5px)
  const tolerance = 5;

  for (const rect of sortedRects) {
    if (currentLine.length === 0) {
      currentLine.push(rect);
      currentY = rect.y;
      continue;
    }

    if (Math.abs(rect.y - currentY) <= tolerance) {
      currentLine.push(rect);
    } else {
      lines.push(currentLine);
      currentLine = [rect];
      currentY = rect.y;
    }
  }

  if (currentLine.length > 0) {
    lines.push(currentLine);
  }

  return lines.map((lineRects) => mergePdfRects(lineRects));
};

function CollapsibleComment({ text, onDelete }: { text: string; onDelete?: () => void }) {
  const [isExpanded, setIsExpanded] = useState(false);
  const words = text.split(/\s+/);
  const shouldTruncate = words.length > 8;

  const displayText = isExpanded
    ? text
    : words.slice(0, 8).join(' ') + (shouldTruncate ? '...' : '');

  return (
    <div className="highlight-dialog-note-item">
      {onDelete && (
        <div
          className="highlight-dialog-note-header"
          style={{ justifyContent: 'flex-end', minHeight: '18px', marginBottom: '-14px' }}
        >
          <button className="highlight-dialog-note-delete" onClick={onDelete} title="Delete note">
            <X size={14} />
          </button>
        </div>
      )}
      <p
        className="highlight-dialog-note-content"
        onClick={() => shouldTruncate && setIsExpanded(!isExpanded)}
        style={{
          cursor: shouldTruncate ? 'pointer' : 'default',
          paddingTop: onDelete ? '0' : '8px',
        }}
      >
        {displayText}
        {shouldTruncate && !isExpanded && (
          <span style={{ color: '#0073e6', marginLeft: '4px', fontSize: '11px' }}>Read more</span>
        )}
        {shouldTruncate && isExpanded && (
          <span style={{ color: '#0073e6', marginLeft: '4px', fontSize: '11px' }}>Read less</span>
        )}
      </p>
    </div>
  );
}

export function DocumentViewer({
  highlightColor,
  documentUrl,
  initialAnnotations = [],
  onCreateAnnotation,
  onUpdateAnnotation,
  onDeleteAnnotation,
  setPendingHighlight,
  onPageChange,
  onNumPagesChange,
  onScaleChange,
  externalCurrentPage,
  externalScale,
  scrollToAnnotationId,
}: DocumentViewerProps) {
  const [numPages, setNumPages] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scale, setScale] = useState<number>(1.5);
  const [fitWidth, setFitWidth] = useState(true);
  const [pdfPageSize, setPdfPageSize] = useState<{ width: number; height: number } | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(0);
  const isScrollingToAnnotationRef = useRef(false);

  // Notify parent of page changes
  useEffect(() => {
    onPageChange?.(currentPage);
  }, [currentPage, onPageChange]);

  // Notify parent of numPages changes
  useEffect(() => {
    if (numPages > 0) {
      onNumPagesChange?.(numPages);
    }
  }, [numPages, onNumPagesChange]);

  // Handle external page navigation (from header) and annotation scrolling
  useEffect(() => {
    if (
      externalCurrentPage !== undefined &&
      externalCurrentPage >= 1 &&
      externalCurrentPage <= numPages
    ) {
      const pageEl = pageRefs.current[externalCurrentPage - 1];
      if (!pageEl) return;

      // Always update current page if it's different
      const isPageChange = externalCurrentPage !== currentPage;
      if (isPageChange) {
        setCurrentPage(externalCurrentPage);
      }

      // If we have an annotation ID, scroll directly to annotation position
      if (scrollToAnnotationId) {
        // Set flag to prevent interference from intersection observer
        isScrollingToAnnotationRef.current = true;

        // Scroll to annotation after page renders
        const scrollToAnnotation = (retryCount = 0) => {
          const container = containerRef.current;
          const pageEl = pageRefs.current[externalCurrentPage - 1];

          if (!container || !pageEl) {
            // Retry if container or page not ready
            if (retryCount < 5) {
              setTimeout(() => scrollToAnnotation(retryCount + 1), 200 + retryCount * 100);
            } else {
              isScrollingToAnnotationRef.current = false;
            }
            return;
          }

          // Use double requestAnimationFrame to ensure DOM is fully updated
          requestAnimationFrame(() => {
            requestAnimationFrame(() => {
              // Try to find the annotation highlight element (it may have an index suffix)
              // Get the first one if there are multiple (for multi-line annotations)
              const annotationElement = document.querySelector(
                `[id^="highlight-${scrollToAnnotationId}"]`
              ) as HTMLElement;

              if (!annotationElement) {
                // Retry if element not found yet
                if (retryCount < 5) {
                  setTimeout(() => scrollToAnnotation(retryCount + 1), 200 + retryCount * 100);
                } else {
                  isScrollingToAnnotationRef.current = false;
                }
                return;
              }

              // Get positions after DOM is stable
              const elementRect = annotationElement.getBoundingClientRect();
              const containerRect = container.getBoundingClientRect();
              const pageRect = pageEl.getBoundingClientRect();
              const currentScrollTop = container.scrollTop;
              const offset = 100; // 100px offset from top

              // Calculate the absolute scroll position:
              // The annotation is absolutely positioned within the page
              // 1. Get the page's top position in scroll coordinates
              const pageTopInScroll = currentScrollTop + (pageRect.top - containerRect.top);

              // 2. Get the annotation's top position relative to the page (in pixels)
              // Use the element's actual position, which accounts for its absolute positioning
              const annotationTopRelativeToPage = elementRect.top - pageRect.top;

              // 3. Calculate final scroll position: page top + annotation position - offset
              const targetY = pageTopInScroll + annotationTopRelativeToPage - offset;

              // Verify the calculation makes sense (annotation should be within page bounds)
              const pageHeight = pageRect.height;
              if (annotationTopRelativeToPage < 0 || annotationTopRelativeToPage > pageHeight) {
                // If calculation seems off, retry
                if (retryCount < 3) {
                  setTimeout(() => scrollToAnnotation(retryCount + 1), 300);
                  return;
                }
              }

              // Cancel any ongoing smooth scrolls by jumping to current position first
              container.scrollTop = container.scrollTop;

              // Small delay to ensure any previous scroll is cancelled
              setTimeout(() => {
                // Perform a single smooth scroll to the exact annotation position
                const finalTargetY = Math.max(0, targetY);
                container.scrollTo({
                  top: finalTargetY,
                  behavior: 'smooth',
                });

                // Verify scroll worked after a delay
                setTimeout(() => {
                  // Check if we're close to the target (within 50px)
                  const actualScroll = container.scrollTop;
                  const scrollDiff = Math.abs(actualScroll - finalTargetY);

                  // If we're not close enough, try one more time with scrollIntoView as fallback
                  if (scrollDiff > 50 && retryCount < 2) {
                    annotationElement.scrollIntoView({
                      behavior: 'smooth',
                      block: 'center',
                      inline: 'nearest',
                    });
                  }

                  // Clear flag after scroll completes
                  isScrollingToAnnotationRef.current = false;
                }, 800);
              }, 50);
            });
          });
        };

        // If page changed, wait longer for page to fully render
        // If same page, we can scroll sooner
        const delay = isPageChange ? 600 : 300;
        setTimeout(() => scrollToAnnotation(), delay);
      } else if (isPageChange) {
        // No annotation ID, just scroll to page
        pageEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalCurrentPage, numPages, scrollToAnnotationId]);

  // Handle external scale changes (from header zoom buttons)
  useEffect(() => {
    if (externalScale !== undefined && externalScale !== scale) {
      setFitWidth(false); // Disable fit width when manually zooming
      setScale(externalScale);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [externalScale]);

  useEffect(() => {
    // If we're on mobile, default to fitting width immediately if possible, or start with smaller scale
    if (typeof window !== 'undefined' && window.innerWidth < 768) {
      setScale(0.6); // Start small on mobile to avoid blowout
    }
  }, []);

  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        if (entry.contentRect.width > 0) {
          // contentRect width excludes padding if box-sizing is content-box,
          // or includes it if border-box? ResizeObserver entry.contentRect is usually content box.
          // But let's use the element's clientWidth to be safe about available space.
          setContainerWidth(entry.contentRect.width);
        }
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (fitWidth && containerWidth && pdfPageSize) {
      // Calculate scale to fit width
      // We want some margin so it doesn't touch edges perfectly
      const margin = 0;
      const availableWidth = containerWidth - margin;
      const newScale = availableWidth / pdfPageSize.width;

      if (newScale > 0) {
        // Use setTimeout to avoid setState during render
        setTimeout(() => setScale(newScale), 0);
      }
    }
  }, [fitWidth, containerWidth, pdfPageSize]);

  // Map initialAnnotations to Highlights
  const [highlights, setHighlights] = useState<Highlight[]>(() => {
    return initialAnnotations.map((a) => ({
      id: a.id,
      pageNumber: a.locationInDocument.page,
      text: a.textSelected || '',
      color: a.highlightColor || '#ffff00',
      comment:
        (Array.isArray(a.comment) && a.comment.length > 0
          ? a.comment[a.comment.length - 1]
          : undefined) ||
        a.note ||
        '',
      commentList: Array.isArray(a.comment) ? a.comment : [],
      pdfPosition: a.locationInDocument.coordinates ||
        (() => {
          const rects = a.locationInDocument.coordinatesList || [];
          if (rects.length === 0) return null;
          let minX = Number.POSITIVE_INFINITY;
          let minY = Number.POSITIVE_INFINITY;
          let maxX = Number.NEGATIVE_INFINITY;
          let maxY = Number.NEGATIVE_INFINITY;
          for (const r of rects) {
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.width);
            maxY = Math.max(maxY, r.y + r.height);
          }
          return {
            x: minX,
            y: minY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY),
          };
        })() || { x: 0, y: 0, width: 0, height: 0 },
      pdfPositions: a.locationInDocument.coordinatesList?.length
        ? a.locationInDocument.coordinatesList
        : a.locationInDocument.coordinates
          ? [a.locationInDocument.coordinates]
          : undefined,
      charStart: a.locationInDocument.charStart,
      charEnd: a.locationInDocument.charEnd,
      type: a.type,
      refined: false,
    }));
  });

  // Update highlights when initialAnnotations change
  const prevInitialAnnotationsRef = useRef(initialAnnotations);
  useEffect(() => {
    // Only update if initialAnnotations actually changed
    if (prevInitialAnnotationsRef.current === initialAnnotations) return;
    prevInitialAnnotationsRef.current = initialAnnotations;

    const newHighlights = initialAnnotations.map((a) => ({
      id: a.id,
      pageNumber: a.locationInDocument.page,
      text: a.textSelected || '',
      color: a.highlightColor || '#ffff00',
      comment:
        (Array.isArray(a.comment) && a.comment.length > 0
          ? a.comment[a.comment.length - 1]
          : undefined) ||
        a.note ||
        '',
      commentList: Array.isArray(a.comment) ? a.comment : [],
      pdfPosition: a.locationInDocument.coordinates ||
        (() => {
          const rects = a.locationInDocument.coordinatesList || [];
          if (rects.length === 0) return null;
          let minX = Number.POSITIVE_INFINITY;
          let minY = Number.POSITIVE_INFINITY;
          let maxX = Number.NEGATIVE_INFINITY;
          let maxY = Number.NEGATIVE_INFINITY;
          for (const r of rects) {
            minX = Math.min(minX, r.x);
            minY = Math.min(minY, r.y);
            maxX = Math.max(maxX, r.x + r.width);
            maxY = Math.max(maxY, r.y + r.height);
          }
          return {
            x: minX,
            y: minY,
            width: Math.max(0, maxX - minX),
            height: Math.max(0, maxY - minY),
          };
        })() || { x: 0, y: 0, width: 0, height: 0 },
      pdfPositions: a.locationInDocument.coordinatesList?.length
        ? a.locationInDocument.coordinatesList
        : a.locationInDocument.coordinates
          ? [a.locationInDocument.coordinates]
          : undefined,
      charStart: a.locationInDocument.charStart,
      charEnd: a.locationInDocument.charEnd,
      type: a.type,
      refined: false,
    }));
    setHighlights(newHighlights);
  }, [initialAnnotations]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showMenu, setShowMenu] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ x: 0, y: 0 });
  const [selectedText, setSelectedText] = useState('');
  const [selectedRect, setSelectedRect] = useState<DOMRect | null>(null);
  const [selectedClientRects, setSelectedClientRects] = useState<DOMRect[]>([]);
  const [selectedPageNumber, setSelectedPageNumber] = useState<number | null>(null);
  const [activeHighlight, setActiveHighlight] = useState<string | null>(null);
  const [editingComment, setEditingComment] = useState<string | null>(null);
  const [commentText, setCommentText] = useState('');
  const [pdfDocument, setPdfDocument] = useState<PDFDocumentProxy | null>(null);
  const [showAllComments, setShowAllComments] = useState(false);

  useEffect(() => {
    setShowAllComments(false);
  }, [activeHighlight]);

  // We no longer store single page proxy/text content in state as we have multiple pages

  const containerRef = useRef<HTMLDivElement>(null);
  const highlightPopupRef = useRef<HTMLDivElement>(null);
  const pageRefs = useRef<(HTMLDivElement | null)[]>([]);
  const pageVisibilityRatiosRef = useRef<Record<number, number>>({});

  const getPageNumberForClientRect = (rect: DOMRect): number | null => {
    const rectCenterX = rect.left + rect.width / 2;
    const rectCenterY = rect.top + rect.height / 2;

    for (const pageEl of pageRefs.current) {
      if (!pageEl) continue;
      const pageRect = pageEl.getBoundingClientRect();
      if (
        rectCenterX >= pageRect.left &&
        rectCenterX <= pageRect.right &&
        rectCenterY >= pageRect.top &&
        rectCenterY <= pageRect.bottom
      ) {
        const pageNum = parseInt(pageEl.getAttribute('data-page-number') || '1');
        return Number.isFinite(pageNum) ? pageNum : 1;
      }
    }

    let closestPageNumber: number | null = null;
    let minDistance = Number.POSITIVE_INFINITY;

    for (const pageEl of pageRefs.current) {
      if (!pageEl) continue;
      const pageRect = pageEl.getBoundingClientRect();
      const pageCenterY = pageRect.top + pageRect.height / 2;
      const dist = Math.abs(rectCenterY - pageCenterY);
      if (dist < minDistance) {
        minDistance = dist;
        const pageNum = parseInt(pageEl.getAttribute('data-page-number') || '1');
        closestPageNumber = Number.isFinite(pageNum) ? pageNum : 1;
      }
    }

    return closestPageNumber;
  };

  const rectCenterInside = (rect: DOMRect, containerRect: DOMRect): boolean => {
    const x = rect.left + rect.width / 2;
    const y = rect.top + rect.height / 2;
    return (
      x >= containerRect.left &&
      x <= containerRect.right &&
      y >= containerRect.top &&
      y <= containerRect.bottom
    );
  };

  function onDocumentLoadSuccess({ numPages }: { numPages: number }) {
    setNumPages(numPages);
    setLoading(false);
  }

  function onDocumentLoadError(error: Error) {
    console.error('Error loading document:', error);
    setError('Failed to load document');
    setLoading(false);
  }

  // Load PDF document proxy
  useEffect(() => {
    if (documentUrl) {
      // Dynamically import pdfjs to avoid SSR issues
      import('react-pdf').then((mod) => {
        mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
        const loadingTask = mod.pdfjs.getDocument(documentUrl);
        loadingTask.promise
          .then((pdf) => {
            setPdfDocument(pdf);
          })
          .catch((err) => {
            console.error('Error loading PDF:', err);
          });
      });
    }
  }, [documentUrl]);

  // Update pdfPageSize when document is loaded
  useEffect(() => {
    if (!pdfDocument) return;

    const getPageSize = async () => {
      try {
        const page = await pdfDocument.getPage(1);
        const viewport = page.getViewport({ scale: 1 });
        setPdfPageSize({ width: viewport.width, height: viewport.height });
      } catch (error) {
        console.error('Error getting page size:', error);
      }
    };

    getPageSize();
  }, [pdfDocument]);

  // Refine highlights to ensure text matches position
  useEffect(() => {
    const refineHighlights = async () => {
      if (!pdfDocument) {
        return;
      }
      if (highlights.length === 0) return;

      const highlightsToRefine = highlights.filter(
        (h) =>
          !h.refined &&
          (h.type === 'auto_annotate' ||
            /\s*\([A-Z][a-z]+\s+(?:concurrence|dissent|concurring|dissenting).*\)\.?$/.test(h.text))
      );

      if (highlightsToRefine.length === 0) return;

      let hasChanges = false;
      const newHighlights = [...highlights];
      const CITATION_NOISE_PATTERN =
        /\s*\([A-Z][a-z]+\s+(?:concurrence|dissent|concurring|dissenting).*\)\.?$/;

      const byPage: Record<number, Highlight[]> = {};
      highlightsToRefine.forEach((h) => {
        if (!byPage[h.pageNumber]) byPage[h.pageNumber] = [];
        byPage[h.pageNumber].push(h);
      });

      for (const pageNumStr in byPage) {
        const pageNum = parseInt(pageNumStr);
        const pageHighlights = byPage[pageNum];

        try {
          const page = await pdfDocument.getPage(pageNum);
          const textContent = await page.getTextContent();
          const view = page.view;
          const pageHeight = view[3] - view[1];
          const items = textContent.items as TextItem[];

          let fullText = '';
          const charMap: { itemIndex: number; offset: number }[] = [];

          items.forEach((item, idx) => {
            const str = item.str;
            for (let i = 0; i < str.length; i++) {
              charMap.push({ itemIndex: idx, offset: i });
            }
            fullText += str;
          });

          // Create normalized text map for robust searching (ignoring whitespace)
          let normalizedFullText = '';
          const normToRawIndex: number[] = [];
          for (let i = 0; i < fullText.length; i++) {
            const char = fullText[i];
            if (!/\s/.test(char)) {
              normalizedFullText += char;
              normToRawIndex.push(i);
            }
          }

          for (const h of pageHighlights) {
            const cleanText = h.text.replace(CITATION_NOISE_PATTERN, '').trim();
            if (!cleanText) continue;

            const searchStrNormalized = cleanText.replace(/\s+/g, '');
            if (searchStrNormalized.length === 0) continue;

            // Find all occurrences in normalized text
            const matches: { start: number; end: number }[] = [];
            let pos = normalizedFullText.indexOf(searchStrNormalized);

            while (pos !== -1) {
              matches.push({
                start: pos,
                end: pos + searchStrNormalized.length,
              });
              pos = normalizedFullText.indexOf(searchStrNormalized, pos + 1);
            }

            if (matches.length === 0) {
              continue;
            }

            // Calculate rects for each match and find closest
            let bestMatchRect = h.pdfPosition;
            let minDistance = Number.MAX_VALUE;
            let foundBetterMatch = false;
            let bestMatchString = '';
            let bestMatchCharRects: { x: number; y: number; width: number; height: number }[] = [];

            const originalCenter = {
              x: h.pdfPosition.x + h.pdfPosition.width / 2,
              y: h.pdfPosition.y + h.pdfPosition.height / 2,
            };

            const isOriginalInvalid = h.pdfPosition.width === 0 && h.pdfPosition.height === 0;

            for (const match of matches) {
              // Map back to raw indices
              const rawStartIndex = normToRawIndex[match.start];
              const rawEndIndex = normToRawIndex[match.end - 1]; // inclusive

              if (
                rawStartIndex !== undefined &&
                rawEndIndex !== undefined &&
                rawEndIndex < charMap.length
              ) {
                const newRects: { x: number; y: number; width: number; height: number }[] = [];

                for (let i = rawStartIndex; i <= rawEndIndex; i++) {
                  const map = charMap[i];
                  const item = items[map.itemIndex];

                  const tx = item.transform[4];
                  const ty = item.transform[5];
                  const h_item = item.height;
                  const w_item = item.width;

                  // Estimate char width - crude but effective for standard fonts
                  const charW = w_item / item.str.length;
                  const charX = tx + map.offset * charW;

                  // Convert to Top-Left coordinate system
                  const y = pageHeight - (ty + h_item);

                  newRects.push({
                    x: charX,
                    y: y,
                    width: charW,
                    height: h_item,
                  });
                }

                const mergedRect = mergePdfRects(newRects);

                const center = {
                  x: mergedRect.x + mergedRect.width / 2,
                  y: mergedRect.y + mergedRect.height / 2,
                };
                const dist = Math.sqrt(
                  Math.pow(center.x - originalCenter.x, 2) +
                    Math.pow(center.y - originalCenter.y, 2)
                );

                if (isOriginalInvalid) {
                  if (minDistance === Number.MAX_VALUE) {
                    minDistance = 0;
                    bestMatchRect = mergedRect;
                    foundBetterMatch = true;
                    bestMatchString = fullText.substring(rawStartIndex, rawEndIndex + 1);
                    bestMatchCharRects = newRects;
                  }
                } else {
                  if (dist < minDistance) {
                    minDistance = dist;
                    bestMatchRect = mergedRect;
                    foundBetterMatch = true;
                    bestMatchString = fullText.substring(rawStartIndex, rawEndIndex + 1);
                    bestMatchCharRects = newRects;
                  }
                }
              }
            }

            if (foundBetterMatch) {
              const refinedRects = mergeRectsByLine(bestMatchCharRects);

              const idx = newHighlights.findIndex((hl) => hl.id === h.id);
              if (idx !== -1) {
                newHighlights[idx] = {
                  ...newHighlights[idx],
                  // Use the original text for display, but position is refined
                  pdfPosition: bestMatchRect,
                  pdfPositions: refinedRects,
                  refined: true,
                };
                hasChanges = true;
              }
            } else {
              const idx = newHighlights.findIndex((hl) => hl.id === h.id);
              if (idx !== -1) {
                newHighlights[idx] = { ...newHighlights[idx], refined: true };
                hasChanges = true;
              }
            }
          }
        } catch (e) {
          console.error('Error refining page ' + pageNum, e);
        }
      }

      if (hasChanges) {
        setHighlights(newHighlights);
      }
    };

    refineHighlights();
  }, [pdfDocument, highlights]);

  // Intersection Observer to update current page
  useEffect(() => {
    if (!containerRef.current) return;
    pageVisibilityRatiosRef.current = {};
    const observer = new IntersectionObserver(
      (entries) => {
        // Don't update page if we're currently scrolling to an annotation
        if (isScrollingToAnnotationRef.current) return;

        for (const entry of entries) {
          const pageNum = parseInt(entry.target.getAttribute('data-page-number') || '1');
          if (!Number.isFinite(pageNum)) continue;

          if (entry.isIntersecting && entry.intersectionRatio > 0) {
            pageVisibilityRatiosRef.current[pageNum] = entry.intersectionRatio;
          } else {
            delete pageVisibilityRatiosRef.current[pageNum];
          }
        }

        let bestPage = 1;
        let bestRatio = -1;
        for (const [pageStr, ratio] of Object.entries(pageVisibilityRatiosRef.current)) {
          const pageNum = Number(pageStr);
          if (!Number.isFinite(pageNum)) continue;
          if (ratio > bestRatio) {
            bestRatio = ratio;
            bestPage = pageNum;
          }
        }

        if (bestRatio >= 0) {
          setCurrentPage((prev) => (prev === bestPage ? prev : bestPage));
        }
      },
      {
        root: containerRef.current,
        threshold: [0, 0.1, 0.25, 0.5, 0.75, 1],
      }
    );

    pageRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => {
      observer.disconnect();
    };
  }, [numPages, loading]); // Re-run when pages are rendered

  //handle popup close when click outside for highlight-popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (highlightPopupRef.current && !highlightPopupRef.current.contains(e.target as Node)) {
        setActiveHighlight(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (showMenu) setShowMenu(false);
        if (activeHighlight) setActiveHighlight(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showMenu, activeHighlight]);

  // Convert viewport coordinates to PDF coordinates
  const viewportToPdfCoords = (
    viewportRect: DOMRect,
    containerRect: DOMRect
  ): { x: number; y: number; width: number; height: number } | null => {
    // Get position relative to PDF page container
    const relativeX = viewportRect.left - containerRect.left;
    const relativeY = viewportRect.top - containerRect.top;

    // Convert to PDF coordinates (unscaled)
    const pdfX = relativeX / scale;
    const pdfY = relativeY / scale;
    const pdfWidth = viewportRect.width / scale;
    const pdfHeight = viewportRect.height / scale;

    return {
      x: pdfX,
      y: pdfY,
      width: pdfWidth,
      height: pdfHeight,
    };
  };

  // Convert PDF coordinates back to viewport coordinates
  const pdfToViewportCoords = (pdfCoords: {
    x: number;
    y: number;
    width: number;
    height: number;
  }): { x: number; y: number; width: number; height: number } => {
    return {
      x: pdfCoords.x * scale,
      y: pdfCoords.y * scale,
      width: pdfCoords.width * scale,
      height: pdfCoords.height * scale,
    };
  };

  // Find character positions in text content
  const findCharacterPositions = (
    selectedText: string,
    textContent: any
  ): { charStart: number; charEnd: number } | null => {
    if (!textContent) return null;

    let fullText = '';
    const items = textContent.items as TextItem[];

    for (const item of items) {
      fullText += item.str;
    }

    const charStart = fullText.indexOf(selectedText);
    if (charStart === -1) return null;

    return {
      charStart,
      charEnd: charStart + selectedText.length,
    };
  };

  // Handle text selection with double-click, mouseup, or touchend
  useEffect(() => {
    const handleSelectionChange = () => {
      setTimeout(() => {
        const sel = window.getSelection();
        if (sel && sel.toString().trim().length > 0) {
          const range = sel.getRangeAt(0);
          const rect = range.getBoundingClientRect();
          const rects = Array.from(range.getClientRects()).filter(
            (r) => r.width > 1 && r.height > 1
          );

          setSelectedText(sel.toString().trim());
          setSelectedRect(rect);
          setSelectedClientRects(rects);
          const rectForPage = rects[0] || rect;
          setSelectedPageNumber(getPageNumberForClientRect(rectForPage));

          // Adjust menu position for mobile (add some vertical offset for touch)
          const isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
          const yOffset = isTouch ? -40 : -10;

          setMenuPosition({ x: rect.left + rect.width / 2, y: rect.top + yOffset });
          setShowMenu(true);
        }
      }, 10);
    };

    const handleClearSelection = (e: Event) => {
      const target = e.target as HTMLElement;
      if (!target.closest('.highlight-menu') && !target.closest('.highlight-popup')) {
        setShowMenu(false);
      }
    };

    document.addEventListener('mouseup', handleSelectionChange);
    document.addEventListener('touchend', handleSelectionChange);
    document.addEventListener('mousedown', handleClearSelection);
    document.addEventListener('touchstart', handleClearSelection);

    return () => {
      document.removeEventListener('mouseup', handleSelectionChange);
      document.removeEventListener('touchend', handleSelectionChange);
      document.removeEventListener('mousedown', handleClearSelection);
      document.removeEventListener('touchstart', handleClearSelection);
    };
  }, []);

  // Helper to get page details from selection
  const getPageDetailsFromSelection = async () => {
    if (!selectedText || !pdfDocument) return null;

    const fallbackRect = selectedClientRects[0] || selectedRect;
    const resolvedPageNumber =
      selectedPageNumber ??
      (fallbackRect ? getPageNumberForClientRect(fallbackRect) : null) ??
      currentPage ??
      1;

    const pageWrapper = pageRefs.current[resolvedPageNumber - 1] as HTMLElement | null;
    if (!pageWrapper) return null;

    const pageNumber = parseInt(
      pageWrapper.getAttribute('data-page-number') || String(resolvedPageNumber)
    );
    const containerRect = pageWrapper.getBoundingClientRect();

    const pageProxy = await pdfDocument.getPage(pageNumber);
    const textContent = await pageProxy.getTextContent();

    return { pageNumber, containerRect, pageProxy, textContent };
  };

  // Create highlight (Add Note)
  const createHighlight = async () => {
    if (!selectedText || !highlightColor) return;
    const sourceRects =
      selectedClientRects.length > 0 ? selectedClientRects : selectedRect ? [selectedRect] : [];
    if (sourceRects.length === 0) return;

    const details = await getPageDetailsFromSelection();
    if (!details) return;

    const { pageNumber, containerRect, textContent } = details;

    const pageRects = sourceRects.filter((r) => rectCenterInside(r, containerRect));
    const pdfPositions = (pageRects.length > 0 ? pageRects : sourceRects)
      .map((r) => viewportToPdfCoords(r, containerRect))
      .filter((r): r is { x: number; y: number; width: number; height: number } => r !== null);
    if (pdfPositions.length === 0) return;
    const pdfPosition = mergePdfRects(pdfPositions);

    const charPositions = findCharacterPositions(selectedText, textContent);

    const highlight: Highlight = {
      id: createTempAnnotationId(),
      pageNumber: pageNumber,
      text: selectedText,
      color: highlightColor,
      comment: '',
      commentList: [],
      pdfPosition,
      pdfPositions,
      charStart: charPositions?.charStart,
      charEnd: charPositions?.charEnd,
      type: 'manual_note',
      refined: true,
    };

    // Show visually immediately
    setHighlights((prev) => [...prev, highlight]);

    // Pass to parent to trigger InfoPanel input
    if (setPendingHighlight) {
      setPendingHighlight(highlight);
    } else {
      // Fallback for independent usage if any
    }

    setShowMenu(false);
    setSelectedText('');
    setSelectedRect(null);
    setSelectedClientRects([]);
    setSelectedPageNumber(null);
    window.getSelection()?.removeAllRanges();
  };

  const createHighlightedText = async () => {
    if (!selectedText || !highlightColor) return;
    const sourceRects =
      selectedClientRects.length > 0 ? selectedClientRects : selectedRect ? [selectedRect] : [];
    if (sourceRects.length === 0) return;

    const details = await getPageDetailsFromSelection();
    if (!details) return;

    const { pageNumber, containerRect, textContent } = details;

    const pageRects = sourceRects.filter((r) => rectCenterInside(r, containerRect));
    const pdfPositions = (pageRects.length > 0 ? pageRects : sourceRects)
      .map((r) => viewportToPdfCoords(r, containerRect))
      .filter((r): r is { x: number; y: number; width: number; height: number } => r !== null);
    if (pdfPositions.length === 0) return;
    const pdfPosition = mergePdfRects(pdfPositions);

    const charPositions = findCharacterPositions(selectedText, textContent);

    const highlight: Highlight = {
      id: createTempAnnotationId(),
      pageNumber: pageNumber,
      text: selectedText,
      color: highlightColor,
      comment: '',
      pdfPosition,
      pdfPositions,
      charStart: charPositions?.charStart,
      charEnd: charPositions?.charEnd,
      type: 'manual_highlight',
      refined: true,
    };

    setHighlights((prev) => [...prev, highlight]);

    // Save to database via callback
    onCreateAnnotation?.({
      id: highlight.id,
      textSelected: highlight.text,
      note: '',
      createdAt: new Date().toISOString(),
      createdBy: '',
      type: 'manual_highlight',
      highlightColor: highlight.color,
      locationInDocument: {
        page: pageNumber,
        coordinates: pdfPosition,
        coordinatesList: pdfPositions,
        charStart: charPositions?.charStart,
        charEnd: charPositions?.charEnd,
      },
    });

    setShowMenu(false);
    setSelectedText('');
    setSelectedRect(null);
    setSelectedClientRects([]);
    setSelectedPageNumber(null);
    window.getSelection()?.removeAllRanges();
  };

  // Delete highlight
  const deleteHighlight = (id: string) => {
    setHighlights(highlights.filter((h) => h.id !== id));
    setActiveHighlight(null);
    onDeleteAnnotation?.(id);
  };

  // Update comment
  const updateComment = async (id: string) => {
    // Update local state immediately for responsive UI
    const updatedHighlights = highlights.map((h) => {
      if (h.id !== id) return h;
      const existingList = h.commentList || [];
      const newList = [...existingList, commentText];
      return { ...h, comment: commentText, commentList: newList };
    });
    setHighlights(updatedHighlights);

    // Call parent callback to update context state and trigger API call
    const target = updatedHighlights.find((h) => h.id === id);
    if (target) {
      onUpdateAnnotation?.(id, {
        comment: target.commentList || [],
      });
    }

    setEditingComment(null);
    setCommentText('');
  };

  const deleteComment = async (highlightId: string, index: number) => {
    const updatedHighlights = highlights.map((h) => {
      if (h.id !== highlightId) return h;
      const existingList = h.commentList || [];
      const newList = existingList.filter((_, i) => i !== index);
      const latestComment = newList.length > 0 ? newList[newList.length - 1] : '';
      return { ...h, comment: latestComment, commentList: newList };
    });
    setHighlights(updatedHighlights);

    const target = updatedHighlights.find((h) => h.id === highlightId);
    if (target) {
      onUpdateAnnotation?.(highlightId, {
        comment: target.commentList || [],
      });
    }
  };

  const changeHighlightColor = async (id: string, newColor: string) => {
    // Update local state immediately for responsive UI
    setHighlights(highlights.map((h) => (h.id === id ? { ...h, color: newColor } : h)));

    // Call parent callback to update context state
    onUpdateAnnotation?.(id, { highlightColor: newColor });
  };
  const setPageRef = useCallback(
    (index: number) => (el: HTMLDivElement | null) => {
      pageRefs.current[index] = el;
    },
    []
  );

  // Pinch Zoom State & Handlers
  const [pinchScale, setPinchScale] = useState(1);
  const touchStartDist = useRef<number | null>(null);
  const touchStartScale = useRef<number>(1);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      touchStartDist.current = dist;
      touchStartScale.current = scale;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchStartDist.current) {
      const dist = Math.hypot(
        e.touches[0].clientX - e.touches[1].clientX,
        e.touches[0].clientY - e.touches[1].clientY
      );
      const factor = dist / touchStartDist.current;
      setPinchScale(factor);
    }
  };

  const handleTouchEnd = () => {
    if (touchStartDist.current) {
      const finalScale = touchStartScale.current * pinchScale;
      // Clamp scale between 0.5 and 3.0
      setScale(Math.max(0.5, Math.min(finalScale, 3.0)));
      setPinchScale(1);
      touchStartDist.current = null;
    }
  };

  // Render PDF
  const renderPDF = () => (
    <div
      className="pdf-container"
      style={{
        height: '100%',
        transform: `scale(${pinchScale})`,
        transformOrigin: 'top center',
        transition: pinchScale === 1 ? 'transform 0.1s ease-out' : 'none',
      }}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <PdfDocument
        file={documentUrl}
        onLoadSuccess={onDocumentLoadSuccess}
        onLoadError={onDocumentLoadError}
        loading={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
              height: '100%',
              overflowY: 'auto',
            }}
          >
            {/* Simulate 3 pages loading */}
            {[1, 2, 3].map((page) => (
              <div
                key={page}
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '24px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                {/* Page header */}
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 flex-1" />
                </div>

                {/* Content lines */}
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-4/5" />

                <div style={{ height: '16px' }} />

                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />

                <div style={{ height: '16px' }} />

                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
              </div>
            ))}

            {/* Loading text */}
            <div
              style={{
                textAlign: 'center',
                color: '#6b7280',
                fontSize: '14px',
                marginTop: '8px',
              }}
            >
              Loading PDF...
            </div>
          </div>
        }
      >
        {Array.from(new Array(numPages), (_, index) => {
          const pageNum = index + 1;
          // Compute the effective scale for this page (used for key to force re-render)
          const effectiveScale =
            fitWidth && containerWidth && pdfPageSize ? containerWidth / pdfPageSize.width : scale;
          return (
            <div
              key={`page_${pageNum}`}
              className="page-wrapper"
              data-page-number={pageNum}
              ref={setPageRef(index)}
              style={{ position: 'relative', marginBottom: '20px' }}
            >
              <PdfPage
                key={`page_canvas_${pageNum}_${effectiveScale.toFixed(3)}`}
                pageNumber={pageNum}
                scale={effectiveScale}
                renderTextLayer
                renderAnnotationLayer
                devicePixelRatio={typeof window !== 'undefined' ? window.devicePixelRatio : 1}
              />
              {/* Render highlight overlays for this page */}
              {highlights
                .filter((h) => h.pageNumber === pageNum)
                .map((highlight) => {
                  const viewportPos = pdfToViewportCoords(highlight.pdfPosition);
                  const rectsToRender =
                    highlight.pdfPositions && highlight.pdfPositions.length > 0
                      ? highlight.pdfPositions
                      : [highlight.pdfPosition];

                  return (
                    <div key={highlight.id}>
                      {rectsToRender.map((pdfRect, idx) => {
                        const rectViewportPos = pdfToViewportCoords(pdfRect);
                        return (
                          <div key={`${highlight.id}_${idx}`}>
                            <div
                              className="line-highlight"
                              style={{
                                position: 'absolute',
                                left: rectViewportPos.x,
                                top: rectViewportPos.y,
                                width: rectViewportPos.width,
                                height: rectViewportPos.height,
                                backgroundColor: highlight.color,
                                opacity: 0.9,
                                mixBlendMode: 'multiply',
                                pointerEvents: 'none',
                                zIndex: 0,
                              }}
                            />
                            <div
                              id={`highlight-${highlight.id}-${idx}`}
                              className={`annotation-highlight ${activeHighlight === highlight.id ? 'is-active' : ''}`}
                              style={{
                                left: rectViewportPos.x,
                                top: rectViewportPos.y,
                                width: rectViewportPos.width,
                                height: rectViewportPos.height,
                                backgroundColor: highlight.color,
                              }}
                              onClick={(e) => {
                                e.stopPropagation();
                                setActiveHighlight(
                                  activeHighlight === highlight.id ? null : highlight.id
                                );
                              }}
                            />
                          </div>
                        );
                      })}

                      {/* Highlight Notes Dialog */}
                      {activeHighlight === highlight.id && (
                        <div
                          className="highlight-popup"
                          style={{
                            left: viewportPos.x,
                            top: viewportPos.y + viewportPos.height + 10,
                          }}
                          ref={highlightPopupRef}
                          role="dialog"
                          aria-label="Highlight notes"
                        >
                          {/* Header */}
                          <div className="highlight-dialog-header">
                            <div className="highlight-dialog-header-left">
                              <div className="highlight-dialog-header-row">
                                <span className="highlight-dialog-icon">
                                  <svg
                                    width="100%"
                                    height="100%"
                                    viewBox="0 0 14 14"
                                    fill="none"
                                    xmlns="http://www.w3.org/2000/svg"
                                  >
                                    <path
                                      d="M12.6875 4.21765C12.6881 3.78832 12.5213 3.38465 12.2174 3.08132L10.9177 1.78171C10.6138 1.47838 10.2113 1.31094 9.78137 1.31152C9.35204 1.31211 8.94892 1.48007 8.64675 1.78399L1.44025 9.02374C1.358 9.10599 1.3125 9.21686 1.3125 9.33236V12.249C1.3125 12.4905 1.5085 12.6865 1.75 12.6865H4.66667C4.78217 12.6865 4.89361 12.6404 4.97528 12.5593L12.215 5.35228C12.5195 5.05011 12.6869 4.64699 12.6875 4.21765ZM4.4858 11.8121H2.1875V9.5138L7.43337 4.24393L9.75631 6.56615L4.4858 11.8121ZM11.5979 4.73277L10.3764 5.949L8.0506 3.62385L9.26683 2.40179C9.40449 2.26354 9.58766 2.18768 9.78308 2.18709H9.78365C9.97848 2.18709 10.1617 2.26291 10.2999 2.40058L11.5996 3.70026C11.7373 3.83851 11.8131 4.02167 11.8131 4.21708C11.8125 4.41192 11.7361 4.5951 11.5979 4.73277ZM12.6875 12.2496C12.6875 12.4911 12.4915 12.6871 12.25 12.6871H8.16667C7.92517 12.6871 7.72917 12.4911 7.72917 12.2496C7.72917 12.0081 7.92517 11.8121 8.16667 11.8121H12.25C12.4915 11.8121 12.6875 12.0081 12.6875 12.2496Z"
                                      fill="#111113"
                                    />
                                  </svg>
                                </span>
                                <span className="highlight-dialog-user">
                                  {highlight.type === 'auto_annotate'
                                    ? 'Auto-Annotated'
                                    : highlight.type === 'manual_note'
                                      ? 'Manual Note'
                                      : 'Text Highlight'}
                                </span>
                              </div>
                            </div>
                            <div className="highlight-dialog-header-actions">
                              <button
                                className="highlight-dialog-action-btn highlight-dialog-close-btn"
                                onClick={() => setActiveHighlight(null)}
                                title="Close"
                              >
                                <X size={16} />
                              </button>
                            </div>
                          </div>

                          {/* Color Picker */}
                          <div className="highlight-dialog-colors">
                            {highlightColors.map((colour) => (
                              <button
                                key={colour.id}
                                type="button"
                                className={`highlight-color-dot ${highlight.color === colour.value ? 'active' : ''}`}
                                style={{ backgroundColor: colour.value }}
                                onClick={() => changeHighlightColor(highlight.id, colour.value)}
                                title={colour.label}
                                aria-label={`Set highlight color to ${colour.label}`}
                              />
                            ))}
                          </div>

                          <hr className="highlight-dialog-divider" />

                          {/* Notes Section */}
                          <div className="highlight-dialog-notes">
                            {highlight.commentList && highlight.commentList.length > 0 ? (
                              <>
                                {(showAllComments
                                  ? highlight.commentList
                                  : highlight.commentList.slice(0, 5)
                                ).map((comment, index) => (
                                  <CollapsibleComment
                                    key={index}
                                    text={comment}
                                    onDelete={() => deleteComment(highlight.id, index)}
                                  />
                                ))}
                                {highlight.commentList.length > 5 && !showAllComments && (
                                  <button
                                    className="highlight-dialog-read-more"
                                    onClick={() => setShowAllComments(true)}
                                  >
                                    Read more ({highlight.commentList.length - 5} more)
                                  </button>
                                )}
                                {showAllComments && (
                                  <button
                                    className="highlight-dialog-read-more"
                                    onClick={() => setShowAllComments(false)}
                                  >
                                    Show less
                                  </button>
                                )}
                              </>
                            ) : (
                              <div className="highlight-dialog-empty">
                                <MessageSquare size={24} className="highlight-dialog-empty-icon" />
                                <span>Comments will appear here</span>
                              </div>
                            )}
                          </div>

                          <hr className="highlight-dialog-divider" />

                          {/* Input Section */}
                          <div className="highlight-dialog-input">
                            <textarea
                              className="highlight-dialog-textarea"
                              placeholder="Type your comment..."
                              value={commentText}
                              onChange={(e) => setCommentText(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                  e.preventDefault();
                                  if (commentText.trim()) {
                                    updateComment(highlight.id);
                                  }
                                }
                              }}
                            />
                            <div className="highlight-dialog-input-actions">
                              <button
                                className="highlight-dialog-send-btn"
                                disabled={!commentText.trim()}
                                onClick={() => {
                                  if (commentText.trim()) {
                                    updateComment(highlight.id);
                                  }
                                }}
                                title="Send comment"
                                aria-label="Send comment"
                              >
                                <Send size={14} />
                                Send
                              </button>
                            </div>
                          </div>

                          <hr className="highlight-dialog-divider" />

                          {/* Delete Highlight Button */}
                          <button
                            className="highlight-dialog-delete-highlight"
                            onClick={() => deleteHighlight(highlight.id)}
                          >
                            <Trash2 size={16} />
                            Delete Highlight
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })}
            </div>
          );
        })}
      </PdfDocument>

      {/* Selection menu */}
      {showMenu && highlightColor && (
        <div
          className="highlight-menu"
          style={{
            left: menuPosition.x,
            top: menuPosition.y,
          }}
          role="menu"
          aria-label="Selection actions"
        >
          <button
            className="highlight-button"
            onClick={createHighlightedText}
            type="button"
            aria-label="Create text highlight"
          >
            <span>
              <svg
                width="100%"
                height="100%"
                viewBox="0 0 14 14"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <g id="pen-line">
                  <path
                    id="pen-line_2"
                    d="M12.6875 4.21765C12.6881 3.78832 12.5213 3.38465 12.2174 3.08132L10.9177 1.78171C10.6138 1.47838 10.2113 1.31094 9.78137 1.31152C9.35204 1.31211 8.94892 1.48007 8.64675 1.78399L1.44025 9.02374C1.358 9.10599 1.3125 9.21686 1.3125 9.33236V12.249C1.3125 12.4905 1.5085 12.6865 1.75 12.6865H4.66667C4.78217 12.6865 4.89361 12.6404 4.97528 12.5593L12.215 5.35228C12.5195 5.05011 12.6869 4.64699 12.6875 4.21765ZM4.4858 11.8121H2.1875V9.5138L7.43337 4.24393L9.75631 6.56615L4.4858 11.8121ZM11.5979 4.73277L10.3764 5.949L8.0506 3.62385L9.26683 2.40179C9.40449 2.26354 9.58766 2.18768 9.78308 2.18709H9.78365C9.97848 2.18709 10.1617 2.26291 10.2999 2.40058L11.5996 3.70026C11.7373 3.83851 11.8131 4.02167 11.8131 4.21708C11.8125 4.41192 11.7361 4.5951 11.5979 4.73277ZM12.6875 12.2496C12.6875 12.4911 12.4915 12.6871 12.25 12.6871H8.16667C7.92517 12.6871 7.72917 12.4911 7.72917 12.2496C7.72917 12.0081 7.92517 11.8121 8.16667 11.8121H12.25C12.4915 11.8121 12.6875 12.0081 12.6875 12.2496Z"
                    fill="#44444B"
                  />
                </g>
              </svg>
            </span>
            <p>Text Highlight</p>
          </button>
          <button
            className="highlight-button"
            onClick={createHighlight}
            type="button"
            aria-label="Add note"
          >
            <span>
              <Image src="/assets/svgs/file-plus-black.svg" alt="pen" width={16} height={16} />
            </span>
            <p>Add Note</p>
          </button>
        </div>
      )}
    </div>
  );

  if (error) {
    return (
      <div className="document-viewer error">
        <p>{error}</p>
      </div>
    );
  }

  return (
    <div className="document-viewer" ref={containerRef}>
      {renderPDF()}
    </div>
  );
}
