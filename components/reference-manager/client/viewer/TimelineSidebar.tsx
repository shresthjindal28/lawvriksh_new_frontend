import React, { useEffect, useState, useCallback } from 'react';
import { X, Folder, ChevronRight, ArrowLeft, ChevronDown } from 'lucide-react';
import '@/styles/reference-manager/timeline-sidebar.css';
import { Collection, Folder as FolderType } from '@/lib/contexts/ReferenceManagerContext';
import { ReferenceItem } from '@/types/reference-manager';
import { referenceManagerService } from '@/lib/api/referenceManagerService';
import { Skeleton } from '@/components/ui/skeleton';
import { useMutation } from '@tanstack/react-query';

interface TimelineEvent {
  event: string;
  description: string;
}

interface TimelineDate {
  date: string;
  events: TimelineEvent[];
}

interface Timeline {
  timeline_id: string;
  case_name: string;
  dates: TimelineDate[];
}

interface TimelineData {
  collection_id: string;
  timelines: Timeline[];
}

interface TimelineSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  collections: Collection[];
  foldersByCollection: Record<string, FolderType[]>;
  references: ReferenceItem[];
}

interface TimelineCachePayload {
  folderId: string;
  timelineData: TimelineData;
  selectedTimelineId: string | null;
  cachedAt: number;
}

const TIMELINE_CACHE_KEY = 'reference_manager.timeline_cache.v1';

const readTimelineCache = (): TimelineCachePayload | null => {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(TIMELINE_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as TimelineCachePayload;
    if (
      !parsed ||
      typeof parsed !== 'object' ||
      typeof parsed.folderId !== 'string' ||
      !parsed.timelineData ||
      typeof parsed.timelineData !== 'object' ||
      !Array.isArray(parsed.timelineData.timelines)
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
};

const writeTimelineCache = (payload: TimelineCachePayload) => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.setItem(TIMELINE_CACHE_KEY, JSON.stringify(payload));
  } catch {}
};

const clearTimelineCache = () => {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(TIMELINE_CACHE_KEY);
  } catch {}
};

