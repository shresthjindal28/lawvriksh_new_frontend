'use client';

import { HydrationBoundary, type DehydratedState } from '@tanstack/react-query';
import LibraryView from './LibraryView.client';

export default function LibraryClient({ dehydratedState }: { dehydratedState: DehydratedState }) {
  return (
    <HydrationBoundary state={dehydratedState}>
      <LibraryView />
    </HydrationBoundary>
  );
}
