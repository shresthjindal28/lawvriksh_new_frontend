// Define CSL data structure for citations
interface CSLCitation {
  id: string;
  title: string;
  author: [{ family: string; given: string } | { literal: string }];
  issued: { 'date-parts': [[number]] };
  source?: string;
  URL?: string;
  type: string;
}

// Citation style options
export const CITATION_STYLES = [
  { value: 'apa', label: 'APA 7th Edition', locale: 'en-US' },
  { value: 'mla', label: 'MLA 9th Edition', locale: 'en-US' },
  { value: 'chicago', label: 'Chicago 17th Edition', locale: 'en-US' },
  { value: 'harvard', label: 'Harvard', locale: 'en-US' },
  { value: 'vancouver', label: 'Vancouver', locale: 'en-US' },
  { value: 'ieee', label: 'IEEE', locale: 'en-US' },
  { value: 'bluebook', label: 'Bluebook', locale: 'en-US' },
  { value: 'oscola', label: 'OSCOLA', locale: 'en-US' },
  { value: 'turabian', label: 'Turabian', locale: 'en-US' },
  { value: 'acs', label: 'ACS', locale: 'en-US' },
  { value: 'ama', label: 'AMA', locale: 'en-US' },
  { value: 'apsa', label: 'APSA', locale: 'en-US' },
  { value: 'asa', label: 'ASA', locale: 'en-US' },
  { value: 'chicago-author-date', label: 'Chicago (Author-Date)', locale: 'en-US' },
  { value: 'cse', label: 'CSE', locale: 'en-US' },
];

export class CitationFormatter {
  private static instance: CitationFormatter;

  static getInstance(): CitationFormatter {
    if (!CitationFormatter.instance) {
      CitationFormatter.instance = new CitationFormatter();
    }
    return CitationFormatter.instance;
  }

  convertToCSL(citation: any): CSLCitation {
    const currentYear = new Date().getFullYear();

    return {
      id: citation.id,
      title: citation.title,
      author: this.parseAuthor(citation.author),
      issued: { 'date-parts': [[currentYear]] },
      source: citation.source,
      URL: citation.link,
      type: 'article',
    };
  }

  private parseAuthor(
    authorString: string
  ): [{ family: string; given: string } | { literal: string }] {
    if (!authorString || authorString === 'Unknown') {
      return [{ literal: 'Unknown' }];
    }

    // Try to parse "First Last" or "Last, First"
    if (authorString.includes(',')) {
      const [family, given] = authorString.split(',').map((s) => s.trim());
      return [{ family, given }];
    } else {
      const parts = authorString.trim().split(/\s+/);
      if (parts.length >= 2) {
        const given = parts.slice(0, -1).join(' ');
        const family = parts[parts.length - 1];
        return [{ family, given }];
      } else {
        return [{ literal: authorString }];
      }
    }
  }

  async formatInTextCitation(
    citation: any,
    style: string,
    locale: string = 'en-US'
  ): Promise<string> {
    // For now, use simple formatting based on style
    return this.formatSimpleCitation(citation, style);
  }

  private formatSimpleCitation(citation: any, style: string): string {
    const currentYear = new Date().getFullYear().toString();
    const author = citation.author || 'Unknown';
    const title = citation.title || '';

    switch (style) {
      case 'apa':
        // APA 7th Edition: (Author, Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName}, ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}", ${currentYear})`;
        }

      case 'mla':
        // MLA 9th Edition: (Author Last Name Page) or ("Title" Page)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}")`;
        }

      case 'chicago':
        // Chicago 17th Edition (Notes and Bibliography): (Author, Title, Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}")`;
        }

      case 'chicago-author-date':
        // Chicago Author-Date: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}" ${currentYear})`;
        }

      case 'harvard':
        // Harvard: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')} ${currentYear})`;
        }

      case 'vancouver':
        // Vancouver: (Author Year) or numeric
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')} ${currentYear})`;
        }

      case 'ieee':
        // IEEE: [1], [2], etc. or (Author, Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `[${authorName}${currentYear.slice(-2)}]`;
        } else {
          return `[${currentYear}]`;
        }

      case 'bluebook':
        // Bluebook: Author, Title (Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `${authorName}, ${title} (${currentYear})`;
        } else {
          return `${title} (${currentYear})`;
        }

      case 'oscola':
        // OSCOLA: Author, Title (Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `${authorName}, '${title}' (${currentYear})`;
        } else {
          return `'${title}' (${currentYear})`;
        }

      case 'turabian':
        // Turabian: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}" ${currentYear})`;
        }

      case 'acs':
        // ACS: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')} ${currentYear})`;
        }

      case 'ama':
        // AMA: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')})`;
        }

      case 'apsa':
        // APSA: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}")`;
        }

      case 'asa':
        // ASA: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `("${titleWords.join(' ')}" ${currentYear})`;
        }

      case 'cse':
        // CSE: (Author Year)
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')} ${currentYear})`;
        }

      default:
        if (author !== 'Unknown') {
          const authorName = author.split(' ').slice(-1)[0];
          return `(${authorName} ${currentYear})`;
        } else {
          const titleWords = title.split(' ').slice(0, 2);
          return `(${titleWords.join(' ')} ${currentYear})`;
        }
    }
  }

  async formatBibliography(
    citations: any[],
    style: string,
    locale: string = 'en-US'
  ): Promise<string[]> {
    return citations.map((c) => this.formatSimpleBibliography(c, style));
  }

  private formatSimpleBibliography(citation: any, style: string): string {
    const currentYear = new Date().getFullYear();
    const author = citation.author || 'Unknown';
    const title = citation.title || '';
    const source = citation.source || '';

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
        return `${author}, ${title} (${currentYear}) (available at ${citation.link || source}).`;

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
}
