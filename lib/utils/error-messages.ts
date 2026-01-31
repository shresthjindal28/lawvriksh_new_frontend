/**
 * Error message utilities for user-friendly error handling
 * Converts technical errors into human-readable messages
 */

export type ErrorType = 'generic' | 'network' | 'auth' | 'notFound' | 'permission';

export interface ParsedError {
  message: string;
  type: ErrorType;
  canRetry: boolean;
}

/**
 * Converts any error into a user-friendly message
 * Maps technical error codes and messages to clear, actionable descriptions
 */
export function getUserFriendlyError(error: unknown): ParsedError {
  // Handle string errors
  if (typeof error === 'string') {
    return parseErrorMessage(error);
  }

  // Handle Error objects
  if (error instanceof Error) {
    return parseErrorMessage(error.message);
  }

  // Handle response-like objects
  if (isResponseError(error)) {
    const status = error.status ?? error.statusCode ?? 500;
    return parseStatusCode(status, error.message);
  }

  // Default fallback
  return {
    message:
      'An unexpected error occurred. Please try again or contact support if the problem persists.',
    type: 'generic',
    canRetry: true,
  };
}

/**
 * Parse error message string for known patterns
 */
function parseErrorMessage(message: string): ParsedError {
  const lowerMessage = message.toLowerCase();

  // Network errors
  if (
    lowerMessage.includes('network') ||
    lowerMessage.includes('fetch') ||
    lowerMessage.includes('failed to fetch') ||
    lowerMessage.includes('net::') ||
    lowerMessage.includes('econnrefused') ||
    lowerMessage.includes('etimedout')
  ) {
    return {
      message:
        'Unable to connect to the server. Please check your internet connection and try again.',
      type: 'network',
      canRetry: true,
    };
  }

  // Timeout errors
  if (lowerMessage.includes('timeout') || lowerMessage.includes('timed out')) {
    return {
      message: 'The request took too long to complete. Please try again.',
      type: 'network',
      canRetry: true,
    };
  }

  // DMS service errors
  if (
    lowerMessage.includes('failed to communicate with dms') ||
    lowerMessage.includes('dms') ||
    lowerMessage.includes('http_502')
  ) {
    return {
      message: 'Document services are temporarily unavailable. Please try again shortly.',
      type: 'generic',
      canRetry: true,
    };
  }

  // Auth errors from message
  if (
    lowerMessage.includes('401') ||
    lowerMessage.includes('unauthorized') ||
    lowerMessage.includes('unauthenticated')
  ) {
    return {
      message: 'Your session has expired. Please log in again to continue.',
      type: 'auth',
      canRetry: false,
    };
  }

  // Permission errors
  if (
    lowerMessage.includes('403') ||
    lowerMessage.includes('forbidden') ||
    lowerMessage.includes('permission denied') ||
    lowerMessage.includes('access denied')
  ) {
    return {
      message:
        "You don't have permission to perform this action. Contact your administrator if you believe this is an error.",
      type: 'permission',
      canRetry: false,
    };
  }

  // Not found
  if (lowerMessage.includes('404') || lowerMessage.includes('not found')) {
    return {
      message: 'The requested resource could not be found. It may have been moved or deleted.',
      type: 'notFound',
      canRetry: false,
    };
  }

  // Server errors
  if (
    lowerMessage.includes('500') ||
    lowerMessage.includes('502') ||
    lowerMessage.includes('503') ||
    lowerMessage.includes('504') ||
    lowerMessage.includes('server error') ||
    lowerMessage.includes('internal error')
  ) {
    return {
      message: 'Our servers are experiencing issues. Please try again in a moment.',
      type: 'generic',
      canRetry: true,
    };
  }

  // Validation errors (be more specific if message contains useful info)
  if (lowerMessage.includes('validation') || lowerMessage.includes('invalid')) {
    return {
      message:
        message.length < 200
          ? message
          : 'The provided information is invalid. Please check your input and try again.',
      type: 'generic',
      canRetry: false,
    };
  }

  // Default: use the original message if it's reasonable length, otherwise generic
  return {
    message:
      message.length < 200 && !containsTechnicalDetails(message)
        ? message
        : 'An unexpected error occurred. Please try again or contact support.',
    type: 'generic',
    canRetry: true,
  };
}

/**
 * Parse HTTP status codes
 */
function parseStatusCode(status: number, fallbackMessage?: string): ParsedError {
  switch (status) {
    case 400:
      return {
        message:
          fallbackMessage || 'The request was invalid. Please check your input and try again.',
        type: 'generic',
        canRetry: false,
      };
    case 401:
      return {
        message: 'Your session has expired. Please log in again to continue.',
        type: 'auth',
        canRetry: false,
      };
    case 403:
      return {
        message: "You don't have permission to perform this action.",
        type: 'permission',
        canRetry: false,
      };
    case 404:
      return {
        message: 'The requested resource could not be found.',
        type: 'notFound',
        canRetry: false,
      };
    case 408:
      return {
        message: 'The request took too long. Please try again.',
        type: 'network',
        canRetry: true,
      };
    case 429:
      return {
        message: 'Too many requests. Please wait a moment and try again.',
        type: 'generic',
        canRetry: true,
      };
    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'Our servers are experiencing issues. Please try again in a moment.',
        type: 'generic',
        canRetry: true,
      };
    default:
      return {
        message: fallbackMessage || 'An unexpected error occurred. Please try again.',
        type: 'generic',
        canRetry: true,
      };
  }
}

/**
 * Check if error object has status properties
 */
function isResponseError(
  error: unknown
): error is { status?: number; statusCode?: number; message?: string } {
  return (
    typeof error === 'object' && error !== null && ('status' in error || 'statusCode' in error)
  );
}

/**
 * Check if message contains technical details that shouldn't be shown to users
 */
function containsTechnicalDetails(message: string): boolean {
  const technicalPatterns = [
    /at\s+\w+\s*\(/i, // Stack trace patterns
    /\.tsx?:\d+/i, // File:line references
    /error\s+code:/i, // Error codes
    /undefined\s+is\s+not/i, // JavaScript errors
    /cannot\s+read\s+property/i,
    /null\s+reference/i,
    /\{.*"error".*\}/, // JSON error objects
    /module\s+not\s+found/i,
    /syntax\s+error/i,
  ];

  return technicalPatterns.some((pattern) => pattern.test(message));
}

/**
 * Get a short error title based on error type
 */
export function getErrorTitle(type: ErrorType): string {
  const titles: Record<ErrorType, string> = {
    generic: 'Something went wrong',
    network: 'Connection problem',
    auth: 'Session expired',
    notFound: 'Not found',
    permission: 'Access denied',
  };
  return titles[type];
}
