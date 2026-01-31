import { Book, Briefcase, File, FileSearch, FileText, GraduationCap, PenLine } from 'lucide-react';
import type { ReferenceType } from '@/types/reference-manager';
import { ReferenceTypeValues } from '@/lib/constants/reference-types';

type ReferenceDialogOption = {
  id: ReferenceType;
  label: string;
  icon: React.ComponentType<{ size?: number }> | null;
  value: number;
};

export const referenceDialogOptions: ReferenceDialogOption[] = [
  {
    id: 'article',
    label: 'Article',
    icon: FileText,
    value: ReferenceTypeValues.ARTICLE,
  },
  {
    // UI label “Document” maps to the internal general_document type
    id: 'general_document',
    label: 'Document',
    icon: File,
    value: ReferenceTypeValues.DOCUMENT,
  },
  {
    id: 'hearing',
    label: 'Hearing',
    icon: null,
    value: ReferenceTypeValues.HEARING,
  },
  {
    id: 'legal_case',
    label: 'Legal Case',
    icon: Briefcase,
    value: ReferenceTypeValues.LEGAL_CASE,
  },
  {
    id: 'legislation',
    label: 'Legislation',
    icon: null,
    value: ReferenceTypeValues.LEGISLATION,
  },
  {
    // UI label “Research Paper” maps to internal conference_paper type
    id: 'conference_paper',
    label: 'Research Paper',
    icon: PenLine,
    value: ReferenceTypeValues.RESEARCH_PAPER,
  },
  {
    id: 'thesis',
    label: 'Thesis',
    icon: GraduationCap,
    value: ReferenceTypeValues.THESIS,
  },
  {
    id: 'regulation',
    label: 'Regulation',
    icon: null,
    value: ReferenceTypeValues.REGULATION,
  },
  {
    id: 'report',
    label: 'Report',
    icon: FileSearch,
    value: ReferenceTypeValues.REPORT,
  },
  {
    id: 'bill',
    label: 'Bill',
    icon: null,
    value: ReferenceTypeValues.BILL,
  },
  {
    id: 'book',
    label: 'Book',
    icon: Book,
    value: ReferenceTypeValues.BOOK,
  },
];
