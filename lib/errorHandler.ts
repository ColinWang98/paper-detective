/**
 * Error Handler - 统一错误处理工具
 *
 * 提供完整的错误处理机制，包括：
 * 1. 错误分类和处理
 * 2. 错误日志记录
 * 3. API响应格式化
 * 4. 前端错误处理
 * 5. 错误边界组件
 */

import { NextRequest, NextResponse } from 'next/server';

import {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AIError,
  DatabaseError,
  PDFError,
  ErrorCodes,
  type ErrorCode,
} from './errors';

type DatabaseOperation = 'read' | 'write' | 'delete' | 'transaction';

function toDatabaseOperation(operation?: string): DatabaseOperation | undefined {
  if (
    operation === 'read' ||
    operation === 'write' ||
    operation === 'delete' ||
    operation === 'transaction'
  ) {
    return operation;
  }

  return undefined;
}

// ============================================================================
// 错误日志记录
// ============================================================================

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

class ErrorLogger {
  private logs: ErrorLogEntry[] = [];
  private maxLogs: number = 100;

  /**
   * 记录错误
   */
  log(error: Error, context?: Record<string, unknown>): ErrorLogEntry {
    const entry: ErrorLogEntry = {
      id: crypto.randomUUID(),
      timestamp: new Date().toISOString(),
      code: error instanceof AppError ? error.code : ErrorCodes.UNKNOWN_ERROR,
      message: error.message,
      statusCode: error instanceof AppError ? error.statusCode : 500,
      isOperational: AppError.isOperationalError(error),
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      context,
    };

    // 添加到日志数组
    this.logs.push(entry);

    // 限制日志数量
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // 开发环境打印到控制台
    if (process.env.NODE_ENV === 'development') {
      this.printToConsole(entry, error);
    }

    // 对于编程错误，可以考虑发送到监控系统
    if (!entry.isOperational) {
      this.reportToMonitoring(entry, error);
    }

    return entry;
  }

  /**
   * 打印到控制台
   */
  private printToConsole(entry: ErrorLogEntry, error: Error): void {
    const emoji = entry.isOperational ? '⚠️' : '🔥';
    console.error(
      `${emoji} [${entry.code}] ${entry.message}\n` +
      `Status: ${entry.statusCode} | Operational: ${entry.isOperational}\n` +
      `Time: ${entry.timestamp}\n` +
      `Stack: ${error.stack || 'N/A'}`
    );
  }

  /**
   * 报告到监控系统（预留）
   */
  private reportToMonitoring(_entry: ErrorLogEntry, _error: Error): void {
    // 可集成 Sentry, LogRocket 等监控服务
    // 示例: Sentry.captureException(error);
  }

  /**
   * 获取所有日志
   */
  getLogs(): ErrorLogEntry[] {
    return [...this.logs];
  }

  /**
   * 清除日志
   */
  clear(): void {
    this.logs = [];
  }
}

export const errorLogger = new ErrorLogger();

// ============================================================================
// API 错误处理
// ============================================================================

export interface APIErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    [key: string]: unknown;
  };
}

/**
 * 处理API错误并返回统一格式的响应
 */
export function handleAPIError(error: unknown, request?: NextRequest): NextResponse {
  // 确保是Error对象
  const err = error instanceof Error ? error : new Error(String(error));

  // 记录错误
  errorLogger.log(err, {
    url: request?.url,
    userAgent: request?.headers.get('user-agent') || undefined,
  });

  // AppError 类型的错误
  if (err instanceof AppError) {
    return NextResponse.json(err.toAPIResponse(), {
      status: err.statusCode,
    });
  }

  // 特定类型的原始错误处理
  const statusCode = inferStatusCode(err);
  const errorCode = inferErrorCode(err);

  return NextResponse.json(
    {
      success: false,
      error: {
        code: errorCode,
        message: err.message || 'An unexpected error occurred',
      },
    },
    { status: statusCode }
  );
}

/**
 * 从原始错误推断状态码
 */
function inferStatusCode(error: Error): number {
  const message = error.message.toLowerCase();

  if (message.includes('not found') || message.includes('找不到')) return 404;
  if (message.includes('unauthorized') || message.includes('未授权')) return 401;
  if (message.includes('forbidden') || message.includes('禁止')) return 403;
  if (message.includes('validation') || message.includes('验证')) return 400;
  if (message.includes('timeout') || message.includes('超时')) return 408;
  if (message.includes('rate limit') || message.includes('频率')) return 429;
  if (message.includes('network') || message.includes('网络')) return 503;

  return 500;
}

