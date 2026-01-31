import { useMemo } from 'react';
import type { ReactNode } from 'react';
import type { Editor } from '@tiptap/react';
import {
  AlignCenter,
  AlignJustify,
  AlignLeft,
  AlignRight,
  AtSign,
  Bold,
  Italic,
  List,
  ListOrdered,
  Quote,
  Redo2,
  Search,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Strikethrough,
  Underline,
  Undo2,
  Upload,
  FileText,
  X,
} from 'lucide-react';
import type { AnalysisShortcutActions } from '@/types/analysis-sidebar';

export type ToolbarActionCategory =
  | 'ai'
  | 'formatting'
  | 'lists'
  | 'layout'
  | 'analysis'
  | 'documents';

export interface ToolbarAction {
  id: string;
  label: string;
  description: string;
  icon: ReactNode;
  category: ToolbarActionCategory;
  keywords: string[];
  action: () => void;
  isAvailable?: () => boolean;
}

export const CATEGORY_LABELS: Record<ToolbarActionCategory, string> = {
  ai: 'AI & Citations',
  formatting: 'Text Formatting',
  lists: 'Lists & Blocks',
  layout: 'Alignment',
  analysis: 'Analysis Workflows',
  documents: 'Documents & Discover',
};

interface UseToolbarActionsParams {
  editor: Editor | null;
  onAi?: (e?: React.MouseEvent) => void;
  onCite?: () => void;
  onToggleVariables?: () => void;
  analysisActions?: AnalysisShortcutActions | null;
  searchQuery?: string;
}

