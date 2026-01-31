import React from 'react';
import dynamic from 'next/dynamic';

const AnotateFileComponent = dynamic(
  () => import('@/components/reference-manager/client/viewer/AnnotateFile')
);

interface AnotateFilePageProps {
  params: Promise<{
    referenceId: string;
  }>;
}

import { ReferenceProvider } from '@/lib/contexts/reference/ReferenceProvider';

export default async function AnotateFilePage({ params }: AnotateFilePageProps) {
  const { referenceId } = await params;
  return (
    <ReferenceProvider>
      <AnotateFileComponent referenceId={referenceId} />
    </ReferenceProvider>
  );
}
