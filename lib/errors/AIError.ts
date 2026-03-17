/**
 * AIError - AI服务错误
 *
 * 用于Claude API调用失败、解析错误等场景
 * HTTP Status: 502 Bad Gateway / 503 Service Unavailable
 */

import { AppError, ErrorCodes, type ErrorContext } from './AppError';

export interface AIErrorContext extends ErrorContext {
  model?: string;
  paperId?: number;
  operation?: string;
  retryable?: boolean;
  rawResponse?: string;
}

export class AIError extends AppError {
  public readonly model?: string;
  public readonly retryable: boolean;

  constructor(
    message: string,
    code: string = ErrorCodes.AI_SERVICE_ERROR,
    statusCode: number = 502,
    context?: AIErrorContext,
    originalError?: Error
  ) {
    super(
      message,
      code,
      statusCode,
      true,
      context,
      originalError
    );
    this.model = context?.model;
    this.retryable = context?.retryable ?? false;
  }

  /**
   * API Key缺失
   */
  static apiKeyMissing(): AIError {
    return new AIError(
      '请先在设置中配置API Key',
      ErrorCodes.API_KEY_MISSING,
      401,
      { retryable: false }
    );
  }

  /**
   * API Key无效
   */
  static invalidAPIKey(): AIError {
    return new AIError(
      'API Key无效，请检查设置',
      ErrorCodes.INVALID_API_KEY,
      401,
      { retryable: false }
    );
  }

  /**
   * 请求频率限制
   */
  static rateLimit(retryAfter?: number): AIError {
    return new AIError(
      retryAfter
        ? `请求过于频繁，请${retryAfter}秒后重试`
        : '请求过于频繁，请稍后再试',
      ErrorCodes.AI_RATE_LIMIT,
      429,
      { retryable: true }
    );
  }

  /**
   * 网络错误
   */
  static networkError(originalError?: Error): AIError {
    return new AIError(
      '网络连接失败，请检查网络',
      ErrorCodes.AI_NETWORK_ERROR,
      503,
      { retryable: true },
      originalError
    );
  }

  /**
   * 解析错误
   */
  static parseError(rawResponse?: string, originalError?: Error): AIError {
    return new AIError(
      'AI响应格式无效',
      ErrorCodes.AI_PARSE_ERROR,
      502,
      { retryable: false, rawResponse },
      originalError
    );
  }

  /**
   * 无效请求
   */
  static invalidRequest(message: string): AIError {
    return new AIError(
      message,
      ErrorCodes.AI_INVALID_REQUEST,
      400,
      { retryable: false }
    );
  }

  /**
   * 服务不可用
   */
  static serviceUnavailable(message?: string): AIError {
    return new AIError(
      message || 'AI服务暂时不可用',
      ErrorCodes.SERVICE_UNAVAILABLE,
      503,
      { retryable: true }
    );
  }

  override toAPIResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        retryable: this.retryable,
        ...(this.model && { model: this.model }),
      },
    };
  }
}
