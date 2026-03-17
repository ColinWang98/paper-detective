/**
 * Error Classes Index
 *
 * 导出所有错误类，方便统一使用
 */

export { AppError, ErrorCodes, type ErrorCode, type ErrorContext, type ErrorMetadata } from './AppError';
export { ValidationError, type ValidationFieldError } from './ValidationError';
export { NotFoundError, type NotFoundContext } from './NotFoundError';
export { AuthenticationError } from './AuthenticationError';
export { AIError, type AIErrorContext } from './AIError';
export { DatabaseError, type DatabaseErrorContext } from './DatabaseError';
export { PDFError, type PDFErrorContext } from './PDFError';
