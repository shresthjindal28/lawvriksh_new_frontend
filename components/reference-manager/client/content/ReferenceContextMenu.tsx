'use client';

import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Edit2,
  Trash2,
  Upload,
  ChevronRight,
  FileText,
  ArrowUpRight,
  Download,
  CircleArrowOutUpRight,
  Copy,
  Move,
} from 'lucide-react';
import { Collection, Folder } from '@/store/zustand/useReferenceStore';
import Image from 'next/image';

export default function ReferenceContextMenu({
  position,
  onOpen,
  onRename,
  onExportCitation,
  onDownload,
  onDelete,
  onClose,
  collections,
  foldersByCollections,
  onMoveReferences,
  onCopyReferences,
  referenceId,
  selectedIds = [],
  isTrashMode,
  onRestore,
  selectedCollectionId,
}: {
  collections: Collection[];
  foldersByCollections: Record<string, Folder[]>;
  onMoveReferences: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
  onCopyReferences?: (
    referenceIds: string[],
    targetCollectionId: string,
    targetFolderId?: string
  ) => void;
  referenceId: string;
  selectedIds?: string[];
  position: { top: number; left: number };
  onOpen: () => void;
  onRename: () => void;
  onExportCitation: (format: 'bibtex' | 'biblatex' | 'bibtxt' | 'ris' | 'cff') => void;
  onDownload: () => void;
  isTrashMode?: boolean;
  onRestore?: () => void;
  onDelete: () => void;
  onClose: () => void;
  selectedCollectionId?: string | null;
}) {
  const ref = useRef<HTMLDivElement>(null);

  // Close menu on clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const collectionTitleById = new Map<string, string>(
    (collections || []).map((c) => [c.id, c.title])
  );

  const folderOptions = (() => {
    // Always show all folders from all collections to allow moving/copying across collections
    const all: Array<{ folderId: string; collectionId: string; label: string }> = [];

    // Debug logging
    // console.log('ReferenceContextMenu: collections', collections);
    // console.log('ReferenceContextMenu: foldersByCollections', foldersByCollections);

    if (collections && collections.length > 0) {
      collections.forEach((collection) => {
        const folders = foldersByCollections?.[collection.id];
        if (folders && folders.length > 0) {
          folders.forEach((folder) => {
            all.push({
              folderId: folder.id,
              collectionId: collection.id,
              label: `${collection.title} / ${folder.title}`,
            });
          });
        }
      });
    } else {
      // Fallback if collections is not populated for some reason
      Object.entries(foldersByCollections || {}).forEach(([collectionId, folders]) => {
        const collectionTitle = collectionTitleById.get(collectionId) || 'Collection';
        folders.forEach((folder) => {
          all.push({
            folderId: folder.id,
            collectionId,
            label: `${collectionTitle} / ${folder.title}`,
          });
        });
      });
    }
    return all;
  })();

  const renderFolderPicker = (params: {
    label: string;
    Icon: typeof Move;
    onSelect: (collectionId: string, folderId: string) => void;
  }) => {
    return (
      <div className="contextItem exportItem" role="button" tabIndex={0}>
        <params.Icon size={14} />
        <span>{params.label}</span>
        <ChevronRight size={14} className="submenuChevron" />
        <div className="submenu">
          {folderOptions.length ? (
            folderOptions.map((opt) => (
              <button
                key={`${opt.collectionId}:${opt.folderId}`}
                className="submenuItem"
                type="button"
                onClick={() => params.onSelect(opt.collectionId, opt.folderId)}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Image src="/assets/svgs/corner-down-right.svg" alt="" width={18} height={18} />
                  {opt.label}
                </span>
              </button>
            ))
          ) : (
            <div className="submenuItem">No subfolders</div>
          )}
        </div>
      </div>
    );
  };

  return (
    <motion.div
      ref={ref}
      className="contextMenu"
      style={{
        top: position.top,
        left: position.left,
        position: 'fixed',
        zIndex: 99999,
      }}
      initial={{ opacity: 0, scale: 0.95, y: -8 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{ duration: 0.15 }}
    >
      <button className="contextItem" onClick={onOpen}>
        <ArrowUpRight size={14} />
        <span>View File</span>
      </button>

      {isTrashMode ? (
        <>
          {onRestore && (
            <button className="contextItem" onClick={onRestore}>
              <Upload size={14} />
              <span>Restore</span>
            </button>
          )}

          <button className="contextItem deleteItem" onClick={onDelete}>
            <Trash2 size={14} />
            <span>Delete Permanently</span>
          </button>
        </>
      ) : (
        <>
          <button className="contextItem" onClick={onDownload}>
            <Download size={14} />
            <span>Download File</span>
          </button>

          {/*
                    <button className="contextItem exportItem">
                        <CircleArrowOutUpRight size={14} />
                        <span>Export Citation</span>
                        <ChevronRight size={14} className="submenuChevron" />

                        <div className="submenu">
                            <div className="submenuItem" onClick={() => onExportCitation('bibtex')}>
                                BibTex
                            </div>
                            <div className="submenuItem" onClick={() => onExportCitation('biblatex')}>
                                BibLatex
                            </div>
                            <div className="submenuItem" onClick={() => onExportCitation('bibtxt')}>
                                BibTxt
                            </div>
                            <div className="submenuItem" onClick={() => onExportCitation('ris')}>
                                RIS
                            </div>
                            <div className="submenuItem" onClick={() => onExportCitation('cff')}>
                                CFF
                            </div>
                        </div>
                    </button>
                    */}

          {renderFolderPicker({
            label: 'Move To',
            Icon: Move,
            onSelect: (targetCollectionId, targetFolderId) =>
              onMoveReferences(
                selectedIds.includes(referenceId) ? selectedIds : [referenceId],
                targetCollectionId,
                targetFolderId
              ),
          })}

          {onCopyReferences
            ? renderFolderPicker({
                label: 'Copy To',
                Icon: Copy,
                onSelect: (targetCollectionId, targetFolderId) =>
                  onCopyReferences(
                    selectedIds.includes(referenceId) ? selectedIds : [referenceId],
                    targetCollectionId,
                    targetFolderId
                  ),
              })
            : null}

          <button className="contextItem deleteItem" onClick={onDelete}>
            <Trash2 size={14} />
            <span>Move To Trash</span>
          </button>
        </>
      )}
    </motion.div>
  );
}
