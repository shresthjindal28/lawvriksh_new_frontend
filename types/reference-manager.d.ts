export interface Tag {
  id: string;
  label: string;
  color: string;
}

// Reference Types
export type ReferenceType =
  | 'general_document'
  | 'article'
  | 'hearing'
  | 'legal_case'
  | 'legislation'
  | 'conference_paper'
  | 'thesis'
  | 'regulation'
  | 'report'
  | 'bill'
  | 'book';

// Metadata types for each reference type
export type ArticleMetadata = {
  author?: string;
  url?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  genre?: string;
  language?: string;
  publisher?: string;
  publisherPlace?: string;
  license?: string;
  publication?: string;
  series?: string;
  seriesNumber?: string;
};

export type HearingMetadata = {
  contributor?: string;
  url?: string;
  abstract?: string;
  date?: string;
  language?: string;
  history?: string;
  legislativeBody?: string;
  committee?: string;
  publisher?: string;
  license?: string;
  place?: string;
  documentNumber?: string;
  numberOfVolumes?: string;
  pages?: string;
  session?: string;
};

export type LegalCaseMetadata = {
  author?: string;
  caseName?: string;
  url?: string;
  abstract?: string;
  docketNumber?: string;
  dateDecided?: string;
  language?: string;
  history?: string;
  court?: string;
  reporter?: string;
  reportVolume?: string;
  license?: string;
  pages?: string;
};

export type LegislationMetadata = {
  author?: string;
  url?: string;
  abstract?: string;
  dateEnacted?: string;
  language?: string;
  history?: string;
  legislativeBody?: string;
  license?: string;
  code?: string;
  codeVolume?: string;
  pages?: string;
  section?: string;
  session?: string;
  lawNumber?: string;
};

export type ConferencePaperMetadata = {
  author?: string;
  conferenceName?: string;
  proceedingTitle?: string;
  url?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  conferencePlace?: string;
  language?: string;
  publisher?: string;
  publisherPlace?: string;
  license?: string;
  series?: string;
  volume?: string;
  page?: string;
};

export type ThesisMetadata = {
  author?: string;
  url?: string;
  type?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  language?: string;
  university?: string;
  place?: string;
  license?: string;
  numberOfPages?: string;
};

export type RegulationMetadata = {
  author?: string;
  url?: string;
  abstract?: string;
  enforcementDate?: string;
  language?: string;
  legislation?: string;
  governmentBody?: string;
  license?: string;
  code?: string;
  codeVolume?: string;
  pages?: string;
  section?: string;
  session?: string;
  regulationNumber?: string;
};

export type ReportMetadata = {
  author?: string;
  url?: string;
  reportType?: string;
  reportNumber?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  language?: string;
  institution?: string;
  place?: string;
  license?: string;
  series?: string;
};

export type BillMetadata = {
  sponsor?: string;
  url?: string;
  abstract?: string;
  date?: string;
  language?: string;
  history?: string;
  legislativeBody?: string;
  license?: string;
  code?: string;
  codePages?: string;
  codeVolume?: string;
  section?: string;
  session?: string;
};

export type BookMetadata = {
  author?: string;
  url?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  note?: string;
  language?: string;
  publisher?: string;
  publisherPlace?: string;
  license?: string;
  edition?: string;
  series?: string;
  seriesNumber?: string;
  numberOfVolumes?: string;
  volume?: string;
  numberOfPages?: string;
};

export type GeneralDocumentMetadata = {
  author?: string;
  url?: string;
  format?: string;
  abstract?: string;
  callNumber?: string;
  date?: string;
  language?: string;
  publisher?: string;
  publisherPlace?: string;
  license?: string;
};

export type ReferenceMetadata =
  | ArticleMetadata
  | HearingMetadata
  | LegalCaseMetadata
  | LegislationMetadata
  | ConferencePaperMetadata
  | ThesisMetadata
  | RegulationMetadata
  | ReportMetadata
  | BillMetadata
  | BookMetadata
  | GeneralDocumentMetadata;

export type Note = {
  id: string;
  content: string;
  type: 'independent' | 'annotation';
  createdBy: string;
  createdAt: string;
  modifiedAt?: string;
  textSelected?: string;
};

export type Annotation = {
  id: string;
  type: 'manual_highlight' | 'manual_note' | 'auto_annotate';
  textSelected?: string;
  note?: string;
  prompt?: string;
  comment?: string[];
  highlightColor?: string;
  locationInDocument: {
    page: number;
    coordinates?: { x: number; y: number; width: number; height: number };
    coordinatesList?: { x: number; y: number; width: number; height: number }[];
    charStart?: number;
    charEnd?: number;
  };
  createdBy: string;
  createdAt: string;
  reason?: string; // For AI annotations
};

export type ReferenceItem = {
  id: string;
  type: ReferenceType;
  title: string;
  metadata: ReferenceMetadata;

  // Collection/Folder organization
  collectionId?: string;
  folderId?: string;
  documentId?: string;
  refId?: string;
  location?: string;

  // File information
  document_source_type?: 'file' | 'weblink' | 'FILE' | 'WEBLINK';
  file_url?: string;
  s3_key?: string;
  web_url?: string;
  fileName?: string;
  size?: string;
  uploadedBy?: string;
  dateUploaded?: string;

  // User data
  independentNotes?: Note[]; // Notes NOT tied to text
  annotations?: Annotation[];
  tags?: Tag[];

  // Timestamps
  createdAt?: string;
  created_at?: string;
  modifiedAt?: string;
};
