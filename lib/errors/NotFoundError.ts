/**
 * NotFoundError - 资源未找到错误
 *
 * 用于请求的资源不存在时
 * HTTP Status: 404 Not Found
 */

import { AppError, ErrorCodes } from './AppError';

export interface NotFoundContext {
  resourceType: string;
  resourceId?: string | number;
  [key: string]: unknown;
}

export class NotFoundError extends AppError {
  public readonly resourceType: string;
  public readonly resourceId?: string | number;

  constructor(
    resourceType: string,
    resourceId?: string | number,
    message?: string
  ) {
    const defaultMessage = resourceId
      ? `${resourceType} with id '${resourceId}' not found`
      : `${resourceType} not found`;

    super(
      message || defaultMessage,
      ErrorCodes.NOT_FOUND,
      404,
      true,
      { resourceType, resourceId }
    );
    this.resourceType = resourceType;
    this.resourceId = resourceId;
  }

  /**
   * 创建纸张未找到错误
   */
  static paper(id: number): NotFoundError {
    return new NotFoundError('Paper', id);
  }

  /**
   * 创建高亮未找到错误
   */
  static highlight(id: number): NotFoundError {
    return new NotFoundError('Highlight', id);
  }

  /**
   * 创建分组未找到错误
   */
  static group(id: number): NotFoundError {
    return new NotFoundError('Group', id);
  }

  /**
   * 创建线索卡片未找到错误
   */
  static clueCard(id: number): NotFoundError {
    return new NotFoundError('ClueCard', id);
  }

  /**
   * 创建情报简报未找到错误
   */
  static intelligenceBrief(id: number): NotFoundError {
    return new NotFoundError('IntelligenceBrief', id);
  }

  /**
   * 创建路由未找到错误
   */
  static route(path: string): NotFoundError {
    return new NotFoundError('Route', path, `Route '${path}' not found`);
  }
}
