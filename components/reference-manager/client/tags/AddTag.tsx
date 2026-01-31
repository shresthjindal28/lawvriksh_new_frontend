import { useState, useEffect, useRef, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { darken } from '@/lib/utils/helpers';
import { Tag } from '@/types/reference-manager';

export default function AddTagMenu({
  open,
  onClose,
  onSelect,
  anchorRef,
  tags,
  onCreateTag,
}: {
  open: boolean;
  onClose: () => void;
  onSelect: (tag: Tag | Tag[]) => void;
  anchorRef: React.RefObject<HTMLButtonElement | null>;
  tags: Tag[];
  onCreateTag?: (label: string) => Promise<Tag | undefined>;
}) {
  const [search, setSearch] = useState('');
  const [selectedTags, setSelectedTags] = useState<Tag[]>([]);
  const [menuPosition, setMenuPosition] = useState({ top: 100, left: 100 });
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(() => typeof window !== 'undefined');

  useEffect(() => {
    if (!mounted) {
      setTimeout(() => setMounted(true), 0);
    }
  }, [mounted]);

  const filteredTags = tags.filter((t) => t.label.toLowerCase().includes(search.toLowerCase()));

  const handleClickOutside = useCallback(
    (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        anchorRef.current &&
        !anchorRef.current.contains(e.target as Node)
      ) {
        onClose();
      }
    },
    [anchorRef, onClose]
  );

  useEffect(() => {
    if (!open) return;
    // Defer state updates to avoid synchronous setState in effect
    setTimeout(() => {
      setSearch('');
      setSelectedTags([]);
    }, 0);

    // Calculate position when opening
    if (anchorRef.current) {
      const rect = anchorRef.current.getBoundingClientRect();
      setTimeout(() => {
        setMenuPosition({
          top: rect.top + window.scrollY - 230,
          left: rect.left + window.scrollX,
        });
      }, 0);
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, handleClickOutside, anchorRef]);

  const toggleTag = (tag: Tag) => {
    setSelectedTags((prev) => {
      const exists = prev.some((t) => t.id === tag.id);
      if (exists) {
        return prev.filter((t) => t.id !== tag.id);
      } else {
        return [...prev, tag];
      }
    });
  };

  const handleAddSelected = () => {
    console.log('AddTagMenu: handleAddSelected called with tags:', selectedTags);
    if (selectedTags.length > 0) {
      onSelect(selectedTags);
      onClose();
    } else {
      console.log('AddTagMenu: No tags selected');
    }
  };

  const handleCreateOrSelectTag = async () => {
    const trimmedSearch = search.trim();
    if (!trimmedSearch) return;

    const exactMatch = tags.find((tag) => tag.label.toLowerCase() === trimmedSearch.toLowerCase());

    let tagToApply: Tag | undefined = exactMatch;
    if (!tagToApply) {
      if (!onCreateTag || isCreatingTag) return;
      try {
        setIsCreatingTag(true);
        tagToApply = await onCreateTag(trimmedSearch);
      } finally {
        setIsCreatingTag(false);
      }
    }

    if (!tagToApply) return;

    const nextSelection = selectedTags.some((t) => t.id === tagToApply.id)
      ? selectedTags
      : [...selectedTags, tagToApply];

    setSelectedTags(nextSelection);
    setSearch('');
    onSelect(nextSelection);
    onClose();
  };

  if (!open || !mounted) return null;

  return createPortal(
    <div
      ref={menuRef}
      className="addTagMenu"
      style={{
        position: 'absolute',
        top: menuPosition.top,
        left: menuPosition.left,
        zIndex: 9999, // Ensure it is on top
      }}
    >
      <input
        type="text"
        className="addTagMenuInput"
        placeholder="Type your tags..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            e.preventDefault();
            void handleCreateOrSelectTag();
          }
        }}
      />

      <div className="addTagMenuList">
        {filteredTags.map((tag) => {
          const isSelected = selectedTags.some((t) => t.id === tag.id);
          return (
            <div key={tag.id} className="addTagMenuItem" onClick={() => toggleTag(tag)}>
              <input type="checkbox" className="addTagMenuCheckbox" checked={isSelected} readOnly />
              <span
                className="addTagMenuDot"
                style={{ backgroundColor: tag.color, border: `4px solid ${darken(tag.color, 40)}` }}
              ></span>
              <span className="addTagMenuLabel">{tag.label}</span>
            </div>
          );
        })}
      </div>

      <button
        className="addTagMenuButton"
        onClick={handleAddSelected}
        disabled={selectedTags.length === 0}
      >
        {selectedTags.length > 0 ? `Add ${selectedTags.length} Tag(s)` : 'Select Tags'}
      </button>
    </div>,
    document.body
  );
}
