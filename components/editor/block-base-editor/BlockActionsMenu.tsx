'use client';

import { useState, useRef, useEffect } from 'react';
import { Editor } from '@tiptap/react';
import {
  Type,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  CheckSquare,
  Quote,
  Code,
  Palette,
  RefreshCw,
  Copy,
  Trash2,
  Sparkles,
  Link,
  ChevronRight,
} from 'lucide-react';

interface BlockActionsMenuProps {
  editor: Editor;
  blockPos: number;
  onClose: () => void;
  anchorPosition: { top: number; left: number };
  currentBlockType: string;
  onAskAI?: () => void;
}

// Text colors - 5 options for light theme
const TEXT_COLORS = [
  { id: 'default', label: 'Default', color: '#1a1a1a' },
  { id: 'blue', label: 'Blue', color: '#2563eb' },
  { id: 'green', label: 'Green', color: '#16a34a' },
  { id: 'orange', label: 'Orange', color: '#ea580c' },
  { id: 'purple', label: 'Purple', color: '#9333ea' },
];

// Background colors - 5 options matching text colors for light theme
const BG_COLORS = [
  { id: 'default', label: 'Default', color: 'transparent' },
  { id: 'blue', label: 'Blue', color: '#dbeafe' },
  { id: 'green', label: 'Green', color: '#dcfce7' },
  { id: 'orange', label: 'Orange', color: '#ffedd5' },
  { id: 'purple', label: 'Purple', color: '#f3e8ff' },
];

// Block types for Turn Into
const BLOCK_TYPES = [
  { id: 'paragraph', label: 'Text', icon: <Type size={16} /> },
  { id: 'heading1', label: 'Heading 1', icon: <Heading1 size={16} /> },
  { id: 'heading2', label: 'Heading 2', icon: <Heading2 size={16} /> },
  { id: 'heading3', label: 'Heading 3', icon: <Heading3 size={16} /> },
  { id: 'bulletList', label: 'Bullet List', icon: <List size={16} /> },
  { id: 'orderedList', label: 'Ordered List', icon: <ListOrdered size={16} /> },
  { id: 'taskList', label: 'Task List', icon: <CheckSquare size={16} /> },
  { id: 'blockquote', label: 'Blockquote', icon: <Quote size={16} /> },
  { id: 'codeBlock', label: 'Code Block', icon: <Code size={16} /> },
];

/**
 * BlockActionsMenu - Menu for block-level actions (color, turn into, delete, etc.)
 */
