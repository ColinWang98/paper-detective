/**
 * AppError - 应用错误基类
 *
 * 所有应用错误的基类，提供统一的错误结构
 */

export interface ErrorContext {
  [key: string]: unknown;
}

export interface ErrorMetadata {
  timestamp: string;
  path?: string;
  userAgent?: string;
  requestId?: string;
}

export interface AppErrorJSON {
  code: string;
  message: string;
  statusCode: number;
  isOperational: boolean;
  context?: ErrorContext;
  metadata: ErrorMetadata;
  stack?: string;
}

export class AppError extends Error {
  public readonly code: string;
  public readonly statusCode: number;
  public readonly isOperational: boolean;
  public context?: ErrorContext;
  public readonly metadata: ErrorMetadata;
  public readonly originalError?: Error;

  constructor(
    message: string,
    code: string = 'INTERNAL_ERROR',
    statusCode: number = 500,
    isOperational: boolean = true,
    context?: ErrorContext,
    originalError?: Error
  ) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    this.context = context;
    this.originalError = originalError;
    this.metadata = {
      timestamp: new Date().toISOString(),
    };

    // 捕获堆栈跟踪
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  /**
   * 转换为JSON格式（用于API响应）
   */
  toJSON(): AppErrorJSON {
    return {
      code: this.code,
      message: this.message,
      statusCode: this.statusCode,
      isOperational: this.isOperational,
      context: this.context,
      metadata: this.metadata,
      stack: process.env.NODE_ENV === 'development' ? this.stack : undefined,
    };
  }

  /**
   * 转换为API响应格式
   */
  toAPIResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        ...(this.context && { context: this.context }),
      },
    };
  }

  /**
   * 添加错误上下文
   */
  withContext(context: ErrorContext): this {
    this.context = { ...(this.context ?? {}), ...context };
    return this;
  }

  /**
   * 添加请求元数据
   */
  withMetadata(metadata: Partial<ErrorMetadata>): this {
    Object.assign(this.metadata, metadata);
    return this;
  }

  /**
   * 检查是否为运营错误（用户可处理的错误）
   */
  static isOperationalError(error: Error): boolean {
    if (error instanceof AppError) {
      return error.isOperational;
    }
    return false;
  }

  /**
   * 检查是否为编程错误（需要修复的bug）
   */
  static isProgrammingError(error: Error): boolean {
    return !AppError.isOperationalError(error);
  }
}

/**
 * 错误代码常量
 */
export const ErrorCodes = {
  // 通用错误 (1xx)
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // 验证错误 (2xx)
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  REQUIRED_FIELD_MISSING: 'REQUIRED_FIELD_MISSING',
  INVALID_FORMAT: 'INVALID_FORMAT',

  // 资源错误 (3xx)
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  RESOURCE_CONFLICT: 'RESOURCE_CONFLICT',

  // 认证/授权错误 (4xx)
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  AUTHENTICATION_REQUIRED: 'AUTHENTICATION_REQUIRED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  API_KEY_MISSING: 'API_KEY_MISSING',
  INVALID_API_KEY: 'INVALID_API_KEY',

  // AI服务错误 (5xx)
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  AI_RATE_LIMIT: 'AI_RATE_LIMIT',
  AI_NETWORK_ERROR: 'AI_NETWORK_ERROR',
  AI_PARSE_ERROR: 'AI_PARSE_ERROR',
  AI_INVALID_REQUEST: 'AI_INVALID_REQUEST',

  // 数据库错误 (6xx)
  DATABASE_ERROR: 'DATABASE_ERROR',
  DATABASE_CONNECTION_ERROR: 'DATABASE_CONNECTION_ERROR',
  DATABASE_CONSTRAINT_ERROR: 'DATABASE_CONSTRAINT_ERROR',
  DATABASE_TRANSACTION_ERROR: 'DATABASE_TRANSACTION_ERROR',

  // PDF错误 (7xx)
  PDF_ERROR: 'PDF_ERROR',
  INVALID_PDF: 'INVALID_PDF',
  CORRUPTED_PDF: 'CORRUPTED_PDF',
  PASSWORD_PROTECTED_PDF: 'PASSWORD_PROTECTED_PDF',
  PDF_PARSE_ERROR: 'PDF_PARSE_ERROR',

  // 网络错误 (8xx)
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  RATE_LIMIT: 'RATE_LIMIT',
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];
