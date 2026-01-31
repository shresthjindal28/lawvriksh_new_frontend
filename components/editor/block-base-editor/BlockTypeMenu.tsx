'use client';

import { useState, useRef, useEffect, useLayoutEffect, useCallback } from 'react';
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
  Table,
  Minus,
  Image,
  AtSign,
  Smile,
  ListTree,
  Wand2,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

interface BlockTypeMenuItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  action: (
    editor: Editor,
    pos: number,
    isEmptyBlock: boolean,
    blockPos?: number,
    nodeSize?: number
  ) => void;
  isAI?: boolean;
}

interface BlockTypeMenuSection {
  id: string;
  title: string;
  items: BlockTypeMenuItem[];
}

interface BlockTypeMenuProps {
  editor: Editor;
  position: number;
  blockPos?: number;
  nodeSize?: number;
  onClose: () => void;
  anchorPosition: { top: number; left: number };
  isCurrentBlockEmpty?: boolean;
  onContinueWithAI?: () => void;
}

// Helper function to replace current empty block with new type
const replaceEmptyBlock = (
  editor: Editor,
  blockPos: number,
  nodeSize: number,
  type: string,
  attrs?: Record<string, unknown>
) => {
  // 1. Delete the current empty block
  editor
    .chain()
    .deleteRange({ from: blockPos, to: blockPos + nodeSize })
    .run();

  // 2. Insert the new block structure at the same position
  const content: any[] = [];

  if (type === 'paragraph') {
    content.push({ type: 'paragraph' });
  } else if (type === 'heading') {
    content.push({ type: 'heading', attrs: attrs });
  } else if (type === 'bulletList') {
    content.push({
      type: 'bulletList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
    });
  } else if (type === 'orderedList') {
    content.push({
      type: 'orderedList',
      content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
    });
  } else if (type === 'blockquote') {
    content.push({ type: 'blockquote', content: [{ type: 'paragraph' }] });
  } else if (type === 'codeBlock') {
    content.push({ type: 'codeBlock' });
  }

  editor
    .chain()
    .insertContentAt(blockPos, {
      type: 'rootblock',
      content: content,
    })
    .focus(blockPos + (type === 'paragraph' || type === 'heading' || type === 'codeBlock' ? 2 : 4))
    .run();
};

