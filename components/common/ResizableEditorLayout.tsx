'use client';

import React, { useState, useRef, useEffect, ReactNode } from 'react';

interface ResizableEditorLayoutProps {
  children: ReactNode;
  sidebarInitialWidth?: number;
  sidebarMinWidth?: number;
  sidebarMaxWidth?: number;
}

export default function ResizableEditorLayout({
  children,
  sidebarInitialWidth = 380,
  sidebarMinWidth = 250,
  sidebarMaxWidth = 600,
}: ResizableEditorLayoutProps) {
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    // Load saved width from localStorage during initialization
    if (typeof window !== 'undefined') {
      const savedWidth = localStorage.getItem('editor-sidebar-width');
      if (savedWidth) {
        const width = parseInt(savedWidth, 10);
        if (width >= sidebarMinWidth && width <= sidebarMaxWidth) {
          return width;
        }
      }
    }
    return sidebarInitialWidth;
  });
  const [isResizing, setIsResizing] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const startXRef = useRef(0);
  const startWidthRef = useRef(0);

  const handleResizeStart = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsResizing(true);
    startXRef.current = e.clientX;
    startWidthRef.current = sidebarWidth;
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isResizing) return;

      const delta = e.clientX - startXRef.current;
      const newWidth = Math.max(
        sidebarMinWidth,
        Math.min(sidebarMaxWidth, startWidthRef.current - delta)
      );

      setSidebarWidth(newWidth);
    };

    const handleMouseUp = () => {
      if (isResizing) {
        setIsResizing(false);
        document.body.style.cursor = 'auto';
        document.body.style.userSelect = 'auto';
        // Save width to localStorage
        localStorage.setItem('editor-sidebar-width', sidebarWidth.toString());
      }
    };

    if (isResizing) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
      };
    }
  }, [isResizing, sidebarWidth, sidebarMinWidth, sidebarMaxWidth]);

  return (
    <div
      ref={containerRef}
      className="resizable-editor-layout"
      style={{
        display: 'flex',
        width: '100%',
        height: '100%',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Main Content Area */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
          minWidth: 0,
        }}
      >
        {children}
      </div>

      {/* Resize Handle */}
      <div
        onMouseDown={handleResizeStart}
        style={{
          width: isResizing ? '8px' : '5px',
          backgroundColor: isResizing ? '#3b82f6' : 'transparent',
          cursor: 'col-resize',
          userSelect: 'none',
          transition: isResizing ? 'none' : 'width 0.2s ease',
          flexShrink: 0,
          zIndex: 20,
        }}
        className="resize-handle"
        role="separator"
        aria-label="Resize sidebar"
        aria-orientation="vertical"
      />

      {/* Sidebar */}
      <div
        style={{
          width: `${sidebarWidth}px`,
          flexShrink: 0,
          overflow: 'hidden',
          borderLeft: '1px solid #e5e7eb',
        }}
      >
        {React.Children.toArray(children)[1]}
      </div>
    </div>
  );
}
