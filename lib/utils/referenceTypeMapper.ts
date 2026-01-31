// utils/referenceTypeMapper.ts

import { ReferenceType } from '@/types/reference-manager';
import { ReferenceTypeEnum } from '@/types/reference-manager-api';

export const ReferenceTypeToAPI: Record<ReferenceType, ReferenceTypeEnum> = {
  general_document: 'DOCUMENT',
  article: 'ARTICLE',
  hearing: 'HEARING',
  legal_case: 'LEGAL_CASE',
  legislation: 'LEGISLATION',
  conference_paper: 'RESEARCH_PAPER',
  thesis: 'THESIS',
  regulation: 'REGULATION',
  report: 'REPORT',
  bill: 'BILL',
  book: 'BOOK',
};

export const apiEnumToUIType = (value?: string): ReferenceType => {
  const raw = (value || '').trim();
  if (!raw) return 'general_document';

  const vUpper = raw.toUpperCase();
  switch (vUpper) {
    case 'ARTICLE':
      return 'article';
    case 'DOCUMENT':
      return 'general_document';
    case 'HEARING':
      return 'hearing';
    case 'LEGAL_CASE':
      return 'legal_case';
    case 'LEGISLATION':
      return 'legislation';
    case 'RESEARCH_PAPER':
      return 'conference_paper';
    case 'CONFERENCE_PAPER':
      return 'conference_paper';
    case 'THESIS':
      return 'thesis';
    case 'REGULATION':
      return 'regulation';
    case 'REPORT':
      return 'report';
    case 'BILL':
      return 'bill';
    case 'BOOK':
      return 'book';
    case 'CASE':
      return 'legal_case';
    case 'JOURNAL':
      return 'article';
  }

  const vLower = raw.toLowerCase();
  switch (vLower) {
    case 'article':
      return 'article';
    case 'document':
      return 'general_document';
    case 'hearing':
      return 'hearing';
    case 'legal_case':
      return 'legal_case';
    case 'case':
      return 'legal_case';
    case 'legislation':
      return 'legislation';
    case 'research_paper':
      return 'conference_paper';
    case 'conference_paper':
      return 'conference_paper';
    case 'thesis':
      return 'thesis';
    case 'regulation':
      return 'regulation';
    case 'report':
      return 'report';
    case 'bill':
      return 'bill';
    case 'book':
      return 'book';
    case 'journal':
      return 'article';
    default:
      return 'general_document';
  }
};
