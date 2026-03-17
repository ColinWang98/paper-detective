/**
 * Paper Detective Library - 统一导出
 *
 * 提供所有库功能的统一入口
 */

// ============================================================================
// 错误处理 (核心)
// ============================================================================

export {
  // 错误类
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AIError,
  DatabaseError,
  PDFError,

  // 错误代码
  ErrorCodes,
  type ErrorCode,
  type ErrorContext,
  type ErrorMetadata,
  type ValidationFieldError,
  type NotFoundContext,
  type AIErrorContext,
  type DatabaseErrorContext,
  type PDFErrorContext,
} from './errors';

export {
  // 错误处理工具
  errorLogger,
  handleAPIError,
  withErrorHandler,
  wrapError,
  wrapAIError,
  wrapDatabaseError,
  wrapPDFError,
  toFrontendError,

  // 验证工具
  validateRequired,
  validateNonEmptyString,
  validateNonEmptyArray,
  validateNumberRange,

  // 类型
  type ErrorLogEntry,
  type FrontendError,
} from './errorHandler';

export {
  // API错误处理
  withErrorHandler as withAPIErrorHandler,
  createSuccessResponse,
  createPaginatedResponse,
  parseRequestBody,
  parseQueryParams,
  getRequiredParam,
  getOptionalParam,
  parseIntParam,
  validateFileUpload,
  createRouteHandlers,
  type APIHandler,
  type RouteConfig,
  type PaginatedResponse,
} from './apiErrorHandler';

// ============================================================================
// 错误类型定义
// ============================================================================

export {
  isError,
  hasCode,
  hasStatusCode,
  isAppError,
  getErrorMessage,
  getErrorCode,
  getStatusCode,
  isAPIError,
  isAPIErrorResponse,
  isAPISuccessResponse,
  isOperationalErrorCode,
  isRetryableAIError,

  // 类型
  type APIError,
  type APIErrorResponse,
  type APISuccessResponse,
  type APIResponse,
  type OperationalErrorCode,
  type ProgrammingErrorCode,
  type FrontendErrorInfo,
  type ErrorHandlerConfig,
  type ErrorLogEntry as ErrorLogEntryType,
  type ErrorLogFilter,
  type ToastType,

  // 常量
  defaultErrorHandlerConfig,
} from './errorTypes';

// ============================================================================
// React Hooks
// ============================================================================

export {
  useErrorHandler,
  useAsync,
  type UseErrorHandlerOptions,
  type UseErrorHandlerReturn,
  type UseAsyncOptions,
  type UseAsyncReturn,
  type ExecuteOptions,
} from './useErrorHandler';

// ============================================================================
// 数据库
// ============================================================================

export {
  PaperDetectiveDB,
  db,
  initializeDatabase,
  dbHelpers,
} from './db';

// ============================================================================
// PDF工具
// ============================================================================

export {
  extractPDFText,
  extractPDFTextRange,
  getPDFMetadata,
  getPageDimensions,
  pdfToViewport,
  viewportToPdf,
  type PDFTextContent,
} from './pdf';

// ============================================================================
// 格式化工具
// ============================================================================

export {
  formatDate,
  formatFileSize,
  truncateText,
  highlightText,
} from './utils/format';
