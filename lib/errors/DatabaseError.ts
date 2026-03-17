/**
 * DatabaseError - 数据库错误
 *
 * 用于Dexie.js操作失败、数据约束冲突等场景
 * HTTP Status: 500 Internal Server Error
 */

import { AppError, ErrorCodes } from './AppError';

export interface DatabaseErrorContext {
  table?: string;
  operation?: 'read' | 'write' | 'delete' | 'transaction';
  constraint?: string;
  [key: string]: unknown;
}

export class DatabaseError extends AppError {
  public readonly table?: string;
  public readonly operation?: string;

  constructor(
    message: string,
    code: string = ErrorCodes.DATABASE_ERROR,
    statusCode: number = 500,
    context?: DatabaseErrorContext,
    originalError?: Error
  ) {
    super(
      message,
      code,
      statusCode,
      false, // 数据库错误通常是编程错误
      context,
      originalError
    );
    this.table = context?.table;
    this.operation = context?.operation;
  }

  /**
   * 连接错误
   */
  static connectionError(originalError?: Error): DatabaseError {
    return new DatabaseError(
      '数据库连接失败',
      ErrorCodes.DATABASE_CONNECTION_ERROR,
      500,
      { operation: 'transaction' },
      originalError
    );
  }

  /**
   * 事务错误
   */
  static transactionError(
    message: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(
      message,
      ErrorCodes.DATABASE_TRANSACTION_ERROR,
      500,
      { operation: 'transaction' },
      originalError
    );
  }

  /**
   * 约束错误
   */
  static constraintError(
    table: string,
    constraint: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(
      `数据约束冲突: ${constraint}`,
      ErrorCodes.DATABASE_CONSTRAINT_ERROR,
      409,
      { table, operation: 'write', constraint },
      originalError
    );
  }

  /**
   * 读取错误
   */
  static readError(
    table: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(
      `读取${table}数据失败`,
      ErrorCodes.DATABASE_ERROR,
      500,
      { table, operation: 'read' },
      originalError
    );
  }

  /**
   * 写入错误
   */
  static writeError(
    table: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(
      `写入${table}数据失败`,
      ErrorCodes.DATABASE_ERROR,
      500,
      { table, operation: 'write' },
      originalError
    );
  }

  /**
   * 删除错误
   */
  static deleteError(
    table: string,
    originalError?: Error
  ): DatabaseError {
    return new DatabaseError(
      `删除${table}数据失败`,
      ErrorCodes.DATABASE_ERROR,
      500,
      { table, operation: 'delete' },
      originalError
    );
  }

  /**
   * 系统组保护错误
   */
  static systemGroupProtected(): DatabaseError {
    return new DatabaseError(
      'Cannot delete system group (inbox)',
      ErrorCodes.FORBIDDEN,
      403,
      { table: 'groups', operation: 'delete' }
    );
  }
}
