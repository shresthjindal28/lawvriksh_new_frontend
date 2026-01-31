'use client';

/**
 * @deprecated ReferenceContext is no longer used.
 * State management has been migrated to Zustand.
 * Use `useReferenceContext()` from '@/hooks/editor/useReferenceContext' instead.
 *
 * The Zustand store is at '@/store/zustand/useReferenceStore'.
 */

import { createContext } from 'react';
import { ReferenceContextType } from './types';

/**
 * @deprecated Use useReferenceContext() hook instead
 */
export const ReferenceContext = createContext<ReferenceContextType | undefined>(undefined);
