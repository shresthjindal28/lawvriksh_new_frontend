// CollectionNode.tsx
'use client';

import { useEffect, useState, useRef } from 'react';
import { ChevronDown, ChevronRight, Check, X } from 'lucide-react';
import Image from 'next/image';
import { ReferenceItem } from '@/types/reference-manager';
import { Collection, Folder } from '@/store/zustand/useReferenceStore';
import { Tag } from '@/types/reference-manager';
import { SafeDynamicIcon } from '../../shared/components/SafeDynamicIcon';

export default function CollectionNode({
  node,
  isExpanded,
  isActive,
  isRoot = false,
  onToggle,
  onSelect,
  onAddChild,
  onRename,
  onTriggerRename,
  onOpenMenu,
  folders,
  onAddFolder,
  onRenameFolder,
  onTriggerFolderRename,
  onDeleteFolder,
  references,
  selectedFolderId,
  onSelectFolder,
  onDropReferences,
}: {
  node: Collection;
  isExpanded: boolean;
  isActive: boolean;
  isRoot?: boolean;
  onToggle: () => void;
  onSelect: () => void;
  onAddChild: (title?: string) => Promise<string>;
  onRename: (title: string) => void;
  onTriggerRename?: () => void;
  onOpenMenu: (
    e: React.MouseEvent,
    itemId: string,
    collectionId: string | undefined,
    isSubfolder?: boolean
  ) => void;
  folders: Folder[];
  onAddFolder: (title?: string) => Promise<string>;
  onRenameFolder: (folderId: string, title: string) => void;
  onTriggerFolderRename?: (folderId: string) => boolean | void;
  onDeleteFolder: (folderId: string) => void;
  references: ReferenceItem[];
  selectedFolderId: string | null;
  onSelectFolder: (folderId: string) => void;
  onDropReferences?: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
}) {
  const [isAddingChildLocal, setIsAddingChildLocal] = useState(false);
  const [childTitle, setChildTitle] = useState('');
  const [isRenaming, setIsRenaming] = useState(node.title === '');
  const [tempTitle, setTempTitle] = useState(node.title);
  const [renamingFolderId, setRenamingFolderId] = useState<string | null>(null);
  const [folderTempTitle, setFolderTempTitle] = useState('');
  const [dragOverTarget, setDragOverTarget] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement | null>(null);
  const folderInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (node.title === '') {
      setIsRenaming(true);
      setTempTitle('');
    }
  }, [node.title]);

  useEffect(() => {
    if (isRenaming) inputRef.current?.focus();
  }, [isRenaming]);

  useEffect(() => {
    if (renamingFolderId) folderInputRef.current?.focus();
  }, [renamingFolderId]);

  const finishRename = () => {
    if (tempTitle.trim() === node.title) {
      // No change, just exit rename mode
      setIsRenaming(false);
      return;
    }
    const newTitle = tempTitle.trim() || 'Untitled Collection';
    onRename(newTitle);
    setIsRenaming(false);
  };

  const finishFolderRename = (folderId: string) => {
    const folder = folders.find((f) => f.id === folderId);
    if (folder && folderTempTitle.trim() === folder.title) {
      // No change, just exit rename mode
      setRenamingFolderId(null);
      setFolderTempTitle('');
      return;
    }
    const newTitle = folderTempTitle.trim() || 'Untitled Folder';
    onRenameFolder(folderId, newTitle);
    setRenamingFolderId(null);
    setFolderTempTitle('');
  };

  // Collection drop handlers
  const handleCollectionDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(node.id);
  };

  const handleCollectionDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
  };

  const handleCollectionDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    try {
      const referenceIds = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (Array.isArray(referenceIds) && referenceIds.length > 0) {
        onDropReferences?.(referenceIds, node.id);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  // Folder drop handlers
  const handleFolderDragOver = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = 'move';
    setDragOverTarget(folderId);
  };

  const handleFolderDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);
  };

  const handleFolderDrop = (e: React.DragEvent, folderId: string) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverTarget(null);

    try {
      const referenceIds = JSON.parse(e.dataTransfer.getData('text/plain'));
      if (Array.isArray(referenceIds) && referenceIds.length > 0) {
        onDropReferences?.(referenceIds, node.id, folderId);
      }
    } catch (error) {
      console.error('Error parsing dropped data:', error);
    }
  };

  // Check if any folder needs to be renamed (when title is empty)
  useEffect(() => {
    const folderToRename = folders.find((f) => f.title === '');
    if (folderToRename) {
      setRenamingFolderId(folderToRename.id);
      setFolderTempTitle('');
    }
  }, [folders]);

  // Handle external trigger for collection rename
  useEffect(() => {
    if (onTriggerRename && !isRenaming) {
      setIsRenaming(true);
      setTempTitle(node.title);
      // Call the trigger callback to reset the state in parent
      onTriggerRename();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTriggerRename]);

  // Handle external trigger for folder rename
  useEffect(() => {
    if (onTriggerFolderRename && folders.length > 0 && !renamingFolderId) {
      // Check each folder to see if it should be renamed
      for (const folder of folders) {
        const shouldRename = onTriggerFolderRename(folder.id);
        if (shouldRename) {
          setRenamingFolderId(folder.id);
          setFolderTempTitle(folder.title);
          break;
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [onTriggerFolderRename]);

  return (
    <div className="collectionNode">
      {/* COLLECTION HEADER */}
      <div
        className={isActive ? 'sectionHeader collectionActive' : 'sectionHeader'}
        onDragOver={handleCollectionDragOver}
        onDragLeave={handleCollectionDragLeave}
        onDrop={handleCollectionDrop}
        style={{
          backgroundColor: dragOverTarget === node.id ? '#e3f2fd' : undefined,
          border: dragOverTarget === node.id ? '2px dashed #2196F3' : undefined,
          transition: 'all 0.2s ease',
        }}
      >
        <div className="sidebarItem-child" onClick={onSelect}>
          <button
            className="folderToggle"
            onClick={(e) => {
              e.stopPropagation();
              onToggle();
            }}
          >
            {isExpanded ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
          </button>
          <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center' }}>
            {node.icon ? (
              <SafeDynamicIcon name={node.icon} size={14} />
            ) : (
              <SafeDynamicIcon name="folder" fill="currentColor" size={14} />
            )}
          </div>
          {isRenaming ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
              <input
                ref={inputRef}
                value={tempTitle}
                autoFocus
                onChange={(e) => setTempTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') finishRename();
                  if (e.key === 'Escape') {
                    setTempTitle(node.title);
                    setIsRenaming(false);
                  }
                }}
                className="newFolderInput"
                style={{ padding: '4px 6px', flex: 1, border: '1px solid #ccc', marginLeft: 0 }}
                onClick={(e) => e.stopPropagation()}
              />
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  finishRename();
                }}
                style={{
                  padding: '2px',
                  background: 'none',
                  color: '#4CAF50',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                  height: '24px',
                }}
                title="Confirm rename"
              >
                <Check size={16} />
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setTempTitle(node.title);
                  setIsRenaming(false);
                }}
                style={{
                  padding: '2px',
                  background: 'none',
                  color: '#f44336',
                  border: 'none',
                  borderRadius: '3px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  minWidth: '24px',
                  height: '24px',
                }}
                title="Cancel rename"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <span className="sectionTitle">{node.title}</span>
          )}
        </div>

        {!isRenaming && (
          <div className="sectionActions">
            <button
              className="iconBtn"
              title="Add Folder"
              onClick={(e) => {
                e.stopPropagation();
                setIsAddingChildLocal(true);
                if (!isExpanded) onToggle();
              }}
            >
              <Image
                src="/assets/svgs/folder-plus.svg"
                alt="Add Folder"
                width={14}
                height={14}
                style={{ width: '14px', height: '14px' }}
              />
            </button>

            <button
              className="iconBtn"
              title="More options"
              onClick={(e) => {
                e.stopPropagation();
                onOpenMenu(e, node.id, undefined, false);
              }}
            >
              <Image
                src="/assets/svgs/ellipsis.svg"
                alt="More options"
                width={14}
                height={14}
                style={{ width: '14px', height: '14px' }}
              />
            </button>
          </div>
        )}
      </div>

      {/* CHILDREN (SUBFOLDERS) */}
      {(isExpanded || isAddingChildLocal) && (
        <div className="collectionChildren" style={{ paddingLeft: 16 }}>
          {folders.map((folder) => {
            const folderReferences = references.filter((ref) => ref.folderId === folder.id);
            const isFolderActive = selectedFolderId === folder.id;

            return (
              <div key={folder.id} className="sub-folder">
                <div
                  className={isFolderActive ? 'folderStub collectionActive' : 'folderStub'}
                  onDragOver={(e) => handleFolderDragOver(e, folder.id)}
                  onDragLeave={handleFolderDragLeave}
                  onDrop={(e) => handleFolderDrop(e, folder.id)}
                  style={{
                    backgroundColor: dragOverTarget === folder.id ? '#e3f2fd' : undefined,
                    border: dragOverTarget === folder.id ? '2px dashed #2196F3' : undefined,
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div className="sidebarItem-child" onClick={() => onSelectFolder(folder.id)}>
                    <div style={{ width: 14, height: 14, display: 'flex', alignItems: 'center' }}>
                      {folder.icon ? (
                        <SafeDynamicIcon name={folder.icon} size={14} />
                      ) : (
                        <SafeDynamicIcon name="folder" size={14} />
                      )}
                    </div>
                    {renamingFolderId === folder.id || folder.title === '' ? (
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flex: 1 }}>
                        <input
                          ref={folderInputRef}
                          autoFocus
                          className="newFolderInput"
                          placeholder="Folder name"
                          value={folderTempTitle}
                          onChange={(e) => setFolderTempTitle(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') finishFolderRename(folder.id);
                            if (e.key === 'Escape') {
                              setRenamingFolderId(null);
                              setFolderTempTitle('');
                            }
                          }}
                          style={{
                            padding: '4px 6px',
                            flex: 1,
                            border: '1px solid #ccc',
                            marginLeft: 0,
                          }}
                          onClick={(e) => e.stopPropagation()}
                        />
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            finishFolderRename(folder.id);
                          }}
                          style={{
                            padding: '2px',
                            background: 'none',
                            color: '#4CAF50',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '24px',
                            height: '24px',
                          }}
                          title="Confirm rename"
                        >
                          <Check size={16} />
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setRenamingFolderId(null);
                            setFolderTempTitle('');
                          }}
                          style={{
                            padding: '2px',
                            background: 'none',
                            color: '#f44336',
                            border: 'none',
                            borderRadius: '3px',
                            cursor: 'pointer',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            minWidth: '24px',
                            height: '24px',
                          }}
                          title="Cancel rename"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    ) : (
                      <span className="sectionTitle">
                        {folder.title + ' (' + folderReferences.length + ')'}
                      </span>
                    )}
                  </div>

                  {!(renamingFolderId === folder.id || folder.title === '') && (
                    <div className="sectionActions">
                      <button
                        className="iconBtn"
                        title="More options"
                        onClick={(e) => {
                          e.stopPropagation();
                          onOpenMenu(e, folder.id, node.id, true);
                        }}
                      >
                        <Image
                          src="/assets/svgs/ellipsis.svg"
                          alt="More options"
                          width={14}
                          height={14}
                          style={{ width: '14px', height: '14px' }}
                        />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isAddingChildLocal && (
            <input
              autoFocus
              className="newFolderInput"
              placeholder="New folder"
              value={childTitle}
              onChange={(e) => setChildTitle(e.target.value)}
              onBlur={() => {
                if (childTitle.trim()) onAddFolder(childTitle);
                setIsAddingChildLocal(false);
                setChildTitle('');
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  if (childTitle.trim()) onAddFolder(childTitle);
                  setIsAddingChildLocal(false);
                  setChildTitle('');
                }
                if (e.key === 'Escape') {
                  setIsAddingChildLocal(false);
                  setChildTitle('');
                }
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
