import { OutputData } from '@editorjs/editorjs';
import { nanoid } from 'nanoid';
import { ConvertTemplateResponse, TemplateStructure } from '@/lib/api/ConversionService';
import { Template } from '@/types/project';

export interface TableOfContentsItem {
  id: string;
  title: string;
  level: number;
}

//Converts EditorJS OutputData to HTML string
export function editorJsToHtml(data: OutputData): string {
  if (!data || !data.blocks || data.blocks.length === 0) {
    return '';
  }

  // Skip blocks that are part of References section
  let skipUntilNextHeader = false;

  const htmlBlocks = data.blocks.map((block: any) => {
    // Skip References header and its content
    if (block.type === 'header') {
      const headerText = (block.data.text || '').toLowerCase();
      if (headerText.includes('reference')) {
        skipUntilNextHeader = true;
        return null; // Skip this header
      } else {
        skipUntilNextHeader = false;
      }
    }

    // Skip list blocks after References header
    if (skipUntilNextHeader && block.type === 'list') {
      return null;
    }

    // Extract alignment from block tunes if present
    const alignment = block.tunes?.alignmentTune?.alignment || 'left';
    const alignStyle = alignment !== 'left' ? `text-align: ${alignment};` : '';

    switch (block.type) {
      case 'header':
        const level = block.data.level || 2;
        return alignStyle
          ? `<h${level} style="${alignStyle}">${block.data.text}</h${level}>`
          : `<h${level}>${block.data.text}</h${level}>`;

      case 'paragraph':
        // Use placeholder as fallback text for empty paragraphs (template guidance)
        const paragraphText = block.data.text || block.data.placeholder || '';
        // If paragraph text contains placeholder guidance, wrap in italics
        const displayText =
          block.data.placeholder && !block.data.text
            ? `<em style="color: #666;">${paragraphText}</em>`
            : paragraphText;
        return alignStyle ? `<p style="${alignStyle}">${displayText}</p>` : `<p>${displayText}</p>`;

      case 'list':
        const listType = block.data.style === 'ordered' ? 'ol' : 'ul';
        const items = (block.data.items || [])
          .map((i: any) => {
            // Handle nested list items which might be objects
            if (typeof i === 'string') return `<li>${i}</li>`;
            if (i?.content) return `<li>${i.content}</li>`;
            if (i?.text) return `<li>${i.text}</li>`;
            return '';
          })
          .join('');
        return alignStyle
          ? `<${listType} style="${alignStyle}">${items}</${listType}>`
          : `<${listType}>${items}</${listType}>`;

      case 'quote':
        const quoteStyle = alignStyle ? ` style="${alignStyle}"` : '';
        return `<blockquote${quoteStyle}>
                    <p>${block.data.text}</p>
                    ${block.data.caption ? `<cite>${block.data.caption}</cite>` : ''}
                </blockquote>`;

      case 'code':
        return `<pre><code>${escapeHtml(block.data.code)}</code></pre>`;

      case 'delimiter':
        return `<hr />`;

      case 'raw':
        return block.data.html || '';

      case 'table':
        const tableContent = block.data.content
          .map((row: string[]) => {
            const cells = row.map((cell) => `<td>${cell}</td>`).join('');
            return `<tr>${cells}</tr>`;
          })
          .join('');
        const tableStyle = alignStyle ? ` style="${alignStyle}"` : '';
        return `<table${tableStyle}>${tableContent}</table>`;

      case 'warning':
        return `<div class="warning">
                    <strong>${block.data.title}</strong>
                    <p>${block.data.message}</p>
                </div>`;

      case 'checklist':
        const checkItems = block.data.items
          .map(
            (item: { text: string; checked: boolean }) =>
              `<li><input type="checkbox" ${
                item.checked ? 'checked' : ''
              } disabled /> ${item.text}</li>`
          )
          .join('');
        return `<ul class="checklist">${checkItems}</ul>`;

      case 'image':
        const caption = block.data.caption ? `<figcaption>${block.data.caption}</figcaption>` : '';
        return `<figure>
                    <img src="${block.data.file?.url || ''}" alt="${block.data.caption || ''}" />
                    ${caption}
                </figure>`;

      case 'embed':
        return `<div class="embed">
                    <iframe src="${block.data.embed}" frameborder="0" allowfullscreen></iframe>
                    ${block.data.caption ? `<p>${block.data.caption}</p>` : ''}
                </div>`;

      default:
        // For unknown block types, try to extract text
        if (block.data.text) {
          return `<p>${block.data.text}</p>`;
        }
        return '';
    }
  });

  // Filter out null blocks (skipped References section) and join
  return htmlBlocks.filter((block): block is string => block !== null).join('\n');
}

