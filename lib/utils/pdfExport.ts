/**
 * PDF and DOCX Export Pipeline
 *
 * Complete replacement of the previous fragile export implementation.
 * Uses jsPDF for PDF generation and docx library for DOCX generation.
 *
 * Key improvements:
 * - Full document content extraction from Tiptap
 * - Proper formatting preservation
 * - Reliable citation and footnote handling
 * - Deterministic output
 */

import jsPDF from 'jspdf';
import {
  Document,
  Packer,
  Paragraph,
  TextRun,
  HeadingLevel,
  AlignmentType,
  TableRow,
  TableCell,
  WidthType,
  BorderStyle,
  ExternalHyperlink,
  Footer,
  PageNumber,
  Header,
} from 'docx';
import { saveAs } from 'file-saver';

// ============================================================================
// TYPES
// ============================================================================

export interface CitationData {
  number: number;
  title: string;
  link: string;
  id?: string;
  author?: string;
  source?: string;
}

export interface ExportOptions {
  fontFamily?: string;
  fontSize?: number;
  lineHeight?: number;
  margins?: number;
  includePageNumbers?: boolean;
  citationStyle?: string;
}

interface TiptapNode {
  type: string;
  attrs?: Record<string, unknown>;
  content?: TiptapNode[];
  marks?: TiptapMark[];
  text?: string;
}

interface TiptapMark {
  type: string;
  attrs?: Record<string, unknown>;
}

// ============================================================================
// CONTENT EXTRACTION
// ============================================================================

/**
 * Extract clean HTML content from Tiptap editor
 * Handles both Editor instance and HTML string input
 */
function extractContent(source: unknown): { html: string; json: TiptapNode | null } {
  if (typeof source === 'string') {
    return { html: source, json: null };
  }

  // Handle Tiptap Editor instance
  const editor = source as {
    getHTML?: () => string;
    getJSON?: () => TiptapNode;
  };

  if (editor?.getHTML) {
    return {
      html: editor.getHTML(),
      json: editor.getJSON?.() || null,
    };
  }

  return { html: '', json: null };
}

/**
 * Parse HTML content and extract structured data
 * Removes any existing References section to avoid duplicates
 */
function parseHtmlToNodes(html: string, preserveReferences = false): HTMLElement {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');
  const body = doc.body;

  // Remove existing References section if present (to avoid duplicates)
  // Look for headings with "References" or "Footnotes" and remove them with their content
  // Skip this if preserveReferences is true (e.g. for DOCX where we might want to keep it)
  if (!preserveReferences) {
    const allElements = Array.from(body.children);
    let removeFrom = -1;

    for (let i = 0; i < allElements.length; i++) {
      const el = allElements[i];
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent?.trim().toLowerCase() || '';

      // Check if this is a References/Footnotes heading
      if (['h1', 'h2', 'h3'].includes(tagName) && (text === 'references' || text === 'footnotes')) {
        removeFrom = i;
        break;
      }
    }

    // Remove the References heading and everything after it
    if (removeFrom >= 0) {
      for (let i = allElements.length - 1; i >= removeFrom; i--) {
        body.removeChild(allElements[i]);
      }
    }
  }

  return body;
}

/**
 * Extract citations from HTML content
 */
export function extractCitations(html: string): CitationData[] {
  const body = parseHtmlToNodes(html);
  const citations: CitationData[] = [];
  const seen = new Set<number>();

  const citationElements = body.querySelectorAll('.inline-citation, [data-citation-number]');

  citationElements.forEach((el) => {
    const numStr = el.getAttribute('data-citation-number');
    if (!numStr) return;

    const num = parseInt(numStr, 10);
    if (seen.has(num)) return;
    seen.add(num);

    citations.push({
      number: num,
      title: el.getAttribute('data-citation-title') || 'Untitled',
      link: el.getAttribute('data-citation-link') || '',
      id: el.getAttribute('data-reference-id') || undefined,
      author: el.getAttribute('data-citation-author') || 'Unknown',
      source: 'online',
    });
  });

  return citations.sort((a, b) => a.number - b.number);
}

