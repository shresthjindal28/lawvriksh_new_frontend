'use client';

import { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Pencil, Trash2 } from 'lucide-react';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { referenceKeys } from '@/lib/api/queries/reference-manager/keys';
import { useReferenceContext } from '@/hooks/editor/useReferenceContext';
import '@/styles/reference-manager/interactive-tag.css';

const TAG_COLORS = [
  '#EF4444', // Red
  '#3B82F6', // Blue
  '#B91C1C', // Dark Red
  '#EAB308', // Yellow
  '#22C55E', // Green
  '#4B5563', // Grey
  '#A855F7', // Purple
  '#EC4899', // Pink
];

interface InteractiveTagProps {
  tag: { id: string; label: string; color: string };
  documentId: string;
}

export default function InteractiveTag({ tag, documentId }: InteractiveTagProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editValue, setEditValue] = useState(tag.label);
  const [dropdownPos, setDropdownPos] = useState({ top: 0, left: 0, transformOrigin: 'top left' });

  const menuRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const triggerRef = useRef<HTMLSpanElement>(null);
  const queryClient = useQueryClient();
  const { setReferences } = useReferenceContext();

  // Mutations
  const updateTagMutation = useMutation({
    mutationFn: async (updates: { name?: string; color?: string }) => {
      return referenceManagerService.updateTag({
        tag_id: tag.id,
        ...updates,
      });
    },
    onSuccess: (_, variables) => {
      // Update local state immediately to reflect tag changes
      setReferences((prev) =>
        prev.map((ref) => ({
          ...ref,
          tags: (ref.tags || []).map((t) =>
            t.id === tag.id
              ? { ...t, label: variables.name || t.label, color: variables.color || t.color }
              : t
          ),
        }))
      );

      queryClient.invalidateQueries({ queryKey: referenceKeys.documentTags(documentId) });
      queryClient.invalidateQueries({ queryKey: referenceKeys.all });
      setIsOpen(false);
      setIsEditing(false);
    },
  });

  const removeTagMutation = useMutation({
    mutationFn: async () => {
      return referenceManagerService.removeTagFromDocument(documentId, tag.id);
    },
    onSuccess: () => {
      // Update local state immediately to reflect tag removal
      setReferences((prev) =>
        prev.map((ref) => {
          if (ref.id !== documentId && ref.documentId !== documentId) return ref;
          return {
            ...ref,
            tags: (ref.tags || []).filter((t) => t.id !== tag.id),
          };
        })
      );

      queryClient.invalidateQueries({ queryKey: referenceKeys.documentTags(documentId) });
      // Also invalidate document lists (including unsigned) to reflect tag removal
      queryClient.invalidateQueries({ queryKey: referenceKeys.all });
    },
  });

  // Sync editValue when tag label changes from outside - defer setState
  const prevTagLabelRef = useRef(tag.label);
  useEffect(() => {
    if (prevTagLabelRef.current !== tag.label) {
      prevTagLabelRef.current = tag.label;
      setTimeout(() => setEditValue(tag.label), 0);
    }
  }, [tag.label]);

  // Calculate position when opening
  useEffect(() => {
    if (isOpen && triggerRef.current) {
      const rect = triggerRef.current.getBoundingClientRect();
      const viewportHeight = window.innerHeight;
      const spaceBelow = viewportHeight - rect.bottom;
      const spaceAbove = rect.top;

      // Estimate dropdown height ~200px
      const shouldOpenUp = spaceBelow < 220 && spaceAbove > 220;

      if (shouldOpenUp) {
        setDropdownPos({
          top: rect.top - 8, // 8px gap
          left: rect.left,
          transformOrigin: 'bottom left',
        });
      } else {
        setDropdownPos({
          top: rect.bottom + 8,
          left: rect.left,
          transformOrigin: 'top left',
        });
      }
    }
  }, [isOpen]);

  // Click outside and Scroll handler
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(event.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    const handleScroll = () => {
      if (isOpen) setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      window.addEventListener('scroll', handleScroll, { capture: true });
      window.addEventListener('resize', handleScroll);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      window.removeEventListener('scroll', handleScroll, { capture: true });
      window.removeEventListener('resize', handleScroll);
    };
  }, [isOpen]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleColorSelect = (color: string) => {
    updateTagMutation.mutate({ color });
  };

  const handleRenameSubmit = () => {
    if (editValue.trim() && editValue !== tag.label) {
      updateTagMutation.mutate({ name: editValue });
    } else {
      setIsEditing(false);
      setEditValue(tag.label);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleRenameSubmit();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setEditValue(tag.label);
    }
  };

  if (isEditing) {
    return (
      <input
        ref={inputRef}
        type="text"
        className="tagChip interactiveTagEditInput"
        style={{
          width: `${Math.max(editValue.length * 8, 60)}px`,
          height: '24px',
          boxSizing: 'border-box',
        }}
        value={editValue}
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={handleRenameSubmit}
        onKeyDown={handleKeyDown}
      />
    );
  }

  const DropdownMenu = (
    <div
      ref={menuRef}
      className="interactiveTagMenu"
      style={{
        top: dropdownPos.top,
        left: dropdownPos.left,
        transform: dropdownPos.transformOrigin === 'bottom left' ? 'translateY(-100%)' : 'none',
        animation: 'fadeIn 0.15s ease-out',
      }}
    >
      {/* Color Picker */}
      <div className="interactiveTagColorGrid">
        {TAG_COLORS.map((color) => (
          <button
            key={color}
            className={`interactiveTagColorButton ${
              tag.color === color ? 'interactiveTagColorButtonSelected' : ''
            }`}
            style={{ backgroundColor: color }}
            onClick={() => handleColorSelect(color)}
            title={color}
          />
        ))}
      </div>

      <div className="interactiveTagDivider" />

      {/* Actions */}
      <div className="interactiveTagActions">
        <button
          className="interactiveTagActionButton"
          onClick={() => {
            setIsOpen(false);
            setIsEditing(true);
          }}
        >
          <Pencil size={14} className="interactiveTagActionIconMuted" />
          Rename
        </button>

        <button
          className="interactiveTagActionButton interactiveTagActionButtonDanger"
          onClick={() => {
            removeTagMutation.mutate();
          }}
        >
          <Trash2 size={14} />
          Remove tag
        </button>
      </div>
    </div>
  );

  return (
    <>
      <span
        ref={triggerRef}
        className="tagChip interactiveTagTrigger"
        style={{ background: tag.color || '#eee' }}
        onClick={() => setIsOpen(!isOpen)}
      >
        {tag.label}
      </span>

      {isOpen && typeof document !== 'undefined' && createPortal(DropdownMenu, document.body)}
    </>
  );
}