//Helper function to escape HTML special characters
function escapeHtml(text: string): string {
  const map: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return text.replace(/[&<>"']/g, (char) => map[char]);
}

//Get plain text from EditorJS data (useful for excerpts)
export function editorJsToPlainText(data: OutputData): string {
  if (!data || !data.blocks || data.blocks.length === 0) {
    return '';
  }

  return data.blocks
    .map((block) => {
      if (block.data.text) {
        return block.data.text.replace(/<[^>]*>/g, ''); // Strip HTML tags
      }
      if (block.type === 'list' && block.data.items) {
        return block.data.items.join(' ');
      }
      return '';
    })
    .filter((text) => text.length > 0)
    .join(' ');
}

export function htmlToEditorData(html: string): OutputData {
  const parser = new DOMParser();
  const doc = parser.parseFromString(html, 'text/html');

  const blocks: OutputData['blocks'] = [];

  doc.body.childNodes.forEach((node) => {
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const element = node as HTMLElement;

    switch (element.tagName.toLowerCase()) {
      case 'h1':
      case 'h2':
      case 'h3':
      case 'h4':
      case 'h5':
      case 'h6':
        blocks.push({
          id: nanoid(),
          type: 'header',
          data: {
            text: element.innerHTML,
            level: Number(element.tagName[1]),
          },
        });
        break;
      case 'p':
        blocks.push({
          id: nanoid(),
          type: 'paragraph',
          data: { text: element.innerHTML },
        });
        break;
      case 'ul':
      case 'ol':
        const items = Array.from(element.querySelectorAll('li')).map((li) => li.innerHTML);
        blocks.push({
          id: nanoid(),
          type: 'list',
          data: {
            style: element.tagName.toLowerCase() === 'ol' ? 'ordered' : 'unordered',
            items,
          },
        });
        break;
      case 'blockquote':
        blocks.push({
          id: nanoid(),
          type: 'quote',
          data: { text: element.innerHTML },
        });
        break;
      case 'img':
        blocks.push({
          id: nanoid(),
          type: 'image',
          data: { file: { url: element.getAttribute('src') || '' } },
        });
        break;
      default:
        blocks.push({
          id: nanoid(),
          type: 'paragraph',
          data: { text: element.innerHTML },
        });
    }
  });

  return {
    time: Date.now(),
    blocks,
    version: '2.29.1',
  };
}

export function convertResponseToTemplate(
  response: TemplateStructure,
  templateId?: string
): Template {
  const generatedId =
    templateId || `tmpl_${response.document_type.toLowerCase().replace(/\s+/g, '_')}_${Date.now()}`;

  // Extract category from document type
  const category = response.document_type.toLowerCase().replace(/\s+/g, '_') as any;

  // Generate tags from document type
  const tags = response.document_type
    .toLowerCase()
    .split(/\s+/)
    .filter((word) => word.length > 2);

  const blocks: any[] = [];
  let blockCounter = 0;

  response.sections.forEach((section, sectionIndex) => {
    const sectionId = section.section_name.toLowerCase().replace(/\s+/g, '_');

    // Determine header level based on section structure
    // Main sections get level 2, subsections can be detected by numbering or nesting
    const headerLevel = section.section_name.match(/^\d+\.\d+/)
      ? 3
      : section.section_name.match(/^\d+\.\d+\.\d+/)
        ? 4
        : 2;

    // Add section header
    blocks.push({
      id: `${sectionId}_header_${blockCounter++}`,
      type: 'header',
      data: {
        text: section.section_name,
        level: headerLevel,
      },
    });

    // Combine guidance into a comprehensive text content
    const guidanceText = section.guidance.join(' ');
    const fullGuidanceText = `${guidanceText} [${section.word_count_suggestion}]`;

    // Add paragraph block for content - put guidance in text field so it renders
    blocks.push({
      id: `${sectionId}_para_${blockCounter++}`,
      type: 'paragraph',
      data: {
        text: `<em>${fullGuidanceText}</em>`, // Italicize guidance to indicate it's template text
        placeholder: 'Start writing here...',
      },
    });

    // Special handling for References section - add list format
    if (section.section_name.toLowerCase().includes('reference')) {
      blocks.push({
        id: `${sectionId}_list_${blockCounter++}`,
        type: 'list',
        data: {
          style: 'ordered',
          items: [
            "Author(s), 'Article Title' (Year) Volume Journal Name First Page",
            'Author(s), Book Title (Publisher Year)',
            'Case Name v Case Name [Year] Citation (Court)',
            'Legislation Name Year, Section/Article',
          ],
        },
      });
    }

    // Special handling for Abstract/Keywords sections
    if (
      section.section_name.toLowerCase().includes('abstract') &&
      response.sections.some((s) => s.section_name.toLowerCase().includes('keyword'))
    ) {
      // Add keywords placeholder if Abstract section exists
      const hasKeywordsSection = response.sections.some(
        (s) => s.section_name.toLowerCase() === 'keywords'
      );

      if (!hasKeywordsSection) {
        blocks.push({
          id: `keywords_para_${blockCounter++}`,
          type: 'paragraph',
          data: {
            text: '',
            placeholder: '<b>Keywords:</b> keyword 1, keyword 2, keyword 3, keyword 4, keyword 5',
          },
        });
      }
    }
  });

  // Construct the template object
  const template: Template = {
    templateId: generatedId,
    title: response.document_type,
    category: category,
    tags: tags,
    content: {
      time: Date.now(),
      blocks: blocks,
      version: '2.28.0',
    },
  };

  return template;
}

// Helper function to extract headings from EditorJS content
export function extractTableOfContents(content: any): TableOfContentsItem[] {
  const toc: TableOfContentsItem[] = [];

  if (content?.blocks) {
    content.blocks.forEach((block: any, index: number) => {
      if (block.type === 'header' || block.type === 'heading') {
        const level = block.data.level || 2;
        toc.push({
          id: `heading-${index}`,
          title: block.data.text?.replace(/<[^>]*>/g, '') || 'Untitled',
          level,
        });
      }
    });
  }

  return toc;
}

export const applyHighlightToSelectedText = (color: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  // Create highlight span
  const span = document.createElement('span');
  span.style.backgroundColor = color;
  span.style.padding = '2px 0';
  span.setAttribute('data-highlight', 'true');

  try {
    range.surroundContents(span);
  } catch (e) {
    // Fallback if surroundContents fails
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  // Trigger change event
  const blockElement = span.closest('.ce-block__content');
  if (blockElement) {
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'formatBackColor',
    });
    blockElement.dispatchEvent(event);
  }

  selection.removeAllRanges();
};

/**
 * Apply text color to selected text
 */
export const applyColorToSelectedText = (color: string) => {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  // Create color span
  const span = document.createElement('span');
  span.style.color = color;
  span.setAttribute('data-color', 'true');

  try {
    range.surroundContents(span);
  } catch (e) {
    // Fallback if surroundContents fails
    const fragment = range.extractContents();
    span.appendChild(fragment);
    range.insertNode(span);
  }

  // Trigger change event
  const blockElement = span.closest('.ce-block__content');
  if (blockElement) {
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'formatColor',
    });
    blockElement.dispatchEvent(event);
  }

  selection.removeAllRanges();
};

