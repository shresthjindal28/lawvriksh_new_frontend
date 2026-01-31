/**
 * Utility functions for AnalysisSidebar components
 */

/**
 * Truncate text to a maximum length, adding ellipsis if truncated
 */
export const truncateText = (text: string, maxLength: number): string => {
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

/**
 * Extract verdict type from verdict string
 * e.g., "invalid (legal_claim)" -> "invalid"
 * e.g., "inaccurate (missing_evidence, ...)" -> "inaccurate"
 */
export const getVerdictType = (
  verdict: string
): 'accurate' | 'inaccurate' | 'invalid' | 'unverifiable' | 'other' => {
  const v = (verdict || '').toLowerCase().trim();
  if (v === 'accurate' || v.startsWith('accurate ')) return 'accurate';
  if (v.startsWith('inaccurate')) return 'inaccurate';
  if (v.startsWith('invalid')) return 'invalid';
  if (v.startsWith('unverifiable') || v === 'soft_accurate') return 'unverifiable';
  return 'other';
};

/**
 * Calculate a viewport-safe position for hover cards
 */
export const calculateViewportSafePosition = (
  targetRect: DOMRect,
  cardWidth: number,
  cardHeight: number,
  margin: number = 10
): { x: number; y: number; placement: 'top' | 'bottom' } => {
  const viewportWidth = window.innerWidth;
  const viewportHeight = window.innerHeight;

  let left = targetRect.left;
  let top = targetRect.bottom + 8; // Default below
  let placement: 'top' | 'bottom' = 'bottom';

  // Horizontal clamping
  if (left + cardWidth > viewportWidth - margin) {
    left = viewportWidth - cardWidth - margin;
  }
  if (left < margin) {
    left = margin;
  }

  // Vertical adjustment
  const spaceBelow = viewportHeight - targetRect.bottom - margin;
  // If not enough space below AND more space above, flip
  if (spaceBelow < cardHeight && targetRect.top > cardHeight + margin) {
    // Set top to the top of the target element - the component will use translateY(-100%)
    // to move the card up by its own height, so we just need to position at targetRect.top
    top = targetRect.top - 8;
    placement = 'top';

    // Safety check - ensure card won't go above viewport after translateY
    if (top - cardHeight < margin) {
      // Not enough space above either - show below anyway
      top = targetRect.bottom + 8;
      placement = 'bottom';
    }
  }

  return { x: left, y: top, placement };
};

/**
 * Extract text content from HTML with proper block separation
 */
export const extractTextFromHTML = (html: string): string => {
  if (typeof window === 'undefined') return '';

  const div = document.createElement('div');
  div.innerHTML = html;

  // Helper to recursively extract text with block awareness
  const getTextWithSpacing = (node: Node): string => {
    if (node.nodeType === Node.TEXT_NODE) {
      return node.textContent || '';
    }
    if (node.nodeType !== Node.ELEMENT_NODE) {
      return '';
    }

    const element = node as HTMLElement;
    let text = '';
    const blockTags = ['P', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'LI', 'TR'];
    const isBlock = blockTags.includes(element.tagName);

    // Process children
    for (let i = 0; i < node.childNodes.length; i++) {
      text += getTextWithSpacing(node.childNodes[i]);
    }

    // Add spacing after block elements if they aren't empty
    if (isBlock && text.trim().length > 0) {
      return text + '\n\n';
    }

    // Add newline for BR
    if (element.tagName === 'BR') {
      return '\n';
    }

    return text;
  };

  return getTextWithSpacing(div);
};

/**
 * Priority colors for argument highlighting - sequential assignment
 */
export const PRIORITY_COLORS = [
  '#00BFFF',
  '#A855F7',
  '#FF00FF',
  '#FFBF00',
  '#00E5EE',
  '#2E5BFF',
  '#8F00FF',
  '#EC4899',
  '#FF6600',
  '#00B7EB',
  '#0038A8',
  '#4B0082',
  '#C026D3',
  '#DAA520',
  '#008080',
];

export const EXTENDED_COLORS = [
  '#A020F0',
  '#C71585',
  '#FF69B4',
  '#9966CC',
  '#FF7F50',
  '#40E0D0',
  '#D02090',
  '#E6E6FA',
  '#FF9933',
  '#1C39BB',
  '#DA70D6',
  '#ED872D',
  '#1E90FF',
];

export const ALL_HIGHLIGHT_COLORS = [...PRIORITY_COLORS, ...EXTENDED_COLORS];

/**
 * Get color by index for argument highlighting
 */
export const getColorByIndex = (idx: number): string => {
  return ALL_HIGHLIGHT_COLORS[idx % ALL_HIGHLIGHT_COLORS.length];
};

/**
 * Legal terms for search autocomplete
 */
export const LEGAL_TERMS = [
  'Constitutional Law',
  'Criminal Procedure',
  'Civil Procedure',
  'Evidence Act',
  'Contract Law',
  'Family Law',
  'Intellectual Property',
  'Arbitration',
  'Corporate Law',
  'Taxation',
  'Labor Law',
  'Environmental Law',
  'Human Rights',
  'Cyber Law',
  'Banking Law',
  'Insurance Law',
];
