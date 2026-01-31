'use client';

import React, { createContext, useContext, useState, useMemo, useCallback, ReactNode } from 'react';
import { useRouter } from 'next/navigation';

import { workspaceService } from '@/lib/api/workSpaceService';
import projectService from '@/lib/api/projectService';
import {
  CreateProjectRequest,
  createProjectRequestSchema,
  createProjectResponseSchema,
  fetchStudentProjectsSchema,
} from '@/lib/validators/project/project.schemas';
import { ProjectType } from '@/lib/constants/document-upload';
import { useToast } from './ToastContext';
import { StudentProjectFormData } from '@/components/ui/StudentDialog';
import { getTemplateByCategory } from '@/lib/config/templateConfig';
import { WorkspaceProject } from '@/types/workspace';
import { SearchProject, Template } from '@/types/project';
import { conversionService } from '@/lib/api/ConversionService';

interface WorkspaceContextType {
  // State
  studentProjects: WorkspaceProject[] | null;
  searchedProjects: SearchProject[] | null;
  trashedProjects: WorkspaceProject[] | null;
  isLoading: boolean;
  error: string | null;

  // Actions
  createStudentProject: (data: StudentProjectFormData) => Promise<void>;
  fetchStudentProjects: () => Promise<void>;
  searchStudentProject: (query: string) => Promise<void>;
  deleteProject: (projectId: string, permanent?: boolean) => Promise<void>;
  fetchTrashedProjects: () => Promise<void>;
  restoreProject: (projectId: string) => Promise<void>;
  createProject: (data: CreateProjectRequest) => Promise<void>;
  updateWorkspace: (
    workspaceId: string,
    data: { title?: string; access_type?: string }
  ) => Promise<string>;

  isCreating: boolean;

  isConverting: boolean;
  conversionProgress: Record<string, number>;
  conversionResults: Record<string, Template>; // Changed to Template type
  convertFile: (file: File, userId: string) => Promise<Template | null>;
  convertFiles: (files: File[], userId: string, batchId: string) => Promise<Template[] | null>;
  clearConversionResults: () => void;
}

