import { fromZodError } from 'zod-validation-error';
import { authTokensSchema } from '@/lib/validators/auth/response';
import { AuthTokens } from '@/types';
import { z } from 'zod';
import { LOCALE_CONFIG } from '@/lib/constants/admin-dashboard';

// Helper function to validate API responses with proper typing
export const validateApiResponse = <T extends z.ZodTypeAny>(
  response: any,
  schema: T,
  operationName: string
): z.infer<T> => {
  const parsedResponse = schema.safeParse(response.data);
  if (!parsedResponse.success) {
    const validationError = fromZodError(parsedResponse.error);
    throw new Error(`Invalid response format: ${validationError.message}`);
  }
  return parsedResponse.data;
};

// Helper function to validate refresh token response
export const validateRefreshTokenResponse = (response: any): AuthTokens => {
  const parsedResponse = authTokensSchema.safeParse(response.data);
  if (!parsedResponse.success) {
    const validationError = fromZodError(parsedResponse.error);
    throw new Error(`Invalid token response format: ${validationError.message}`);
  }
  return parsedResponse.data;
};

export const truncateText = (text: string, maxLength: number) => {
  if (text.length <= maxLength) {
    return text;
  }
  return text.slice(0, maxLength) + '...';
};

// Helper function to extract text from Editor.js blocks
export const extractTextFromBlock = (block: any): string => {
  if (!block || !block.data) return '';

  switch (block.type) {
    case 'paragraph':
    case 'header':
      return block.data.text || '';
    case 'list':
      return (block.data.items || []).join(' ');
    case 'quote':
      return block.data.text || '';
    case 'warning':
      return `${block.data.title || ''} ${block.data.message || ''}`;
    default:
      return JSON.stringify(block.data);
  }
};

export const debounce = (func: Function, delay: number) => {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: any[]) {
    const context = this;
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(context, args), delay);
  };
};

// Strip HTML tags for spell checking
export const stripHtml = (html: string): string => {
  const tmp = document.createElement('DIV');
  tmp.innerHTML = html;
  return tmp.textContent || tmp.innerText || '';
};

// Helper function to identify if an item is a blog
export const isBlog = (item: any): boolean => {
  return 'status' in item && 'likes' in item && 'views' in item;
};

// Helper function to identify if an item is a project
export const isProject = (item: any): boolean => {
  return 'privacy' in item && 'footerLabel' in item;
};

export function getCurrentTimestamp(): string {
  return new Date().toLocaleString(LOCALE_CONFIG.locale, {
    timeZone: LOCALE_CONFIG.timeZone,
  });
}

//Safely calculates percentage with division by zero protection
export function calculatePercentage(numerator: number, denominator: number): number {
  return denominator > 0 ? Math.round((numerator / denominator) * 100) : 0;
}

export const formatTimeAgo = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInSeconds = Math.floor(diffInMs / 1000);
  const diffInMinutes = Math.floor(diffInMs / 60000);
  const diffInHours = Math.floor(diffInMs / 3600000);
  const diffInDays = Math.floor(diffInMs / 86400000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
  if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
  if (diffInDays === 1) return 'yesterday';
  if (diffInDays < 30) return `${diffInDays} days ago`;

  // For older dates
  return date.toLocaleDateString();
};

export const formatTimeAgoinMins = (dateString: string) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInMs = now.getTime() - date.getTime();
  const diffInMinutes = Math.floor(diffInMs / 60000);

  if (diffInMinutes < 60) {
    return `${diffInMinutes} minutes ago`;
  }

  const hours = Math.floor(diffInMinutes / 60);
  const minutes = diffInMinutes % 60;

  if (minutes === 0) {
    return `${hours} hour${hours > 1 ? 's' : ''} ago`;
  }

  return `${hours} hour${hours > 1 ? 's' : ''} ${minutes} minute${minutes > 1 ? 's' : ''} ago`;
};

export function darken(hex: string, amount = 25) {
  let col = hex.replace('#', '');

  if (col.length === 3) {
    col = col
      .split('')
      .map((c) => c + c)
      .join('');
  }

  const num = parseInt(col, 16);

  let r = Math.max(0, (num >> 16) - amount);
  let g = Math.max(0, ((num >> 8) & 0xff) - amount);
  let b = Math.max(0, (num & 0xff) - amount);

  return '#' + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
}

// Inline text formatting functions
export function applyInlineFormat(format: string) {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const span = document.createElement('span');

  switch (format) {
    case 'bold':
      span.style.fontWeight = 'bold';
      break;
    case 'italic':
      span.style.fontStyle = 'italic';
      break;
    case 'underline':
      span.style.textDecoration = 'underline';
      break;
    case 'strikethrough':
      span.style.textDecoration = 'line-through';
      break;
    case 'superscript':
      span.style.verticalAlign = 'super';
      span.style.fontSize = '0.75em';
      break;
    case 'subscript':
      span.style.verticalAlign = 'sub';
      span.style.fontSize = '0.75em';
      break;
  }

  try {
    range.surroundContents(span);
  } catch (e) {
    const contents = range.extractContents();
    span.appendChild(contents);
    range.insertNode(span);
  }

  // Restore selection
  selection.removeAllRanges();
  selection.addRange(range);
}

export function insertLink() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const url = prompt('Enter URL:');
  if (!url) return;

  const a = document.createElement('a');
  a.href = url;
  a.target = '_blank';
  a.rel = 'noopener noreferrer';

  try {
    range.surroundContents(a);
  } catch (e) {
    const contents = range.extractContents();
    a.appendChild(contents);
    range.insertNode(a);
  }
}

export function createTempAnnotationId(): string {
  return `temp-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export function isTempAnnotationId(id: string): boolean {
  return id.startsWith('temp-');
}

export function removeFormatting() {
  const selection = window.getSelection();
  if (!selection || selection.rangeCount === 0) return;

  const range = selection.getRangeAt(0);
  if (range.collapsed) return;

  const content = range.extractContents();
  const textContent = content.textContent || '';
  const textNode = document.createTextNode(textContent);
  range.insertNode(textNode);
}
