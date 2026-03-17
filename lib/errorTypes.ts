/**
 * Error Types - 错误类型定义
 *
 * 提供统一的错误类型定义，用于TypeScript类型安全和运行时错误处理
 */

// ============================================================================
// 基础类型守卫
// ============================================================================

/**
 * Type guard to check if value is an Error
 */
export function isError(value: unknown): value is Error {
  return value instanceof Error;
}

/**
 * Type guard to check if value has a code property
 */
export function hasCode(value: unknown): value is { code: string } {
  return typeof value === 'object' && value !== null && 'code' in value;
}

/**
 * Type guard to check if value has a statusCode property
 */
export function hasStatusCode(value: unknown): value is { statusCode: number } {
  return typeof value === 'object' && value !== null && 'statusCode' in value;
}

/**
 * Type guard to check if value is an AppError-like object
 */
export function isAppError(value: unknown): value is {
  code: string;
  statusCode: number;
  isOperational: boolean;
  message: string;
} {
  return (
    isError(value) &&
    hasCode(value) &&
    hasStatusCode(value) &&
    'isOperational' in value
  );
}

// ============================================================================
// 错误消息提取
// ============================================================================

/**
 * Type-safe error message extraction
 */
export function getErrorMessage(error: unknown): string {
  if (isError(error)) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (typeof error === 'object' && error !== null) {
    if ('message' in error && typeof error.message === 'string') {
      return error.message;
    }
  }
  return 'Unknown error occurred';
}

/**
 * Type-safe error code extraction
 */
export function getErrorCode(error: unknown): string {
  if (hasCode(error)) {
    return error.code;
  }
  return 'UNKNOWN_ERROR';
}

/**
 * Type-safe status code extraction
 */
export function getStatusCode(error: unknown): number {
  if (hasStatusCode(error)) {
    return error.statusCode;
  }
  return 500;
}

// ============================================================================
// API 错误类型
// ============================================================================

/**
 * API错误基础接口
 */
export interface APIError {
  code: string;
  message: string;
  status?: number;
  context?: Record<string, unknown>;
}

/**
 * API错误响应接口
 */
export interface APIErrorResponse {
  success: false;
  error: APIError;
}

/**
 * API成功响应接口
 */
export interface APISuccessResponse<T = unknown> {
  success: true;
  data: T;
}

/**
 * API响应联合类型
 */
export type APIResponse<T = unknown> = APISuccessResponse<T> | APIErrorResponse;

/**
 * Type guard for API errors
 */
export function isAPIError(value: unknown): value is APIError {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  return 'code' in value && typeof (value as any).code === 'string';
}

/**
 * Type guard for API error responses
 */
export function isAPIErrorResponse(value: unknown): value is APIErrorResponse {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as any;
  return obj.success === false && 'error' in obj && isAPIError(obj.error);
}

/**
 * Type guard for API success responses
 */
export function isAPISuccessResponse<T>(
  value: unknown
): value is APISuccessResponse<T> {
  if (typeof value !== 'object' || value === null) {
    return false;
  }
  const obj = value as any;
  return obj.success === true && 'data' in obj;
}

// ============================================================================
// 错误分类
// ============================================================================

/**
 * 运营错误（用户可处理的错误）
 */
export type OperationalErrorCode =
  | 'VALIDATION_ERROR'
  | 'NOT_FOUND'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'API_KEY_MISSING'
  | 'INVALID_API_KEY'
  | 'AI_RATE_LIMIT'
  | 'AI_NETWORK_ERROR'
  | 'INVALID_PDF'
  | 'CORRUPTED_PDF'
  | 'PASSWORD_PROTECTED_PDF'
  | 'RATE_LIMIT'
  | 'TIMEOUT_ERROR';

/**
 * 编程错误（需要修复的bug）
 */
export type ProgrammingErrorCode =
  | 'INTERNAL_ERROR'
  | 'DATABASE_ERROR'
  | 'DATABASE_CONNECTION_ERROR'
  | 'DATABASE_TRANSACTION_ERROR'
  | 'UNKNOWN_ERROR';

/**
 * 检查错误代码是否为运营错误
 */