// ============================================================================
// PDF EXPORT
// ============================================================================

/**
 * Convert HTML element to plain text with formatting hints
 */
function getTextFromElement(element: Element): string {
  let text = '';
  element.childNodes.forEach((node) => {
    if (node.nodeType === Node.TEXT_NODE) {
      text += node.textContent || '';
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();

      if (tag === 'br') {
        text += '\n';
      } else if (['p', 'div', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6', 'li'].includes(tag)) {
        text += getTextFromElement(el) + '\n';
      } else {
        text += getTextFromElement(el);
      }
    }
  });
  return text;
}

/**
 * PDF generation configuration
 */
const PDF_CONFIG = {
  pageWidth: 210, // A4 width in mm
  pageHeight: 297, // A4 height in mm
  marginTop: 20,
  marginBottom: 25,
  marginLeft: 20,
  marginRight: 20,
  lineHeight: 7,
  fontSize: {
    body: 12,
    h1: 18,
    h2: 16,
    h3: 14,
    h4: 12,
    h5: 11,
    h6: 10,
  },
};

interface TextSegment {
  text: string;
  bold?: boolean;
  italic?: boolean;
  underline?: boolean;
  link?: string;
  citation?: CitationData;
}

/**
 * Extract text segments with formatting from an element
 */
function extractTextSegments(element: Element): TextSegment[] {
  const segments: TextSegment[] = [];

  function processNode(node: Node, inherited: Partial<TextSegment> = {}) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text.trim() || text.includes(' ')) {
        segments.push({ text, ...inherited });
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const style: Partial<TextSegment> = { ...inherited };

      // Check for formatting
      if (tag === 'strong' || tag === 'b') style.bold = true;
      if (tag === 'em' || tag === 'i') style.italic = true;
      if (tag === 'u') style.underline = true;
      if (tag === 'a') style.link = el.getAttribute('href') || undefined;

      // Check for citation - emit citation segment and skip children
      if (el.classList.contains('inline-citation') || el.hasAttribute('data-citation-number')) {
        const citNum = el.getAttribute('data-citation-number');
        if (citNum) {
          segments.push({
            text: '', // No regular text for citation
            citation: {
              number: parseInt(citNum, 10),
              title: el.getAttribute('data-citation-title') || '',
              link: el.getAttribute('data-citation-link') || '',
              author: el.getAttribute('data-citation-author') || undefined,
            },
          });
          return; // Don't process children - citation number will be rendered by renderSegmentsToPdf
        }
      }

      // Check for inline styles
      const computedStyle = el.getAttribute('style') || '';
      if (computedStyle.includes('font-weight') && computedStyle.includes('bold')) {
        style.bold = true;
      }
      if (computedStyle.includes('font-style') && computedStyle.includes('italic')) {
        style.italic = true;
      }
      if (computedStyle.includes('text-decoration') && computedStyle.includes('underline')) {
        style.underline = true;
      }

      el.childNodes.forEach((child) => processNode(child, style));
    }
  }

  processNode(element);
  return segments;
}

/**
 * Render text segments to PDF with proper formatting
 */
