'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Skeleton } from '@/components/ui/skeleton';
import 'react-pdf/dist/Page/AnnotationLayer.css';
import 'react-pdf/dist/Page/TextLayer.css';
// Dynamically import react-pdf to avoid SSR issues with pdfjs-dist
const PdfDocument = dynamic(
  () =>
    import('react-pdf').then((mod) => {
      // Set worker source after module loads
      mod.pdfjs.GlobalWorkerOptions.workerSrc = `//unpkg.com/pdfjs-dist@${mod.pdfjs.version}/build/pdf.worker.min.mjs`;
      return mod.Document;
    }),
  { ssr: false }
);

const PdfPage = dynamic(() => import('react-pdf').then((mod) => mod.Page), { ssr: false });

function PdfPreview({ url }: { url: string }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const [containerWidth, setContainerWidth] = useState<number>(800);
  const [numPages, setNumPages] = useState<number>(0);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    const updateWidth = () => {
      const el = containerRef.current;
      if (!el) return;
      const width = Math.floor(el.getBoundingClientRect().width);
      if (Number.isFinite(width) && width > 0) {
        setContainerWidth(width);
      }
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    if (containerRef.current) {
      observer.observe(containerRef.current);
    }

    return () => observer.disconnect();
  }, []);

  const pages = useMemo(() => {
    if (!numPages) return [];
    return Array.from({ length: numPages }, (_, idx) => idx + 1);
  }, [numPages]);

  return (
    <div
      ref={containerRef}
      className="w-full h-full overflow-y-auto bg-gray-100 rounded-lg scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent"
    >
      <PdfDocument
        file={url}
        onLoadSuccess={({ numPages: n }: { numPages: number }) => {
          setNumPages(n);
          setLoadError(null);
        }}
        onLoadError={() => {
          setLoadError('Failed to load PDF');
        }}
        loading={
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '20px',
              padding: '20px',
            }}
          >
            {[1, 2].map((page) => (
              <div
                key={page}
                style={{
                  width: '100%',
                  maxWidth: '800px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px',
                  padding: '24px',
                  backgroundColor: 'white',
                  borderRadius: '8px',
                  boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                }}
              >
                <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                  <Skeleton className="h-6 w-24" />
                  <Skeleton className="h-6 flex-1" />
                </div>
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-5/6" />
                <Skeleton className="h-4 w-full" />
                <div style={{ height: '16px' }} />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
            <div
              style={{ textAlign: 'center', color: '#6b7280', fontSize: '14px', marginTop: '8px' }}
            >
              Loading PDF…
            </div>
          </div>
        }
        className="flex flex-col items-center"
      >
        {loadError ? (
          <div className=" text-red-500 text-center">{loadError}</div>
        ) : pages.length > 0 ? (
          pages.map((pageNumber) => (
            <div key={pageNumber} className="flex justify-center py-4">
              <div className="shadow-md">
                <PdfPage pageNumber={pageNumber} width={containerWidth} className="bg-white" />
              </div>
            </div>
          ))
        ) : null}
      </PdfDocument>
    </div>
  );
}

export default function ReferencePdfPreviewModal({
  isOpen,
  onClose,
  title,
  url,
  isLoading,
  error,
}: {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  url: string | null;
  isLoading: boolean;
  error: string | null;
}) {
  const contentRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-99999 bg-black/60"
      role="dialog"
      aria-modal="true"
      aria-label={title || 'Preview'}
      onMouseDown={(e) => {
        if (contentRef.current && !contentRef.current.contains(e.target as Node)) {
          onClose();
        }
      }}
    >
      <div ref={contentRef} className="absolute inset-0 bg-white flex flex-col">
        <div className="h-14 px-4 flex items-center justify-between border-b">
          <div className="font-medium text-center w-screen">{title || 'Preview'}</div>
          <button
            type="button"
            onClick={onClose}
            className="h-15 w-15 grid place-items-center rounded hover:bg-gray-100"
            aria-label="Close preview"
          >
            <span className="text-2xl font-bold">×</span>
          </button>
        </div>

        <div className="flex-1">
          {isLoading ? (
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '20px',
                padding: '40px 20px',
                height: '100%',
                justifyContent: 'center',
              }}
            >
              {[1, 2].map((page) => (
                <div
                  key={page}
                  style={{
                    width: '100%',
                    maxWidth: '600px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '12px',
                    padding: '24px',
                    backgroundColor: 'white',
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px rgba(0, 0, 0, 0.1)',
                  }}
                >
                  <div style={{ display: 'flex', gap: '12px', marginBottom: '8px' }}>
                    <Skeleton className="h-6 w-24" />
                    <Skeleton className="h-6 flex-1" />
                  </div>
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-5/6" />
                  <Skeleton className="h-4 w-full" />
                  <div style={{ height: '16px' }} />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                </div>
              ))}
              <div
                style={{
                  textAlign: 'center',
                  color: '#6b7280',
                  fontSize: '14px',
                  marginTop: '8px',
                }}
              >
                Loading preview…
              </div>
            </div>
          ) : error ? (
            <div className="h-full grid place-items-center text-red-600">{error}</div>
          ) : url ? (
            <PdfPreview url={url} />
          ) : (
            <div className="h-full grid place-items-center text-gray-400">No preview available</div>
          )}
        </div>
      </div>
    </div>
  );
}
