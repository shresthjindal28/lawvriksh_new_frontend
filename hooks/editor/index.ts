// Writing-related service hooks
// These hooks handle API/service calls for writing pages

export { useAIWriting } from './useAIWriting';
export { useProjectData } from './useProjectData';
export { useCitations } from './useCitations';
export { useSmartSuggestion } from './useSmartSuggestion';

// Prompt History - Optimized with O(1) indexed access
export {
  usePromptHistory,
  usePromptById,
  useIsPromptExpanded,
  usePromptCount,
  useHasMorePrompts,
} from './usePromptHistory';

// Editor UI hooks
export { useCitationManager } from './useCitationManager';
export { useAIDraftingManager } from './useAIDraftingManager';
export { useAIPopupManager } from './useAIPopupManager';
export { useAutoSave } from './useAutoSave';
export { useScrollHeader } from './useScrollHeader';
export { useUnsavedChangesWarning } from './useUnsavedChangesWarning';
export { useNewProjectExitWarning } from './useNewProjectExitWarning';
export { useReferenceContext } from './useReferenceContext';