export function isOperationalErrorCode(code: string): code is OperationalErrorCode {
  const operationalCodes: OperationalErrorCode[] = [
    'VALIDATION_ERROR',
    'NOT_FOUND',
    'UNAUTHORIZED',
    'FORBIDDEN',
    'API_KEY_MISSING',
    'INVALID_API_KEY',
    'AI_RATE_LIMIT',
    'AI_NETWORK_ERROR',
    'INVALID_PDF',
    'CORRUPTED_PDF',
    'PASSWORD_PROTECTED_PDF',
    'RATE_LIMIT',
    'TIMEOUT_ERROR',
  ];
  return operationalCodes.includes(code as OperationalErrorCode);
}

// ============================================================================
// 前端错误类型
// ============================================================================

/**
 * Toast 消息类型
 */
export type ToastType = 'success' | 'error' | 'warning' | 'info';

/**
 * 前端错误信息
 */
export interface FrontendErrorInfo {
  type: ToastType;
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
  autoDismiss?: boolean;
  dismissDuration?: number;
}

/**
 * 错误处理器配置
 */
export interface ErrorHandlerConfig {
  logErrors: boolean;
  showToast: boolean;
  toastDuration: number;
  retryAttempts: number;
  retryDelay: number;
}

/**
 * 默认错误处理器配置
 */
export const defaultErrorHandlerConfig: ErrorHandlerConfig = {
  logErrors: true,
  showToast: true,
  toastDuration: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};

// ============================================================================
// AI 错误类型（与 ai.types.ts 兼容）
// ============================================================================

/**
 * AI 错误代码
 */
export type AIErrorCode =
  | 'API_KEY_MISSING'
  | 'INVALID_API_KEY'
  | 'RATE_LIMIT'
  | 'NETWORK_ERROR'
  | 'PARSE_ERROR'
  | 'INVALID_REQUEST'
  | 'UNKNOWN_ERROR'
  | 'AI_SERVICE_ERROR'
  | 'AI_RATE_LIMIT'
  | 'AI_NETWORK_ERROR'
  | 'AI_PARSE_ERROR'
  | 'AI_INVALID_REQUEST';

/**
 * AI 错误接口
 */
export interface AIErrorInterface {
  code: AIErrorCode;
  message: string;
  retryable: boolean;
  model?: string;
}

/**
 * 检查是否为可重试的AI错误
 */
export function isRetryableAIError(code: AIErrorCode): boolean {
  const retryableCodes: AIErrorCode[] = [
    'RATE_LIMIT',
    'NETWORK_ERROR',
    'AI_RATE_LIMIT',
    'AI_NETWORK_ERROR',
  ];
  return retryableCodes.includes(code);
}

// ============================================================================
// 数据库错误类型
// ============================================================================

/**
 * 数据库错误代码
 */
export type DatabaseErrorCode =
  | 'DATABASE_ERROR'
  | 'DATABASE_CONNECTION_ERROR'
  | 'DATABASE_CONSTRAINT_ERROR'
  | 'DATABASE_TRANSACTION_ERROR';

/**
 * 数据库错误接口
 */
export interface DatabaseErrorInterface {
  code: DatabaseErrorCode;
  message: string;
  table?: string;
  operation?: 'read' | 'write' | 'delete' | 'transaction';
}

// ============================================================================
// PDF 错误类型
// ============================================================================

/**
 * PDF 错误代码
 */
export type PDFErrorCode =
  | 'PDF_ERROR'
  | 'INVALID_PDF'
  | 'CORRUPTED_PDF'
  | 'PASSWORD_PROTECTED_PDF'
  | 'PDF_PARSE_ERROR';

/**
 * PDF 错误接口
 */
export interface PDFErrorInterface {
  code: PDFErrorCode;
  message: string;
  fileName?: string;
  pageNumber?: number;
}

// ============================================================================
// 错误日志类型
// ============================================================================

/**
 * 错误日志条目
 */
export interface ErrorLogEntry {
  id: string;
  timestamp: string;
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  stack?: string;
  context?: Record<string, unknown>;
  url?: string;
  userAgent?: string;
}

/**
 * 错误日志过滤器
 */
export interface ErrorLogFilter {
  codes?: string[];
  isOperational?: boolean;
  startTime?: string;
  endTime?: string;
  limit?: number;
}