export function useToolbarActions({
  editor,
  onAi,
  onCite,
  onToggleVariables,
  analysisActions,
  searchQuery = '',
}: UseToolbarActionsParams) {
  const availableActions = useMemo<ToolbarAction[]>(() => {
    const safeEditor = editor;
    const runEditorCommand = (callback: (editor: Editor) => void) => {
      if (!safeEditor) return;
      callback(safeEditor);
    };

    const baseActions: ToolbarAction[] = [
      {
        id: 'ai-assistant',
        label: 'AI Assistant',
        description: 'Open the AI helper',
        icon: <Sparkles size={20} />,
        category: 'ai',
        keywords: ['ai', 'assistant', 'draft', 'more'],
        action: () => {
          onAi?.();
        },
      },
      {
        id: 'add-citation',
        label: 'Add Citation',
        description: 'Insert a reference quickly',
        icon: <AtSign size={20} />,
        category: 'ai',
        keywords: ['cite', 'reference', 'source'],
        action: () => {
          onCite?.();
        },
      },
      {
        id: 'undo',
        label: 'Undo',
        description: 'Reverse the last edit',
        icon: <Undo2 size={20} />,
        category: 'layout',
        keywords: ['undo', 'back', 'ctrl+z'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().undo().run();
          });
        },
        isAvailable: () => safeEditor?.can().undo() ?? false,
      },
      {
        id: 'redo',
        label: 'Redo',
        description: 'Bring back the undone change',
        icon: <Redo2 size={20} />,
        category: 'layout',
        keywords: ['redo', 'forward', 'ctrl+y'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().redo().run();
          });
        },
        isAvailable: () => safeEditor?.can().redo() ?? false,
      },
      {
        id: 'bold',
        label: 'Bold',
        description: 'Toggle bold text',
        icon: <Bold size={20} />,
        category: 'formatting',
        keywords: ['bold', 'strong', 'format'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleBold().run();
          });
        },
      },
      {
        id: 'italic',
        label: 'Italic',
        description: 'Toggle italics',
        icon: <Italic size={20} />,
        category: 'formatting',
        keywords: ['italic', 'slant'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleItalic().run();
          });
        },
      },
      {
        id: 'underline',
        label: 'Underline',
        description: 'Toggle underline',
        icon: <Underline size={20} />,
        category: 'formatting',
        keywords: ['underline', 'line'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleUnderline().run();
          });
        },
      },
      {
        id: 'strikethrough',
        label: 'Strikethrough',
        description: 'Toggle strikethrough',
        icon: <Strikethrough size={20} />,
        category: 'formatting',
        keywords: ['strikethrough', 'strike', 'remove'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleStrike().run();
          });
        },
      },
      {
        id: 'bullet-list',
        label: 'Bullet List',
        description: 'Add or remove bullet list',
        icon: <List size={20} />,
        category: 'lists',
        keywords: ['bullet', 'list', 'unordered'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleBulletList().run();
          });
        },
      },
      {
        id: 'numbered-list',
        label: 'Numbered List',
        description: 'Add or remove numbered list',
        icon: <ListOrdered size={20} />,
        category: 'lists',
        keywords: ['ordered', 'list', 'number'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleOrderedList().run();
          });
        },
      },
      {
        id: 'blockquote',
        label: 'Blockquote',
        description: 'Toggle blockquote',
        icon: <Quote size={20} />,
        category: 'lists',
        keywords: ['quote', 'blockquote'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().toggleBlockquote().run();
          });
        },
      },
      {
        id: 'align-left',
        label: 'Align Left',
        description: 'Align text to the left',
        icon: <AlignLeft size={20} />,
        category: 'layout',
        keywords: ['align', 'left'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().setTextAlign('left').run();
          });
        },
      },
      {
        id: 'align-center',
        label: 'Align Center',
        description: 'Center align text',
        icon: <AlignCenter size={20} />,
        category: 'layout',
        keywords: ['center', 'align'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().setTextAlign('center').run();
          });
        },
      },
      {
        id: 'align-right',
        label: 'Align Right',
        description: 'Align text to the right',
        icon: <AlignRight size={20} />,
        category: 'layout',
        keywords: ['right', 'align'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().setTextAlign('right').run();
          });
        },
      },
      {
        id: 'align-justify',
        label: 'Justify',
        description: 'Justify text',
        icon: <AlignJustify size={20} />,
        category: 'layout',
        keywords: ['justify', 'align'],
        action: () => {
          runEditorCommand((ed) => {
            ed.chain().focus().setTextAlign('justify').run();
          });
        },
      },
      {
        id: 'toggle-variables',
        label: 'Toggle Variables',
        description: 'Show or hide variable panel',
        icon: <AtSign size={20} />,
        category: 'ai',
        keywords: ['variables', 'fields', 'meta'],
        action: () => {
          onToggleVariables?.();
        },
        isAvailable: () => typeof onToggleVariables === 'function',
      },
    ];

    const analysisActionList: ToolbarAction[] = analysisActions
      ? [
          {
            id: 'open-ai-tab',
            label: 'AI Tools',
            description: 'Open AI drafting assistant',
            icon: <Sparkles size={18} />,
            category: 'ai',
            keywords: ['ai', 'draft', 'assistant', 'tools'],
            action: () => {
              analysisActions.openAiTab();
            },
          },
          {
            id: 'open-facts-tab',
            label: 'Show Facts Analysis',
            description: 'View the facts panel and focus on claims',
            icon: <ShieldCheck size={18} />,
            category: 'analysis',
            keywords: ['facts', 'analysis', 'claims'],
            action: () => {
              analysisActions.openAnalysisTab();
              analysisActions.setAnalysisSubTab('facts');
            },
          },
          {
            id: 'run-facts-analysis',
            label: 'Run Facts Analysis',
            description: 'Check claims against sources',
            icon: <ShieldCheck size={18} />,
            category: 'analysis',
            keywords: ['analyze', 'facts', 'check'],
            action: () => {
              analysisActions.analyzeFacts();
            },
          },
          {
            id: 'open-compliance-tab',
            label: 'Show Compliance Tools',
            description: 'Navigate to compliance and plagiarism controls',
            icon: <ShieldAlert size={18} />,
            category: 'analysis',
            keywords: ['compliance', 'plagiarism', 'rules'],
            action: () => {
              analysisActions.openAnalysisTab();
              analysisActions.setAnalysisSubTab('compliances');
            },
          },
          {
            id: 'run-compliance-analysis',
            label: 'Run Compliance Check',
            description: 'Detect compliance violations',
            icon: <ShieldAlert size={18} />,
            category: 'analysis',
            keywords: ['compliance', 'violations', 'audit'],
            action: () => {
              analysisActions.analyzeCompliances();
            },
          },
          {
            id: 'open-argument-tab',
            label: 'Show Argument & Logics',
            description: 'Highlight contradictions in your reasoning',
            icon: <Upload size={18} />,
            category: 'analysis',
            keywords: ['arguments', 'logic', 'reasoning'],
            action: () => {
              analysisActions.openAnalysisTab();
              analysisActions.setAnalysisSubTab('argument');
            },
          },
          {
            id: 'run-argument-analysis',
            label: 'Run Argument Analysis',
            description: 'Detect logical inconsistencies',
            icon: <Upload size={18} />,
            category: 'analysis',
            keywords: ['argument', 'logic', 'check'],
            action: () => {
              analysisActions.analyzeArguments();
            },
          },
          {
            id: 'run-plagiarism',
            label: 'Run Plagiarism Check',
            description: 'Scan for plagiarism & AI-generated text',
            icon: <ShieldAlert size={18} />,
            category: 'analysis',
            keywords: ['plagiarism', 'ai', 'detection'],
            action: () => {
              analysisActions.openPlagiarismTab('check');
              analysisActions.analyzePlagiarism();
            },
          },
          {
            id: 'run-ai-detection',
            label: 'Run AI Detection',
            description: 'Detect AI-generated content',
            icon: <Sparkles size={18} />,
            category: 'analysis',
            keywords: ['ai', 'detection', 'plagiarism'],
            action: () => {
              analysisActions.openPlagiarismTab('ai-detection');
              analysisActions.analyzeAiDetection();
            },
          },
          {
            id: 'clear-analysis',
            label: 'Clear Analysis Results',
            description: 'Reset facts, compliance, plagiarism and AI overlays',
            icon: <X size={18} />,
            category: 'analysis',
            keywords: ['clear', 'reset', 'analysis'],
            action: () => {
              analysisActions.clearAnalysis();
            },
          },
        ]
      : [];

    const documentActionList: ToolbarAction[] = analysisActions
      ? [
          {
            id: 'open-documents-tab',
            label: 'Open Documents Tab',
            description: 'Manage analysis documents and uploads',
            icon: <FileText size={18} />,
            category: 'documents',
            keywords: ['documents', 'files', 'upload'],
            action: () => {
              analysisActions.openDocumentsTab();
            },
          },
          {
            id: 'upload-document',
            label: 'Upload Document',
            description: 'Add new files for analysis',
            icon: <Upload size={18} />,
            category: 'documents',
            keywords: ['upload', 'document', 'compliance'],
            action: () => {
              analysisActions.openDocumentUpload();
            },
          },
          {
            id: 'upload-analysis-document',
            label: 'Upload Compliance File',
            description: 'Add compliance-specific documents',
            icon: <Upload size={18} />,
            category: 'documents',
            keywords: ['analysis', 'compliance', 'upload'],
            action: () => {
              analysisActions.openAnalysisUpload();
            },
          },
          {
            id: 'open-discover',
            label: 'Discover Tab',
            description: 'Search templates or explore tools',
            icon: <Search size={18} />,
            category: 'documents',
            keywords: ['discover', 'search', 'templates'],
            action: () => {
              analysisActions.openDiscoverTab();
            },
          },
        ]
      : [];

    return [...baseActions, ...analysisActionList, ...documentActionList];
  }, [editor, onAi, onCite, onToggleVariables, analysisActions]);

  const filteredActions = useMemo(() => {
    const query = searchQuery.toLowerCase().trim();
    if (!query) return availableActions;
    return availableActions.filter((action) => {
      if (action.description.toLowerCase().includes(query)) return true;
      if (action.label.toLowerCase().includes(query)) return true;
      return action.keywords.some((keyword) => keyword.toLowerCase().includes(query));
    });
  }, [availableActions, searchQuery]);

  const groupedActions = useMemo(() => {
    return filteredActions.reduce<Record<ToolbarActionCategory, ToolbarAction[]>>(
      (acc, action) => {
        const category = action.category;
        if (!acc[category]) {
          acc[category] = [];
        }
        if (action.isAvailable && !action.isAvailable()) {
          return acc;
        }
        acc[category]!.push(action);
        return acc;
      },
      {} as Record<ToolbarActionCategory, ToolbarAction[]>
    );
  }, [filteredActions]);

  const hasActions = useMemo(
    () => Object.values(groupedActions).some((group) => group.length > 0),
    [groupedActions]
  );

  return {
    groupedActions,
    hasActions,
  };
}
