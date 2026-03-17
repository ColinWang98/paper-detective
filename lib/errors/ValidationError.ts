/**
 * ValidationError - 验证错误
 *
 * 用于输入验证失败、格式错误等场景
 * HTTP Status: 400 Bad Request
 */

import { AppError, ErrorCodes } from './AppError';

export interface ValidationFieldError {
  field: string;
  message: string;
  value?: unknown;
  constraint?: string;
}

export class ValidationError extends AppError {
  public readonly fieldErrors: ValidationFieldError[];

  constructor(
    message: string = 'Validation failed',
    fieldErrors: ValidationFieldError[] = [],
    context?: Record<string, unknown>
  ) {
    super(
      message,
      ErrorCodes.VALIDATION_ERROR,
      400,
      true,
      context
    );
    this.fieldErrors = fieldErrors;
  }

  /**
   * 添加字段错误
   */
  addFieldError(field: string, message: string, value?: unknown): this {
    this.fieldErrors.push({ field, message, value });
    return this;
  }

  /**
   * 从单个字段创建验证错误
   */
  static forField(
    field: string,
    message: string,
    value?: unknown
  ): ValidationError {
    return new ValidationError('Validation failed', [
      { field, message, value },
    ]);
  }

  /**
   * 检查必填字段
   */
  static required(field: string, value?: unknown): ValidationError {
    return ValidationError.forField(
      field,
      `${field} is required`,
      value
    );
  }

  /**
   * 检查字段格式
   */
  static invalidFormat(
    field: string,
    expectedFormat: string,
    value?: unknown
  ): ValidationError {
    return ValidationError.forField(
      field,
      `${field} must be ${expectedFormat}`,
      value
    );
  }

  override toAPIResponse() {
    return {
      success: false,
      error: {
        code: this.code,
        message: this.message,
        fields: this.fieldErrors,
      },
    };
  }
}
