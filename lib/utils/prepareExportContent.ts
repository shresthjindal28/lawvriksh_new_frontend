/**
 * Utility to prepare TipTap editor content for PDF export
 * Transforms HTML content into page-based structure with citation footers
 * and a final references section
 */

export interface CitationData {
  number: number;
  title: string;
  link: string;
  id?: string;
  pageNumber?: number;
  author?: string;
  source?: string;
}

export interface PageContent {
  pageNumber: number;
  htmlContent: string;
  citations: CitationData[];
}

export interface ExportContentOptions {
  fontFamily?: string;
  fontSize?: string;
  lineHeight?: number;
  margins?: number;
  citationStyle?: string;
}

/**
 * Extract citations from a page section of HTML content
 */
function extractCitationsFromSection(sectionHtml: string): CitationData[] {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = sectionHtml;

  const citations: CitationData[] = [];
  const citationElements = tempDiv.querySelectorAll('.inline-citation');

  citationElements.forEach((el) => {
    const citationNumber = el.getAttribute('data-citation-number');
    const title = el.getAttribute('data-citation-title');
    const link = el.getAttribute('data-citation-link');
    const referenceId = el.getAttribute('data-reference-id');
    const author = el.getAttribute('data-citation-author');

    if (citationNumber) {
      citations.push({
        number: parseInt(citationNumber, 10),
        title: title || 'Untitled Citation',
        link: link || '',
        id: referenceId || undefined,
        author: author || 'Unknown',
        source: 'online',
      });
    }
  });

  // Sort by citation number and remove duplicates
  const uniqueCitations = citations.reduce((acc, current) => {
    const exists = acc.find((item) => item.number === current.number);
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as CitationData[]);

  return uniqueCitations.sort((a, b) => a.number - b.number);
}

/**
 * Format a citation based on the selected citation style
 * Implements the same logic as CitationFormatter.formatSimpleBibliography
 */
function formatCitationByStyle(citation: CitationData, style: string): string {
  const currentYear = new Date().getFullYear();
  const author = citation.author || 'Unknown';
  const title = citation.title || '';
  const source = citation.source || 'online';
  const link = citation.link || '';

  switch (style) {
    case 'apa':
      // APA 7th Edition bibliography
      return `${author}. (${currentYear}). ${title}. ${source}.`;

    case 'mla':
      // MLA 9th Edition bibliography
      return `${author}. "${title}." ${source}, ${currentYear}.`;

    case 'chicago':
      // Chicago 17th Edition bibliography
      return `${author}. "${title}." ${source} (${currentYear}).`;

    case 'chicago-author-date':
      // Chicago Author-Date bibliography
      return `${author}. ${currentYear}. "${title}." ${source}.`;

    case 'harvard':
      // Harvard bibliography
      return `${author} (${currentYear}) '${title}' ${source}.`;

    case 'vancouver':
      // Vancouver bibliography
      return `${author}. ${title}. ${source}. ${currentYear};`;

    case 'ieee':
      // IEEE bibliography
      return `${author}, "${title}," ${source}, ${currentYear}.`;

    case 'bluebook':
      // Bluebook bibliography
      return `${author}, ${title} (${currentYear}) (available at ${link || source}).`;

    case 'oscola':
      // OSCOLA bibliography
      return `${author}, '${title}' (${currentYear}) ${source}.`;

    case 'turabian':
      // Turabian bibliography
      return `${author}. "${title}." ${source} (${currentYear}).`;

    case 'acs':
      // ACS bibliography
      return `${author}. ${title}. ${source} ${currentYear}.`;

    case 'ama':
      // AMA bibliography
      return `${author}. ${title}. ${source}. ${currentYear};`;

    case 'apsa':
      // APSA bibliography
      return `${author}. ${currentYear}. "${title}." ${source}.`;

    case 'asa':
      // ASA bibliography
      return `${author}. ${currentYear}. "${title}." ${source}.`;

    case 'cse':
      // CSE bibliography
      return `${author}. ${title}. ${source}. ${currentYear}.`;

    default:
      return `${author} (${currentYear}). ${title}. ${source}.`;
  }
}

/**
 * Generate the final references section for the document
 */
function generateReferencesSection(
  allCitations: CitationData[],
  fontFamily: string,
  fontSize: string,
  citationStyle: string
): string {
  if (allCitations.length === 0) {
    return '';
  }

  // Sort citations by number
  const sortedCitations = [...allCitations].sort((a, b) => a.number - b.number);

  let referencesHtml = `
    <div class="references-section" style="
      font-family: '${fontFamily}', serif;
      font-size: ${fontSize};
      margin-top: 30px;
      padding-top: 20px;
    ">
      <h2 style="
        font-family: '${fontFamily}', serif;
        font-size: 14pt;
        font-weight: bold;
        margin-bottom: 16px;
        text-align: center;
        border-bottom: 2px solid #333333;
        padding-bottom: 8px;
      ">References</h2>
      <div class="references-list" style="
        font-size: ${fontSize};
        line-height: 1.8;
      ">`;

  sortedCitations.forEach((citation) => {
    const formattedCitation = formatCitationByStyle(citation, citationStyle);
    const linkHtml = citation.link
      ? `<a href="${citation.link}" target="_blank" style="color: #0066cc; text-decoration: underline;">[${citation.number}] ${formattedCitation}</a>`
      : `<span>[${citation.number}] ${formattedCitation}</span>`;

    referencesHtml += `
        <p style="
          margin: 8px 0;
          padding-left: 20px;
          text-indent: -20px;
          font-family: '${fontFamily}', serif;
          font-size: ${fontSize};
        ">${linkHtml}</p>`;
  });

  referencesHtml += `
      </div>
    </div>`;

  return referencesHtml;
}

/**
 * Split content by page breaks and organize into page sections
 */
function splitContentByPages(htmlContent: string): string[] {
  // Create a temporary container
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  // Find all page break elements
  const pageBreaks = tempDiv.querySelectorAll('.tiptap-page-break');

  if (pageBreaks.length === 0) {
    // No page breaks - return entire content as single page
    return [htmlContent];
  }

  const pages: string[] = [];

  // Create a tree walker to iterate through nodes
  const allNodes = Array.from(tempDiv.children);

  let pageBreakIndices: number[] = [];

  // Find indices of page breaks
  allNodes.forEach((node, index) => {
    if (node.classList.contains('tiptap-page-break')) {
      pageBreakIndices.push(index);
    }
  });

  // Split nodes by page breaks
  let lastBreakIndex = -1;
  pageBreakIndices.forEach((breakIndex) => {
    const pageNodes = allNodes.slice(lastBreakIndex + 1, breakIndex);
    const pageDiv = document.createElement('div');
    pageNodes.forEach((node) => pageDiv.appendChild(node.cloneNode(true)));
    pages.push(pageDiv.innerHTML);
    lastBreakIndex = breakIndex;
  });

  // Add remaining content after last page break
  const remainingNodes = allNodes.slice(lastBreakIndex + 1);
  if (remainingNodes.length > 0) {
    const pageDiv = document.createElement('div');
    remainingNodes.forEach((node) => pageDiv.appendChild(node.cloneNode(true)));
    pages.push(pageDiv.innerHTML);
  }

  return pages.length > 0 ? pages : [htmlContent];
}

/**
 * Collect all unique citations from the entire document
 */
function collectAllCitations(htmlContent: string): CitationData[] {
  const tempDiv = document.createElement('div');
  tempDiv.innerHTML = htmlContent;

  const citations: CitationData[] = [];
  const citationElements = tempDiv.querySelectorAll('.inline-citation');

  citationElements.forEach((el) => {
    const citationNumber = el.getAttribute('data-citation-number');
    const title = el.getAttribute('data-citation-title');
    const link = el.getAttribute('data-citation-link');
    const referenceId = el.getAttribute('data-reference-id');
    const author = el.getAttribute('data-citation-author');

    if (citationNumber) {
      // Check if this citation number already exists
      const exists = citations.find((c) => c.number === parseInt(citationNumber, 10));
      if (!exists) {
        citations.push({
          number: parseInt(citationNumber, 10),
          title: title || 'Untitled Citation',
          link: link || '',
          id: referenceId || undefined,
          author: author || 'Unknown',
          source: 'online',
        });
      }
    }
  });

  return citations.sort((a, b) => a.number - b.number);
}

/**
 * Main function to prepare content for PDF export
 * Transforms raw HTML into page-based structure with citation footers
 * and a final references section
 */
export function prepareExportContent(
  htmlContent: string,
  options: ExportContentOptions = {}
): string {
  const {
    fontFamily = 'Times New Roman',
    fontSize = '12pt',
    lineHeight = 1.5,
    margins = 20,
    citationStyle = 'bluebook',
  } = options;

  // Split content into pages
  const pageContents = splitContentByPages(htmlContent);

  // Collect all unique citations from the document
  const allCitations = collectAllCitations(htmlContent);

  // Build the main container with styling
  let exportHtml = `
    <div id="main" style="
      font-family: '${fontFamily}', serif;
      font-size: ${fontSize};
      line-height: ${lineHeight};
    ">`;

  // Process each page
  pageContents.forEach((pageHtml, index) => {
    const pageNumber = index + 1;

    exportHtml += `
      <div class="page${pageNumber}" style="
        page-break-after: always;
        padding: ${margins}px;
        min-height: calc(100vh - ${margins * 2}px);
      ">
        <div class="page-content">
          ${pageHtml}
        </div>
      </div>`;
  });

  // Add final references section at the end
  if (allCitations.length > 0) {
    const referencesSection = generateReferencesSection(
      allCitations,
      fontFamily,
      fontSize,
      citationStyle
    );

    exportHtml += `
      <div class="page-references" style="
        page-break-before: always;
        padding: ${margins}px;
      ">
        ${referencesSection}
      </div>`;
  }

  exportHtml += `
    </div>`;

  return exportHtml;
}

/**
 * Get all citations from the entire document with their page numbers
 */
export function getAllCitationsWithPages(htmlContent: string): CitationData[] {
  const pageContents = splitContentByPages(htmlContent);
  const allCitations: CitationData[] = [];

  pageContents.forEach((pageHtml, index) => {
    const pageNumber = index + 1;
    const pageCitations = extractCitationsFromSection(pageHtml);

    pageCitations.forEach((citation) => {
      allCitations.push({
        ...citation,
        pageNumber,
      });
    });
  });

  // Remove duplicates (citations may appear multiple times on same page)
  const uniqueCitations = allCitations.reduce((acc, current) => {
    const exists = acc.find(
      (item) => item.number === current.number && item.pageNumber === current.pageNumber
    );
    if (!exists) {
      acc.push(current);
    }
    return acc;
  }, [] as CitationData[]);

  return uniqueCitations.sort((a, b) => {
    if (a.pageNumber !== b.pageNumber) {
      return (a.pageNumber || 0) - (b.pageNumber || 0);
    }
    return a.number - b.number;
  });
}

export default prepareExportContent;