export default function TimelineSidebar({
  isOpen,
  onClose,
  collections,
  foldersByCollection,
  references,
}: TimelineSidebarProps) {
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [timelineData, setTimelineData] = useState<TimelineData | null>(null);
  const [selectedTimelineId, setSelectedTimelineId] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [timelineError, setTimelineError] = useState<string | null>(null);

  const extractTimelineMutation = useMutation({
    mutationFn: async ({ folderId, s3Keys }: { folderId: string; s3Keys: string[] }) => {
      return referenceManagerService.extractTimeline({
        collection_id: folderId,
        s3_keys: s3Keys,
      });
    },
  });

  const isLoading = extractTimelineMutation.isPending;

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setSelectedFolder(null);
        setTimelineData(null);
        setSelectedTimelineId(null);
        setIsDropdownOpen(false);
        setTimelineError(null);
      }, 0);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const cached = readTimelineCache();
    if (!cached) return;
    const fallbackTimelineId = cached.timelineData.timelines[0]?.timeline_id ?? null;
    // Use queueMicrotask for deferred state updates
    queueMicrotask(() => {
      setSelectedFolder(cached.folderId);
      setTimelineData(cached.timelineData);
      setSelectedTimelineId(cached.selectedTimelineId ?? fallbackTimelineId);
      setIsDropdownOpen(false);
      setTimelineError(null);
    });
  }, [isOpen]);

  // Count references for each folder
  const getReferencesCount = (folderId: string): number => {
    return references.filter((ref) => ref.folderId === folderId).length;
  };

  const saveCache = useCallback(
    (folderId: string, data: TimelineData, timelineId: string | null) => {
      writeTimelineCache({
        folderId,
        timelineData: data,
        selectedTimelineId: timelineId,
        cachedAt: performance.now(),
      });
    },
    []
  );

  const generateTimelineForFolder = async (
    folderId: string,
    options?: { preserveExisting?: boolean }
  ) => {
    setSelectedFolder(folderId);
    setTimelineError(null);
    setIsDropdownOpen(false);
    if (!options?.preserveExisting) {
      setTimelineData(null);
      setSelectedTimelineId(null);
    }

    try {
      // Filter references for this folder that have an s3_key
      const folderRefs = references.filter((ref) => ref.folderId === folderId && ref.s3_key);

      if (folderRefs.length === 0) {
        setTimelineError('You need to add more document');
        return;
      }

      const s3Keys = folderRefs.map((ref) => ref.s3_key!);
      console.log('Fetching timeline for keys:', s3Keys);

      const response = await extractTimelineMutation.mutateAsync({ folderId, s3Keys });

      if (response.success && response.data) {
        const backendError =
          typeof response.data.error === 'string' ? response.data.error.trim() : '';
        if (
          backendError ||
          !Array.isArray(response.data.timelines) ||
          response.data.timelines.length === 0
        ) {
          setTimelineError('You need to add more document');
          setTimelineData(null);
          setSelectedTimelineId(null);
          return;
        }

        console.log('Timeline data received:', response.data);

        // Map the API response to the local TimelineData structure
        const adaptedTimelines: Timeline[] = response.data.timelines.map((t) => ({
          timeline_id: t.timeline_id,
          case_name: t.case_name || t.timeline_name || t.timeline_id,
          dates: t.dates,
        }));

        console.log('Extracted Timelines:', adaptedTimelines);

        const newTimelineData: TimelineData = {
          collection_id: response.data.collection_id,
          timelines: adaptedTimelines,
        };

        const defaultTimelineId = adaptedTimelines[0]?.timeline_id ?? null;

        setTimelineData(newTimelineData);
        setSelectedTimelineId(defaultTimelineId);
        saveCache(folderId, newTimelineData, defaultTimelineId);
      } else {
        console.error('Failed to fetch timeline:', response);
        setTimelineError('You need to add more document');
      }
    } catch (error) {
      console.error('Error fetching timeline:', error);
      setTimelineError('You need to add more document');
    }
  };

  const handleFolderClick = async (folderId: string) => {
    const cached = readTimelineCache();
    if (cached?.folderId === folderId) {
      const fallbackTimelineId = cached.timelineData.timelines[0]?.timeline_id ?? null;
      setSelectedFolder(folderId);
      setTimelineData(cached.timelineData);
      setSelectedTimelineId(cached.selectedTimelineId ?? fallbackTimelineId);
      setIsDropdownOpen(false);
      setTimelineError(null);
      return;
    }

    await generateTimelineForFolder(folderId);
  };

  const handleBack = () => {
    setSelectedFolder(null);
    setTimelineData(null);
    setSelectedTimelineId(null);
    setIsDropdownOpen(false);
    setTimelineError(null);
  };

  const handleRegenerate = async () => {
    if (!selectedFolder) return;
    clearTimelineCache();
    await generateTimelineForFolder(selectedFolder, { preserveExisting: true });
  };

  // Group events by year for selected timeline only
  const groupEventsByYear = () => {
    if (!timelineData || !selectedTimelineId) return {};

    const selectedTimeline = timelineData.timelines.find(
      (t) => t.timeline_id === selectedTimelineId
    );
    if (!selectedTimeline) return {};

    const grouped: Record<string, TimelineDate[]> = {};

    selectedTimeline.dates.forEach((dateEntry) => {
      const year = new Date(dateEntry.date).getFullYear().toString();
      if (!grouped[year]) {
        grouped[year] = [];
      }
      grouped[year].push(dateEntry);
    });

    // Sort years in descending order
    const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
    const sortedGrouped: Record<string, TimelineDate[]> = {};
    sortedYears.forEach((year) => {
      // Sort dates within each year in descending order
      sortedGrouped[year] = grouped[year].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
    });

    return sortedGrouped;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const options: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return date.toLocaleDateString('en-US', options);
  };

  const renderFolderSelection = () => (
    <div className="timeline-folder-selection">
      <p className="timeline-subtitle">Select a folder to view document timelines</p>
      {timelineError && (
        <div className="timeline-error" role="alert">
          {timelineError}
        </div>
      )}
      {collections
        .filter((collection) => collection.id !== 'collections') // Exclude the root 'Collections' item
        .map((collection) => {
          const folders = foldersByCollection[collection.id] || [];
          if (folders.length === 0) return null;

          return (
            <div key={collection.id} className="timeline-collection-group">
              <h3 className="timeline-collection-name">{collection.title}</h3>
              {folders.map((folder) => {
                const refCount = getReferencesCount(folder.id);
                return (
                  <div
                    key={folder.id}
                    className="timeline-folder-item"
                    onClick={() => handleFolderClick(folder.id)}
                  >
                    <Folder size={20} className="timeline-folder-icon" />
                    <div className="timeline-folder-info">
                      <div className="timeline-folder-name">{folder.title}</div>
                      <div className="timeline-folder-count">
                        {refCount} reference{refCount !== 1 ? 's' : ''}
                      </div>
                    </div>
                    <ChevronRight size={18} className="timeline-folder-arrow" />
                  </div>
                );
              })}
            </div>
          );
        })}
    </div>
  );

  const renderTimelineLoading = () => (
    <div className="timeline-loading" aria-hidden="true">
      <div className="timeline-view">
        <div className="timeline-view-header">
          <Skeleton className="h-9 w-9 rounded-md" />
          <Skeleton className="h-9 w-[70%] rounded-md" />
        </div>

        <div style={{ marginTop: 12 }}>
          <Skeleton className="h-5 w-[60%]" />
        </div>

        <div className="timeline-events" style={{ marginTop: 16 }}>
          {Array.from({ length: 2 }).map((_, yearIdx) => (
            <div key={yearIdx} className="timeline-year-group">
              <div
                className="timeline-year-badge"
                style={{ backgroundColor: 'transparent', boxShadow: 'none' }}
              >
                <Skeleton className="h-6 w-14 rounded-full" />
              </div>
              <div className="timeline-year-content">
                {Array.from({ length: 3 }).map((_, eventIdx) => (
                  <div key={eventIdx} className="timeline-event-item">
                    <div className="timeline-dot"></div>
                    <div className="timeline-event-card">
                      <div className="timeline-event-date">
                        <Skeleton className="h-3 w-28" />
                      </div>
                      <div className="timeline-event-title">
                        <Skeleton className="h-4 w-[70%]" />
                      </div>
                      <div className="timeline-event-description">
                        <Skeleton className="h-3 w-[90%]" />
                        {/* <Skeleton className="h-3 w-[75%] mt-2" /> */}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  const renderTimeline = () => {
    const groupedEvents = groupEventsByYear();
    const selectedTimeline = timelineData?.timelines.find(
      (t) => t.timeline_id === selectedTimelineId
    );

    return (
      <div className="timeline-view">
        <div className="timeline-view-header">
          <button
            className="timeline-back-btn-visible"
            onClick={handleBack}
            title="Back to all folders"
          >
            <ArrowLeft size={20} />
          </button>
          <button
            className="timeline-regenerate-btn"
            onClick={handleRegenerate}
            disabled={isLoading || !selectedFolder}
          >
            Regenerate
          </button>
        </div>
        <div className="timeline-dropdown-container flex items-center justify-between">
          <button
            className="timeline-dropdown-trigger"
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
          >
            <span className="timeline-dropdown-label">
              {selectedTimeline?.case_name || 'Select a case'}
            </span>
            <ChevronDown
              size={18}
              className={`timeline-dropdown-icon ${isDropdownOpen ? 'open' : ''}`}
            />
          </button>

          {isDropdownOpen && (
            <div className="timeline-dropdown-menu">
              {timelineData?.timelines.map((timeline) => (
                <div
                  key={timeline.timeline_id}
                  className={`timeline-dropdown-item ${selectedTimelineId === timeline.timeline_id ? 'selected' : ''}`}
                  onClick={() => {
                    setSelectedTimelineId(timeline.timeline_id);
                    setIsDropdownOpen(false);
                    if (selectedFolder && timelineData) {
                      saveCache(selectedFolder, timelineData, timeline.timeline_id);
                    }
                  }}
                >
                  {timeline.case_name}
                </div>
              ))}
            </div>
          )}
        </div>

        <h3 className="timeline-case-title">{selectedTimeline?.case_name}</h3>

        {timelineError && (
          <div className="timeline-error" role="alert">
            {timelineError}
          </div>
        )}

        <div className="timeline-events">
          {Object.entries(groupedEvents).map(([year, dates]) => (
            <div key={year} className="timeline-year-group">
              <div className="timeline-year-badge">{year}</div>
              <div className="timeline-year-content">
                {dates.map((dateEntry, dateIdx) => (
                  <div key={`${dateEntry.date}-${dateIdx}`}>
                    {dateEntry.events.map((event, eventIdx) => (
                      <div key={`${dateEntry.date}-${eventIdx}`} className="timeline-event-item">
                        <div className="timeline-dot"></div>
                        <div className="timeline-event-card">
                          <div className="timeline-event-date">{formatDate(dateEntry.date)}</div>
                          <div className="timeline-event-title">{event.event}</div>
                          <div className="timeline-event-description">{event.description}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className={`timeline-sidebar ${isOpen ? 'open' : ''}`}>
      <div className="timeline-header">
        <h2>Document Timeline</h2>
        <button className="timeline-close-btn" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <div className="timeline-content">
        {isLoading
          ? renderTimelineLoading()
          : !timelineData
            ? renderFolderSelection()
            : renderTimeline()}
      </div>
    </div>
  );
}
