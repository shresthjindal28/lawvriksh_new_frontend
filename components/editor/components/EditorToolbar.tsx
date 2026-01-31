'use client';

import { useState } from 'react';
import type { Editor } from '@tiptap/react';
import {
  Undo2,
  Redo2,
  AtSign,
  Sparkles,
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Search,
  ChevronDown,
  Minus,
  Languages,
  Image,
  Plus,
} from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { CITATION_STYLES } from '@/lib/services/citationFormatter';
import { useAIWriting } from '@/hooks/editor/useAIWriting';

interface EditorToolbarProps {
  editor: Editor | null;
  onCite?: () => void;
  onAi?: (e?: React.MouseEvent) => void;
  onToggleVariables?: () => void;
  isVariablesPanelOpen?: boolean;
  citationStyle?: string;
  onStyleChange?: (style: string) => void;
  textSize?: string;
  onTextSizeChange?: (size: string) => void;
  onTranslatingStateChange?: (isTranslating: boolean) => void;
  zoomLevel?: number;
  onZoomIn?: () => void;
  onZoomOut?: () => void;
}

// Inline CSS Helper Component for Buttons to handle Hover states
const ToolbarButton = ({
  onClick,
  disabled,
  isActive,
  title,
  children,
  className,
  style,
}: {
  onClick: (e: React.MouseEvent) => void;
  disabled?: boolean;
  isActive?: boolean;
  title: string;
  children: React.ReactNode;
  className?: string; // Legacy support or extra classes if needed
  style?: React.CSSProperties;
}) => {
  const [isHovered, setIsHovered] = useState(false);

  const baseStyle: React.CSSProperties = {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: '32px',
    height: '32px',
    padding: '0 6px',
    borderRadius: '4px',
    transition: 'background-color 150ms ease, color 150ms ease',
    flexShrink: 0,
    border: 'none',
    cursor: disabled ? 'not-allowed' : 'pointer',
    opacity: disabled ? 0.4 : 1,
    color: disabled ? '#9ca3af' : isActive ? '#09090b' : '#09090b',
    backgroundColor: isActive
      ? '#e5e7eb' // bg-gray-200
      : isHovered && !disabled
        ? '#f3f4f6' // hover:bg-gray-100
        : 'transparent',
    ...style,
  };

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={baseStyle}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={className}
    >
      {children}
    </button>
  );
};

// Generic Button with Hover support for non-toggle actions
const ActionButton = ({
  onClick,
  title,
  children,
  className,
}: {
  onClick: (e: React.MouseEvent) => void;
  title: string;
  children: React.ReactNode;
  className?: string;
}) => {
  const [isHovered, setIsHovered] = useState(false);
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={className} // Keep class for ai-button targeting
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '6px',
        padding: '6px 8px',
        borderRadius: '4px',
        fontSize: '14px',
        fontWeight: 500,
        color: '#09090b',
        backgroundColor: isHovered ? '#f3f4f6' : 'transparent', // hover:bg-gray-100
        transition: 'background-color 150ms ease',
        border: 'none',
        cursor: 'pointer',
        flexShrink: 0,
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {children}
    </button>
  );
};

