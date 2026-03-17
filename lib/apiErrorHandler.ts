/**
 * API Error Handler - API路由错误处理工具
 *
 * 提供API路由的统一错误处理，包括：
 * - 自动错误分类和转换
 * - 统一的错误响应格式
 * - 错误日志记录
 * - 请求上下文追踪
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
  wrapError,
  errorLogger,
} from './errorHandler';

/**
 * API处理器类型
 */
export type APIHandler = (request: NextRequest, ...args: any[]) => Promise<NextResponse>;

/**
 * 路由配置选项
 */
export interface RouteConfig {
  requireAuth?: boolean;
  validateBody?: boolean;
  rateLimit?: boolean;
}

/**
 * 统一API错误处理器
 *
 * 包装API路由处理器，提供统一错误处理
 *
 * @example
 * export const GET = withErrorHandler(async (request) => {
 *   const data = await fetchData();
 *   return NextResponse.json({ success: true, data });
 * });
 */
export function withErrorHandler(
  handler: APIHandler,
  _config?: RouteConfig
): APIHandler {
  return async (request: NextRequest, ...args: any[]): Promise<NextResponse> => {
    try {
      return await handler(request, ...args);
    } catch (error) {
      return handleAPIError(error, request);
    }
  };
}

/**
 * 处理API错误并返回响应
 */
export function handleAPIError(
  error: unknown,
  request?: NextRequest
): NextResponse {
  // 确保是AppError
  const appError = error instanceof AppError
    ? error
    : wrapError(error);

  // 记录错误
  errorLogger.log(appError, {
    url: request?.url,
    method: request?.method,
    userAgent: request?.headers.get('user-agent') || undefined,
  });

  // 设置安全头部
  const headers = new Headers();
  headers.set('X-Content-Type-Options', 'nosniff');
  headers.set('X-Frame-Options', 'DENY');

  // 返回统一格式的错误响应
  return NextResponse.json(
    appError.toAPIResponse(),
    {
      status: appError.statusCode,
      headers,
    }
  );
}

/**
 * 创建成功响应
 */
export function createSuccessResponse<T>(
  data: T,
  statusCode: number = 200,
  headers?: HeadersInit
): NextResponse {
  return NextResponse.json(
    {
      success: true,
      data,
    },
    { status: statusCode, headers }
  );
}

/**
 * 创建分页响应
 */
export interface PaginatedResponse<T> {
  items: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

export function createPaginatedResponse<T>(
  items: T[],
  page: number,
  pageSize: number,
  total: number
): NextResponse {
  const totalPages = Math.ceil(total / pageSize);

  return createSuccessResponse<PaginatedResponse<T>>({
    items,
    pagination: {
      page,
      pageSize,
      total,
      totalPages,
      hasNext: page < totalPages,
      hasPrev: page > 1,
    },
  });
}

/**
 * 解析和验证请求体
 */
export async function parseRequestBody<T>(
  request: NextRequest,
  validator?: (body: unknown) => asserts body is T
): Promise<T> {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    throw new ValidationError('Invalid JSON in request body');
  }

  if (validator) {
    const validateBody: (body: unknown) => asserts body is T = validator;
    try {
      validateBody(body);
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError('Request body validation failed');
    }
  }

  return body as T;
}

/**
 * 解析查询参数
 */
export function parseQueryParams(
  request: NextRequest
): Record<string, string> {
  const { searchParams } = new URL(request.url);
  const params: Record<string, string> = {};

  searchParams.forEach((value, key) => {
    params[key] = value;
  });

  return params;
}

/**
 * 获取必填查询参数
 */
export function getRequiredParam(
  params: Record<string, string>,
  name: string
): string {
  const value = params[name];
  if (!value || value.trim() === '') {
    throw ValidationError.required(name);
  }
  return value;
}

/**
 * 获取可选查询参数
 */
export function getOptionalParam(
  params: Record<string, string>,
  name: string,
  defaultValue?: string
): string | undefined {
  return params[name] || defaultValue;
}

/**
 * 解析整数参数
 */
export function parseIntParam(
  params: Record<string, string>,
  name: string,
  defaultValue?: number
): number | undefined {
  const value = params[name];
  if (!value) {
    return defaultValue;
  }

  const parsed = parseInt(value, 10);
  if (isNaN(parsed)) {
    throw ValidationError.forField(name, `${name} must be a valid integer`);
  }

  return parsed;
}

/**
 * 验证文件上传
 */
export function validateFileUpload(
  file: File,
  options: {
    allowedTypes?: string[];
    maxSize?: number; // in bytes
  } = {}
): void {
  const { allowedTypes, maxSize } = options;

  if (allowedTypes && !allowedTypes.includes(file.type)) {
    throw new ValidationError(
      `Invalid file type: ${file.type}. Allowed: ${allowedTypes.join(', ')}`
    );
  }

  if (maxSize && file.size > maxSize) {
    throw PDFError.fileTooLarge(maxSize, file.size);
  }
}

// ============================================================================
// HTTP 方法处理器创建器
// ============================================================================

/**
 * 创建路由处理器对象
 *
 * @example
 * export const { GET, POST } = createRouteHandlers({
 *   get: async (request) => { ... },
 *   post: async (request) => { ... },
 * });
 */
export function createRouteHandlers(handlers: {
  get?: APIHandler;
  post?: APIHandler;
  put?: APIHandler;
  patch?: APIHandler;
  delete?: APIHandler;
}): {
  GET?: APIHandler;
  POST?: APIHandler;
  PUT?: APIHandler;
  PATCH?: APIHandler;
  DELETE?: APIHandler;
} {
  const wrappedHandlers: Record<string, APIHandler> = {};

  for (const [method, handler] of Object.entries(handlers)) {
    if (handler) {
      wrappedHandlers[method.toUpperCase()] = withErrorHandler(handler);
    }
  }

  return wrappedHandlers;
}

// ============================================================================
// 重新导出错误类（方便使用）
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
  errorLogger,
  wrapError,
};
