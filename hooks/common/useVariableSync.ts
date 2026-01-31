import { create } from 'zustand';
import { Editor } from '@tiptap/react';

type VariableType = 'text' | 'email' | 'number' | 'date' | 'url' | 'currency';

interface Variable {
  name: string;
  label: string;
  type: VariableType;
  value: string;
  editable: boolean;
}

interface VariableStore {
  variables: Record<string, Variable>;
  editor: Editor | null;

  setEditor: (editor: Editor | null) => void;
  setVariables: (variables: Record<string, Variable>) => void;

  // Update from sidebar → propagate to editor
  updateFromSidebar: (name: string, value: string) => void;

  // Update from editor → propagate to sidebar
  updateFromEditor: (name: string, value: string) => void;
}

export const useVariableStore = create<VariableStore>((set, get) => ({
  variables: {},
  editor: null,

  setEditor: (editor) => set({ editor }),

  setVariables: (variables) => set({ variables }),

  updateFromSidebar: (name, value) => {
    const { editor, variables } = get();

    // Update local state
    set({
      variables: {
        ...variables,
        [name]: { ...variables[name], value },
      },
    });

    // Propagate to editor
    if (editor && !editor.isDestroyed) {
      (editor.commands as any).updateVariableValue(name, value);
    }
  },

  updateFromEditor: (name, value) => {
    const { variables } = get();

    // Update local state
    set({
      variables: {
        ...variables,
        [name]: { ...variables[name], value },
      },
    });

    // Sidebar will re-render automatically via subscription
  },
}));

// Hook for components to use
export function useVariableSync() {
  const updateFromSidebar = useVariableStore((state) => state.updateFromSidebar);
  const updateFromEditor = useVariableStore((state) => state.updateFromEditor);

  return {
    updateVariable: updateFromSidebar,
    updateVariableFromEditor: updateFromEditor,
  };
}