/**
 * Remove highlight (background color) from selected text
 */
export function removeHighlight() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  // Get all spans with background color in the selection
  const container = range.commonAncestorContainer;
  const parent =
    container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

  // Find all highlighted spans
  const spans = parent?.querySelectorAll('span[style*="background-color"]');
  spans?.forEach((span) => {
    const spanElement = span as HTMLElement;
    if (spanElement.style.backgroundColor) {
      // Remove the span and keep its content
      const parent = spanElement.parentNode;
      if (parent) {
        while (spanElement.firstChild) {
          parent.insertBefore(spanElement.firstChild, spanElement);
        }
        parent.removeChild(spanElement);
      }
    }
  });

  // Trigger change event
  const blockElement = parent?.closest('.ce-block__content');
  if (blockElement) {
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'formatBackColor',
    });
    blockElement.dispatchEvent(event);
  }

  selection.removeAllRanges();
}

/**
 * Remove text color from selected text
 */
export function removeTextColor() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  // Get all spans with color in the selection
  const container = range.commonAncestorContainer;
  const parent =
    container.nodeType === Node.TEXT_NODE ? container.parentElement : (container as HTMLElement);

  // Find all colored spans
  const spans = parent?.querySelectorAll('span[style*="color"]');
  spans?.forEach((span) => {
    const spanElement = span as HTMLElement;
    if (spanElement.style.color && !spanElement.style.backgroundColor) {
      // Remove the span and keep its content
      const parent = spanElement.parentNode;
      if (parent) {
        while (spanElement.firstChild) {
          parent.insertBefore(spanElement.firstChild, spanElement);
        }
        parent.removeChild(spanElement);
      }
    }
  });

  // Trigger change event
  const blockElement = parent?.closest('.ce-block__content');
  if (blockElement) {
    const event = new InputEvent('input', {
      bubbles: true,
      cancelable: true,
      inputType: 'formatColor',
    });
    blockElement.dispatchEvent(event);
  }

  selection.removeAllRanges();
}
