/**
 * AuthenticationError - 认证错误
 *
 * 用于身份验证失败、未授权访问等场景
 * HTTP Status: 401 Unauthorized / 403 Forbidden
 */

import { AppError, ErrorCodes } from './AppError';

export class AuthenticationError extends AppError {
  constructor(
    message: string = 'Authentication required',
    code: string = ErrorCodes.UNAUTHORIZED,
    statusCode: number = 401
  ) {
    super(message, code, statusCode, true);
  }

  /**
   * API Key缺失
   */
  static apiKeyMissing(): AuthenticationError {
    return new AuthenticationError(
      '请先在设置中配置API Key',
      ErrorCodes.API_KEY_MISSING,
      401
    );
  }

  /**
   * API Key无效
   */
  static invalidAPIKey(): AuthenticationError {
    return new AuthenticationError(
      'API Key无效，请检查设置',
      ErrorCodes.INVALID_API_KEY,
      401
    );
  }

  /**
   * 未授权
   */
  static unauthorized(message?: string): AuthenticationError {
    return new AuthenticationError(
      message || 'Unauthorized access',
      ErrorCodes.UNAUTHORIZED,
      401
    );
  }

  /**
   * 禁止访问
   */
  static forbidden(message?: string): AuthenticationError {
    return new AuthenticationError(
      message || 'Access forbidden',
      ErrorCodes.FORBIDDEN,
      403
    );
  }

  /**
   * 无效凭证
   */
  static invalidCredentials(): AuthenticationError {
    return new AuthenticationError(
      'Invalid credentials',
      ErrorCodes.INVALID_CREDENTIALS,
      401
    );
  }
}
