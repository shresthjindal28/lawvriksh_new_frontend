import { z } from 'zod';
import { Privacy } from '@/types/workspace';

export const PrivacyEnum = z.enum([Privacy.PRIVATE, Privacy.PUBLIC, Privacy.SHARED]);

export const projectCardSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    privacy: PrivacyEnum,
    footerLabel: z.string(),
  })
);

export const blogCardSchema = z.array(
  z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    likes: z.number(),
    views: z.string(),
  })
);

export type ProjectCard = z.infer<typeof projectCardSchema>;
export type BlogCard = z.infer<typeof blogCardSchema>;