/**
 * 从原始错误推断错误代码
 */
function inferErrorCode(error: Error): ErrorCode {
  const message = error.message.toLowerCase();

  if (message.includes('not found')) return ErrorCodes.NOT_FOUND;
  if (message.includes('unauthorized')) return ErrorCodes.UNAUTHORIZED;
  if (message.includes('forbidden')) return ErrorCodes.FORBIDDEN;
  if (message.includes('validation')) return ErrorCodes.VALIDATION_ERROR;
  if (message.includes('timeout')) return ErrorCodes.TIMEOUT_ERROR;
  if (message.includes('rate limit')) return ErrorCodes.RATE_LIMIT;
  if (message.includes('network')) return ErrorCodes.NETWORK_ERROR;
  if (message.includes('database')) return ErrorCodes.DATABASE_ERROR;

  return ErrorCodes.UNKNOWN_ERROR;
}

// ============================================================================
// 错误包装器
// ============================================================================

/**
 * 包装异步函数，统一处理错误
 */
export function withErrorHandler<T extends (...args: any[]) => Promise<any>>(
  fn: T,
  errorMapper?: (error: unknown) => AppError
): T {
  return (async (...args: Parameters<T>): Promise<ReturnType<T>> => {
    try {
      return await fn(...args);
    } catch (error) {
      if (error instanceof AppError) {
        throw error;
      }

      if (errorMapper) {
        throw errorMapper(error);
      }

      throw wrapError(error);
    }
  }) as T;
}

/**
 * 将未知错误包装为 AppError
 */
export function wrapError(error: unknown): AppError {
  if (error instanceof AppError) {
    return error;
  }

  if (error instanceof Error) {
    return new AppError(
      error.message,
      ErrorCodes.UNKNOWN_ERROR,
      500,
      false,
      undefined,
      error
    );
  }

  return new AppError(
    String(error) || 'An unknown error occurred',
    ErrorCodes.UNKNOWN_ERROR,
    500,
    false
  );
}

// ============================================================================
// 特定领域错误包装
// ============================================================================

/**
 * 包装AI服务错误
 */
export function wrapAIError(error: unknown): AIError {
  if (error instanceof AIError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('api key') || message.includes('apikey')) {
      return AIError.apiKeyMissing();
    }

    if (message.includes('rate limit') || message.includes('429')) {
      return AIError.rateLimit();
    }

    if (message.includes('network') || message.includes('fetch')) {
      return AIError.networkError(error);
    }

    if (message.includes('parse') || message.includes('json')) {
      return AIError.parseError(undefined, error);
    }

    return new AIError(
      error.message,
      ErrorCodes.AI_SERVICE_ERROR,
      502,
      { retryable: true },
      error
    );
  }

  return new AIError(
    String(error) || 'AI service error',
    ErrorCodes.AI_SERVICE_ERROR,
    502,
    { retryable: true }
  );
}

/**
 * 包装数据库错误
 */
export function wrapDatabaseError(error: unknown, operation?: string): DatabaseError {
  const normalizedOperation = toDatabaseOperation(operation);

  if (error instanceof DatabaseError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('constraint') || message.includes('unique')) {
      return DatabaseError.constraintError('unknown', 'constraint', error);
    }

    if (message.includes('transaction')) {
      return DatabaseError.transactionError(error.message, error);
    }

    return new DatabaseError(
      error.message,
      ErrorCodes.DATABASE_ERROR,
      500,
      { operation: normalizedOperation },
      error
    );
  }

  return new DatabaseError(
    String(error) || 'Database error',
    ErrorCodes.DATABASE_ERROR,
    500,
    { operation: normalizedOperation }
  );
}

/**
 * 包装PDF错误
 */
