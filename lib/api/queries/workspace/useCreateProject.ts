import { useMutation, useQueryClient } from '@tanstack/react-query';
import projectService from '@/lib/api/projectService';
import { workspaceKeys } from './keys';
import { WorkspaceProject } from '@/types/workspace';
import type { StudentProjectFormData } from '@/components/ui/StudentDialog';
import { useEffect, useRef } from 'react';
import {
  createProjectRequestSchema,
  createProjectResponseSchema,
} from '@/lib/validators/project/project.schemas';
import { Privacy } from '@/types/workspace';
import type { CreateProjectResponse } from '@/types/project';
import { ProjectType } from '@/types/project';
import { getTemplateByCategory } from '@/lib/config/templateConfig';
import { conversionService } from '@/lib/api/ConversionService';
import { useRouter } from 'next/navigation';
import { useToast } from '@/lib/contexts/ToastContext';

/**
 * ✅ TanStack Query mutation to replace WorkspaceContext.createStudentProject
 *
 * Creates a new project with optimistic updates for instant UI feedback.
 * Automatically invalidates project list cache on success.
 *
 * @returns TanStack Query mutation object
 */
export function useCreateProject() {
  const queryClient = useQueryClient();
  const router = useRouter();
  const { addToast } = useToast();
  const abortControllerRef = useRef<AbortController | null>(null);
  const runIdRef = useRef(0);
  const activeRunIdRef = useRef(0);

  useEffect(() => {
    return () => {
      abortControllerRef.current?.abort();
    };
  }, []);

  return useMutation<CreateProjectResponse, Error, StudentProjectFormData>({
    mutationFn: async (data) => {
      abortControllerRef.current?.abort();
      const controller = new AbortController();
      abortControllerRef.current = controller;
      const signal = controller.signal;
      const runId = ++runIdRef.current;
      activeRunIdRef.current = runId;
      const isActive = () => activeRunIdRef.current === runId && !signal.aborted;

      if (data.type === 'scratch') {
        const requestData = {
          title: data.name,
          category: data.category || 'ideation',
          access_type: Privacy.PRIVATE,
          metadata: { description: 'Scratch' },
        };

        const validatedData = createProjectRequestSchema.safeParse(requestData);
        if (!validatedData.success) {
          throw new Error(validatedData.error.message);
        }

        const response = await projectService.createProject(validatedData.data, { signal });
        const validateResponse = createProjectResponseSchema.safeParse(response.data);
        if (!validateResponse.success) {
          throw new Error(validateResponse.error.message);
        }

        if (!response.success || !response.data || !response.data.workspace?.id) {
          throw new Error(response.message || 'Failed to create document');
        }

        const responseData = response.data;
        if (isActive()) {
          addToast('Document created successfully!', 'success');
          router.push(`/writing-section/${responseData.workspace.id}?new=true`);
        }
        return responseData;
      }

      if (data.type === 'template' && data.documentType) {
        const template = getTemplateByCategory(data.documentType);

        const requestData = {
          title: data.name,
          category: data.documentType,
          access_type: Privacy.PRIVATE,
          content: template?.content ? { data: { data: template.content } } : undefined,
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

        const response = await projectService.createProject(validatedData.data, { signal });
        const validateResponse = createProjectResponseSchema.safeParse(response.data);
        if (!validateResponse.success) {
          throw new Error(validateResponse.error.message);
        }

        if (!response.success || !response.data || !response.data.workspace?.id) {
          throw new Error(response.message || 'Failed to create document');
        }

        const responseData = response.data;
        const projectId = responseData.workspace.id;
        const templateId = responseData.workspace.metadata?.data?.templateId;
        const url = templateId
          ? `/writing-section/${projectId}?templateId=${templateId}&new=true`
          : `/writing-section/${projectId}?new=true`;

        if (isActive()) {
          addToast('Document created successfully!', 'success');
          router.push(url);
        }
        return responseData;
      }

      if (data.type === 'upload' && data.files.length > 0) {
        const parseHtmlToSemantic = (html: string): string => {
          let content = html
            .replace(/<!DOCTYPE[^>]*>/gi, '')
            .replace(/<html[^>]*>/gi, '')
            .replace(/<\/html>/gi, '')
            .replace(/<head[^>]*>[\s\S]*?<\/head>/gi, '')
            .replace(/<body[^>]*>/gi, '')
            .replace(/<\/body>/gi, '')
            .trim();

          content = content.replace(/<div class="page"[^>]*>/gi, '').replace(/<\/div>/gi, '');
          content = content.replace(/<h2[^>]*>Page \d+<\/h2>/gi, '');

          const paragraphRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;

          interface ParsedItem {
            tag: string;
            text: string;
            fontSize: number;
          }

          const parsedItems: ParsedItem[] = [];

          let match: RegExpExecArray | null;
          while ((match = paragraphRegex.exec(content)) !== null) {
            const pContent = match[1];

            const spanRegex =
              /<span[^>]*style="[^"]*font-size:\s*(\d+)px[^"]*"[^>]*>([^<]*)<\/span>/gi;

            let spanMatch: RegExpExecArray | null;
            let maxFontSize = 0;
            const textParts: string[] = [];
            let hasPageNumber = false;

            while ((spanMatch = spanRegex.exec(pContent)) !== null) {
              const fontSize = parseInt(spanMatch[1], 10);
              const text = spanMatch[2].trim();

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

            if (hasPageNumber && textParts.length === 0) {
              continue;
            }

            if (textParts.length === 0) {
              const plainText = pContent.replace(/<[^>]*>/g, '').trim();
              if (plainText && !/^Page \d+$/i.test(plainText)) {
                textParts.push(plainText);
                maxFontSize = 11;
              }
            }

            if (textParts.length === 0) continue;

            const combinedText = textParts.join(' ').trim();
            if (!combinedText) continue;

            if (/^(author|subject):\s*/i.test(combinedText)) {
              continue;
            }

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

          const mergedItems: ParsedItem[] = [];
          for (let i = 0; i < parsedItems.length; i++) {
            const current = parsedItems[i];

            if (mergedItems.length > 0 && current.tag === 'p') {
              const prev = mergedItems[mergedItems.length - 1];
              const prevText = prev.text.trim();
              const endsWithSentence = /[.!?][\)"'\s]*$/.test(prevText);

              const startsNewParagraph =
                /^\d+\.\s/.test(current.text) ||
                /^[A-Z]{2,}/.test(current.text) ||
                /^(WHEREAS|NOW|IN WITNESS|ARTICLE|SECTION)/i.test(current.text);

              if (prev.tag === 'p' && !endsWithSentence && !startsNewParagraph) {
                prev.text += ' ' + current.text;
                continue;
              }
            }

            mergedItems.push({ ...current });
          }

          const result = mergedItems.map((item) => `<${item.tag}>${item.text}</${item.tag}>`);
          return result.join('');
        };

        if (isActive()) {
          addToast('Extracting text from document...', 'info');
        }

        const htmlConversions = await Promise.all(
          data.files.map(async (file) => {
            try {
              if (!isActive()) return null;

              const extractResponse = await conversionService.extractText(file, { signal });
              if (!extractResponse.success || !extractResponse.data?.text) {
                throw new Error(extractResponse.message || 'Failed to extract text from document');
              }

              const rawHtmlContent = extractResponse.data.text;
              let htmlContent = parseHtmlToSemantic(rawHtmlContent);

              if (!htmlContent.trim()) {
                const plainText = rawHtmlContent
                  .replace(/<[^>]*>/g, ' ')
                  .replace(/\s+/g, ' ')
                  .trim();
                htmlContent = plainText ? `<p>${plainText}</p>` : '';
              }

              if (isActive()) {
                addToast(`Successfully extracted text from ${file.name}`, 'success');
              }
              return htmlContent;
            } catch (error) {
              if (!isActive()) return null;
              if (error instanceof DOMException && error.name === 'AbortError') return null;
              if (error instanceof Error && error.name === 'AbortError') return null;

              const message = error instanceof Error ? error.message : 'Extraction failed';
              addToast(`Failed to extract text from ${file.name}: ${message}`, 'error');
              return null;
            }
          })
        );

        if (!isActive()) {
          throw new DOMException('Aborted', 'AbortError');
        }

        const htmlContent =
          htmlConversions.find((v) => typeof v === 'string' && v.length > 0) ?? '';

        if (!htmlContent) {
          throw new Error('No files could be converted successfully');
        }

        const requestData = {
          title: data.name,
          category: data.category,
          access_type: Privacy.PRIVATE,
          content: {
            data: {
              data: {
                time: Date.now(),
                blocks: [
                  {
                    id: 'draft-content',
                    type: 'paragraph',
                    data: { text: htmlContent, json: null },
                  },
                ],
                version: '2.0',
              },
            },
          },
          metadata: {
            data: {
              type: ProjectType.TEMPLATE,
              templateId: 'custom-template',
              category: data.category,
            },
          },
        };

        const validatedData = createProjectRequestSchema.safeParse(requestData);
        if (!validatedData.success) {
          throw new Error(validatedData.error.message);
        }

        const response = await projectService.createProject(validatedData.data, { signal });
        const validateResponse = createProjectResponseSchema.safeParse(response.data);
        if (!validateResponse.success) {
          throw new Error(validateResponse.error.message);
        }

        if (!response.success || !response.data || !response.data.workspace?.id) {
          throw new Error(response.message || 'Failed to create project from converted template');
        }

        const responseData = response.data;
        const projectId = responseData.workspace.id;
        if (isActive()) {
          addToast('Your document has been converted and created!', 'success');
          router.push(`/writing-section/${projectId}?templateId=custom-template&new=true`);
        }
        return responseData;
      }

      throw new Error('Unsupported project creation request');
    },
    onSuccess: (data) => {
      // Invalidate projects list to trigger refetch
      queryClient.invalidateQueries({
        queryKey: workspaceKeys.projects(),
      });

      // Optionally: Optimistically add new project to cache
      // This provides instant UI feedback before refetch completes
      const newProject = data.workspace;
      if (newProject) {
        queryClient.setQueryData<WorkspaceProject[]>(workspaceKeys.projectsList(1, 100), (old) => {
          if (!old) return [newProject];
          return [newProject, ...old];
        });
      }
    },
    onError: (error) => {
      if (error instanceof DOMException && error.name === 'AbortError') return;
      if (error instanceof Error && error.name === 'AbortError') return;
      console.error('Failed to create project:', error);
      // Error handling is done in the component via mutation.error
    },
  });
}