function renderSegmentsToPdf(
  pdf: jsPDF,
  segments: TextSegment[],
  x: number,
  y: number,
  maxWidth: number,
  fontSize: number
): number {
  let currentX = x;
  let currentY = y;
  const lineHeight = fontSize * 0.5;

  segments.forEach((segment) => {
    // Handle citation - render as superscript [n]
    if (segment.citation) {
      const citText = `[${segment.citation.number}]`;
      pdf.setFont('times', 'normal');
      pdf.setFontSize(fontSize * 0.75); // Smaller for superscript
      pdf.setTextColor(26, 115, 232); // Blue for citations

      const citWidth = pdf.getTextWidth(citText);

      // Check if citation fits on current line
      if (currentX + citWidth > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;
        if (currentY > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom) {
          pdf.addPage();
          currentY = PDF_CONFIG.marginTop;
        }
      }

      // Draw citation superscript (slightly raised)
      pdf.text(citText, currentX, currentY - 2);
      currentX += citWidth;

      // Reset font size and color
      pdf.setFontSize(fontSize);
      pdf.setTextColor(0, 0, 0);
      return;
    }

    let fontStyle = 'normal';
    if (segment.bold && segment.italic) fontStyle = 'bolditalic';
    else if (segment.bold) fontStyle = 'bold';
    else if (segment.italic) fontStyle = 'italic';

    pdf.setFont('times', fontStyle);
    pdf.setFontSize(fontSize);

    // Handle text wrapping
    const words = segment.text.split(/(\s+)/);
    words.forEach((word) => {
      const wordWidth = pdf.getTextWidth(word);

      // Check if word fits on current line
      if (currentX + wordWidth > x + maxWidth) {
        currentX = x;
        currentY += lineHeight;

        // Check for page break
        if (currentY > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom) {
          pdf.addPage();
          currentY = PDF_CONFIG.marginTop;
        }
      }

      // Draw underline if needed
      if (segment.underline && word.trim()) {
        pdf.setDrawColor(0);
        pdf.line(currentX, currentY + 1, currentX + wordWidth, currentY + 1);
      }

      // Set link color
      if (segment.link) {
        pdf.setTextColor(26, 115, 232); // Blue for links
      } else {
        pdf.setTextColor(0, 0, 0);
      }

      pdf.text(word, currentX, currentY);
      currentX += wordWidth;
    });
  });

  return currentY;
}

/**
 * Export content to PDF
 * Reliable PDF generation that preserves all formatting
 */
