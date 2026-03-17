/**
 * Store Error Handler - Store层错误处理工具
 *
 * 为Zustand Store提供统一的错误处理能力
 */

import {
  DatabaseError,
  wrapDatabaseError,
  toFrontendError,
  type FrontendError,
} from './errorHandler';
import { AppError } from './errors';
import { getErrorMessage } from './errorTypes';

export interface StoreErrorState {
  error: string | null;
  errorCode: string | null;
  isLoading: boolean;
}

export interface StoreErrorActions {
  setError: (error: string | null, code?: string | null) => void;
  clearError: () => void;
  setLoading: (loading: boolean) => void;
}

/**
 * Store错误处理配置
 */
export interface StoreErrorConfig {
  showToast?: boolean;
  logErrors?: boolean;
  operationName?: string;
}

/**
 * 包装Store异步操作
 *
 * @example
 * loadPapers: async () => {
 *   await handleStoreOperation(
 *     async () => {
 *       const papers = await dbHelpers.getAllPapers();
 *       set({ papers });
 *     },
 *     { set, get },
 *     { operationName: 'loadPapers' }
 *   );
 * },
 */
export async function handleStoreOperation<T>(
  operation: () => Promise<T>,
  storeApi: { set: (state: Partial<StoreErrorState>) => void; get: () => any },
  config: StoreErrorConfig = {}
): Promise<T | null> {
  const { set } = storeApi;
  const { operationName = 'operation', showToast = true, logErrors = true } = config;

  set({ isLoading: true, error: null, errorCode: null });

  try {
    const result = await operation();
    set({ isLoading: false });
    return result;
  } catch (error) {
    // 包装错误
    const appError = error instanceof DatabaseError
      ? error
      : wrapDatabaseError(error, operationName);

    // 转换为前端错误
    const frontendError = toFrontendError(appError);

    // 记录错误
    if (logErrors) {
      console.error(`[Store:${operationName}]`, appError);
    }

    // 更新状态
    set({
      isLoading: false,
      error: frontendError.userMessage,
      errorCode: frontendError.code,
    });

    // 显示Toast（实际项目中这里应该调用Toast系统）
    if (showToast) {
      // toast.error(frontendError.userMessage);
    }

    return null;
  }
}

/**
 * 包装乐观更新操作
 *
 * @example
 * addHighlight: async (highlight) => {
 *   const tempId = Date.now();
 *
 *   await handleOptimisticUpdate(
 *     {
 *       // 乐观更新
 *       apply: () => set(state => ({
 *         highlights: [...state.highlights, { ...highlight, id: tempId }]
 *       })),
 *       // 实际操作
 *       commit: async () => await dbHelpers.addHighlight(highlight),
 *       // 成功处理
 *       onSuccess: (id) => set(state => ({
 *         highlights: state.highlights.map(h =>
 *           h.id === tempId ? { ...h, id } : h
 *         )
 *       })),
 *       // 回滚操作
 *       rollback: () => set(state => ({
 *         highlights: state.highlights.filter(h => h.id !== tempId)
 *       })),
 *     },
 *     { set, get },
 *     { operationName: 'addHighlight' }
 *   );
 * },
 */
export async function handleOptimisticUpdate<T>(
  operations: {
    apply: () => void;
    commit: () => Promise<T>;
    onSuccess: (result: T) => void;
    rollback: () => void;
  },
  storeApi: { set: (state: Partial<StoreErrorState>) => void; get: () => any },
  config: StoreErrorConfig = {}
): Promise<T | null> {
  const { set } = storeApi;
  const { operationName = 'optimisticUpdate' } = config;

  set({ error: null, errorCode: null });

  try {
    // 应用乐观更新
    operations.apply();

    // 执行实际操作
    const result = await operations.commit();

    // 提交成功结果
    operations.onSuccess(result);

    return result;
  } catch (error) {
    // 回滚
    operations.rollback();

    // 包装并处理错误
    const appError = wrapDatabaseError(error, operationName);
    const frontendError = toFrontendError(appError);

    set({
      error: frontendError.userMessage,
      errorCode: frontendError.code,
    });

    return null;
  }
}

/**
 * 创建错误选择器
 *
 * 用于从Store中提取错误信息
 */
export function createErrorSelectors<T extends StoreErrorState>(
  store: T
) {
  return {
    hasError: () => store.error !== null,
    getError: () => store.error,
    getErrorCode: () => store.errorCode,
    isOperationalError: () => {
      // 这里可以根据errorCode判断是否为运营错误
      return store.errorCode !== null && store.errorCode !== 'DATABASE_ERROR';
    },
    getRetryable: () => {
      const retryableCodes = [
        'AI_NETWORK_ERROR',
        'AI_RATE_LIMIT',
        'NETWORK_ERROR',
        'TIMEOUT_ERROR',
      ];
      return store.errorCode !== null && retryableCodes.includes(store.errorCode);
    },
  };
}

/**
 * 格式化错误消息
 */
export function formatErrorMessage(error: unknown): string {
  if (error instanceof AppError) {
    return error.message;
  }
  return getErrorMessage(error);
}

/**
 * 检查错误是否可重试
 */
export function isRetryableError(error: unknown): boolean {
  if (!(error instanceof AppError)) {
    return false;
  }

  const retryableCodes = [
    'AI_NETWORK_ERROR',
    'AI_RATE_LIMIT',
    'NETWORK_ERROR',
    'TIMEOUT_ERROR',
  ];

  return retryableCodes.includes(error.code);
}
