import { toast } from "sonner";
import { analytics } from "./analytics";

export interface AppError extends Error {
  code?: string;
  statusCode?: number;
  retryable?: boolean;
}

export class ApiError extends Error implements AppError {
  code: string;
  statusCode: number;
  retryable: boolean;

  constructor(message: string, code: string = 'API_ERROR', statusCode: number = 500, retryable: boolean = false) {
    super(message);
    this.name = 'ApiError';
    this.code = code;
    this.statusCode = statusCode;
    this.retryable = retryable;
  }
}

export class ValidationError extends Error implements AppError {
  code = 'VALIDATION_ERROR';
  statusCode = 400;
  retryable = false;

  constructor(message: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class NetworkError extends Error implements AppError {
  code = 'NETWORK_ERROR';
  statusCode = 0;
  retryable = true;

  constructor(message: string = 'Network connection failed') {
    super(message);
    this.name = 'NetworkError';
  }
}

export class AuthError extends Error implements AppError {
  code = 'AUTH_ERROR';
  statusCode = 401;
  retryable = false;

  constructor(message: string = 'Authentication failed') {
    super(message);
    this.name = 'AuthError';
  }
}

/**
 * Centralized error handler that logs errors and shows appropriate user messages
 */
export function handleError(error: unknown, context?: string): AppError {
  console.error(`[${context || 'Error'}]:`, error);
  
  // Track error for monitoring
  if (error instanceof Error) {
    analytics.trackError(error, context);
  } else {
    analytics.trackError(String(error), context);
  }

  // Convert unknown errors to AppError
  let appError: AppError;

  if (error instanceof ApiError || error instanceof NetworkError || 
      error instanceof ValidationError || error instanceof AuthError) {
    appError = error;
  } else if (error instanceof Error) {
    // Check for specific error patterns
    if (error.message.includes('fetch')) {
      appError = new NetworkError(error.message);
    } else if (error.message.includes('auth') || error.message.includes('unauthorized')) {
      appError = new AuthError(error.message);
    } else {
      appError = new ApiError(error.message);
    }
  } else if (typeof error === 'string') {
    appError = new ApiError(error);
  } else {
    appError = new ApiError('An unexpected error occurred');
  }

  // Show user-friendly toast message
  showErrorToast(appError);

  return appError;
}

/**
 * Show user-friendly error messages via toast
 */
function showErrorToast(error: AppError) {
  let message = error.message;
  let actionLabel: string | undefined;
  let action: (() => void) | undefined;

  // Customize messages based on error type
  switch (error.code) {
    case 'NETWORK_ERROR':
      message = 'Connection failed. Please check your internet connection.';
      if (error.retryable) {
        actionLabel = 'Retry';
        action = () => window.location.reload();
      }
      break;
    case 'AUTH_ERROR':
      message = 'Please sign in to continue.';
      actionLabel = 'Sign In';
      action = () => window.location.href = '/auth';
      break;
    case 'VALIDATION_ERROR':
      // Use the original message for validation errors
      break;
    default:
      // Generic error message for unknown errors
      if (error.statusCode >= 500) {
        message = 'Something went wrong on our end. Please try again later.';
      }
  }

  toast.error(message, {
    action: actionLabel && action ? {
      label: actionLabel,
      onClick: action,
    } : undefined,
  });
}

/**
 * Async error boundary for handling promise rejections
 */
export async function withErrorHandling<T>(
  asyncFn: () => Promise<T>,
  context?: string
): Promise<T | null> {
  try {
    return await asyncFn();
  } catch (error) {
    handleError(error, context);
    return null;
  }
}

/**
 * Retry logic for retryable operations
 */
export async function withRetry<T>(
  asyncFn: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000,
  context?: string
): Promise<T> {
  let lastError: AppError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await asyncFn();
    } catch (error) {
      lastError = handleError(error, `${context} (attempt ${attempt})`);
      
      if (!lastError.retryable || attempt === maxRetries) {
        throw lastError;
      }

      // Wait before retrying
      await new Promise(resolve => setTimeout(resolve, delay * attempt));
    }
  }

  throw lastError!;
}
