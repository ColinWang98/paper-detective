/**
 * Unified API Response Utilities
 *
 * Provides standardized response formatting for all API routes.
 * This module complements the existing error handling system in @/lib/errorHandler
 * by providing convenient response helpers.
 *
 * Features:
 * - Success responses with type-safe data
 * - Error responses with error codes and messages
 * - Validation error responses with field-level errors
 * - Backward compatibility with existing error handling
 *
 * @example
 * ```typescript
 * // Success response
 * return success({ items: [] });
 *
 * // Error response (using existing error system)
 * throw ValidationError.forField('email', 'Required');
 *
 * // With error handler wrapper
 * export const POST = withErrorHandler(async (request) => {
 *   return success(data);
 * });
 * ```
 */

import { NextResponse } from 'next/server';
import {
  ErrorCodes,
  type ErrorCode,
} from '@/lib/errors';

// Re-export error codes and types from the main error system
export { ErrorCodes, type ErrorCode };

// ============================================================================
// Types
// ============================================================================

/**
 * Standard API success response structure
 */
export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
  meta?: ResponseMeta;
}

/**
 * Standard API error response structure
 */
export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/**
 * Validation error item
 */
export interface ValidationErrorItem {
  field: string;
  message: string;
  value?: unknown;
}

/**
 * Response metadata for pagination, etc.
 */
export interface ResponseMeta {
  page?: number;
  pageSize?: number;
  total?: number;
  totalPages?: number;
  timestamp?: string;
  requestId?: string;
}

/**
 * Union type for all API responses
 */
export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;

// ============================================================================
// Success Response Helpers
// ============================================================================

/**
 * Create a standardized success response
 *
 * @param data - Response data
 * @param status - HTTP status code (default: 200)
 * @param meta - Optional response metadata
 * @returns NextResponse with standardized format
 *
 * @example
 * ```typescript
 * return success({ users: [] }, 200, { page: 1, total: 100 });
 * ```
 */
export function success<T>(
  data: T,
  status: number = 200,
  meta?: ResponseMeta
): NextResponse {
  const body: APISuccessResponse<T> = {
    success: true,
    data,
    ...(meta && { meta }),
  };

  return NextResponse.json(body, { status });
}

/**
 * Create a success response for created resources (201)
 */
export function created<T>(data: T, meta?: ResponseMeta): NextResponse {
  return success(data, 201, meta);
}

/**
 * Create a success response for accepted requests (202)
 */
export function accepted<T>(data: T, meta?: ResponseMeta): NextResponse {
  return success(data, 202, meta);
}

// ============================================================================
// Error Response Helpers (for manual error handling)
// ============================================================================

/**
 * Create a standardized error response
 *
 * Note: Prefer using the error throwing mechanism with withErrorHandler wrapper
 * instead of manually creating error responses.
 *
 * @param message - Human-readable error message
 * @param code - Machine-readable error code
 * @param status - HTTP status code
 * @param details - Optional error details
 * @returns NextResponse with standardized error format
 */
export function errorResponse(
  message: string,
  code: string,
  status: number,
  details?: unknown
): NextResponse {
  const detailPayload = details !== undefined ? { details } : {};
  const body: APIErrorResponse = {
    success: false,
    error: {
      code,
      message,
      ...detailPayload,
    },
  };

  return NextResponse.json(body, { status });
}

/**
 * Create a validation error response (400)
 * Note: Prefer throwing ValidationError instead
 */
export function validationErrorResponse(errors: ValidationErrorItem[]): NextResponse {
  return errorResponse(
    'Validation failed',
    ErrorCodes.VALIDATION_ERROR,
    400,
    { errors }
  );
}

/**
 * Create a bad request error response (400)
 */
export function badRequestResponse(message: string, code?: string): NextResponse {
  return errorResponse(message, code || ErrorCodes.INVALID_INPUT, 400);
}

/**
 * Create an unauthorized error response (401)
 */
export function unauthorizedResponse(message: string, code?: string): NextResponse {
  return errorResponse(message, code || ErrorCodes.UNAUTHORIZED, 401);
}

/**
 * Create a not found error response (404)
 */
export function notFoundResponse(message: string, code?: string): NextResponse {
  return errorResponse(message, code || ErrorCodes.NOT_FOUND, 404);
}

// ============================================================================
// Error Logging
// ============================================================================

/**
 * Log API error with context
 *
 * @param context - Error context (route, function, etc.)
 * @param error - Error object or message
 * @param extra - Additional context data
 */
export function logAPIError(
  context: string,
  error: unknown,
  extra?: Record<string, unknown>
): void {
  const timestamp = new Date().toISOString();
  const errorMessage = error instanceof Error ? error.message : String(error);
  const errorStack = error instanceof Error ? error.stack : undefined;

  // In production, this would send to error tracking service
  // eslint-disable-next-line no-console
  console.error(JSON.stringify({
    timestamp,
    context,
    error: errorMessage,
    stack: errorStack,
    ...extra,
  }));
}

// ============================================================================
// Error Handler Factory (compatible with existing system)
// ============================================================================

/**
 * Create a route-specific error handler
 * Maps common error codes to appropriate HTTP responses
 *
 * Note: This is a simplified version. Prefer using withErrorHandler from @/lib/errorHandler
 * for full error handling capabilities.
 *
 * @param routeContext - Context identifier for error logging
 * @returns Error handler function
 *
 * @example
 * ```typescript
 * const handleError = createErrorHandler('api/analyze');
 * try {
 *   // ... operation
 * } catch (err) {
 *   return handleError(err);
 * }
 * ```
 */
export function createErrorHandler(routeContext: string) {
  return function handleRouteError(error: unknown): NextResponse {
    // Log the error
    logAPIError(routeContext, error);

    // Extract error code if available
    const errorCode = (error as { code?: string }).code;
    const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

    // Map error codes to responses
    switch (errorCode) {
      case ErrorCodes.API_KEY_MISSING:
        return unauthorizedResponse(errorMessage, ErrorCodes.API_KEY_MISSING);

      case ErrorCodes.INVALID_API_KEY:
        return unauthorizedResponse(errorMessage, ErrorCodes.INVALID_API_KEY);

      case ErrorCodes.RATE_LIMIT:
      case ErrorCodes.AI_RATE_LIMIT:
        return errorResponse(errorMessage, ErrorCodes.RATE_LIMIT, 429);

      case ErrorCodes.NETWORK_ERROR:
      case ErrorCodes.AI_NETWORK_ERROR:
        return errorResponse(errorMessage, ErrorCodes.NETWORK_ERROR, 503);

      case ErrorCodes.VALIDATION_ERROR:
        return errorResponse(errorMessage, ErrorCodes.VALIDATION_ERROR, 400);

      case ErrorCodes.NOT_FOUND:
        return notFoundResponse(errorMessage, ErrorCodes.NOT_FOUND);

      default:
        return errorResponse(errorMessage, ErrorCodes.UNKNOWN_ERROR, 500);
    }
  };
}

// ============================================================================
// Re-exports from main error system for convenience
// ============================================================================

export {
  // Error classes
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AIError,
  DatabaseError,
  PDFError,
} from '@/lib/errors';

export {
  // Error handling utilities
  withErrorHandler,
  handleAPIError,
  wrapError,
  wrapAIError,
  errorLogger,
  toFrontendError,
  validateRequired,
  validateNonEmptyString,
  validateNonEmptyArray,
  validateNumberRange,
} from '@/lib/errorHandler';

export type {
  ErrorLogEntry,
  FrontendError,
} from '@/lib/errorHandler';