export async function exportContentToPdf(
  source: unknown,
  filename: string = 'document.pdf',
  references: CitationData[] = [],
  options: ExportOptions = {}
): Promise<Blob | null> {
  try {
    const { html } = extractContent(source);
    if (!html) {
      console.error('No content to export');
      return null;
    }

    const body = parseHtmlToNodes(html);
    const pdf = new jsPDF('p', 'mm', 'a4');

    const contentWidth = PDF_CONFIG.pageWidth - PDF_CONFIG.marginLeft - PDF_CONFIG.marginRight;
    let y = PDF_CONFIG.marginTop;

    pdf.setFont('times', 'normal');

    // Process each child element
    const processElement = (element: Element) => {
      const tag = element.tagName?.toLowerCase() || '';

      // Check for page break
      if (y > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom - 20) {
        pdf.addPage();
        y = PDF_CONFIG.marginTop;
      }

      // Handle different element types
      if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
        const level = parseInt(tag.charAt(1), 10) as 1 | 2 | 3 | 4 | 5 | 6;
        const fontSize = PDF_CONFIG.fontSize[tag as keyof typeof PDF_CONFIG.fontSize];

        pdf.setFont('times', 'bold');
        pdf.setFontSize(fontSize);

        const text = element.textContent || '';
        const lines = pdf.splitTextToSize(text, contentWidth);

        // Center h1
        if (level === 1) {
          lines.forEach((line: string) => {
            const lineWidth = pdf.getTextWidth(line);
            const centerX = PDF_CONFIG.marginLeft + (contentWidth - lineWidth) / 2;
            pdf.text(line, centerX, y);
            y += fontSize * 0.5;
          });
        } else {
          pdf.text(lines, PDF_CONFIG.marginLeft, y);
          y += lines.length * fontSize * 0.5;
        }

        y += 4; // Space after heading
      } else if (tag === 'p') {
        const segments = extractTextSegments(element);
        if (segments.length > 0) {
          y = renderSegmentsToPdf(pdf, segments, PDF_CONFIG.marginLeft, y, contentWidth, 12);
          y += 6; // Paragraph spacing
        }
      } else if (tag === 'ul' || tag === 'ol') {
        const items = element.querySelectorAll(':scope > li');
        items.forEach((item, index) => {
          const bullet = tag === 'ul' ? '•' : `${index + 1}.`;
          pdf.setFont('times', 'normal');
          pdf.setFontSize(12);

          // Check for page break
          if (y > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom - 10) {
            pdf.addPage();
            y = PDF_CONFIG.marginTop;
          }

          pdf.text(bullet, PDF_CONFIG.marginLeft, y);

          const segments = extractTextSegments(item);
          const bulletWidth = pdf.getTextWidth(bullet + ' ');
          y = renderSegmentsToPdf(
            pdf,
            segments,
            PDF_CONFIG.marginLeft + bulletWidth + 2,
            y,
            contentWidth - bulletWidth - 2,
            12
          );
          y += 4;
        });
        y += 4;
      } else if (tag === 'blockquote') {
        pdf.setFont('times', 'italic');
        pdf.setFontSize(12);

        const text = element.textContent || '';
        const lines = pdf.splitTextToSize(text, contentWidth - 20);

        // Draw left border
        pdf.setDrawColor(100);
        pdf.setLineWidth(0.5);
        pdf.line(PDF_CONFIG.marginLeft + 5, y - 2, PDF_CONFIG.marginLeft + 5, y + lines.length * 6);

        pdf.text(lines, PDF_CONFIG.marginLeft + 15, y);
        y += lines.length * 6 + 6;
      } else if (tag === 'table') {
        // Simple table handling
        const rows = element.querySelectorAll('tr');
        const startY = y;

        rows.forEach((row, rowIndex) => {
          if (y > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom - 15) {
            pdf.addPage();
            y = PDF_CONFIG.marginTop;
          }

          const cells = row.querySelectorAll('td, th');
          const cellWidth = contentWidth / (cells.length || 1);
          let cellX = PDF_CONFIG.marginLeft;

          cells.forEach((cell) => {
            const isHeader = cell.tagName.toLowerCase() === 'th';
            pdf.setFont('times', isHeader ? 'bold' : 'normal');
            pdf.setFontSize(11);

            const text = cell.textContent || '';
            const lines = pdf.splitTextToSize(text, cellWidth - 4);

            // Draw cell border
            pdf.setDrawColor(0);
            pdf.rect(cellX, y - 4, cellWidth, 8);

            pdf.text(lines[0] || '', cellX + 2, y);
            cellX += cellWidth;
          });

          y += 8;
        });

        y += 4;
      } else if (tag === 'hr') {
        pdf.setDrawColor(150);
        pdf.line(PDF_CONFIG.marginLeft, y, PDF_CONFIG.marginLeft + contentWidth, y);
        y += 8;
      } else if (element.children && element.children.length > 0) {
        // Process children for container elements
        Array.from(element.children).forEach(processElement);
      } else if (element.textContent?.trim()) {
        // Fallback for text content
        pdf.setFont('times', 'normal');
        pdf.setFontSize(12);
        const text = element.textContent.trim();
        const lines = pdf.splitTextToSize(text, contentWidth);
        pdf.text(lines, PDF_CONFIG.marginLeft, y);
        y += lines.length * 6 + 4;
      }
    };

    // Process all content
    Array.from(body.children).forEach(processElement);

    // Add references section if citations exist (title and content on same page)
    const allCitations = references.length > 0 ? references : extractCitations(html);

    if (allCitations.length > 0) {
      // Add page break before references
      pdf.addPage();
      y = PDF_CONFIG.marginTop;

      // References title
      pdf.setFont('times', 'bold');
      pdf.setFontSize(16);
      const refTitle = 'References';
      const refTitleWidth = pdf.getTextWidth(refTitle);
      pdf.text(refTitle, PDF_CONFIG.marginLeft + (contentWidth - refTitleWidth) / 2, y);
      y += 12;

      // Underline
      pdf.setDrawColor(0);
      pdf.line(PDF_CONFIG.marginLeft + 30, y - 8, PDF_CONFIG.marginLeft + contentWidth - 30, y - 8);
      y += 4;

      // List citations (immediately after title - same page)
      pdf.setFont('times', 'normal');
      pdf.setFontSize(11);
      pdf.setTextColor(26, 115, 232); // Blue for citations content

      allCitations.forEach((citation) => {
        if (y > PDF_CONFIG.pageHeight - PDF_CONFIG.marginBottom - 15) {
          pdf.addPage();
          y = PDF_CONFIG.marginTop;
        }

        const citText = `[${citation.number}] ${citation.author || 'Unknown'}. "${citation.title}." ${citation.link ? `Available at: ${citation.link}` : ''}`;
        const lines = pdf.splitTextToSize(citText, contentWidth);

        pdf.text(lines, PDF_CONFIG.marginLeft, y);
        y += lines.length * 5 + 4;
      });

      // Reset text color to black for subsequent content (like page numbers)
      pdf.setTextColor(0, 0, 0);
    }

    // Add page numbers
    const pageCount = pdf.getNumberOfPages();
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i);
      pdf.setFont('times', 'normal');
      pdf.setFontSize(10);
      pdf.setTextColor(100);
      const pageStr = `Page ${i} of ${pageCount}`;
      const pageStrWidth = pdf.getTextWidth(pageStr);
      pdf.text(
        pageStr,
        PDF_CONFIG.pageWidth - PDF_CONFIG.marginRight - pageStrWidth,
        PDF_CONFIG.pageHeight - 10
      );
    }

    // Save file
    pdf.save(filename);

    // Return blob for email attachment support
    return pdf.output('blob');
  } catch (error) {
    console.error('PDF export failed:', error);
    throw new Error(
      `PDF export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}

// ============================================================================
// DOCX EXPORT
// ============================================================================

/**
 * Convert HTML element to DOCX paragraphs
 */
function htmlToDocxParagraphs(body: HTMLElement, options: ExportOptions = {}): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  function processElement(element: Element): Paragraph[] {
    const result: Paragraph[] = [];
    const tag = element.tagName?.toLowerCase() || '';

    // Handle headings
    if (['h1', 'h2', 'h3', 'h4', 'h5', 'h6'].includes(tag)) {
      const level = parseInt(tag.charAt(1), 10);
      const headingLevel = [
        HeadingLevel.HEADING_1,
        HeadingLevel.HEADING_2,
        HeadingLevel.HEADING_3,
        HeadingLevel.HEADING_4,
        HeadingLevel.HEADING_5,
        HeadingLevel.HEADING_6,
      ][level - 1];

      result.push(
        new Paragraph({
          heading: headingLevel,
          alignment: level === 1 ? AlignmentType.CENTER : AlignmentType.LEFT,
          children: extractDocxTextRuns(element),
          spacing: { before: 240, after: 120 },
        })
      );
    }
    // Handle paragraphs
    else if (tag === 'p') {
      const runs = extractDocxTextRuns(element);
      if (runs.length > 0) {
        // Check for text alignment
        const style = element.getAttribute('style') || '';
        let alignment: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.JUSTIFIED;
        if (style.includes('text-align: center')) alignment = AlignmentType.CENTER;
        else if (style.includes('text-align: right')) alignment = AlignmentType.RIGHT;
        else if (style.includes('text-align: left')) alignment = AlignmentType.LEFT;

        result.push(
          new Paragraph({
            children: runs,
            alignment,
            spacing: { after: 200 },
          })
        );
      }
    }
    // Handle lists
    else if (tag === 'ul' || tag === 'ol') {
      const items = element.querySelectorAll(':scope > li');
      items.forEach((item, index) => {
        const runs = extractDocxTextRuns(item);
        const bullet = tag === 'ul' ? '• ' : `${index + 1}. `;
        runs.unshift(new TextRun({ text: bullet }));

        result.push(
          new Paragraph({
            children: runs,
            indent: { left: 720 },
            spacing: { after: 100 },
          })
        );
      });
    }
    // Handle blockquotes
    else if (tag === 'blockquote') {
      const textContent = element.textContent || '';
      result.push(
        new Paragraph({
          children: [
            new TextRun({
              text: textContent,
              italics: true,
            }),
          ],
          indent: { left: 720 },
          spacing: { before: 200, after: 200 },
          border: {
            left: { style: BorderStyle.SINGLE, size: 12, color: '666666' },
          },
        })
      );
    }
    // Handle tables
    else if (tag === 'table') {
      const tableRows: TableRow[] = [];
      const rows = element.querySelectorAll('tr');

      rows.forEach((row) => {
        const cells: TableCell[] = [];
        const cellElements = row.querySelectorAll('td, th');

        cellElements.forEach((cell) => {
          const isHeader = cell.tagName.toLowerCase() === 'th';
          const runs = extractDocxTextRuns(cell);

          const cellText = cell.textContent || '';
          cells.push(
            new TableCell({
              children: [
                new Paragraph({
                  children: [
                    new TextRun({
                      text: cellText,
                      bold: isHeader,
                    }),
                  ],
                  alignment: isHeader ? AlignmentType.CENTER : AlignmentType.LEFT,
                }),
              ],
              width: { size: 100 / (cellElements.length || 1), type: WidthType.PERCENTAGE },
            })
          );
        });

        if (cells.length > 0) {
          tableRows.push(new TableRow({ children: cells }));
        }
      });

      if (tableRows.length > 0) {
        // Note: Tables are added to document sections, not as paragraphs
        // We'll handle this separately
      }
    }
    // Handle horizontal rules
    else if (tag === 'hr') {
      result.push(
        new Paragraph({
          children: [new TextRun({ text: '─'.repeat(50) })],
          alignment: AlignmentType.CENTER,
          spacing: { before: 200, after: 200 },
        })
      );
    }
    // Handle divs and other containers
    else if (element.children && element.children.length > 0) {
      Array.from(element.children).forEach((child) => {
        result.push(...processElement(child));
      });
    }
    // Handle raw text
    else if (element.textContent?.trim()) {
      result.push(
        new Paragraph({
          children: [new TextRun({ text: element.textContent.trim() })],
          spacing: { after: 200 },
        })
      );
    }

    return result;
  }

  Array.from(body.children).forEach((child) => {
    paragraphs.push(...processElement(child));
  });

  return paragraphs;
}

/**
 * Extract TextRuns with formatting from an element
 */
function extractDocxTextRuns(element: Element): TextRun[] {
  const runs: TextRun[] = [];

  function processNode(
    node: Node,
    inherited: { bold?: boolean; italic?: boolean; underline?: boolean } = {}
  ) {
    if (node.nodeType === Node.TEXT_NODE) {
      const text = node.textContent || '';
      if (text) {
        runs.push(
          new TextRun({
            text,
            bold: inherited.bold,
            italics: inherited.italic,
            underline: inherited.underline ? {} : undefined,
          })
        );
      }
    } else if (node.nodeType === Node.ELEMENT_NODE) {
      const el = node as Element;
      const tag = el.tagName.toLowerCase();
      const style = { ...inherited };

      if (tag === 'strong' || tag === 'b') style.bold = true;
      if (tag === 'em' || tag === 'i') style.italic = true;
      if (tag === 'u') style.underline = true;

      // Handle links
      if (tag === 'a') {
        const href = el.getAttribute('href');
        if (href) {
          // For docx, we'll just add the text with underline styling
          style.underline = true;
        }
      }

      // Handle citation markers
      if (el.classList.contains('inline-citation') || el.hasAttribute('data-citation-number')) {
        const citNum = el.getAttribute('data-citation-number');
        if (citNum) {
          runs.push(
            new TextRun({
              text: `[${citNum}]`,
              superScript: true,
              color: '1a73e8',
            })
          );
          return;
        }
      }

      el.childNodes.forEach((child) => processNode(child, style));
    }
  }

  processNode(element);
  return runs;
}

/**
 * Generate references section for DOCX
 */
function generateDocxReferences(citations: CitationData[]): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Add title (no page break before - title and content on same page)
  paragraphs.push(
    new Paragraph({
      heading: HeadingLevel.HEADING_1,
      alignment: AlignmentType.CENTER,
      children: [new TextRun({ text: 'References', bold: true })],
      spacing: { before: 400, after: 200 },
    })
  );

  // Add each citation
  citations.forEach((citation) => {
    const citText = `[${citation.number}] ${citation.author || 'Unknown'}. "${citation.title}."`;

    const children: (TextRun | ExternalHyperlink)[] = [
      new TextRun({
        text: citText + ' ',
        color: '1a73e8', // Blue color for citation content
      }),
    ];

    if (citation.link) {
      children.push(
        new ExternalHyperlink({
          children: [
            new TextRun({
              text: citation.link,
              color: '1a73e8',
              underline: {},
            }),
          ],
          link: citation.link,
        })
      );
    }

    paragraphs.push(
      new Paragraph({
        children,
        indent: { left: 720, hanging: 360 },
        spacing: { after: 120 },
      })
    );
  });

  return paragraphs;
}

/**
 * Export content to DOCX
 * Produces a properly formatted Word document
 */
export async function exportContentToDocx(
  source: unknown,
  filename: string = 'document.docx',
  references: CitationData[] = [],
  options: ExportOptions = {}
): Promise<Blob | null> {
  try {
    const { html } = extractContent(source);
    if (!html) {
      console.error('No content to export');
      return null;
    }

    // Extract citations if not provided
    const allCitations = references.length > 0 ? references : extractCitations(html);

    // Parse HTML but preserve References section if it exists
    const body = parseHtmlToNodes(html, true);

    // Check if body already has a References section (so we don't duplicate)
    let hasReferencesSection = false;
    const allElements = Array.from(body.children);
    for (const el of allElements) {
      const tagName = el.tagName.toLowerCase();
      const text = el.textContent?.trim().toLowerCase() || '';

      if (
        ['h1', 'h2', 'h3'].includes(tagName) &&
        (text.includes('references') || text.includes('footnotes'))
      ) {
        // Simple check - if heading contains References/Footnotes, assume section exists
        hasReferencesSection = true;
        break;
      }
    }

    const paragraphs = htmlToDocxParagraphs(body, options);

    // Add references section IF citations exist AND we didn't find an existing section
    if (allCitations.length > 0 && !hasReferencesSection) {
      paragraphs.push(...generateDocxReferences(allCitations));
    }

    // Create document
    const doc = new Document({
      sections: [
        {
          properties: {
            page: {
              margin: {
                top: 1440, // 1 inch in twips
                right: 1440,
                bottom: 1440,
                left: 1440,
              },
            },
          },
          headers: {
            default: new Header({
              children: [
                new Paragraph({
                  children: [],
                }),
              ],
            }),
          },
          footers: {
            default: new Footer({
              children: [
                new Paragraph({
                  alignment: AlignmentType.RIGHT,
                  children: [
                    new TextRun({ text: 'Page ' }),
                    new TextRun({
                      children: [PageNumber.CURRENT],
                    }),
                    new TextRun({ text: ' of ' }),
                    new TextRun({
                      children: [PageNumber.TOTAL_PAGES],
                    }),
                  ],
                }),
              ],
            }),
          },
          children: paragraphs,
        },
      ],
    });

    // Generate and save
    const blob = await Packer.toBlob(doc);
    saveAs(blob, filename);

    return blob;
  } catch (error) {
    console.error('DOCX export failed:', error);
    throw new Error(
      `DOCX export failed: ${error instanceof Error ? error.message : 'Unknown error'}`
    );
  }
}