enum Privacy {
  PRIVATE = 'PRIVATE',
  PUBLIC = 'PUBLIC',
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: ReactNode }) {
  const [studentProjects, setStudentProjects] = useState<WorkspaceProject[] | null>(null);
  const [searchedProjects, setSearchedProjects] = useState<SearchProject[] | null>(null);
  const [trashedProjects, setTrashedProjects] = useState<WorkspaceProject[] | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [isCreating, setIsCreating] = useState(false);
  const [isDeleting, setisDeleting] = useState(false);

  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState<Record<string, number>>({});
  const [conversionResults, setConversionResults] = useState<Record<string, Template>>({});

  const router = useRouter();
  const { addToast } = useToast();

  const convertFile = useCallback(
    async (file: File, userId: string): Promise<Template | null> => {
      setIsConverting(true);
      setConversionProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        // Extract text from PDF/DOC using extract-text API
        addToast('Extracting text from document...', 'info');
        const extractResponse = await conversionService.extractText(file);

        if (!extractResponse.success || !extractResponse.data?.text) {
          throw new Error(extractResponse.message || 'Failed to extract text from document');
        }

        // The API now returns HTML formatted content directly
        const rawHtmlContent = extractResponse.data.text;
        console.log(`📄 Extracted ${extractResponse.data.total_pages} pages from ${file.name}`);

        // Get file name without extension for the title
        const fileName = file.name.replace(/\.[^/.]+$/, '');

        /**
         * Parse HTML and convert font-size based spans to semantic HTML tags.
         * Font size thresholds:
         * - >= 24px: h1 (main title)
         * - >= 16px: h2 (section heading)
         * - >= 14px: h3 (subsection heading)
         * - < 14px: p (normal paragraph text)
         * - 10px: page numbers (filter out)
         *
         * Also merges consecutive paragraphs with the same font size into single paragraphs.
         */
        const parseHtmlToSemantic = (html: string): string => {
          // Remove DOCTYPE, html, head, body wrappers
          let content = html
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '')
            .replace(/<\/html>/gi, '')
            .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '')
            .replace(/<\/body>/gi, '')
            .trim();

          // Remove page divs but keep content
          content = content.replace(/<div class="page"[^>]*>/gi, '').replace(/<\/div>/gi, '');

          // Remove "Page X" h2 headers
          content = content.replace(/<h2[^>]*>Page \d+<\/h2>/gi, '');

          // Process each paragraph to extract text and determine heading level
          const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;

          // Collect all parsed items with their tag type and text
          interface ParsedItem {
            tag: string;
            text: string;
            fontSize: number;
          }
          const parsedItems: ParsedItem[] = [];

          let match;
          while ((match = paragraphRegex.exec(content)) !== null) {
            const pContent = match[1];

            // Extract all spans with their font sizes and text
            const spanRegex =
              /<span[^>]*style="[^"]*font-size:\s*(\d+)px[^"]*"[^>]*>([^<]*)<\/span>/gi;
            let spanMatch;
            let maxFontSize = 0;
            let textParts: string[] = [];
            let hasPageNumber = false;

            while ((spanMatch = spanRegex.exec(pContent)) !== null) {
              const fontSize = parseInt(spanMatch[1], 10);
              const text = spanMatch[2].trim();

              // Skip page number indicators (10px font or "Page X" text)
              if (fontSize <= 10 || /^Page \d+$/i.test(text)) {
                hasPageNumber = true;
                continue;
              }

              if (text) {
                textParts.push(text);
                if (fontSize > maxFontSize) {
                  maxFontSize = fontSize;
                }
              }
            }

            // Skip if this paragraph only contained page numbers
            if (hasPageNumber && textParts.length === 0) {
              continue;
            }

            // If no spans found, try to get plain text content
            if (textParts.length === 0) {
              const plainText = pContent.replace(/<[^>]*>/g, '').trim();
              if (plainText && !/^Page \d+$/i.test(plainText)) {
                textParts.push(plainText);
                maxFontSize = 11; // Default to paragraph size
              }
            }

            if (textParts.length === 0) continue;

            const combinedText = textParts.join(' ').trim();
            if (!combinedText) continue;

            // Skip metadata lines like "author:" and "subject:"
            if (/^(author|subject):\s*/i.test(combinedText)) {
              continue;
            }

            // Determine the semantic tag based on font size
            let tag = 'p';
            if (maxFontSize >= 24) {
              tag = 'h1';
            } else if (maxFontSize >= 16) {
              tag = 'h2';
            } else if (maxFontSize >= 14) {
              tag = 'h3';
            }

            parsedItems.push({ tag, text: combinedText, fontSize: maxFontSize });
          }

          // Smart merge: only merge consecutive paragraph lines that are part of the same sentence
          // A line is a continuation if the previous line doesn't end with sentence-ending punctuation
          const mergedItems: ParsedItem[] = [];
          for (let i = 0; i < parsedItems.length; i++) {
            const current = parsedItems[i];

            if (mergedItems.length > 0 && current.tag === 'p') {
              const prev = mergedItems[mergedItems.length - 1];

              // Check if previous item is also a paragraph and doesn't end a sentence
              // Sentence ends with: . ! ? or ends with .) or ." etc.
              const prevText = prev.text.trim();
              const endsWithSentence = /[.!?][\)"'\s]*$/.test(prevText);

              // Also check if current line looks like a new paragraph start
              // (starts with number like "1." or starts with capital after previous ended with period)
              const startsNewParagraph =
                /^\d+\.\s/.test(current.text) || // Numbered list item
                /^[A-Z]{2,}/.test(current.text) || // All caps word (likely heading)
                /^(WHEREAS|NOW|IN WITNESS|ARTICLE|SECTION)/i.test(current.text); // Legal terms

              if (prev.tag === 'p' && !endsWithSentence && !startsNewParagraph) {
                // Merge: this is a continuation of the previous line
                prev.text += ' ' + current.text;
                continue;
              }
            }

            // Don't merge: add as new item
            mergedItems.push({ ...current });
          }

          // Generate HTML from merged items - join without extra newlines to prevent spacing issues
          const result = mergedItems.map((item) => `<${item.tag}>${item.text}</${item.tag}>`);

          return result.join('');
        };

        // Parse the HTML content to semantic tags
        let htmlContent = parseHtmlToSemantic(rawHtmlContent);

        // If parsing resulted in empty content, provide a fallback
        if (!htmlContent.trim()) {
          // Fallback: just strip all HTML tags and wrap in paragraphs
          const plainText = rawHtmlContent
            .replace(/<[^>]*>/g, ' ')
            .replace(/\s+/g, ' ')
            .trim();
          htmlContent = plainText ? `<p>${plainText}</p>` : '';
        }

        // Note: We don't add the filename as title since the PDF content already has its own title

        // Create template with HTML content for saving
        const templateId = `tmpl_import_${fileName}_${Date.now()}`;
        const editorTemplate: Template = {
          templateId,
          title: fileName,
          category: 'article',
          tags: ['imported', 'extracted'],
          content: {
            time: Date.now(),
            blocks: [
              {
                id: 'draft-content',
                type: 'paragraph',
                data: {
                  text: htmlContent, // Store HTML directly
                },
              },
            ],
            version: '2.0',
          },
          // Add htmlContent as separate property for easy access
          htmlContent,
        } as Template & { htmlContent: string };

        setConversionResults((prev) => ({
          ...prev,
          [file.name]: editorTemplate,
        }));

        addToast(`Successfully extracted text from ${file.name}`, 'success');
        return editorTemplate;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Extraction failed';
        addToast(`Failed to extract text from ${file.name}: ${errorMessage}`, 'error');
        console.error('Extraction error:', error);
        return null;
      } finally {
        setIsConverting(false);
        setConversionProgress((prev) => {
          const updated = { ...prev };
          delete updated[file.name];
          return updated;
        });
      }
    },
    [addToast]
  );

  const convertFiles = useCallback(
    async (files: File[], userId: string, batchId: string): Promise<Template[] | null> => {
      setIsConverting(true);
      try {
        // Use convertFile for each file (which uses extractText API)
        const conversions = await Promise.all(files.map((file) => convertFile(file, userId)));

        const convertedTemplates = conversions.filter(
          (template): template is Template => template !== null
        );

        addToast(
          `Extracted text from ${convertedTemplates.length} of ${files.length} files`,
          convertedTemplates.length > 0 ? 'success' : 'error'
        );

        return convertedTemplates.length > 0 ? convertedTemplates : null;
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Batch extraction failed';
        addToast(`Batch extraction failed: ${errorMessage}`, 'error');
        console.error('Batch extraction error:', error);
        return null;
      } finally {
        setIsConverting(false);
      }
    },
    [addToast, convertFile]
  );

  const clearConversionResults = useCallback(() => {
    setConversionResults({});
    setConversionProgress({});
  }, []);

  const fetchStudentProjects = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await workspaceService.getWorkspace(1, 100);

      // Handle case where workspaces is undefined/null (no projects)
      if (response.success && response.data) {
        // If workspaces is undefined/null, treat as empty array
        const workspaces = response.data.workspaces || [];

        const validatedData = fetchStudentProjectsSchema.safeParse({
          ...response.data,
          workspaces,
        });
        if (!validatedData.success) {
          throw new Error(validatedData.error.message);
        }

        const normalizedProjects = workspaces.map((project) => {
          if (project.metadata?.data?.data) {
            return {
              ...project,
              metadata: {
                data: project.metadata.data.data,
              },
            };
          }
          return project;
        });
        setStudentProjects(normalizedProjects);
      }
    } catch (err) {
      if (err instanceof Error) {
        setError(err.message || 'Failed to fetch blogs.');
      } else {
        setError('Failed to fetch blogs.');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteProject = useCallback(
    async (projectId: string, permanent: boolean = false) => {
      try {
        if (!projectId) return;

        const response = await projectService.deleteProject(projectId, permanent);
        if (response.success) {
          if (permanent) {
            addToast('Project Permanently Deleted', 'success');
            setTrashedProjects((prev) => (prev ? prev.filter((p) => p.id !== projectId) : null));
          } else {
            addToast('Project Moved to Trash', 'success');
            fetchStudentProjects();
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to delete the Project');
        addToast('Unable to delete the Project', 'error');
      } finally {
        setisDeleting(false);
      }
    },
    [addToast, fetchStudentProjects]
  );

  const fetchTrashedProjects = useCallback(async () => {
    try {
      setIsLoading(true);
      setError(null);
      const response = await projectService.getTrashedProjects(1, 100); // Fetch all trashed items
      if (response.success && response.data && response.data.workspaces) {
        setTrashedProjects(response.data.workspaces);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to fetch trashed projects');
      addToast('Unable to fetch trashed projects', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [addToast]);

  const restoreProject = useCallback(
    async (projectId: string) => {
      try {
        if (!projectId) return;

        const response = await projectService.restoreProject(projectId);
        if (response.success) {
          addToast('Project Restored Successfully', 'success');

          setTrashedProjects((prev) => (prev ? prev.filter((p) => p.id !== projectId) : null));

          await fetchStudentProjects();
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to restore the Project');
        addToast('Unable to restore the Project', 'error');
      }
    },
    [addToast, fetchStudentProjects]
  );

  const searchStudentProject = useCallback(
    async (query: string) => {
      try {
        // If query is empty, clear results
        if (!query || query.trim() === '') {
          setSearchedProjects([]);
          setError(null);
          setIsLoading(false);
          return;
        }

        setIsLoading(true);
        setError(null);

        // For now, use only client-side search to ensure functionality
        if (studentProjects && Array.isArray(studentProjects)) {
          const filteredResults = studentProjects.filter(
            (project) => project.title && project.title.toLowerCase().includes(query.toLowerCase())
          );

          // Convert to SearchProject format
          const searchResults = filteredResults.map((project) => ({
            id: project.id,
            title: project.title,
            category: project.category || 'ideation',
            metadata: { data: project.metadata?.data || {} },
            content: { data: project.content?.data || {} },
            access_type: project.access_type || 'PRIVATE',
            updated_at: project.updated_at,
          }));

          setSearchedProjects(searchResults);
        } else {
          setSearchedProjects([]);
        }
      } catch (error) {
        setError(error instanceof Error ? error.message : 'Unable to search the Project');
        setSearchedProjects([]);
      } finally {
        setIsLoading(false);
      }
    },
    [studentProjects]
  );

  const createStudentProject = useCallback(
    async (data: StudentProjectFormData) => {
      setIsCreating(true);
      setError(null);

      try {
        // Handle scratch creation
        if (data.type === 'scratch') {
          const requestData: CreateProjectRequest = {
            title: data.name,
            category: data.category || 'ideation',
            access_type: Privacy.PRIVATE,
            metadata: {
              description: 'Scratch',
            },
          };

          const validatedData = createProjectRequestSchema.safeParse(requestData);

          if (!validatedData.success) {
            throw new Error(validatedData.error.message);
          }

          const response = await projectService.createProject(validatedData.data);
          const validateResponse = createProjectResponseSchema.safeParse(response.data);
          if (!validateResponse.success) {
            throw new Error(validateResponse.error.message);
          }

          if (response.success && response.data && response.data?.workspace) {
            const projectId = response.data.workspace.id;
            if (projectId) {
              addToast('Document created successfully!', 'success');
              router.push(`/writing-section/${projectId}?new=true`);
            } else {
              throw new Error('Project ID not returned from server');
            }
          } else {
            throw new Error(response.message || 'Failed to create document');
          }
          return;
        }

        // Handle template creation
        if (data.type === 'template' && data.documentType) {
          const template = getTemplateByCategory(data.documentType);

          const requestData: CreateProjectRequest = {
            title: data.name,
            category: data.documentType,
            access_type: Privacy.PRIVATE,
            // Save template content only in content field
            content: template?.content
              ? {
                  data: { data: template.content },
                }
              : undefined,
            metadata: {
              data: {
                type: ProjectType.TEMPLATE,
                templateId: template?.templateId,
                category: template?.category,
              },
            },
          };

          const validatedData = createProjectRequestSchema.safeParse(requestData);
          if (!validatedData.success) {
            throw new Error(validatedData.error.message);
          }

          const response = await projectService.createProject(validatedData.data);
          const validateResponse = createProjectResponseSchema.safeParse(response.data);
          if (!validateResponse.success) {
            throw new Error(validateResponse.error.message);
          }

          if (response.success && response.data && response.data?.workspace) {
            const projectId = response.data.workspace.id;
            const templateId = response.data.workspace.metadata?.data.templateId;

            if (projectId) {
              const url = templateId
                ? `/writing-section/${projectId}?templateId=${templateId}&new=true`
                : `/writing-section/${projectId}?new=true`;

              addToast('Document created successfully!', 'success');
              router.push(url);
            } else {
              throw new Error('Project ID not returned from server');
            }
          } else {
            throw new Error(response.message || 'Failed to create document');
          }
          return;
        }

        // Handle file upload with text extraction
        if (data.type === 'upload' && data.files.length > 0) {
          setIsConverting(true);
          try {
            addToast('Extracting text from document...', 'info');

            // Extract text from files
            const conversions = await Promise.all(
              data.files.map((file) => convertFile(file, 'user-' + Date.now()))
            );

            const validConversions = conversions.filter(
              (template): template is Template => template !== null
            );

            if (validConversions.length === 0) {
              throw new Error('No files could be converted successfully');
            }

            // Use the first converted template
            const convertedTemplate = validConversions[0] as Template & { htmlContent?: string };

            // Get HTML content (from htmlContent property or first block)
            const htmlContent =
              convertedTemplate.htmlContent ||
              convertedTemplate.content?.blocks?.[0]?.data?.text ||
              '';

            const requestData: CreateProjectRequest = {
              title: data.name,
              category: data.category,
              access_type: Privacy.PRIVATE,
              // Store content with HTML for TipTap
              content: {
                data: {
                  data: {
                    time: Date.now(),
                    blocks: [
                      {
                        id: 'draft-content',
                        type: 'paragraph',
                        data: {
                          text: htmlContent,
                          json: null,
                        },
                      },
                    ],
                    version: '2.0',
                  },
                },
              },
              metadata: {
                data: {
                  type: ProjectType.TEMPLATE,
                  templateId: convertedTemplate.templateId,
                  category: convertedTemplate.category,
                },
              },
            };

            const validatedData = createProjectRequestSchema.safeParse(requestData);
            if (!validatedData.success) {
              throw new Error(validatedData.error.message);
            }

            const response = await projectService.createProject(validatedData.data);
            const validateResponse = createProjectResponseSchema.safeParse(response.data);
            if (!validateResponse.success) {
              throw new Error(validateResponse.error.message);
            }

            if (response.success && response.data?.workspace) {
              const projectId = response.data.workspace.id;
              addToast('Your document has been converted and created!', 'success');
              router.push(`/writing-section/${projectId}?templateId=custom-template&new=true`);
            } else {
              throw new Error('Failed to create project from converted template');
            }
          } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Failed to convert document';
            setError(errorMsg);
            addToast(errorMsg, 'error');
            console.error('Upload conversion error:', err);
            throw err;
          } finally {
            setIsConverting(false);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to create document';

        setError(errorMessage);
        addToast(errorMessage, 'error');
        console.error('Create project error:', error);
        throw error;
      } finally {
        setIsCreating(false);
      }
    },
    [router, addToast, convertFile]
  );

  const updateWorkspace = useCallback(
    async (workspaceId: string, data: { title?: string; access_type?: string }) => {
      try {
        const response = await projectService.updateWorkspace(workspaceId, data);

        if (response.success) {
          // Update the local state to reflect the changes
          setStudentProjects((prev) =>
            prev
              ? prev.map((project) =>
                  project.id === workspaceId
                    ? {
                        ...project,
                        ...data,
                        access_type: (data.access_type as any) || project.access_type,
                      }
                    : project
                )
              : null
          );

          addToast('Project updated successfully', 'success');
          return response.data || '';
        } else {
          throw new Error('Failed to update project');
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Failed to update project';
        addToast(errorMessage, 'error');
        throw error;
      }
    },
    [addToast]
  );

  const createProject = useCallback(
    async (data: CreateProjectRequest) => {
      // Convert CreateProjectRequest to StudentProjectFormData
      const studentProjectData: StudentProjectFormData = {
        name: data.title,
        type: 'scratch',
        category: data.category,
        files: [],
      };

      await createStudentProject(studentProjectData);
    },
    [createStudentProject]
  );

  const value = useMemo(() => {
    return {
      studentProjects,
      searchedProjects,
      trashedProjects,
      isLoading,
      error,
      createStudentProject,
      fetchStudentProjects,
      searchStudentProject,
      deleteProject,
      fetchTrashedProjects,
      restoreProject,
      createProject,
      updateWorkspace,
      isCreating,
      isDeleting,
      isConverting,
      conversionProgress,
      conversionResults,
      convertFile,
      convertFiles,
      clearConversionResults,
    };
  }, [
    clearConversionResults,
    convertFile,
    convertFiles,
    conversionProgress,
    conversionResults,
    createProject,
    createStudentProject,
    deleteProject,
    error,
    fetchStudentProjects,
    fetchTrashedProjects,
    isConverting,
    isCreating,
    isDeleting,
    isLoading,
    restoreProject,
    searchedProjects,
    searchStudentProject,
    studentProjects,
    trashedProjects,
    updateWorkspace,
  ]);

  return <WorkspaceContext.Provider value={value}>{children}</WorkspaceContext.Provider>;
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
