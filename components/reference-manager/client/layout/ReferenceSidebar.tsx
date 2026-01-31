'use client';

import React, { useEffect, useState } from 'react';
import { AnimatedEmptyCollection } from '../content/AnimatedEmptyCollection';
import {
  ChevronDown,
  Plus,
  Trash2,
  X,
  FolderPlus,
  FileWarning,
  Files,
  Folder,
  Tag as TagIcon,
  ChevronsRight,
} from 'lucide-react';
import CollectionNode from '../sidebar/CollectionNode';
import { Collection, Folder as FolderType } from '@/store/zustand/useReferenceStore';
import { Tag } from '@/types/reference-manager';
import CreateFolderMenu from '../sidebar/CreateFolderMenu';
import TagMenu from '../tags/TagMenu';
import { motion, AnimatePresence } from 'framer-motion';
import { ReferenceItem } from '@/types/reference-manager';
import { darken } from '@/lib/utils/helpers';
import { ReferenceTypeEnum } from '@/types/reference-manager-api';
import { Skeleton } from '@/components/ui/skeleton';
import { useTypewriter } from '@/hooks/common/useTypewriter';

export default function Sidebar({
  collections,
  expandedFolders,
  selectedCollectionId,
  selectedFolderId,
  isLoading,
  onToggleFolder,
  onSelectCollection,
  onSelectFolder,
  onAddCollection,
  onRenameCollection,
  onDeleteCollection,
  foldersByCollection,
  onAddFolder,
  onRenameFolder,
  onDeleteFolder,
  references,
  trashedReferences,
  tags,
  setTags,
  createTag,
  isRenaming,
  setIsRenaming,
  setFilterTag,
  filterTag,
  setTrashOpen,
  isTrashOpen,
  onDropReferences,
  onUpdateTag,
  onDeleteTag,
  isMobile,
  isOpen,
  onClose,
}: {
  collections: Collection[];
  expandedFolders: string[];
  selectedCollectionId: string | null;
  selectedFolderId: string | null;
  isLoading: boolean;
  onToggleFolder: (id: string) => void;
  onSelectCollection: (id: string) => void;
  onSelectFolder: (collectionId: string, folderId: string) => void;
  onAddCollection: () => void;
  onRenameCollection: (id: string, title: string) => void;
  onDeleteCollection: (id: string) => void;
  foldersByCollection: Record<string, FolderType[]>;
  onAddFolder: (collectionId: string, title?: string, type?: ReferenceTypeEnum) => Promise<string>;
  onRenameFolder: (collectionId: string, folderId: string, title: string) => void;
  onDeleteFolder: (collectionId: string, folderId: string) => void;
  onTriggerCollectionRename?: (collectionId: string) => void;
  onTriggerFolderRename?: (collectionId: string, folderId: string) => void;
  references: ReferenceItem[];
  trashedReferences: ReferenceItem[];
  tags: Tag[];
  setTags: (tags: Tag[]) => void;
  createTag: (label?: string, color?: string) => Promise<Tag | undefined>;
  isRenaming: boolean;
  setIsRenaming: (value: boolean) => void;
  filterTag: Tag | null;
  setFilterTag: React.Dispatch<React.SetStateAction<Tag | null>>;
  setTrashOpen: React.Dispatch<React.SetStateAction<boolean>>;
  isTrashOpen: boolean;
  onDropReferences?: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
  onUpdateTag: (tagId: string, updates: Partial<Tag>) => void;
  onDeleteTag: (tagId: string) => void;
  isMobile?: boolean;
  isOpen?: boolean;
  onClose?: () => void;
}) {
  const [isTagsOpen, setIsTagsOpen] = useState(true);
  const [tagSearchTerm, setTagSearchTerm] = useState('');

  const [menuOpen, setMenuOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const [menuOpenFor, setMenuOpenFor] = useState<{ id: string; collectionId?: string } | null>(
    null
  );
  const [menuIsSubfolder, setMenuIsSubfolder] = useState(false);

  // State to trigger rename mode in CollectionNode
  const [triggerRenameForCollection, setTriggerRenameForCollection] = useState<string | null>(null);
  const [triggerRenameForFolder, setTriggerRenameForFolder] = useState<{
    collectionId: string;
    folderId: string;
  } | null>(null);

  const [tagMenuAnchor, setTagMenuAnchor] = useState<DOMRect | null>(null);
  const [tagMenuFor, setTagMenuFor] = useState<string | null>(null);

  const [tempTag, setTempTag] = useState<Tag | null>(null);
  const [hasLoadedOnce, setHasLoadedOnce] = useState(false);
  const sidebarWidth = 330;

  const tagPlaceholder = useTypewriter(
    ['Search tags...', 'Find categories...', 'Filter topics...', 'Locate subjects...'],
    100,
    50,
    3000
  );

  useEffect(() => {
    if (!isLoading) setHasLoadedOnce(true);
  }, [isLoading]);

  const showCollectionsSkeleton = isLoading && !hasLoadedOnce;
  const showTagsSkeleton = isLoading && !hasLoadedOnce;

  const renderCollectionsSkeleton = () => (
    <div aria-hidden="true">
      <div className="flex items-center gap-3 px-3 py-2">
        <Skeleton className="h-4 w-4 rounded-sm" />
        <Skeleton className="h-4 w-28 rounded-md" />
      </div>
      <div className="pl-7">
        {Array.from({ length: 3 }).map((_, idx) => (
          <div key={idx} className="flex items-center gap-3 px-3 py-2">
            <Skeleton className="h-4 w-4 rounded-sm" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>
        ))}
      </div>
      {Array.from({ length: 2 }).map((_, idx) => (
        <div key={`col-${idx}`} className="flex items-center gap-3 px-3 py-2">
          <Skeleton className="h-4 w-4 rounded-sm" />
          <Skeleton className="h-4 w-32 rounded-md" />
        </div>
      ))}
    </div>
  );

  const renderTagsSkeleton = () => (
    <div aria-hidden="true">
      <div className="tagSearchBar">
        <Skeleton className="h-10 w-full rounded-md" />
      </div>
      <div className="tagItems">
        {Array.from({ length: 5 }).map((_, idx) => (
          <div key={idx} className="tagRow" style={{ pointerEvents: 'none' }}>
            <Skeleton className="h-3 w-3 rounded-full" />
            <Skeleton className="h-3 w-24 rounded-md" />
          </div>
        ))}
      </div>
    </div>
  );

  function openMenu(
    e: React.MouseEvent,
    itemId: string,
    collectionId: string | undefined,
    isSubfolder: boolean = false
  ) {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setMenuPosition({ top: rect.bottom + 4, left: rect.left });
    setMenuOpen(true);
    setMenuOpenFor({ id: itemId, collectionId });
    setMenuIsSubfolder(isSubfolder);
  }

  const openTagMenuFor = (e: React.MouseEvent, tagId: string) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setTagMenuAnchor(rect);
    setTagMenuFor(tagId);
  };

  const closeTagMenu = () => {
    setTagMenuAnchor(null);
    setTagMenuFor(null);
  };

  const handleColorChange = (id: string, color: string) => {
    onUpdateTag(id, { color });
  };

  const handleRenameFromMenu = (id: string) => {
    const tag = tags.find((t) => t.id === id);
    if (!tag) return;
    setTempTag({ ...tag });
    tag.label = '';
    setIsRenaming(true);
  };

  const handleDeleteFromMenu = (id: string) => {
    onDeleteTag(id);
  };

  const handleTagRename = (id: string, newLabel: string) => {
    const tag = tags.find((tag) => tag.id === id);
    if (!tag) return;
    setTempTag({ ...tag, label: newLabel });
  };

  const finalizeTagRename = () => {
    if (!tempTag) {
      setIsRenaming(false);
      return;
    }

    // Optimistic local update handled by hook, but we need to trigger it
    onUpdateTag(tempTag.id, { label: tempTag.label });

    setIsRenaming(false);
    setTempTag(null);
  };

  const handleTagSelect = (tag: Tag) => {
    if (!tag) return;

    setFilterTag((prev) => (prev?.id === tag.id ? null : tag));
  };

  const handleTagSearchKeyDown = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key !== 'Enter') return;
    e.preventDefault();

    const trimmedSearch = tagSearchTerm.trim();
    if (!trimmedSearch) return;

    const exactMatch = tags.find((tag) => tag.label.toLowerCase() === trimmedSearch.toLowerCase());

    if (exactMatch) {
      setFilterTag(exactMatch);
      setTagSearchTerm('');
      return;
    }

    const newTag = await createTag(trimmedSearch);
    if (newTag) {
      setTagSearchTerm('');
    }
  };

  const visibleTags = tags.filter((tag) =>
    tag.label.toLowerCase().includes(tagSearchTerm.toLowerCase())
  );

  const sidebarContent = (
    <div className="h-[93vh] flex flex-col">
      {/* ALL REFERENCES BUTTON */}
      <div className="sidebarSection">
        <button
          className={
            selectedCollectionId === 'all' && !selectedFolderId && !isTrashOpen
              ? 'sidebarItem collectionActive'
              : 'sidebarItem'
          }
          onClick={() => onSelectCollection('all')}
        >
          <Files size={16} />
          <span>All References</span>
        </button>
      </div>

      <div className="sidebarSection">
        <div
          className={
            selectedCollectionId === 'unsigned' && !selectedFolderId && !isTrashOpen
              ? 'sidebarItem collectionActive'
              : 'sidebarItem'
          }
          role="button"
          tabIndex={0}
          onClick={() => onSelectCollection('unsigned')}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              onSelectCollection('unsigned');
            }
          }}
        >
          <Folder size={16} style={{ color: 'var(--lv-text-muted)' }} />
          <span>Uncategorized</span>
        </div>
      </div>

      {/* ROOT-LEVEL COLLECTIONS */}
      <div className="sidebarSection">
        {showCollectionsSkeleton ? (
          renderCollectionsSkeleton()
        ) : collections.length === 0 ? (
          <div className="emptyCollectionsContainer">
            <div className="emptyCollectionsIconWrapper">
              <AnimatedEmptyCollection className="emptyCollectionsIcon" />
            </div>
            <h3 className="emptyCollectionsTitle">No collections yet</h3>
            <p className="emptyCollectionsDescription">
              Create your first collection to start organizing your research.
            </p>
          </div>
        ) : (
          collections.map((node) => (
            <CollectionNode
              key={node.id}
              node={node}
              isRoot={true}
              isExpanded={expandedFolders.includes(node.id)}
              isActive={selectedCollectionId === node.id && !selectedFolderId}
              onToggle={() => onToggleFolder(node.id)}
              onSelect={() => onSelectCollection(node.id)}
              onAddChild={(title?: string) => onAddFolder(node.id, title)}
              onRename={(title: string) => onRenameCollection(node.id, title)}
              onTriggerRename={
                triggerRenameForCollection === node.id
                  ? () => setTriggerRenameForCollection(null)
                  : undefined
              }
              onOpenMenu={(
                e: React.MouseEvent,
                itemId: string,
                collectionId: string | undefined,
                isSubfolder?: boolean
              ) => openMenu(e, itemId, collectionId, isSubfolder)}
              folders={foldersByCollection[node.id] || []}
              onAddFolder={(title?: string) => onAddFolder(node.id, title)}
              onRenameFolder={(folderId, title) => onRenameFolder(node.id, folderId, title)}
              onTriggerFolderRename={
                triggerRenameForFolder?.collectionId === node.id
                  ? (folderId: string) => {
                      if (triggerRenameForFolder?.folderId === folderId) {
                        setTriggerRenameForFolder(null);
                        return true;
                      }
                      return false;
                    }
                  : undefined
              }
              onDeleteFolder={(folderId) => onDeleteFolder(node.id, folderId)}
              references={references.filter((r) => r.collectionId === node.id)}
              selectedFolderId={selectedFolderId}
              onSelectFolder={(folderId) => onSelectFolder(node.id, folderId)}
              onDropReferences={onDropReferences}
            />
          ))
        )}

        {menuOpen && menuOpenFor && (
          <CreateFolderMenu
            position={menuPosition}
            isSubfolder={menuIsSubfolder}
            onNewSubcollection={async () => {
              try {
                // Create a subfolder with empty title to trigger inline rename
                await onAddFolder(menuOpenFor.id, '');
                // Expand the collection to show the new folder
                if (!expandedFolders.includes(menuOpenFor.id)) {
                  onToggleFolder(menuOpenFor.id);
                }
              } catch (err) {
                console.error('Failed to create subcollection from menu', err);
              } finally {
                setMenuOpen(false);
              }
            }}
            onRename={async () => {
              try {
                if (menuIsSubfolder && menuOpenFor.collectionId) {
                  // Trigger folder rename mode
                  setTriggerRenameForFolder({
                    collectionId: menuOpenFor.collectionId,
                    folderId: menuOpenFor.id,
                  });
                } else {
                  // Trigger collection rename mode
                  setTriggerRenameForCollection(menuOpenFor.id);
                }
              } catch (err) {
                console.error('Failed to trigger rename from menu', err);
              } finally {
                setMenuOpen(false);
              }
            }}
            onExport={async () => {
              try {
                // Placeholder: keep existing behavior
              } catch (err) {
                console.error('Export failed', err);
              } finally {
                setMenuOpen(false);
              }
            }}
            onDelete={async () => {
              try {
                if (menuIsSubfolder && menuOpenFor.collectionId) {
                  // Delete folder
                  await onDeleteFolder(menuOpenFor.collectionId, menuOpenFor.id);
                } else {
                  // Delete collection
                  await onDeleteCollection(menuOpenFor.id);
                }
              } catch (err) {
                console.error('Failed to delete from menu', err);
              } finally {
                setMenuOpen(false);
              }
            }}
            onClose={() => setMenuOpen(false)}
          />
        )}
      </div>

      {/* NEW COLLECTION */}
      <button className="newCollectionBtn" onClick={onAddCollection}>
        <Plus size={14} />
        New Collection
      </button>

      {/* TRASH SECTION */}
      <div className="bottom-Section">
        <div className="sidebarSection" onClick={() => setTrashOpen((prev) => !prev)}>
          <button className={isTrashOpen ? 'TrashItem active' : 'TrashItem'}>
            <div className="sectionActionsLeft">
              <Trash2 size={18} />
              <span>Trash ({trashedReferences.length})</span>
            </div>
            <div className="sectionActionsRight">
              <ChevronDown size={16} />
            </div>
          </button>
        </div>

        {/* TAGS */}
        <div className="tagsContainer">
          {/* TAGS HEADER */}
          <div className="tagsHeader">
            <div className="left" onClick={() => setIsTagsOpen(!isTagsOpen)}>
              <TagIcon size={16} />
              <span className="tagsTitle">
                Tags (
                {showTagsSkeleton ? (
                  <Skeleton className="h-3 w-6 inline-block align-middle" aria-hidden="true" />
                ) : (
                  tags.length
                )}
                )
              </span>
            </div>

            <div className="right">
              <button className="tagsIconBtn" onClick={() => createTag()}>
                <Plus size={16} />
                <p>Create Tag</p>
              </button>
              <button className="tagsIconBtn" onClick={() => setIsTagsOpen(!isTagsOpen)}>
                <ChevronsRight size={14} />
              </button>
            </div>
          </div>

          {isTagsOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {showTagsSkeleton ? (
                renderTagsSkeleton()
              ) : (
                <>
                  <div className="tagSearchBar">
                    <input
                      type="text"
                      placeholder={tagPlaceholder}
                      value={tagSearchTerm}
                      onChange={(e) => setTagSearchTerm(e.target.value)}
                      onKeyDown={handleTagSearchKeyDown}
                    />
                  </div>

                  <div className="tagItems">
                    {visibleTags.map((tag) => (
                      <div
                        key={tag.id}
                        className={filterTag?.id === tag.id ? 'tagRow selected' : 'tagRow'}
                        onClick={() => handleTagSelect(tag)}
                        onDoubleClick={(e) => openTagMenuFor(e, tag.id)}
                      >
                        <span
                          className="tagDot"
                          style={{
                            background: tag.color,
                            border: `4px solid ${darken(tag.color, 40)}`,
                          }}
                        ></span>

                        {isRenaming && tag.label === '' ? (
                          <input
                            autoFocus
                            className="tagInput"
                            type="text"
                            placeholder="Tag Name"
                            value={tempTag?.id === tag.id ? tempTag.label : tag.label}
                            onChange={(e) => handleTagRename(tag.id, e.target.value)}
                            onBlur={() => finalizeTagRename()}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') finalizeTagRename();
                              if (e.key === 'Escape') {
                                setIsRenaming(false);
                                setTempTag(null);
                              }
                            }}
                          />
                        ) : (
                          <span className="tagLabel">{tag.label}</span>
                        )}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* --- TagMenu (separate) --- */}
      <TagMenu
        anchorRect={tagMenuAnchor}
        tag={tagMenuFor ? (tags.find((t) => t.id === tagMenuFor) ?? null) : null}
        onClose={() => closeTagMenu()}
        onColorChange={(id, color) => handleColorChange(id, color)}
        onRename={(id) => handleRenameFromMenu(id)}
        onDelete={(id) => handleDeleteFromMenu(id)}
      />
    </div>
  );

  if (isMobile) {
    return (
      <AnimatePresence>
        {isOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={onClose}
              style={{
                position: 'fixed',
                inset: 0,
                background: 'black',
                zIndex: 49,
              }}
            />
            <motion.aside
              className="referenceManagerSidebar"
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{
                position: 'fixed',
                top: 0,
                right: 0,
                height: '100%',
                width: '80%',
                maxWidth: '300px',
                zIndex: 50,
                background: 'white',
                boxShadow: '-4px 0 10px rgba(0,0,0,0.1)',
                padding: '20px',
                overflowY: 'auto',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '10px' }}>
                <button
                  onClick={onClose}
                  style={{ background: 'none', border: 'none', cursor: 'pointer' }}
                >
                  <X size={24} />
                </button>
              </div>
              {sidebarContent}
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    );
  }

  const shouldShow = isOpen !== undefined ? isOpen : true;

  return (
    <motion.aside
      className="referenceManagerSidebar"
      initial={{ width: 330, opacity: 1, x: 0 }}
      animate={{
        width: shouldShow ? sidebarWidth : 0,
        opacity: shouldShow ? 1 : 0,
        x: shouldShow ? 0 : -20,
        padding: shouldShow ? undefined : 0,
        borderRightWidth: shouldShow ? 1 : 0,
      }}
      transition={{ duration: 0.3 }}
      style={{ overflow: 'hidden', position: 'relative' }}
    >
      <div style={{ width: sidebarWidth }}>{sidebarContent}</div>
    </motion.aside>
  );
}
