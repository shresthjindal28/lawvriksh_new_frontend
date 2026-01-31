import {
  Book,
  ChevronUp,
  FileText,
  Gavel,
  Globe,
  GraduationCap,
  Library,
  Link,
  MessageSquareQuote,
  Newspaper,
  Plus,
  Scale,
} from 'lucide-react';
import { Root } from 'react-dom/client';
import { createRoot } from 'react-dom/client';
import { truncateText } from './helpers';
import React, { useCallback, memo, useState, useEffect } from 'react';
import Image from 'next/image';
import { Citation, CitationsDisplayData } from '@/types/citations';

// Favicon utility function with error handling
function getFaviconUrl(url: string) {
  try {
    const domain = new URL(url).hostname;
    return `https://www.google.com/s2/favicons?domain=${domain}&sz=32`;
  } catch {
    return '';
  }
}

// Custom hook to handle favicon loading with fallback
const useFavicon = (url: string) => {
  const [faviconUrl, setFaviconUrl] = useState<string>('');
  const [hasError, setHasError] = useState(false);

  const handleFavicon = useCallback(() => {
    const favicon = getFaviconUrl(url);
    if (!favicon) {
      setHasError(true);
      return;
    }
    setFaviconUrl(favicon);
  }, [url]);

  useEffect(() => {
    if (!url) {
      queueMicrotask(() => setHasError(true));
      return;
    }

    queueMicrotask(() => handleFavicon());
  }, [url, handleFavicon]);

  return { faviconUrl, hasError };
};

export const CitationItem = memo(
  ({
    citation,
    index,
    onAdd,
    onHover,
    isHighlighted,
  }: {
    citation: Citation;
    index: number;
    onAdd: (citation: Citation) => void;
    onHover?: (citationId: string, isHovered: boolean) => void;
    isHighlighted?: boolean;
  }) => {
    const { faviconUrl, hasError } = useFavicon(citation.link || '');

    const handleMouseEnter = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onHover?.(citation.id, true);
      },
      [citation.id, onHover]
    );

    const handleMouseLeave = useCallback(
      (e: React.MouseEvent) => {
        e.stopPropagation();
        onHover?.(citation.id, false);
      },
      [citation.id, onHover]
    );

    const handleAdd = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onAdd(citation);
      },
      [citation, onAdd]
    );

    // Enhanced function to determine the source icon with favicon priority
    const getSourceIcon = () => {
      if (faviconUrl && !hasError) {
        return (
          <span
            style={{
              width: 16,
              height: 16,
              display: 'inline-block',
              marginRight: 6,
              position: 'relative',
            }}
          >
            <Image src={faviconUrl} alt="Site icon" fill style={{ objectFit: 'contain' }} />
          </span>
        );
      }

      // Fallback to Lucide icons based on source type
      const source = citation.source?.toLowerCase() || '';
      const title = citation.title?.toLowerCase() || '';
      const author = citation.author?.toLowerCase() || '';
      const link = citation.link?.toLowerCase() || '';

      // Legal court sources
      if (source.includes('supreme court') || title.includes('supreme court')) {
        return <Scale size={14} />;
      }
      if (
        source.includes('high court') ||
        source.includes('district court') ||
        source.includes('session court') ||
        author.includes('court')
      ) {
        return <Gavel size={14} />;
      }
      if (
        source.includes('legal') ||
        source.includes('law') ||
        source.includes('act') ||
        source.includes('statute') ||
        source.includes('regulation') ||
        title.includes('section') ||
        title.includes('article')
      ) {
        return <GraduationCap size={14} />;
      }

      // Document sources (PDFs, documents)
      if (
        source.includes('document') ||
        source.includes('file') ||
        link.includes('.pdf') ||
        link.includes('/pdf') ||
        title.includes('pdf')
      ) {
        return <FileText size={14} />;
      }

      // Academic/research sources
      if (
        source.includes('journal') ||
        source.includes('research') ||
        source.includes('study') ||
        source.includes('academic') ||
        source.includes('university') ||
        source.includes('institute')
      ) {
        return <Library size={14} />;
      }

      // Book sources
      if (source.includes('book') || title.includes('book') || author.includes('author')) {
        return <Book size={14} />;
      }

      // News sources
      if (
        source.includes('news') ||
        source.includes('times') ||
        source.includes('post') ||
        source.includes('daily') ||
        source.includes('press') ||
        source.includes('reporter')
      ) {
        return <Newspaper size={14} />;
      }

      // Online sources
      if (
        source.includes('website') ||
        source.includes('web') ||
        source.includes('online') ||
        source.includes('blog') ||
        source.includes('http') ||
        source.includes('www')
      ) {
        return <Globe size={14} />;
      }

      // Default
      return <Link size={14} />;
    };

    // Function to get source display text
    const getSourceText = () => {
      const source = citation.source || '';

      // Shorten common source names for better display
      if (source.includes('User Added Document')) return 'Document';
      if (source.includes('Supreme Court')) return 'Supreme Court';
      if (source.includes('High Court')) return 'High Court';
      if (source.includes('District Court')) return 'District Court';
      if (source.includes('Journal')) return 'Journal';
      if (source.includes('Research Paper')) return 'Research';
      if (source.includes('News')) return 'News';
      if (source.includes('Website')) return 'Website';
      if (source.includes('Google Custom Search')) return 'Google';
      if (source.includes('IndianKanoon API')) return 'IndianKanoon';

      return source;
    };

    return (
      <div
        className={`citation-data ${isHighlighted ? 'citation-data-highlighted' : ''}`}
        style={{ position: 'relative', marginBottom: '-10px' }}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        data-citation-id={citation.id}
        onClick={(e) => e.stopPropagation()}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <div className="citation-left">
          <div className="citation-title-with-icon">
            <span className="citation-icon" title={getSourceText()}>
              {getSourceIcon()}
            </span>
            <p className="citation-title">{truncateText(citation.title, 40)}</p>
          </div>
        </div>
        <div className="citation-right">
          <div className="citation-source-badge">
            <p className="citation-source">{truncateText(getSourceText(), 15)}</p>
          </div>
          <button
            className="citations-add-btn"
            onClick={handleAdd}
            aria-label={`Add citation: ${citation.title}`}
            type="button"
            onMouseDown={(e) => e.preventDefault()}
          >
            <Plus size={16} />
          </button>
        </div>
      </div>
    );
  }
);