const createMenuSections = (
  onContinueWithAI?: () => void,
  userId?: string
): BlockTypeMenuSection[] => [
  {
    id: 'ai',
    title: 'AI',
    items: [
      {
        id: 'continueWithAI',
        label: 'Continue with AI',
        icon: <Wand2 size={18} />,
        isAI: true,
        action: () => {
          if (onContinueWithAI) {
            onContinueWithAI();
          }
        },
      },
    ],
  },
  {
    id: 'style',
    title: 'Style',
    items: [
      {
        id: 'text',
        label: 'Text',
        icon: <Type size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'paragraph');
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'paragraph' }],
              })
              .focus(pos + 3)
              .run();
          }
        },
      },
      {
        id: 'heading1',
        label: 'Heading 1',
        icon: <Heading1 size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'heading', { level: 1 });
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'heading', attrs: { level: 1 } }],
              })
              .focus(pos + 3)
              .run();
          }
        },
      },
      {
        id: 'heading2',
        label: 'Heading 2',
        icon: <Heading2 size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'heading', { level: 2 });
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'heading', attrs: { level: 2 } }],
              })
              .focus(pos + 3)
              .run();
          }
        },
      },
      {
        id: 'heading3',
        label: 'Heading 3',
        icon: <Heading3 size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'heading', { level: 3 });
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'heading', attrs: { level: 3 } }],
              })
              .focus(pos + 3)
              .run();
          }
        },
      },
      {
        id: 'bulletList',
        label: 'Bullet List',
        icon: <List size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'bulletList');
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [
                  {
                    type: 'bulletList',
                    content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
                  },
                ],
              })
              .focus(pos + 5)
              .run();
          }
        },
      },
      {
        id: 'orderedList',
        label: 'Numbered List',
        icon: <ListOrdered size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'orderedList');
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [
                  {
                    type: 'orderedList',
                    content: [{ type: 'listItem', content: [{ type: 'paragraph' }] }],
                  },
                ],
              })
              .focus(pos + 5)
              .run();
          }
        },
      },
      {
        id: 'todoList',
        label: 'To-do list',
        icon: <CheckSquare size={18} />,
        action: (editor, pos) => {
          // Todo list always adds new block for now as it's complex structure
          editor
            .chain()
            .insertContentAt(pos, {
              type: 'rootblock',
              content: [
                {
                  type: 'bulletList',
                  content: [
                    {
                      type: 'listItem',
                      content: [{ type: 'paragraph', content: [{ type: 'text', text: '☐ ' }] }],
                    },
                  ],
                },
              ],
            })
            .focus(pos + 7)
            .run();
        },
      },
      {
        id: 'blockquote',
        label: 'Blockquote',
        icon: <Quote size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'blockquote');
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'blockquote', content: [{ type: 'paragraph' }] }],
              })
              .focus(pos + 4)
              .run();
          }
        },
      },
      {
        id: 'codeBlock',
        label: 'Code Block',
        icon: <Code size={18} />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
            replaceEmptyBlock(editor, blockPos, nodeSize, 'codeBlock');
          } else {
            editor
              .chain()
              .insertContentAt(pos, {
                type: 'rootblock',
                content: [{ type: 'codeBlock' }],
              })
              .focus(pos + 3)
              .run();
          }
        },
      },
    ],
  },
  {
    id: 'insert',
    title: 'Insert',
    items: [
      {
        id: 'mention',
        label: 'Mention',
        icon: <AtSign size={18} />,
        action: (editor, pos) => {
          editor
            .chain()
            .insertContentAt(pos, {
              type: 'rootblock',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '@' }] }],
            })
            .focus(pos + 4)
            .run();
        },
      },
      {
        id: 'emoji',
        label: 'Emoji',
        icon: <Smile size={18} />,
        action: (editor, pos) => {
          editor
            .chain()
            .insertContentAt(pos, {
              type: 'rootblock',
              content: [{ type: 'paragraph', content: [{ type: 'text', text: '😀 ' }] }],
            })
            .focus(pos + 5)
            .run();
        },
      },
      {
        id: 'table',
        label: 'Table',
        icon: <Table size={18} />,
        action: (editor, pos) => {
          editor
            .chain()
            .insertContentAt(pos, {
              type: 'rootblock',
              content: [
                {
                  type: 'table',
                  content: [
                    {
                      type: 'tableRow',
                      content: [
                        { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                        { type: 'tableHeader', content: [{ type: 'paragraph' }] },
                      ],
                    },
                    {
                      type: 'tableRow',
                      content: [
                        { type: 'tableCell', content: [{ type: 'paragraph' }] },
                        { type: 'tableCell', content: [{ type: 'paragraph' }] },
                        { type: 'tableCell', content: [{ type: 'paragraph' }] },
                      ],
                    },
                  ],
                },
              ],
            })
            .focus(pos + 10)
            .run();
        },
      },
      {
        id: 'separator',
        label: 'Separator',
        icon: <Minus size={18} />,
        action: (editor, pos) => {
          editor
            .chain()
            .insertContentAt(pos, { type: 'rootblock', content: [{ type: 'horizontalRule' }] })
            .insertContentAt(pos + 2, { type: 'rootblock', content: [{ type: 'paragraph' }] })
            .focus(pos + 5)
            .run();
        },
      },
      {
        id: 'tableOfContents',
        label: 'Table of contents',
        icon: <ListTree size={18} />,
        action: (editor, pos) => {
          editor
            .chain()
            .insertContentAt(pos, {
              type: 'rootblock',
              content: [
                { type: 'paragraph', content: [{ type: 'text', text: '📑 Table of Contents' }] },
              ],
            })
            .focus(pos + 5)
            .run();
        },
      },
    ],
  },
  {
    id: 'upload',
    title: 'Upload',
    items: [
      {
        id: 'image',
        label: 'Image',
        icon: <Image size={18} aria-label="Image block" />,
        action: (editor, pos, isEmptyBlock, blockPos, nodeSize) => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = 'image/*';
          input.onchange = async (e) => {
            const file = (e.target as HTMLInputElement).files?.[0];
            if (!file) return;

            try {
              const { dmsImageService } = await import('@/lib/api/imageService');

              // Use userId passed to the function
              if (!userId) {
                console.error('User ID not found for image upload');
                return;
              }

              const response = await dmsImageService.uploadImage({
                file,
                userId,
                imageType: 'workspace_image',
              });

              if (response.success && response.data?.permanent_url) {
                if (isEmptyBlock && blockPos !== undefined && nodeSize !== undefined) {
                  // Delete current empty block first
                  editor
                    .chain()
                    .deleteRange({ from: blockPos, to: blockPos + nodeSize })
                    .focus(blockPos)
                    .setImage({ src: response.data.permanent_url, alt: file.name })
                    .run();
                } else {
                  editor
                    .chain()
                    .focus(pos)
                    .setImage({ src: response.data.permanent_url, alt: file.name })
                    .run();
                }
              } else {
                console.error('Image upload failed:', response.message);
              }
            } catch (error) {
              console.error('Image upload error:', error);
            }
          };
          input.click();
        },
      },
    ],
  },
];

