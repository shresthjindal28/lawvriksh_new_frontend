'use client';

import { DynamicIcon } from 'lucide-react/dynamic';
import { LucideProps } from 'lucide-react';
import dynamicIconImports from 'lucide-react/dynamicIconImports';

// Map old/invalid names to valid ones
const ICON_MAPPING: Record<string, string> = {
  'file-edit': 'file-pen',
  'file-video': 'file-video-camera',
  'edit-2': 'pen',
  edit: 'pencil',
  'upload-cloud': 'cloud-upload',
  'download-cloud': 'cloud-download',
  'user-circle': 'circle-user',
  home: 'house',
  'house-heart': 'house-plus',
  filter: 'list-filter',
  'filter-x': 'list-filter',
};

export function SafeDynamicIcon({ name, ...props }: { name: string } & LucideProps) {
  let mappedName = ICON_MAPPING[name] || name;

  // Validate if the icon exists in lucide-react
  if (!dynamicIconImports[mappedName as keyof typeof dynamicIconImports]) {
    console.warn(
      `[SafeDynamicIcon] Icon "${name}" (mapped to "${mappedName}") not found. Fallback to "circle-help".`
    );
    mappedName = 'circle-help';
  }

  return <DynamicIcon name={mappedName as any} {...props} />;
}
