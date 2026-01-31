'use client';

import { ReactNode } from 'react';

/**
 * ReferenceProvider - Kept for backward compatibility with component tree.
 *
 * With Zustand, we no longer need a React Context Provider for state management.
 * The useReferenceStore hook provides direct access to the store from anywhere.
 *
 * This component is now a simple pass-through that renders its children.
 * It can be safely removed from the component tree in the future.
 */
export function ReferenceProvider({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
