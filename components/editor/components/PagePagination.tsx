import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';

type PagePaginationProps = {
  editor: any;
};

interface PageInfo {
  current: number;
  total: number;
}

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));

export function PagePagination({ editor }: PagePaginationProps) {
  const [pageInfo, setPageInfo] = useState<PageInfo>({ current: 1, total: 1 });
  const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const scrollContainerRef = useRef<Element | null>(null);

  // Calculate current page based on scroll position and visible page elements
  const calculateCurrentPage = useCallback(() => {
    if (!editor?.view?.dom) return { current: 1, total: 1 };

    // Find the scroll container - check multiple possible containers
    const scrollContainer =
      scrollContainerRef.current ||
      editor.view.dom.closest('.ai-drafting-editor-scroll') ||
      editor.view.dom.closest('.tiptap-document-container') ||
      editor.view.dom.closest('.tiptap-editor-wrapper')?.parentElement;

    if (!scrollContainer) return { current: 1, total: 1 };

    // Cache the scroll container
    scrollContainerRef.current = scrollContainer;

    // Find all page elements (page breaks create visual page separations)
    const pageElements = editor.view.dom.querySelectorAll('.tiptap-page-break');
    const total = Math.max(1, pageElements.length);

    if (total <= 1) {
      return { current: 1, total: 1 };
    }

    // Get the scroll position relative to the container
    const scrollTop = scrollContainer.scrollTop;
    const containerRect = scrollContainer.getBoundingClientRect();
    const viewportMiddle = containerRect.top + containerRect.height / 3; // Use top third as reference

    // Find which page is currently visible
    let currentPage = 1;

    for (let i = 0; i < pageElements.length; i++) {
      const pageElement = pageElements[i] as HTMLElement;
      const pageRect = pageElement.getBoundingClientRect();

      // Check if this page is at or above the viewport reference point
      if (pageRect.top <= viewportMiddle) {
        currentPage = i + 1;
      } else {
        break;
      }
    }

    return { current: Math.max(1, currentPage), total };
  }, [editor]);

  const updatePageInfo = useCallback(() => {
    if (!editor?.view) return;

    const { current, total } = calculateCurrentPage();

    setPageInfo((prev) =>
      prev.current === current && prev.total === total ? prev : { current, total }
    );
  }, [editor, calculateCurrentPage]);

  // Update on editor changes
  useEffect(() => {
    if (!editor) return;

    // Initial update after a small delay to let pagination render
    const initTimeout = setTimeout(updatePageInfo, 300);

    editor.on('update', updatePageInfo);
    editor.on('selectionUpdate', updatePageInfo);

    return () => {
      clearTimeout(initTimeout);
      editor.off('update', updatePageInfo);
      editor.off('selectionUpdate', updatePageInfo);
    };
  }, [editor, updatePageInfo]);

  // Update on scroll - attach to multiple possible scroll containers
  useEffect(() => {
    if (!editor?.view?.dom) return;

    // Find the correct scroll container
    const editorDom = editor.view.dom;
    const scrollContainer =
      editorDom.closest('.ai-drafting-editor-scroll') ||
      editorDom.closest('.tiptap-document-container') ||
      editorDom.closest('.tiptap-editor-wrapper')?.parentElement;

    if (!scrollContainer) return;

    scrollContainerRef.current = scrollContainer;

    const handleScroll = () => {
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      // Use a short debounce for smooth updates
      scrollTimeoutRef.current = setTimeout(updatePageInfo, 30);
    };

    scrollContainer.addEventListener('scroll', handleScroll, { passive: true });

    return () => {
      scrollContainer.removeEventListener('scroll', handleScroll);
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
    };
  }, [editor, updatePageInfo]);

  const scrollToPage = useCallback(
    (page: number) => {
      if (!editor?.view?.dom) return;

      const targetPage = clamp(page, 1, pageInfo.total || 1);

      // Find all page break elements
      const pages = editor.view.dom.querySelectorAll('.tiptap-page-break');

      if (pages.length === 0) return;

      const targetElement = pages[targetPage - 1] as HTMLElement | undefined;

      if (targetElement) {
        // Use the cached scroll container or find it
        const scrollContainer =
          scrollContainerRef.current ||
          editor.view.dom.closest('.ai-drafting-editor-scroll') ||
          editor.view.dom.closest('.tiptap-document-container');

        if (scrollContainer) {
          // Calculate the scroll position
          const containerRect = scrollContainer.getBoundingClientRect();
          const targetRect = targetElement.getBoundingClientRect();
          const scrollTop = scrollContainer.scrollTop;
          const offset = targetRect.top - containerRect.top + scrollTop;

          scrollContainer.scrollTo({
            top: offset,
            behavior: 'smooth',
          });
        } else {
          // Fallback to scrollIntoView
          targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }

        // Update page info after scrolling
        setTimeout(updatePageInfo, 100);
      }
    },
    [editor, pageInfo.total, updatePageInfo]
  );

  const handlePrev = () => {
    scrollToPage(pageInfo.current - 1);
  };

  const handleNext = () => {
    scrollToPage(pageInfo.current + 1);
  };

  if (!editor) return null;

  return (
    <div className="page-pagination">
      <button
        type="button"
        className="page-pagination-btn"
        onClick={handlePrev}
        disabled={pageInfo.current <= 1}
      >
        <ChevronLeft size={16} />
      </button>
      <span className="page-pagination-label">
        Page {pageInfo.current} of {pageInfo.total}
      </span>
      <button
        type="button"
        className="page-pagination-btn"
        onClick={handleNext}
        disabled={pageInfo.current >= pageInfo.total}
      >
        <ChevronRight size={16} />
      </button>
    </div>
  );
}
