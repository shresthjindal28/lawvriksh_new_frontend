export type FilterType = 'recent' | 'article' | 'research_paper' | 'assignment' | 'draft';

export const filterButtons = [
  { type: 'recent' as FilterType, label: 'Most Recent' },
  { type: 'article' as FilterType, label: 'Article' },
  { type: 'research_paper' as FilterType, label: 'Research Paper' },
  { type: 'assignment' as FilterType, label: 'Assignment' },
  { type: 'draft' as FilterType, label: 'Draft' },
];