/**
 * BlockTypeMenu - Dropdown menu for selecting block type
 * Displays when clicking the plus (+) button or pressing "/" in the block editor
 */
const BlockTypeMenu: React.FC<BlockTypeMenuProps> = ({
  editor,
  position,
  blockPos,
  nodeSize,
  onClose,
  anchorPosition,
  isCurrentBlockEmpty = false,
  onContinueWithAI,
}) => {
  const menuRef = useRef<HTMLDivElement>(null);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [menuPosition, setMenuPosition] = useState(anchorPosition);

  const { user } = useAuth();
  const MENU_SECTIONS = createMenuSections(onContinueWithAI, user?.user_id);
  const allItems = MENU_SECTIONS.flatMap((section) => section.items);

  // Ensure menu stays in viewport

  useLayoutEffect(() => {
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
  }, [anchorPosition]);

  const handleItemClick = useCallback(
    (item: BlockTypeMenuItem) => {
      // Call the action
      item.action(editor, position, isCurrentBlockEmpty, blockPos, nodeSize);
      // Close the menu after action
      onClose();
    },
    [editor, position, isCurrentBlockEmpty, blockPos, nodeSize, onClose]
  );

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setSelectedIndex((prev) => (prev + 1) % allItems.length);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setSelectedIndex((prev) => (prev - 1 + allItems.length) % allItems.length);
          break;
        case 'Enter':
          e.preventDefault();
          handleItemClick(allItems[selectedIndex]);
          break;
        case 'Escape':
          e.preventDefault();
          onClose();
          break;
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [editor, position, onClose, selectedIndex, allItems, isCurrentBlockEmpty, handleItemClick]);

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

  const getGlobalIndex = (sectionIndex: number, itemIndex: number): number => {
    let index = 0;
    for (let i = 0; i < sectionIndex; i++) {
      index += MENU_SECTIONS[i].items.length;
    }
    return index + itemIndex;
  };

  return (
    <div
      ref={menuRef}
      className="block-type-menu"
      style={{
        position: 'fixed',
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 1000,
      }}
    >
      <div className="block-type-menu-content">
        {MENU_SECTIONS.map((section, sectionIndex) => (
          <div key={section.id}>
            <div className="block-type-menu-section">{section.title}</div>
            <div className="block-type-menu-list">
              {section.items.map((item, itemIndex) => {
                const globalIndex = getGlobalIndex(sectionIndex, itemIndex);
                return (
                  <button
                    key={item.id}
                    className={`block-type-menu-item ${globalIndex === selectedIndex ? 'is-selected' : ''} ${item.isAI ? 'ai-item' : ''}`}
                    onClick={() => handleItemClick(item)}
                    onMouseEnter={() => setSelectedIndex(globalIndex)}
                    type="button"
                  >
                    <div className="block-type-menu-item-icon">{item.icon}</div>
                    <span className="block-type-menu-item-label">{item.label}</span>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default BlockTypeMenu;
