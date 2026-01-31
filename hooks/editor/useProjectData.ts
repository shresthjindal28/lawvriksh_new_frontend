import { OutputData } from '@editorjs/editorjs';
import { useCallback, useEffect, useState } from 'react';
import projectService from '@/lib/api/projectService';
import { ExportOptions, GetProjectContent, Project, ProjectDocument } from '@/types/project';
import {
  getProjectByIdSchema,
  updateProjectRequestSchema,
  updateProjectResponseSchema,
} from '@/lib/validators/project/project.schemas';
import { getTemplateById, getTemplateTags } from '@/lib/config/templateConfig';
import { useLibraryDocuments } from '@/hooks/common/useLibraryDocuments';
import { Document } from '@/types/library';
import { DocumentType } from '@/types/project';
import { editorJsToHtml, htmlToEditorData } from '@/lib/utils/editorHelper';
import { useAuth } from '@/lib/contexts/AuthContext';
import { useToast } from '@/lib/contexts/ToastContext';
import { Citation, Citations, ProjectMetadata, WorkspaceReference } from '@/types/citations';
import { useCitationStore } from '@/store/zustand/useCitationStore';

export function useProjectData(projectId: string, templateId?: string, initialTitle?: string) {
  const {
    documents,
    fetchDocuments,
    loading: documentsLoading,
    error: documentsError,
  } = useLibraryDocuments({ autoFetch: false });
  const { profile } = useAuth();
  const setCitationStore = useCitationStore((state) => state.setCitations);

  const [projectData, setProjectData] = useState<OutputData | null>(null);
  const [project, setProject] = useState<GetProjectContent | null>(null);
  const [updatedProjectData, setUpdatedProjectData] = useState<OutputData | null>(null);
  const [projectTitle, setProjectTitle] = useState<string>(initialTitle || '');
  const [projectDocuments, setProjectDocuments] = useState<Document[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [templateType, setTemplateType] = useState<DocumentType>('ideation');
  const [isProjectExporting, setIsProjectExporting] = useState<boolean>(false);
  const [citations, setCitations] = useState<Citations>({});
  const [references, setReferences] = useState<WorkspaceReference[]>([]);
  const { addToast } = useToast();

  useEffect(() => {
    setProjectDocuments(documents);
  }, [documents]);

  // Sync citations to citation store whenever citations change
  useEffect(() => {
    if (citations && citations['tiptap-doc']) {
      const tiptapCitations = citations['tiptap-doc'];
      if (Array.isArray(tiptapCitations)) {
        const citationItems = tiptapCitations
          .filter((citation: any) => citation.title) // Only require title
          .map((citation: any) => ({
            pageNumber: citation.pageNumber || 1, // Default to page 1
            title: citation.title,
          }));
        // Always update store to ensure sync (even if empty to clear removed citations)
        setCitationStore(citationItems);
      }
    }
  }, [citations, setCitationStore]);

  useEffect(() => {
    fetchProjectData(templateId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId, templateId]);

  useEffect(() => {
    if (templateId) {
      const template = getTemplateById(templateId);
      if (template) {
        setTemplateType(template.category);
      }
    }
  }, [templateId]);

  function unwrapMetadata(wrappedMetadata: any): ProjectMetadata {
    let metadata = wrappedMetadata || {};
    while (
      metadata &&
      metadata.data &&
      typeof metadata.data === 'object' &&
      !Array.isArray(metadata.data)
    ) {
      metadata = metadata.data;
    }

    return metadata as ProjectMetadata;
  }

  // FIXED: Proper content handling
  const saveCitationsToMetadata = useCallback(
    async (citationsToSave: Citations) => {
      if (!projectId) {
        return;
      }

      try {
        const projectResponse = await projectService.getProjectById(projectId);

        if (!projectResponse.success) {
          throw new Error('Failed to fetch project data');
        }

        const existingMetadata = unwrapMetadata(projectResponse.data?.workspace?.metadata);

        const currentContent = projectResponse.data?.workspace?.content?.data?.data;

        const mergedMetadata: ProjectMetadata = {
          ...existingMetadata,
          citations: citationsToSave,
        };

        // SAFETY: Explicitly remove content/templateData from metadata to prevent duplication
        if ((mergedMetadata as any).content) delete (mergedMetadata as any).content;
        if ((mergedMetadata as any).templateData) delete (mergedMetadata as any).templateData;

        const contentToSave = updatedProjectData || projectData || currentContent;

        if (!contentToSave) {
          throw new Error('No content available to save');
        }

        const updatePayload = {
          title: projectTitle || projectResponse.data?.workspace?.title,
          content: { data: contentToSave },
          metadata: { data: mergedMetadata },
        };

        const updateResponse = await projectService.updateProject(projectId, updatePayload);

        if (!updateResponse.success) {
          throw new Error(updateResponse.message || 'Failed to save citations');
        }

        setCitations(citationsToSave);
      } catch (err) {
        throw err;
      }
    },
    [projectId, projectTitle, projectData, updatedProjectData]
  );

  const addCitation = useCallback(
    async (blockId: string, citation: Citation) => {
      const newCitations = {
        ...citations,
        [blockId]: [
          ...(citations[blockId] || []),
          {
            ...citation,
            addedAt: new Date().toISOString(),
          },
        ],
      };

      // Update citation store IMMEDIATELY (before API call) for instant UI feedback
      // This ensures footer updates right away, not after API completes
      if (blockId === 'tiptap-doc') {
        const tiptapCitations = newCitations['tiptap-doc'] || [];
        const citationItems = tiptapCitations
          .filter((c: any) => c.title)
          .map((c: any) => ({
            pageNumber: c.pageNumber || 1,
            title: c.title,
          }));
        setCitationStore(citationItems);
      }

      // Update local state
      setCitations(newCitations);

      // Save to backend (runs after store is already updated)
      await saveCitationsToMetadata(newCitations);
    },
    [citations, saveCitationsToMetadata, setCitationStore]
  );

  const updateCitation = useCallback(
    async (blockId: string, citationId: string, updatedCitation: Partial<Citation>) => {
      const blockCitations = citations[blockId];
      if (!blockCitations) return;

      const newCitations = {
        ...citations,
        [blockId]: blockCitations.map((citation) =>
          citation.id === citationId ? { ...citation, ...updatedCitation } : citation
        ),
      };

      // Update citation store IMMEDIATELY (before API call) for instant UI feedback
      if (blockId === 'tiptap-doc') {
        const tiptapCitations = newCitations['tiptap-doc'] || [];
        const citationItems = tiptapCitations
          .filter((c: any) => c.title)
          .map((c: any) => ({
            pageNumber: c.pageNumber || 1,
            title: c.title,
          }));
        setCitationStore(citationItems);
      }

      // Update local state
      setCitations(newCitations);

      // Save to backend (runs after store is already updated)
      await saveCitationsToMetadata(newCitations);
    },
    [citations, saveCitationsToMetadata, setCitationStore]
  );

  const removeCitation = useCallback(
    async (blockId: string, citationId: string) => {
      const blockCitations = citations[blockId];
      if (!blockCitations) return;

      // Find the citation to get its reference_id before removing
      const citation = blockCitations.find((c) => c.id === citationId);

      const newCitations = {
        ...citations,
        [blockId]: blockCitations.filter((c) => c.id !== citationId),
      };

      if (newCitations[blockId].length === 0) {
        delete newCitations[blockId];
      }

      // Update citation store IMMEDIATELY (before API call) for instant UI feedback
      if (blockId === 'tiptap-doc') {
        const tiptapCitations = newCitations['tiptap-doc'] || [];
        const citationItems = tiptapCitations
          .filter((c: any) => c.title)
          .map((c: any) => ({
            pageNumber: c.pageNumber || 1,
            title: c.title,
          }));
        setCitationStore(citationItems); // Update store even if empty
      }

      // Update local state
      setCitations(newCitations);

      // Save to backend (runs after store is already updated)
      await saveCitationsToMetadata(newCitations);

      // Also delete the backend reference if it exists
      if (citation?.reference_id) {
        try {
          await projectService.deleteWorkspaceReference(projectId, citation.reference_id);
          setReferences((prev) => prev.filter((ref) => ref.id !== citation.reference_id));
        } catch (error) {
          console.error('Failed to delete workspace reference:', error);
        }
      }
    },
    [citations, projectId, saveCitationsToMetadata, setCitationStore]
  );

  const getCitationsForBlock = useCallback(
    (blockId: string): Citation[] => {
      return citations[blockId] || [];
    },
    [citations]
  );

  const getAllCitations = useCallback((): Citation[] => {
    return Object.values(citations).flat();
  }, [citations]);

  // Add a new workspace reference to backend and return the reference ID
  const addWorkspaceReference = useCallback(
    async (citation: Citation): Promise<string | null> => {
      if (!projectId) return null;

      // Check if reference already exists by ID, Link, or Title to avoid duplicates
      const existingRef = references.find(
        (ref) =>
          ref.id === citation.id ||
          (ref.link && citation.link && ref.link === citation.link) ||
          (ref.title && citation.title && ref.title === citation.title)
      );

      if (existingRef) {
        console.log('Reference already exists, returning ID:', existingRef.id);
        return existingRef.id;
      }

      try {
        const response = await projectService.addWorkspaceReference(projectId, {
          workspace_id: projectId,
          title: citation.title,
          relevance_score: 0.95,
          source: citation.source,
          link: citation.link || '',
        });

        console.log('addWorkspaceReference response:', response);
        console.log('addWorkspaceReference response.data:', response.data);

        if (response.success && response.data?.reference) {
          const newReference = response.data.reference as WorkspaceReference;
          console.log('Stored reference with ID:', newReference.id);
          setReferences((prev) => [...prev, newReference]);
          return newReference.id;
        }
        return null;
      } catch (error) {
        console.error('Failed to add workspace reference:', error);
        return null;
      }
    },
    [projectId, references]
  );

  // Get a reference by its ID
  const getReferenceById = useCallback(
    (referenceId: string): WorkspaceReference | undefined => {
      return references.find((ref) => ref.id === referenceId);
    },
    [references]
  );

  // Delete a workspace reference from backend
  const deleteWorkspaceReference = useCallback(
    async (referenceId: string): Promise<boolean> => {
      if (!projectId) return false;

      try {
        const response = await projectService.deleteWorkspaceReference(projectId, referenceId);
        if (response.success) {
          setReferences((prev) => prev.filter((ref) => ref.id !== referenceId));
          return true;
        }
        return false;
      } catch (error) {
        console.error('Failed to delete workspace reference:', error);
        return false;
      }
    },
    [projectId]
  );

  const updateProjectData = useCallback(
    async (
      data: OutputData,
      additionalMetadata?: Record<string, any>,
      titleOverride?: string,
      suppressToast: boolean = false
    ) => {
      if (!projectId) {
        setError('Project ID is required');
        return;
      }

      try {
        const projectResponse = await projectService.getProjectById(projectId);

        if (!projectResponse.success) {
          throw new Error('Failed to fetch project data');
        }

        const existingMetadata = unwrapMetadata(projectResponse.data?.workspace?.metadata);

        // Use citations from additionalMetadata if provided, otherwise use hook state
        const citationsToSave = additionalMetadata?.citations || citations;

        const mergedMetadata: ProjectMetadata = {
          ...existingMetadata,
          ...(additionalMetadata || {}),
          citations: citationsToSave,
        };

        // SAFETY: Explicitly remove content/templateData from metadata to prevent duplication
        if ((mergedMetadata as any).content) delete (mergedMetadata as any).content;
        if ((mergedMetadata as any).templateData) delete (mergedMetadata as any).templateData;

        // Use titleOverride if provided (for immediate title updates), otherwise use state
        const updatePayload = {
          title: titleOverride ?? projectTitle,
          content: { data },
          metadata: { data: mergedMetadata },
        };

        const updateProjectDataResponse = await projectService.updateProject(
          projectId,
          updatePayload
        );

        if (!updateProjectDataResponse.success) {
          throw new Error('Update failed');
        }

        if (updateProjectDataResponse.data?.workspace?.content?.data) {
          const unwrappedContent = updateProjectDataResponse.data.workspace.content.data;
          setProjectData(unwrappedContent);
          setUpdatedProjectData(unwrappedContent);
        }

        let updatedMetadata = unwrapMetadata(
          updateProjectDataResponse.data?.workspace?.metadata?.data
        );

        if (updatedMetadata?.citations) {
          setCitations(updatedMetadata.citations);

          // Update citation store when citations are updated
          const tiptapCitations = updatedMetadata.citations['tiptap-doc'];
          if (Array.isArray(tiptapCitations) && tiptapCitations.length > 0) {
            const citationItems = tiptapCitations
              .filter((citation: any) => citation.pageNumber !== undefined && citation.title)
              .map((citation: any) => ({
                pageNumber: citation.pageNumber,
                title: citation.title,
              }));
            if (citationItems.length > 0) {
              setCitationStore(citationItems);
            }
          }
        }

        if (!suppressToast) {
          addToast('Project updated successfully', 'success');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        setError(errorMessage);
        throw error;
      }
    },
    [projectId, projectTitle, citations, addToast, setCitationStore]
  );

  const fetchProjectData = useCallback(
    async (templateId?: string) => {
      setIsLoading(true);
      setError(null);

      if (!projectId) {
        setError('Project ID is required');
        setIsLoading(false);
        return;
      }

      try {
        if (templateId && templateId !== 'custom-template') {
          const template = getTemplateById(templateId);
          if (template) {
            setProjectData(template.content);
            setProjectTitle(template.title);
            setTemplateType(template.category);
            setCitations({});
            await fetchDocuments();
            setIsLoading(false);
            return;
          }
        }

        const projectResponse = await projectService.getProjectById(projectId);
        console.log('projectResponse', projectResponse);
        if (!projectResponse.success) {
          throw new Error(projectResponse.message || 'Failed to fetch project');
        }

        const validation = getProjectByIdSchema.safeParse(projectResponse.data);

        // IMPORTANT: Set project and title BEFORE validation
        // For new documents, content.data.data may be undefined, causing validation to fail
        // But we still want to display the title
        if (projectResponse.data?.workspace) {
          setProject(projectResponse.data.workspace);
        }
        setProjectTitle(projectResponse.data?.workspace?.title || '');

        // Validation is now optional - don't throw for new documents
        if (!validation.success) {
          // Don't throw - continue with available data
        }

        // CORRECT: Unwrap content from response (content.data.data)
        const content = projectResponse.data?.workspace?.content?.data?.data;
        if (content) {
          setProjectData(content);
          setUpdatedProjectData(content);
        }

        const metadata = projectResponse.data?.workspace?.metadata?.data as ProjectMetadata;
        if (metadata) {
          // Check for citations at workspace.metadata.data.data.citations (nested data structure)
          const nestedMetadata = (metadata as any)?.data;
          if (nestedMetadata?.citations) {
            setCitations(nestedMetadata.citations);

            // Extract and store citation page numbers and titles from tiptap-doc
            const tiptapCitations = nestedMetadata.citations['tiptap-doc'];
            if (Array.isArray(tiptapCitations) && tiptapCitations.length > 0) {
              const citationItems = tiptapCitations
                .filter((citation: any) => citation.pageNumber !== undefined && citation.title)
                .map((citation: any) => ({
                  pageNumber: citation.pageNumber,
                  title: citation.title,
                }));
              if (citationItems.length > 0) {
                setCitationStore(citationItems);
              }
            }
          } else if (metadata.citations) {
            // Fallback to direct citations if nested structure doesn't exist
            setCitations(metadata.citations);

            const tiptapCitations = metadata.citations['tiptap-doc'];
            if (Array.isArray(tiptapCitations) && tiptapCitations.length > 0) {
              const citationItems = tiptapCitations
                .filter((citation: any) => citation.pageNumber !== undefined && citation.title)
                .map((citation: any) => ({
                  pageNumber: citation.pageNumber,
                  title: citation.title,
                }));
              if (citationItems.length > 0) {
                setCitationStore(citationItems);
              }
            }
          }

          if (projectResponse.data?.workspace.category) {
            setTemplateType(projectResponse.data.workspace.category as DocumentType);
          }
        }

        // Also check the exact path found by the search: workspace.metadata.data.data.citations
        const deepMetadata = (projectResponse.data as any)?.workspace?.metadata?.data?.data;
        if (deepMetadata?.citations?.['tiptap-doc']) {
          const tiptapCitations = deepMetadata.citations['tiptap-doc'];
          if (Array.isArray(tiptapCitations) && tiptapCitations.length > 0) {
            const citationItems = tiptapCitations
              .filter((citation: any) => citation.pageNumber !== undefined && citation.title)
              .map((citation: any) => ({
                pageNumber: citation.pageNumber,
                title: citation.title,
              }));
            if (citationItems.length > 0) {
              setCitationStore(citationItems);
            }
          }
        }

        // Load references from the API response
        const workspaceData = projectResponse.data?.workspace as any;
        if (workspaceData?.references && Array.isArray(workspaceData.references)) {
          setReferences(workspaceData.references);
        }

        await fetchDocuments();
      } catch (error) {
        const errorMessage =
          error instanceof Error ? error.message : 'An unexpected error occurred';
        setError(errorMessage);
      } finally {
        setIsLoading(false);
      }
    },
    [projectId, fetchDocuments, setCitationStore]
  );

  const handleExport = async (options: ExportOptions) => {
    try {
      setIsProjectExporting(true);
      setError(null);

      if (!projectId || !projectData || !options) {
        throw new Error('Project ID or Project Data is required');
      }

      let tags: string[] = [];
      if (templateId) {
        tags = getTemplateTags(templateId);
      }

      const htmlContent = editorJsToHtml(projectData || project?.content.data.data);
      const formatStyle = options.format === 'pdf' ? 1 : 2;
      const filteredMetadata = project?.metadata.data.templateData;

      const exportPayload = {
        title: projectTitle,
        content: htmlContent,
        doc_type: 1,
        metadata: filteredMetadata,
        include_cover: true,
        export_format: formatStyle,
        page_size: options.pageSize || 'A4',
        color_scheme: 4,
        include_page_numbers: true,
        include_toc: false,
      };
      const exportProjectResponse = await projectService.exportProject(exportPayload);

      if (!exportProjectResponse.success) {
        throw new Error(exportProjectResponse.message || 'Failed to export project');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unexpected error occurred';
      setError(errorMessage);
    } finally {
      setIsProjectExporting(false);
    }
  };

  return {
    projectData,
    updatedProjectData,
    setUpdatedProjectData,
    projectTitle,
    setProjectTitle,
    projectDocuments,
    setProjectDocuments,
    isLoading: isLoading || documentsLoading,
    error: error || documentsError,
    updateProjectData,
    refetchDocuments: fetchDocuments,
    templateType,
    handleExport,
    isProjectExporting,
    citations,
    addCitation,
    updateCitation,
    removeCitation,
    getCitationsForBlock,
    getAllCitations,
    saveCitationsToMetadata,
    profile,
    project,
    // References
    references,
    addWorkspaceReference,
    getReferenceById,
    deleteWorkspaceReference,
  };
}