CitationItem.displayName = 'CitationItem';

// Rest of your existing components remain the same...
export const CitationWidget = memo(
  ({
    blockId,
    onClick,
    isCitationsOpen,
  }: {
    blockId: string;
    onClick: () => void;
    isCitationsOpen: boolean;
  }) => {
    const handleClick = useCallback(
      (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        onClick();
      },
      [onClick]
    );

    return (
      <div
        className={`citations-widget citation-widget-${blockId}`}
        onClick={(e) => e.stopPropagation()}
      >
        <span className="citations-widget-divider" />
        <button
          className="citations-widget-button"
          onClick={handleClick}
          type="button"
          onMouseDown={(e) => e.preventDefault()}
        >
          {isCitationsOpen ? (
            <ChevronUp size={16} color="white" />
          ) : (
            <MessageSquareQuote size={16} color="white" />
          )}
        </button>
      </div>
    );
  }
);

CitationWidget.displayName = 'CitationWidget';

export const updateWidgetIcon = (widgetElement: Element, isOpen: boolean) => {
  const button = widgetElement.querySelector('.citations-widget-button');
  if (!button) return;

  if (isOpen) {
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-chevron-up"><path d="m18 15-6-6-6 6"/></svg>`;
  } else {
    button.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="lucide lucide-message-square-quote"><path d="M22 17a2 2 0 0 1-2 2H6.828a2 2 0 0 0-1.414.586l-2.202 2.202A.71.71 0 0 1 2 21.286V5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2z"/><path d="M14 13a2 2 0 0 0 2-2V9h-2"/><path d="M8 13a2 2 0 0 0 2-2V9H8"/></svg>`;
  }
};

export const createCitationWidget = (
  blockId: string,
  onClickHandler: () => void,
  isCitationsOpen: boolean
): { container: HTMLDivElement; root: Root } => {
  const container = document.createElement('div');
  const root = createRoot(container);

  root.render(
    <CitationWidget blockId={blockId} onClick={onClickHandler} isCitationsOpen={isCitationsOpen} />
  );

  return { container, root };
};

export const CitationsDataDisplay = memo(
  ({
    citations,
    handleAddCitation,
    onCitationHover,
  }: {
    citations: Citation[];
    handleAddCitation: (citation: Citation) => void;
    onCitationHover?: (citationId: string, isHovered: boolean) => void;
  }) => {
    const handleContainerClick = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    const handleContainerMouseDown = useCallback((e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
    }, []);

    return (
      <div
        className="citations-data-container"
        onClick={handleContainerClick}
        onMouseDown={handleContainerMouseDown}
      >
        {citations.map((citation, index) => (
          <CitationItem
            key={citation.id}
            citation={citation}
            index={index}
            onAdd={handleAddCitation}
            onHover={onCitationHover}
          />
        ))}
      </div>
    );
  }
);

CitationsDataDisplay.displayName = 'CitationsDataDisplay';

export const createCitationsDisplay = (
  citations: Citation[],
  handleAddCitation: (citation: Citation) => void,
  onCitationHover?: (citationId: string, isHovered: boolean) => void
): { container: HTMLDivElement; root: Root } => {
  const container = document.createElement('div');
  const root = createRoot(container);

  const uniqueCitations = citations.reduce((acc, citation) => {
    const isDuplicate = acc.some(
      (c) =>
        c.id === citation.id ||
        (c.title === citation.title && c.author === citation.author && c.source === citation.source)
    );

    if (!isDuplicate) {
      acc.push(citation);
    }
    return acc;
  }, [] as Citation[]);

  root.render(
    <CitationsDataDisplay
      citations={uniqueCitations}
      handleAddCitation={handleAddCitation}
      onCitationHover={onCitationHover}
    />
  );

  return { container, root };
};

export const CitationsInsertWidget = memo(
  function CitationsInsertWidget({ citations }: { citations: Citation[] }) {
    if (citations.length === 0) return null;

    return (
      <div className="citationsInsertWidget">
        <div className="added-citations-list">
          <span className="citation-badge">
            {truncateText(citations[0].title, 5)}
            {citations.length > 1 && (
              <span className="citation-count-badge">+{citations.length - 1}</span>
            )}
          </span>
        </div>
      </div>
    );
  },
  (prevProps, nextProps) => {
    return (
      prevProps.citations.length === nextProps.citations.length &&
      prevProps.citations[0]?.id === nextProps.citations[0]?.id
    );
  }
);

export const createCitationsInsertWidget = (
  citations: Citation[]
): { container: HTMLDivElement; root: Root } => {
  const container = document.createElement('div');
  const root = createRoot(container);

  const uniqueCitations = citations.reduce((acc, citation) => {
    const isDuplicate = acc.some(
      (c) =>
        c.id === citation.id ||
        (c.title === citation.title && c.author === citation.author && c.source === citation.source)
    );

    if (!isDuplicate) {
      acc.push(citation);
    }
    return acc;
  }, [] as Citation[]);

  root.render(<CitationsInsertWidget citations={uniqueCitations} />);
  return { container, root };
};

// Helper functions
export const getBlockId = (block: Element): string => {
  return block.getAttribute('data-id') || block.id;
};

export const getCitationMap = (
  citations: CitationsDisplayData[]
): Map<string, CitationsDisplayData> => {
  return new Map(citations.map((citation) => [citation.id, citation]));
};

export const generateUniqueCitationId = (blockId: string, sourceId?: string): string => {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 9);
  return `${blockId}-${timestamp}-${random}${sourceId ? `-${sourceId}` : ''}`;
};