const BlockActionsMenu: React.FC<BlockActionsMenuProps> = ({
  editor,
  blockPos,
  onClose,
  anchorPosition,
  currentBlockType,
  onAskAI,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [activeSubmenu, setActiveSubmenu] = useState<'color' | 'turnInto' | null>(null);
  const [menuPosition, setMenuPosition] = useState(anchorPosition);

  // Ensure menu stays in viewport
  useEffect(() => {
    if (menuRef.current) {
      const rect = menuRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const viewportWidth = window.innerWidth;

      let newTop = anchorPosition.top;
      let newLeft = anchorPosition.left;

      if (rect.bottom > viewportHeight - 10) {
        newTop = anchorPosition.top - rect.height - 8;
      }
      if (rect.right > viewportWidth - 10) {
        newLeft = viewportWidth - rect.width - 20;
      }
      if (newLeft < 10) {
        newLeft = 10;
      }

      if (newTop !== anchorPosition.top || newLeft !== anchorPosition.left) {
        // Use setTimeout to avoid setState during render cycle
        setTimeout(() => setMenuPosition({ top: newTop, left: newLeft }), 0);
      }
    }
  }, [anchorPosition, activeSubmenu]);

  // Close on click outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        onClose();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  // Close on Escape
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (activeSubmenu) {
          setActiveSubmenu(null);
        } else {
          onClose();
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose, activeSubmenu]);

  // Apply text color to the current block content
  const applyTextColor = (color: string) => {
    // Select all content in the current block before applying color
    editor.chain().focus().selectParentNode().setColor(color).run();
    onClose();
  };

  // Apply background color (highlight) to current block content
  const applyBgColor = (color: string) => {
    // Select all content in the current block before applying highlight
    if (color === 'transparent') {
      editor.chain().focus().selectParentNode().unsetHighlight().run();
    } else {
      editor.chain().focus().selectParentNode().setHighlight({ color }).run();
    }
    onClose();
  };

  // Turn block into another type
  const turnInto = (type: string) => {
    // First, lift list items out of list if currently in a list
    const currentType = currentBlockType;
    const isInList =
      currentType === 'bulletList' || currentType === 'orderedList' || currentType === 'listItem';

    if (isInList) {
      // Lift the list item out of the list first
      editor.chain().focus().liftListItem('listItem').run();
    }

    // Now apply the transformation
    switch (type) {
      case 'paragraph':
        editor.chain().focus().setParagraph().run();
        break;
      case 'heading1':
        editor.chain().focus().setHeading({ level: 1 }).run();
        break;
      case 'heading2':
        editor.chain().focus().setHeading({ level: 2 }).run();
        break;
      case 'heading3':
        editor.chain().focus().setHeading({ level: 3 }).run();
        break;
      case 'bulletList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'orderedList':
        editor.chain().focus().toggleOrderedList().run();
        break;
      case 'taskList':
        editor.chain().focus().toggleBulletList().run();
        break;
      case 'blockquote':
        editor.chain().focus().toggleBlockquote().run();
        break;
      case 'codeBlock':
        editor.chain().focus().toggleCodeBlock().run();
        break;
    }
    onClose();
  };

  // Reset formatting
  const resetFormatting = () => {
    editor.chain().focus().clearNodes().unsetAllMarks().run();
    onClose();
  };

  // Duplicate node
  const duplicateNode = () => {
    const { state } = editor;
    const { selection } = state;
    const node = selection.$anchor.node(-1);

    if (node) {
      editor
        .chain()
        .focus()
        .insertContentAt(blockPos + node.nodeSize, node.toJSON())
        .run();
    }
    onClose();
  };

  // Copy to clipboard
  const copyToClipboard = () => {
    const { state } = editor;
    const content = state.doc.textBetween(
      blockPos,
      blockPos + state.selection.$anchor.node(-1).nodeSize
    );
    navigator.clipboard.writeText(content);
    onClose();
  };

  // Delete block
  const deleteBlock = () => {
    const { state } = editor;
    const node = state.selection.$anchor.node(-1);
    if (node) {
      editor
        .chain()
        .focus()
        .deleteRange({ from: blockPos, to: blockPos + node.nodeSize })
        .run();
    }
    onClose();
  };

  // Get display name for current block type
  const getBlockTypeName = () => {
    if (currentBlockType.includes('heading')) {
      const level = currentBlockType.match(/\d/)?.[0] || '1';
      return `Heading ${level}`;
    }
    return currentBlockType.charAt(0).toUpperCase() + currentBlockType.slice(1);
  };

  return (
    <div
      ref={menuRef}
      className="block-actions-menu"
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 1000,
      }}
    >
      <div className="block-actions-menu-content">
        {/* Block type label */}
        <div className="block-actions-header">{getBlockTypeName()}</div>

        {/* Color submenu trigger */}
        <button
          className={`block-actions-item ${activeSubmenu === 'color' ? 'is-active' : ''}`}
          onClick={() => setActiveSubmenu(activeSubmenu === 'color' ? null : 'color')}
          type="button"
        >
          <Palette size={16} />
          <span>Color</span>
          <ChevronRight size={14} className="ml-auto" />
        </button>

        {/* Turn Into submenu trigger */}
        <button
          className={`block-actions-item ${activeSubmenu === 'turnInto' ? 'is-active' : ''}`}
          onClick={() => setActiveSubmenu(activeSubmenu === 'turnInto' ? null : 'turnInto')}
          type="button"
        >
          <RefreshCw size={16} />
          <span>Turn Into</span>
          <ChevronRight size={14} className="ml-auto" />
        </button>

        {/* Reset formatting */}
        <button className="block-actions-item" onClick={resetFormatting} type="button">
          <RefreshCw size={16} />
          <span>Reset formatting</span>
        </button>

        <div className="block-actions-divider" />

        {/* Duplicate */}
        <button className="block-actions-item" onClick={duplicateNode} type="button">
          <Copy size={16} />
          <span>Duplicate node</span>
        </button>

        {/* Copy to clipboard */}
        <button className="block-actions-item" onClick={copyToClipboard} type="button">
          <Copy size={16} />
          <span>Copy to clipboard</span>
        </button>

        {/* Copy anchor link */}
        <button className="block-actions-item" onClick={copyToClipboard} type="button">
          <Link size={16} />
          <span>Copy anchor link</span>
        </button>

        <div className="block-actions-divider" />

        {/* Ask AI */}
        <button className="block-actions-item" onClick={onAskAI || onClose} type="button">
          <Sparkles size={16} />
          <span>Ask AI</span>
        </button>

        <div className="block-actions-divider" />

        {/* Delete */}
        <button className="block-actions-item text-red-500" onClick={deleteBlock} type="button">
          <Trash2 size={16} />
          <span>Delete</span>
        </button>
      </div>

      {/* Color Submenu */}
      {activeSubmenu === 'color' && (
        <div className="block-actions-submenu" style={{ left: '100%', top: 0 }}>
          <div className="block-actions-submenu-section">Text color</div>
          {TEXT_COLORS.map((c) => (
            <button
              key={c.id}
              className="block-actions-color-item"
              onClick={() => applyTextColor(c.color)}
              type="button"
            >
              <span className="color-indicator" style={{ color: c.color }}>
                A
              </span>
              <span>{c.label}</span>
            </button>
          ))}
          <div className="block-actions-submenu-section">Background color</div>
          {BG_COLORS.map((c) => (
            <button
              key={c.id}
              className="block-actions-color-item"
              onClick={() => applyBgColor(c.color)}
              type="button"
            >
              <span
                className="color-dot"
                style={{ backgroundColor: c.color === 'transparent' ? '#e5e7eb' : c.color }}
              />
              <span>{c.label}</span>
            </button>
          ))}
        </div>
      )}

      {/* Turn Into Submenu */}
      {activeSubmenu === 'turnInto' && (
        <div className="block-actions-submenu" style={{ left: '100%', top: 32 }}>
          <div className="block-actions-submenu-section">Turn into</div>
          {BLOCK_TYPES.map((t) => (
            <button
              key={t.id}
              className={`block-actions-item ${currentBlockType === t.id ? 'is-current' : ''}`}
              onClick={() => turnInto(t.id)}
              type="button"
            >
              {t.icon}
              <span>{t.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default BlockActionsMenu;
