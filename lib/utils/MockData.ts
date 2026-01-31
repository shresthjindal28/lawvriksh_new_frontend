// Mock Data Objects for Reference Manager
import { Tag, Collection, Folder } from '@/lib/contexts/ReferenceManagerContext';
import { ReferenceItem, ReferenceType } from '@/types/reference-manager';

export const mockTags: Tag[] = [];

export const mockCollections: Collection[] = [
  { id: 'collections', title: 'Collections' },
  { id: 'c-1', title: 'Legal Research' },
  { id: 'c-2', title: 'Academic Papers' },
  { id: 'c-3', title: 'Case Studies' },
];

export const mockFoldersByCollection: Record<string, Folder[]> = {
  collections: [],
  'c-1': [
    { id: 'f-1-1', title: 'Supreme Court Cases' },
    { id: 'f-1-2', title: 'Federal Regulations' },
  ],
  'c-2': [
    { id: 'f-2-1', title: 'Conference Papers' },
    { id: 'f-2-2', title: 'Journal Articles' },
  ],
  'c-3': [{ id: 'f-3-1', title: 'Landmark Cases' }],
};

export const mockReferences: ReferenceItem[] = [
  {
    id: 'r-1',
    type: 'legal_case',
    title: 'Brown v. Board of Education',
    metadata: {
      caseName: 'Brown v. Board of Education',
      court: 'Supreme Court',
      dateDecided: '1954-05-17',
      docketNumber: '347 U.S. 483',
      abstract:
        'Landmark Supreme Court case that declared racial segregation in public schools unconstitutional.',
    },
    collectionId: 'c-1',
    folderId: 'f-1-1',
    document_source_type: 'file',
    file_url: '/mock-files/brown-v-board.pdf',
    fileName: 'brown-v-board.pdf',
    size: '2.5 MB',
    tags: [],
    createdAt: '2024-01-15T10:00:00Z',
    modifiedAt: '2024-01-15T10:00:00Z',
  },
  {
    id: 'r-2',
    type: 'article',
    title: 'The Impact of AI on Legal Research',
    metadata: {
      author: 'Dr. Jane Smith',
      publication: 'Harvard Law Review',
      date: '2023-12-01',
      abstract:
        'An analysis of how artificial intelligence is transforming legal research methodologies.',
    },
    collectionId: 'c-2',
    folderId: 'f-2-2',
    document_source_type: 'weblink',
    web_url: 'https://example.com/ai-legal-research',
    tags: [],
    createdAt: '2024-01-10T14:30:00Z',
    modifiedAt: '2024-01-10T14:30:00Z',
  },
  {
    id: 'r-3',
    type: 'legislation',
    title: 'Civil Rights Act of 1964',
    metadata: {
      legislativeBody: 'United States Congress',
      dateEnacted: '1964-07-02',
      code: '42 U.S.C. § 2000d',
      abstract:
        'Landmark civil rights legislation that outlawed discrimination based on race, color, religion, sex, or national origin.',
    },
    collectionId: 'c-1',
    folderId: 'f-1-2',
    document_source_type: 'file',
    file_url: '/mock-files/civil-rights-act.pdf',
    fileName: 'civil-rights-act.pdf',
    size: '1.8 MB',
    tags: [],
    createdAt: '2024-01-05T09:15:00Z',
    modifiedAt: '2024-01-05T09:15:00Z',
  },
  {
    id: 'r-4',
    type: 'conference_paper',
    title: 'Machine Learning in Legal Document Analysis',
    metadata: {
      author: 'Prof. John Doe',
      conferenceName: 'International Conference on AI and Law',
      proceedingTitle: 'ICAIL 2023 Proceedings',
      date: '2023-06-15',
      abstract:
        'Novel approaches to applying machine learning techniques for analyzing legal documents.',
    },
    collectionId: 'c-2',
    folderId: 'f-2-1',
    document_source_type: 'file',
    file_url: '/mock-files/ml-legal-analysis.pdf',
    fileName: 'ml-legal-analysis.pdf',
    size: '3.2 MB',
    tags: [],
    createdAt: '2024-01-08T16:45:00Z',
    modifiedAt: '2024-01-08T16:45:00Z',
  },
  {
    id: 'r-5',
    type: 'book',
    title: 'Constitutional Law: Principles and Policies',
    metadata: {
      author: 'Prof. Alan Dershowitz',
      publisher: 'Oxford University Press',
      date: '2022-03-15',
      edition: '5th',
      abstract:
        'Comprehensive analysis of constitutional law principles and their application in modern jurisprudence.',
    },
    collectionId: 'c-3',
    folderId: 'f-3-1',
    document_source_type: 'file',
    file_url: '/mock-files/constitutional-law.pdf',
    fileName: 'constitutional-law.pdf',
    size: '5.1 MB',
    tags: [],
    createdAt: '2024-01-12T11:20:00Z',
    modifiedAt: '2024-01-12T11:20:00Z',
  },
];

export const mockTrashedReferences: ReferenceItem[] = [
  {
    id: 'trash-1',
    type: 'general_document',
    title: 'Old Legal Brief',
    metadata: {
      author: 'Unknown',
      date: '2020-05-10',
      abstract: 'Outdated legal brief that is no longer needed.',
    },
    document_source_type: 'file',
    file_url: '/mock-files/old-brief.pdf',
    fileName: 'old-brief.pdf',
    size: '856 KB',
    tags: [],
    createdAt: '2023-12-01T08:00:00Z',
    modifiedAt: '2024-01-01T08:00:00Z',
  },
];
