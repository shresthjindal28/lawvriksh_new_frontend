// Server Components (for layout shells)
export { ReferenceManagerShell } from './server/ReferenceManagerShell';
export { SidebarShell } from './server/SidebarShell';
export { HeaderShell } from './server/HeaderShell';

// Client Components - Layout
export { default as ReferenceManager } from './client/layout/ReferenceManager';
export { default as ReferenceSidebar } from './client/layout/ReferenceSidebar';
export { default as ReferenceHeader } from './client/layout/ReferenceHeader';
export { default as InfoPanel } from './client/layout/InfoPanel';

// Client Components - Virtualized Tables (for performance)
export { VirtualizedReferenceTable } from './client/tables/VirtualizedReferenceTable';
export { ReferenceRow } from './client/tables/ReferenceRow';

// Client Components - Content
export { default as ReferenceTable } from './client/content/ReferenceTable';
export { default as ReferenceContextMenu } from './client/content/ReferenceContextMenu';
export { DocumentHeader } from './client/content/DocumentHeader';
export { default as EmptyStateAnimation } from './client/content/EmptyStateAnimation';
export { AnimatedEmptyCollection } from './client/content/AnimatedEmptyCollection';
export { AnimatedCreateButton } from './client/content/AnimatedCreateButton';

// Client Components - Dialogs
export { default as CreateReferenceDialog } from './client/dialogs/CreateReferenceDialog';
export { default as FolderSelectionMenu } from './client/dialogs/FolderSelectionMenu';
export { default as ReferencePdfPreviewModal } from './client/dialogs/ReferencePdfPreviewModal';
export { default as UnifiedUploadDialog } from './client/dialogs/UnifiedUploadDialog';

// Client Components - Sidebar
export { default as CollectionNode } from './client/sidebar/CollectionNode';
export { default as CreateFolderMenu } from './client/sidebar/CreateFolderMenu';

// Client Components - Tags
export { default as AddTag } from './client/tags/AddTag';
export { default as InteractiveTag } from './client/tags/InteractiveTag';
export { default as ReferenceTags } from './client/tags/ReferenceTags';
export { default as TagMenu } from './client/tags/TagMenu';

// Client Components - Viewer
export { default as AnnotateFile } from './client/viewer/AnnotateFile';
export { DocumentViewer } from './client/viewer/DocumentViewer';
export { default as TimelineSidebar } from './client/viewer/TimelineSidebar';

// Shared Components
export { IconPicker } from './shared/components/IconPicker';
export { SafeDynamicIcon } from './shared/components/SafeDynamicIcon';