export function EditorToolbar({
  editor,
  onCite,
  onAi,
  onToggleVariables,
  isVariablesPanelOpen,
  citationStyle = 'bluebook',
  onStyleChange,
  textSize = 'normal',
  onTextSizeChange,
  onTranslatingStateChange,
  zoomLevel = 100,
  onZoomIn,
  onZoomOut,
}: EditorToolbarProps) {
  const [isStyleDropdownOpen, setIsStyleDropdownOpen] = useState(false);
  const [isHeadingDropdownOpen, setIsHeadingDropdownOpen] = useState(false);
  const [isAlignDropdownOpen, setIsAlignDropdownOpen] = useState(false);
  const [isTextSizeDropdownOpen, setIsTextSizeDropdownOpen] = useState(false);
  const [styleSearchQuery, setStyleSearchQuery] = useState('');

  const { translate } = useAIWriting();

  const [isTranslating, setIsTranslating] = useState(false);
  const [isTranslateDropdownOpen, setIsTranslateDropdownOpen] = useState(false);
  const [hoveredLanguageItem, setHoveredLanguageItem] = useState<string | null>(null);

  const languages = [
    'English',
    'Hindi',
    'Bengali',
    'Marathi',
    'Telugu',
    'Tamil',
    'Gujarati',
    'Urdu',
    'Kannada',
    'Odia',
    'Malayalam',
    'Punjabi',
  ];

  const languageOptions: Record<string, string> = {
    English: 'en',
    Hindi: 'hi',
    Bengali: 'bn',
    Marathi: 'mr',
    Telugu: 'te',
    Tamil: 'ta',
    Gujarati: 'gu',
    Urdu: 'ur',
    Kannada: 'kn',
    Odia: 'or',
    Malayalam: 'ml',
    Punjabi: 'pa',
  };

  const handleTranslate = async (languageName: string) => {
    if (!editor) return;

    // Safety check: ensure languageName is a string (not an event object)
    if (typeof languageName !== 'string') {
      return;
    }

    setIsTranslateDropdownOpen(false);
    setIsTranslating(true);
    onTranslatingStateChange?.(true);

    try {
      const content = editor.getHTML();
      const targetLang = languageOptions[languageName] || 'hi';

      const result = await translate({
        text: content,
        target_language: targetLang,
        domain: 'legal',
      });

      if (result) {
        editor.commands.setContent(result);
      }
    } catch (error) {
      console.error('Translation failed:', error);
    } finally {
      setIsTranslating(false);
      onTranslatingStateChange?.(false);
    }
  };

  const { user } = useAuth();

  const handleImageUpload = (e: React.MouseEvent) => {
    e.preventDefault();
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (event) => {
      const file = (event.target as HTMLInputElement).files?.[0];
      if (!file) return;

      try {
        const { dmsImageService } = await import('@/lib/api/imageService');

        let userId = user?.user_id;

        if (!userId) {
          console.error('User ID needed for upload (User object missing or invalid)');
          // Optionally try local storage as last resort if context is slow to populate (though it shouldn't be if auth'd)
          try {
            const userData = localStorage.getItem('user_data');
            if (userData) {
              const parsed = JSON.parse(userData);
              if (parsed.id || parsed.user_id) {
                userId = parsed.id || parsed.user_id;
              }
            }
          } catch (e) {}
          return;
        }

        const response = await dmsImageService.uploadImage({
          file,
          userId,
          imageType: 'workspace_image',
        });

        if (response.success && response.data?.permanent_url) {
          editor
            ?.chain()
            .focus()
            .setImage({ src: response.data.permanent_url, alt: file.name })
            .run();
        } else {
          console.error('Upload failed', response.message);
        }
      } catch (error) {
        console.error('Upload error', error);
      }
    };
    input.click();
  };

  // Dropdown Hover States
  const [hoveredHeadingItem, setHoveredHeadingItem] = useState<string | null>(null);
  const [hoveredStyleItem, setHoveredStyleItem] = useState<string | null>(null);
  const [hoveredTextSizeItem, setHoveredTextSizeItem] = useState<string | null>(null);
  const [isHeadingDropdownHovered, setIsHeadingDropdownHovered] = useState(false);

  if (!editor) {
    return null;
  }

  const filteredStyles = CITATION_STYLES.filter((style) =>
    style.label.toLowerCase().includes(styleSearchQuery.toLowerCase())
  );

  const containerStyle: React.CSSProperties = {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    alignContent: 'center',
    gap: '8px',
    width: '100%',
    maxWidth: '100%',
    padding: 'var(--toolbar-padding, 10px 20px)',
    borderBottom: '1px solid var(--lv-border-light, #F1F3F3)',
    minHeight: '50px',
    backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
    zIndex: 40,
  };

  const dividerStyle: React.CSSProperties = {
    width: '1px',
    height: '24px',
    margin: '0 4px',
    flexShrink: 0,
    backgroundColor: '#CFCFCF',
  };

  const flexGroupStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: '4px',
    flexShrink: 0,
  };

  return (
    <div style={containerStyle}>
      {/* Variables Toggle */}
      {onToggleVariables && (
        <button
          type="button"
          onClick={onToggleVariables}
          title="Toggle Variables"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            padding: '6px 18px',
            borderRadius: '6px',
            border: '1px solid rgba(19,52,53,0.12)',
            fontSize: '14px',
            fontWeight: 500,
            whiteSpace: 'nowrap',
            marginRight: '8px',
            transition: 'background-color 150ms ease',
            cursor: 'pointer',
            backgroundColor: isVariablesPanelOpen ? '#E5E7EB' : 'var(--lv-bg-toolbar, #F2EFE9)',
            color: 'var(--lv-text-primary, #133435)',
            flexShrink: 0,
          }}
        >
          <span style={{ fontWeight: 600 }}>(x)</span>
          <span>Variables</span>
        </button>
      )}

      {/* Undo / Redo */}
      <div style={flexGroupStyle}>
        <ToolbarButton
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          title="Undo"
        >
          <Undo2 size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          title="Redo"
        >
          <Redo2 size={18} />
        </ToolbarButton>
      </div>

      <div style={dividerStyle} />

      {/* Heading Selector */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setIsHeadingDropdownOpen(!isHeadingDropdownOpen)}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: '4px',
            height: '32px',
            paddingLeft: '12px',
            paddingRight: '8px',
            fontSize: '14px',
            fontWeight: 500,
            color: '#09090b',
            backgroundColor: isHeadingDropdownHovered ? '#e5e7eb' : 'transparent', // hover:bg-gray-200
            borderRadius: '4px',
            minWidth: '120px',
            transition: 'background-color 150ms ease',
            border: 'none',
            cursor: 'pointer',
          }}
          onMouseEnter={() => setIsHeadingDropdownHovered(true)}
          onMouseLeave={() => setIsHeadingDropdownHovered(false)}
          title="Text Style"
        >
          <span
            style={{
              color: 'var(--lv-text-secondary, #3D3D3D)',
            }}
          >
            {editor.isActive('heading', { level: 1 })
              ? 'Heading 1'
              : editor.isActive('heading', { level: 2 })
                ? 'Heading 2'
                : editor.isActive('heading', { level: 3 })
                  ? 'Heading 3'
                  : 'Normal Text'}
          </span>
          <ChevronDown size={14} style={{ color: '#6b7280' }} />
        </button>

        {isHeadingDropdownOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setIsHeadingDropdownOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '192px', // w-48
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              {[
                {
                  label: 'Normal Text',
                  action: () => editor.chain().focus().setParagraph().run(),
                  isActive: !editor.isActive('heading'),
                  style: {},
                },
                {
                  label: 'Heading 1',
                  action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
                  isActive: editor.isActive('heading', { level: 1 }),
                  style: { fontSize: '20px', fontWeight: 700 },
                },
                {
                  label: 'Heading 2',
                  action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
                  isActive: editor.isActive('heading', { level: 2 }),
                  style: { fontSize: '18px', fontWeight: 700 },
                },
                {
                  label: 'Heading 3',
                  action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
                  isActive: editor.isActive('heading', { level: 3 }),
                  style: { fontSize: '16px', fontWeight: 600 },
                },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => {
                    item.action();
                    setIsHeadingDropdownOpen(false);
                  }}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 16px',
                    fontSize: '14px',
                    transition: 'background-color 150ms ease',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      hoveredHeadingItem === item.label
                        ? 'var(--lv-bg-toolbar, #F2EFE9)'
                        : item.isActive
                          ? 'var(--lv-bg-toolbar, #F2EFE9)' // Match citation style active state
                          : 'transparent',
                    color: item.isActive
                      ? 'var(--lv-text-primary, #133435)'
                      : 'var(--lv-text-secondary, #3D3D3D)',
                    fontWeight: item.isActive ? 500 : 400,
                    ...item.style,
                  }}
                  onMouseEnter={() => setHoveredHeadingItem(item.label)}
                  onMouseLeave={() => setHoveredHeadingItem(null)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Text Size Dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setIsTextSizeDropdownOpen(!isTextSizeDropdownOpen)}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '6px 10px',
            fontSize: '14px',
            backgroundColor: isTextSizeDropdownOpen
              ? 'var(--lv-bg-toolbar, #F2EFE9)'
              : 'transparent',
            borderRadius: '6px',
            minWidth: '80px',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--lv-text-secondary, #3D3D3D)',
          }}
          title="Text Size"
        >
          <span>
            {textSize === 'small'
              ? 'Small'
              : textSize === 'medium'
                ? 'Medium'
                : textSize === 'large'
                  ? 'Large'
                  : textSize === 'extra-large'
                    ? 'Extra Large'
                    : 'Normal'}
          </span>
          <ChevronDown size={14} style={{ color: '#6b7280' }} />
        </button>

        {isTextSizeDropdownOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setIsTextSizeDropdownOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '130px',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                overflow: 'hidden',
                padding: '4px 0',
              }}
            >
              {[
                { label: 'Small', value: 'small', fontSize: '12px' },
                { label: 'Normal', value: 'normal', fontSize: '16px' },
                { label: 'Medium', value: 'medium', fontSize: '18px' },
                { label: 'Large', value: 'large', fontSize: '22px' },
                { label: 'Extra Large', value: 'extra-large', fontSize: '28px' },
              ].map((size) => (
                <button
                  key={size.value}
                  onClick={() => {
                    if (onTextSizeChange) {
                      onTextSizeChange(size.value);
                    }
                    setIsTextSizeDropdownOpen(false);
                  }}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      hoveredTextSizeItem === size.value
                        ? 'var(--lv-bg-toolbar, #F2EFE9)'
                        : textSize === size.value
                          ? 'var(--lv-bg-toolbar, #F2EFE9)'
                          : 'transparent',
                    color:
                      textSize === size.value
                        ? 'var(--lv-text-primary, #133435)'
                        : 'var(--lv-text-secondary, #3D3D3D)',
                    fontWeight: textSize === size.value ? 500 : 400,
                  }}
                  onMouseEnter={() => setHoveredTextSizeItem(size.value)}
                  onMouseLeave={() => setHoveredTextSizeItem(null)}
                >
                  {size.label}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      <div style={dividerStyle} />

      {/* Cite Button - moved here after Normal Text */}
      <ActionButton onClick={onCite!} title="Add Citation">
        <AtSign size={16} style={{ color: 'var(--lv-accent-gold, #B48612)' }} />
        <span style={{ color: 'var(--lv-accent-gold, #B48612)' }}>Cite</span>
      </ActionButton>

      {/* AI Button - moved here after Cite */}
      <ActionButton
        onClick={(e) => onAi && onAi(e)}
        title="AI Assistant"
        className="toolbar-ai-button"
      >
        <Sparkles
          size={16}
          style={{
            stroke: 'url(#ai-gradient)',
          }}
        />
        <svg width="0" height="0" style={{ position: 'absolute' }}>
          <defs>
            <linearGradient id="ai-gradient" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#070707" />
              <stop offset="100%" stopColor="#38989B" />
            </linearGradient>
          </defs>
        </svg>
        <span
          style={{
            background: 'linear-gradient(to bottom, #070707, #38989B 85.714%)',
            WebkitBackgroundClip: 'text',
            backgroundClip: 'text',
            color: 'transparent',
          }}
        >
          AI
        </span>
      </ActionButton>

      {/* Translate Button */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <ActionButton
          onClick={() => setIsTranslateDropdownOpen(!isTranslateDropdownOpen)}
          title="Translate"
          className="toolbar-translate-button"
        >
          <Languages size={16} style={{ color: '#BD9000' }} />
          <span style={{ color: '#BD9000' }}>Translate</span>
        </ActionButton>

        {isTranslateDropdownOpen && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 10 }}
              onClick={() => setIsTranslateDropdownOpen(false)}
            />
            <div
              style={{
                position: 'absolute',
                top: '100%',
                left: 0,
                marginTop: '4px',
                width: '150px',
                maxHeight: '300px',
                overflowY: 'auto',
                backgroundColor: 'white',
                border: '1px solid #e5e7eb',
                borderRadius: '8px',
                boxShadow:
                  '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                zIndex: 100,
                padding: '4px 0',
              }}
            >
              {languages.map((lang) => (
                <button
                  key={lang}
                  onClick={() => handleTranslate(lang)}
                  type="button"
                  style={{
                    width: '100%',
                    textAlign: 'left',
                    padding: '8px 12px',
                    fontSize: '14px',
                    border: 'none',
                    cursor: 'pointer',
                    backgroundColor:
                      hoveredLanguageItem === lang
                        ? 'var(--lv-bg-toolbar, #F2EFE9)'
                        : 'transparent',
                    color: 'var(--lv-text-primary, #133435)',
                  }}
                  onMouseEnter={() => setHoveredLanguageItem(lang)}
                  onMouseLeave={() => setHoveredLanguageItem(null)}
                >
                  {lang}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Image Upload Button */}
      <ToolbarButton onClick={handleImageUpload} disabled={false} title="Insert Image">
        <Image size={18} aria-label="Insert Image" />
      </ToolbarButton>

      <div style={dividerStyle} />

      {/* Text Formatting */}
      <div style={flexGroupStyle}>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleBold().run()}
          isActive={editor.isActive('bold')}
          title="Bold"
        >
          <Bold size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleItalic().run()}
          isActive={editor.isActive('italic')}
          title="Italic"
        >
          <Italic size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleUnderline().run()}
          isActive={editor.isActive('underline')}
          title="Underline"
        >
          <Underline size={18} />
        </ToolbarButton>
        <ToolbarButton
          onClick={() => editor.chain().focus().toggleStrike().run()}
          isActive={editor.isActive('strike')}
          title="Strikethrough"
        >
          <Strikethrough size={18} />
        </ToolbarButton>
      </div>

      <div style={dividerStyle} />

      {/* Alignment Dropdown */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <button
          onClick={() => setIsAlignDropdownOpen(!isAlignDropdownOpen)}
          type="button"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            padding: '4px 8px',
            borderRadius: '4px',
            border: 'none',
            backgroundColor: isAlignDropdownOpen ? 'var(--lv-bg-toolbar, #F2EFE9)' : 'transparent',
            cursor: 'pointer',
            color: 'var(--lv-text-primary, #133435)',
          }}
          title="Text Alignment"
        >
          {editor.isActive({ textAlign: 'center' }) ? (
            <AlignCenter size={18} />
          ) : editor.isActive({ textAlign: 'right' }) ? (
            <AlignRight size={18} />
          ) : editor.isActive({ textAlign: 'justify' }) ? (
            <AlignJustify size={18} />
          ) : (
            <AlignLeft size={18} />
          )}
          <ChevronDown size={14} style={{ color: '#565656' }} />
        </button>

        {isAlignDropdownOpen && (
          <div
            style={{
              position: 'absolute',
              top: '100%',
              left: 0,
              marginTop: '4px',
              backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
              border: '1px solid var(--lv-border-input, #D7D8D3)',
              borderRadius: '8px',
              boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
              zIndex: 100,
              padding: '4px',
              minWidth: '120px',
            }}
          >
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('left').run();
                setIsAlignDropdownOpen(false);
              }}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: editor.isActive({ textAlign: 'left' })
                  ? 'var(--lv-bg-toolbar, #F2EFE9)'
                  : 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: 'var(--lv-text-primary, #133435)',
              }}
            >
              <AlignLeft size={16} />
              <span style={{ fontSize: '14px' }}>Left</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('center').run();
                setIsAlignDropdownOpen(false);
              }}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: editor.isActive({ textAlign: 'center' })
                  ? 'var(--lv-bg-toolbar, #F2EFE9)'
                  : 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: 'var(--lv-text-primary, #133435)',
              }}
            >
              <AlignCenter size={16} />
              <span style={{ fontSize: '14px' }}>Center</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('right').run();
                setIsAlignDropdownOpen(false);
              }}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: editor.isActive({ textAlign: 'right' })
                  ? 'var(--lv-bg-toolbar, #F2EFE9)'
                  : 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: 'var(--lv-text-primary, #133435)',
              }}
            >
              <AlignRight size={16} />
              <span style={{ fontSize: '14px' }}>Right</span>
            </button>
            <button
              onClick={() => {
                editor.chain().focus().setTextAlign('justify').run();
                setIsAlignDropdownOpen(false);
              }}
              type="button"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                width: '100%',
                padding: '8px 12px',
                border: 'none',
                backgroundColor: editor.isActive({ textAlign: 'justify' })
                  ? 'var(--lv-bg-toolbar, #F2EFE9)'
                  : 'transparent',
                cursor: 'pointer',
                borderRadius: '4px',
                color: 'var(--lv-text-primary, #133435)',
              }}
            >
              <AlignJustify size={16} />
              <span style={{ fontSize: '14px' }}>Justify</span>
            </button>
          </div>
        )}
      </div>

      <div style={dividerStyle} />

      {/* Zoom Controls */}
      <div style={flexGroupStyle}>
        <ToolbarButton
          onClick={() => onZoomOut?.()}
          disabled={!onZoomOut || zoomLevel <= 50}
          title="Zoom Out"
        >
          <Minus size={18} />
        </ToolbarButton>
        <div
          style={{
            fontSize: '13px',
            minWidth: '40px',
            textAlign: 'center',
            color: 'var(--lv-text-secondary, #3D3D3D)',
            userSelect: 'none',
          }}
        >
          {zoomLevel}%
        </div>
        <ToolbarButton
          onClick={() => onZoomIn?.()}
          disabled={!onZoomIn || zoomLevel >= 200}
          title="Zoom In"
        >
          <Plus size={18} />
        </ToolbarButton>
      </div>

      <div style={dividerStyle} />

      {/* List */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        isActive={editor.isActive('bulletList')}
        title="Bullet List"
      >
        <List size={18} />
      </ToolbarButton>

      <ToolbarButton
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        isActive={editor.isActive('orderedList')}
        title="Ordered List"
      >
        <ListOrdered size={18} />
      </ToolbarButton>

      <div style={dividerStyle} />

      {/* Quote */}
      <ToolbarButton
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        isActive={editor.isActive('blockquote')}
        title="Blockquote"
      >
        <Quote size={18} />
      </ToolbarButton>

      {/* Page Break */}
      <ToolbarButton
        onClick={() => editor.chain().focus().setHorizontalRule().run()}
        title="Page Break"
      >
        <Minus size={18} />
      </ToolbarButton>

      {/* Citation Style Dropdown - moved to end */}
      {onStyleChange && (
        <div style={{ position: 'relative', flexShrink: 0 }}>
          <button
            onClick={() => setIsStyleDropdownOpen(!isStyleDropdownOpen)}
            type="button"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '8px',
              padding: '6px 12px',
              fontSize: '14px',
              color: 'var(--lv-text-secondary, #3D3D3D)',
              backgroundColor: 'var(--lv-bg-tab, #FCFCF9)',
              border: '1px solid var(--lv-border-input, #D7D8D3)',
              borderRadius: '6px',
              boxShadow: 'none',
              minWidth: '140px',
              cursor: 'pointer',
              transition: 'all 150ms ease',
            }}
            title="Citation Style"
          >
            <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {CITATION_STYLES.find((s) => s.value === citationStyle)?.label || 'Citation Style'}
              </span>
            </span>
            <ChevronDown
              size={14}
              style={{ color: 'var(--lv-text-muted, #656565)', flexShrink: 0 }}
            />
          </button>

          {isStyleDropdownOpen && (
            <>
              <div
                style={{ position: 'fixed', inset: 0, zIndex: 10 }}
                onClick={() => setIsStyleDropdownOpen(false)}
              />
              <div
                style={{
                  position: 'absolute',
                  top: '100%',
                  left: 0,
                  marginTop: '4px',
                  width: '256px',
                  backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
                  border: '1px solid var(--lv-border-primary, #E3E3E3)',
                  borderRadius: '8px',
                  boxShadow:
                    '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
                  zIndex: 100,
                  overflow: 'hidden',
                  display: 'flex',
                  flexDirection: 'column',
                }}
              >
                <div
                  style={{
                    padding: '8px',
                    borderBottom: '1px solid var(--lv-border-light, #F1F3F3)',
                    backgroundColor: 'var(--lv-bg-tab, #FCFCF9)',
                    position: 'sticky',
                    top: 0,
                  }}
                >
                  <div style={{ position: 'relative' }}>
                    <Search
                      size={14}
                      style={{
                        position: 'absolute',
                        left: '10px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        color: 'var(--lv-text-muted, #656565)',
                        pointerEvents: 'none',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search styles..."
                      style={{
                        width: '100%',
                        paddingLeft: '32px',
                        paddingRight: '12px',
                        paddingTop: '6px',
                        paddingBottom: '6px',
                        fontSize: '14px',
                        border: '1px solid var(--lv-border-input, #D7D8D3)',
                        borderRadius: '6px',
                        outline: 'none',
                        backgroundColor: 'var(--lv-bg-white, #FFFFFF)',
                        color: 'var(--lv-text-primary, #133435)',
                      }}
                      value={styleSearchQuery}
                      onChange={(e) => setStyleSearchQuery(e.target.value)}
                      onClick={(e) => e.stopPropagation()}
                      autoFocus
                    />
                  </div>
                </div>
                <div style={{ maxHeight: '240px', overflowY: 'auto', padding: '4px 0' }}>
                  {filteredStyles.length > 0 ? (
                    filteredStyles.map((style) => (
                      <button
                        key={style.value}
                        onClick={() => {
                          onStyleChange(style.value);
                          setIsStyleDropdownOpen(false);
                          setStyleSearchQuery('');
                        }}
                        type="button"
                        style={{
                          width: '100%',
                          textAlign: 'left',
                          padding: '8px 12px',
                          fontSize: '14px',
                          border: 'none',
                          cursor: 'pointer',
                          backgroundColor:
                            hoveredStyleItem === style.value
                              ? 'var(--lv-bg-toolbar, #F2EFE9)'
                              : citationStyle === style.value
                                ? 'var(--lv-bg-toolbar, #F2EFE9)'
                                : 'transparent',
                          color:
                            citationStyle === style.value
                              ? 'var(--lv-text-primary, #133435)'
                              : 'var(--lv-text-secondary, #3D3D3D)',
                          fontWeight: citationStyle === style.value ? 500 : 400,
                          transition: 'background-color 150ms ease',
                        }}
                        onMouseEnter={() => setHoveredStyleItem(style.value)}
                        onMouseLeave={() => setHoveredStyleItem(null)}
                      >
                        {style.label}
                      </button>
                    ))
                  ) : (
                    <div
                      style={{
                        padding: '8px 12px',
                        fontSize: '14px',
                        color: 'var(--lv-text-muted, #656565)',
                        textAlign: 'center',
                      }}
                    >
                      No styles found
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default EditorToolbar;
