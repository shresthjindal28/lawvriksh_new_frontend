import { create } from 'zustand';

interface CitationItem {
  pageNumber: number;
  title: string;
}

interface CitationState {
  pageNumbers: number[];
  citationTitles: string[];
  citations: CitationItem[];
  setCitations: (citations: CitationItem[]) => void;
  clearCitations: () => void;
}

export const useCitationStore = create<CitationState>((set) => ({
  pageNumbers: [],
  citationTitles: [],
  citations: [],
  setCitations: (citations) => {
    const pageNumbers = citations.map((c) => c.pageNumber);
    const citationTitles = citations.map((c) => c.title);

    set({
      citations,
      pageNumbers,
      citationTitles,
    });
  },
  clearCitations: () => set({ citations: [], pageNumbers: [], citationTitles: [] }),
}));
