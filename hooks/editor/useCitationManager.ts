'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import { Citation } from '@/types/citations';

interface CitePopupPosition {
  x: number;
  y: number;
}

interface UseCitationManagerReturn {
  // State
  citePopupVisible: boolean;
  citePopupPosition: CitePopupPosition;
  citationSelectedText: string;
  showAllLibraryReferences: boolean;

  // Actions
  handleCite: (editorInstance: Editor | null) => void;
  handleAddCitationToEditor: (
    citation: Citation,
    editorInstance: Editor | null,
    addWorkspaceReference: (citation: Citation) => Promise<string | null>,
    addCitation: (blockId: string, citation: any) => Promise<void>,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => Promise<void>;
  handleCiteFromReferences: (
    reference: any,
    editorInstance: Editor | null,
    addToast: (message: string, type: 'success' | 'error' | 'warning') => void
  ) => void;
  closeCitePopup: () => void;
  updateCitePopupPosition: (editorInstance: Editor | null) => void;
}

/**
 * Helper function to detect page number at a given editor position
 * Uses DOM traversal to find the containing .page element
 */
const getPageNumberAtPosition = (editor: Editor, pos: number): number => {
  try {
    const domInfo = editor.view.domAtPos(pos);
    let node: Node | null = domInfo.node;

    // If it's a text node, get its parent element
    if (node && node.nodeType === 3 && node.parentElement) {
      node = node.parentElement;
    }

    let current = node as HTMLElement | null;
    let maxDepth = 30; // Prevent infinite loops

    while (current && current !== document.body && maxDepth > 0) {
      // Check for .page class (TipTap Pro Pages extension)
      if (current.classList?.contains('page')) {
        const pageNum = current.getAttribute('data-page-number');
        if (pageNum) return parseInt(pageNum, 10);

        // Fallback: count pages before this one
        const documentContainer = current.closest('.tiptap-document-container') || document;
        const pages = documentContainer.querySelectorAll('.page');
        const pageIndex = Array.from(pages).indexOf(current);
        if (pageIndex >= 0) return pageIndex + 1;
      }

      // Also check for tiptap-page-break class as fallback
      if (current.classList?.contains('tiptap-page-break')) {
        const pageNum = current.getAttribute('data-page-number');
        if (pageNum) return parseInt(pageNum, 10);
      }

      current = current.parentElement;
      maxDepth--;
    }
  } catch (e) {
    console.warn('Page number detection failed:', e);
  }
  return 1; // Default to page 1 if detection fails
};

/**
 * useCitationManager - Manages citation popup state and actions
 *
 * Extracted from page components to reduce code duplication.
 * Handles opening citation popup, inserting citations, and managing popup state.
 */
export function useCitationManager(): UseCitationManagerReturn {
  const [citePopupVisible, setCitePopupVisible] = useState(false);
  const [citePopupPosition, setCitePopupPosition] = useState<CitePopupPosition>({ x: 0, y: 0 });
  const [citationSelectedText, setCitationSelectedText] = useState('');
  const [showAllLibraryReferences, setShowAllLibraryReferences] = useState(false);
  const editorInstanceRef = useRef<Editor | null>(null);
  const selectionFromRef = useRef<number | null>(null);

  /**
   * Calculates and updates the popup position based on current selection
   */
  const calculatePosition = useCallback((editorInstance: Editor | null, from: number) => {
    if (!editorInstance) return { x: 0, y: 0 };

    const start = editorInstance.view.coordsAtPos(from);
    const popupWidth = 425;
    const popupHeight = 650;
    const padding = 20;

    let x = start.left;
    let y = start.bottom + 10;

    // Ensure popup stays within viewport horizontally
    const viewportWidth = window.innerWidth;
    if (x + popupWidth > viewportWidth - padding) {
      x = viewportWidth - popupWidth - padding;
    }
    if (x < padding) {
      x = padding;
    }

    // Ensure popup stays within viewport vertically
    const viewportHeight = window.innerHeight;
    if (y + popupHeight > viewportHeight - padding) {
      // Try positioning above the selection
      y = start.top - popupHeight - 10;
      // If still doesn't fit above, position at top of viewport
      if (y < padding) {
        y = padding;
        // If popup is taller than viewport, allow it to be scrollable
        if (popupHeight > viewportHeight - 2 * padding) {
          y = padding;
        }
      }
    }
    if (y < padding) {
      y = padding;
    }

    return { x, y };
  }, []);

  /**
   * Updates the popup position based on stored selection
   */
  const updateCitePopupPosition = useCallback(
    (editorInstance: Editor | null) => {
      if (
        !editorInstance ||
        !citePopupVisible ||
        showAllLibraryReferences ||
        !selectionFromRef.current
      ) {
        return;
      }

      const newPosition = calculatePosition(editorInstance, selectionFromRef.current);
      setCitePopupPosition(newPosition);
    },
    [citePopupVisible, showAllLibraryReferences, calculatePosition]
  );

  /**
   * Opens the citation popup based on current editor selection
   */
  const handleCite = useCallback(
    (editorInstance: Editor | null) => {
      if (!editorInstance) return;

      const { from, to, empty } = editorInstance.state.selection;
      const text = !empty ? editorInstance.state.doc.textBetween(from, to) : '';

      // Calculate coordinates to check for validity
      const start = editorInstance.view.coordsAtPos(from);
      const isCoordsInvalid = start.left === 0 && start.top === 0;

      // If no text selected, very short text, or invalid coordinates, show library sidebar
      const shouldShowAllLibrary = empty || text.trim().length < 3 || isCoordsInvalid;

      if (!shouldShowAllLibrary) {
        setCitationSelectedText(text);
        editorInstanceRef.current = editorInstance;
        selectionFromRef.current = from;

        const newPosition = calculatePosition(editorInstance, from);
        setCitePopupPosition(newPosition);
      } else {
        setCitationSelectedText('');
        setCitePopupPosition({ x: 0, y: 0 });
        editorInstanceRef.current = null;
        selectionFromRef.current = null;
      }

      setShowAllLibraryReferences(shouldShowAllLibrary);
      setCitePopupVisible(true);
    },
    [calculatePosition]
  );

  /**
   * Helper function to get the next citation number by counting existing citations in editor
   */
  const getNextCitationNumber = (editorInstance: Editor): number => {
    const html = editorInstance.getHTML();
    const matches = html.match(/data-citation-number="(\d+)"/g);
    if (!matches || matches.length === 0) {
      return 1;
    }
    // Find the highest existing citation number and add 1
    const numbers = matches.map((m) => {
      const match = m.match(/data-citation-number="(\d+)"/);
      return match ? parseInt(match[1], 10) : 0;
    });
    return Math.max(...numbers) + 1;
  };

  /**
   * Inserts a citation into the editor from the popup
   */
  const handleAddCitationToEditor = useCallback(
    async (
      citation: Citation,
      editorInstance: Editor | null,
      addWorkspaceReference: (citation: Citation) => Promise<string | null>,
      addCitation: (blockId: string, citation: any) => Promise<void>,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      if (!editorInstance) {
        addToast('Editor not ready', 'error');
        return;
      }

      try {
        // Create the workspace reference via API
        const referenceId = await addWorkspaceReference(citation);

        // Get current selection info
        const { from, to } = editorInstance.state.selection;

        // Detect page number BEFORE inserting citation (using cursor position)
        const pageNumber = getPageNumberAtPosition(editorInstance, from);

        // Get the next citation number based on existing citations in editor
        const citationNumber = getNextCitationNumber(editorInstance);
        const citationText = `[${citationNumber}]`;

        // Insert citation as a styled span with data attributes (including citation number)
        const citationHtml = `<span
          class="inline-citation"
          style="color: #027FBD; cursor: pointer; text-decoration: none; font-weight: 500;"
          data-citation-link="${citation.link || ''}"
          data-reference-id="${referenceId || ''}"
          data-citation-number="${citationNumber}"
          data-citation-title="${citation.title || ''}"
          data-citation-author="${citation.author || ''}"
          data-citation-source="${citation.source || ''}"
        >${citationText}</span>`;

        // Move to end of selection and insert
        editorInstance.chain().focus().setTextSelection(to).insertContent(citationHtml).run();

        // Add citation to project metadata via API with page number
        const blockId = 'tiptap-doc';
        const citationWithRef = {
          ...citation,
          reference_id: referenceId || undefined,
          citation_number: citationNumber,
          pageNumber: pageNumber, // Include detected page number
          id: `${blockId}_${Date.now()}`,
        };
        await addCitation(blockId, citationWithRef);

        setCitePopupVisible(false);
        addToast('Citation added successfully', 'success');
      } catch (error) {
        console.error('Error adding citation:', error);
        addToast('Failed to add citation', 'error');
      }
    },
    []
  );

  /**
   * Inserts a citation from the references panel (when no text selected)
   */
  const handleCiteFromReferences = useCallback(
    (
      reference: any,
      editorInstance: Editor | null,
      addToast: (message: string, type: 'success' | 'error' | 'warning') => void
    ) => {
      if (!editorInstance) {
        addToast('Editor not ready', 'error');
        return;
      }

      try {
        const { from, to } = editorInstance.state.selection;

        // Detect page number BEFORE inserting citation
        const pageNumber = getPageNumberAtPosition(editorInstance, from);

        // Get the next citation number based on existing citations in editor
        const citationNumber = getNextCitationNumber(editorInstance);
        const citationText = `[${citationNumber}]`;

        const citationHtml = `<span
          class="inline-citation"
          style="color: #027FBD; cursor: pointer; text-decoration: none; font-weight: 500;"
          data-citation-link="${reference.link || ''}"
          data-reference-id="${reference.id || ''}"
          data-citation-number="${citationNumber}"
          data-citation-title="${reference.title || ''}"
          data-citation-source="${reference.source || ''}"
          data-citation-page="${pageNumber}"
        >${citationText}</span>`;

        editorInstance.chain().focus().setTextSelection(to).insertContent(citationHtml).run();

        addToast('Citation added successfully', 'success');
      } catch (error) {
        console.error('Error adding citation from reference:', error);
        addToast('Failed to add citation', 'error');
      }
    },
    []
  );

  /**
   * Closes the citation popup
   */
  const closeCitePopup = useCallback(() => {
    setCitePopupVisible(false);
    editorInstanceRef.current = null;
    selectionFromRef.current = null;
  }, []);

  // Update position on scroll/resize when popup is visible
  useEffect(() => {
    if (!citePopupVisible || showAllLibraryReferences || !editorInstanceRef.current) {
      return;
    }

    const updatePosition = () => {
      // Use requestAnimationFrame to batch position updates
      requestAnimationFrame(() => {
        updateCitePopupPosition(editorInstanceRef.current);
      });
    };

    // Listen to scroll events on window and editor container
    window.addEventListener('scroll', updatePosition, true);
    window.addEventListener('resize', updatePosition);

    // Find all potential scroll containers
    const editorElement = editorInstanceRef.current.view.dom;
    const scrollContainers: (Element | Window)[] = [window];

    if (editorElement) {
      // Find the editor wrapper
      let parent: Element | null = editorElement.parentElement;
      while (parent && parent !== document.body) {
        const style = window.getComputedStyle(parent);
        if (
          style.overflow === 'auto' ||
          style.overflow === 'scroll' ||
          style.overflowY === 'auto' ||
          style.overflowY === 'scroll'
        ) {
          scrollContainers.push(parent);
        }
        parent = parent.parentElement;
      }

      // Also check for common editor containers
      const commonContainers = [
        editorElement.closest('.tiptap-editor-wrapper'),
        editorElement.closest('[data-scroll-container]'),
        editorElement.closest('.editor-wrapper'),
        document.body,
      ].filter(Boolean) as Element[];

      commonContainers.forEach((container) => {
        if (!scrollContainers.includes(container)) {
          scrollContainers.push(container);
        }
      });
    }

    // Add listeners to all scroll containers
    scrollContainers.forEach((container) => {
      if (container === window) {
        container.addEventListener('scroll', updatePosition, true);
      } else {
        container.addEventListener('scroll', updatePosition, true);
      }
    });

    return () => {
      window.removeEventListener('scroll', updatePosition, true);
      window.removeEventListener('resize', updatePosition);
      scrollContainers.forEach((container) => {
        if (container !== window) {
          container.removeEventListener('scroll', updatePosition, true);
        }
      });
    };
  }, [citePopupVisible, showAllLibraryReferences, updateCitePopupPosition]);

  return {
    // State
    citePopupVisible,
    citePopupPosition,
    citationSelectedText,
    showAllLibraryReferences,

    // Actions
    handleCite,
    handleAddCitationToEditor,
    handleCiteFromReferences,
    closeCitePopup,
    updateCitePopupPosition,
  };
}

export default useCitationManager;