export function wrapPDFError(error: unknown, fileName?: string): PDFError {
  if (error instanceof PDFError) {
    return error;
  }

  if (error instanceof Error) {
    const message = error.message.toLowerCase();

    if (message.includes('invalid') || message.includes('not a valid')) {
      return PDFError.invalidPDF(fileName, error);
    }

    if (message.includes('corrupted') || message.includes('damaged')) {
      return PDFError.corruptedPDF(fileName, error);
    }

    if (message.includes('password')) {
      return PDFError.passwordProtected(fileName);
    }

    if (message.includes('parse')) {
      return PDFError.parseError(undefined, error);
    }

    return new PDFError(
      error.message,
      ErrorCodes.PDF_ERROR,
      400,
      { fileName },
      error
    );
  }

  return new PDFError(
    String(error) || 'PDF processing error',
    ErrorCodes.PDF_ERROR,
    400,
    { fileName }
  );
}

// ============================================================================
// 前端错误处理
// ============================================================================

export interface FrontendError {
  type: 'error' | 'warning' | 'info';
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

/**
 * 将 AppError 转换为前端错误
 */
export function toFrontendError(error: AppError): FrontendError {
  const userMessages: Record<string, string> = {
    [ErrorCodes.VALIDATION_ERROR]: '输入数据格式不正确，请检查后重试',
    [ErrorCodes.NOT_FOUND]: '请求的资源不存在',
    [ErrorCodes.UNAUTHORIZED]: '请先登录',
    [ErrorCodes.API_KEY_MISSING]: '请先在设置中配置API Key',
    [ErrorCodes.INVALID_API_KEY]: 'API Key无效，请检查设置',
    [ErrorCodes.AI_RATE_LIMIT]: '请求过于频繁，请稍后再试',
    [ErrorCodes.AI_NETWORK_ERROR]: '网络连接失败，请检查网络',
    [ErrorCodes.DATABASE_ERROR]: '数据操作失败，请刷新页面重试',
    [ErrorCodes.INVALID_PDF]: '无效的PDF文件',
    [ErrorCodes.CORRUPTED_PDF]: 'PDF文件已损坏',
    [ErrorCodes.PASSWORD_PROTECTED_PDF]: 'PDF文件受密码保护，无法处理',
    [ErrorCodes.NETWORK_ERROR]: '网络连接失败，请检查网络',
    [ErrorCodes.TIMEOUT_ERROR]: '请求超时，请稍后重试',
    [ErrorCodes.RATE_LIMIT]: '请求过于频繁，请稍后再试',
  };

  const retryableCodes = new Set<ErrorCode>([
    ErrorCodes.AI_NETWORK_ERROR,
    ErrorCodes.NETWORK_ERROR,
    ErrorCodes.TIMEOUT_ERROR,
  ]);

  const isRetryable = error instanceof AIError
    ? error.retryable
    : retryableCodes.has(error.code as ErrorCode);

  return {
    type: error.isOperational ? 'warning' : 'error',
    code: error.code,
    message: error.message,
    userMessage: userMessages[error.code] || '操作失败，请稍后重试',
    retryable: isRetryable,
  };
}

// ============================================================================
// 验证工具
// ============================================================================

/**
 * 验证必填字段
 */
export function validateRequired<T>(
  value: T | null | undefined,
  fieldName: string
): asserts value is NonNullable<T> {
  if (value === null || value === undefined) {
    throw ValidationError.required(fieldName);
  }
}

/**
 * 验证字符串非空
 */
export function validateNonEmptyString(
  value: string,
  fieldName: string
): void {
  if (!value || value.trim() === '') {
    throw ValidationError.forField(fieldName, `${fieldName} cannot be empty`);
  }
}

/**
 * 验证数组非空
 */
export function validateNonEmptyArray<T>(
  value: T[],
  fieldName: string
): void {
  if (!Array.isArray(value) || value.length === 0) {
    throw ValidationError.forField(fieldName, `${fieldName} must be a non-empty array`);
  }
}

/**
 * 验证数字范围
 */
export function validateNumberRange(
  value: number,
  fieldName: string,
  min: number,
  max: number
): void {
  if (typeof value !== 'number' || isNaN(value)) {
    throw ValidationError.forField(fieldName, `${fieldName} must be a valid number`);
  }
  if (value < min || value > max) {
    throw ValidationError.forField(
      fieldName,
      `${fieldName} must be between ${min} and ${max}`
    );
  }
}

// ============================================================================
// 导出所有错误类
// ============================================================================

export {
  AppError,
  ValidationError,
  NotFoundError,
  AuthenticationError,
  AIError,
  DatabaseError,
  PDFError,
  ErrorCodes,
};

export type { ErrorCode };
