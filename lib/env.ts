import { z } from 'zod';

const envSchema = z.object({
  NEXT_PUBLIC_SENTRY_DSN: z.string().optional(),
  SENTRY_AUTH_TOKEN: z.string().optional(),
  NEXT_PUBLIC_API_BASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_WS_URL_GRAMMER_SPELL: z.string().url().optional(),
  NEXT_PUBLIC_TASK_WS_URL: z.string().url().optional(),
  NEXT_PUBLIC_TIPTAP_APP_ID: z.string().optional(),
  NEXT_PUBLIC_TIPTAP_PRO_TOKEN: z.string().optional(),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables', parsed.error.flatten().fieldErrors);
  process.exit(1);
}

export const env = parsed.data;
