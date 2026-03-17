'use client';

import { useState, useCallback, useRef } from 'react';

import {
  AppError,
  wrapError,
  toFrontendError,
  type FrontendError,
} from './errorHandler';
import type { ErrorHandlerConfig, FrontendErrorInfo, ToastType } from './errorTypes';

/**
 * useErrorHandler - React Hook for error handling
 *
 * 提供前端统一的错误处理能力，包括：
 * - 错误状态管理
 * - 错误恢复
 * - Toast通知
 * - 重试机制
 */

export interface UseErrorHandlerOptions extends Partial<ErrorHandlerConfig> {
  onError?: (error: AppError, frontendError: FrontendErrorInfo) => void;
  onRetry?: () => void;
}

export interface UseErrorHandlerReturn {
  // 错误状态
  error: AppError | null;
  errorInfo: FrontendErrorInfo | null;
  hasError: boolean;

  // 加载状态
  isLoading: boolean;
  isRetrying: boolean;

  // 操作函数
  handleError: (error: unknown) => void;
  clearError: () => void;
  execute: <T>(
    promise: Promise<T>,
    options?: ExecuteOptions<T>
  ) => Promise<T | null>;
  retry: () => void;

  // Toast支持
  showToast: (message: string, type?: ToastType) => void;
}

export interface ExecuteOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  errorMessage?: string;
  showErrorToast?: boolean;
  retryable?: boolean;
}

/**
 * 默认配置
 */
const defaultOptions: ErrorHandlerConfig = {
  logErrors: true,
  showToast: true,
  toastDuration: 5000,
  retryAttempts: 3,
  retryDelay: 1000,
};

export function useErrorHandler(
  options: UseErrorHandlerOptions = {}
): UseErrorHandlerReturn {
  const config = { ...defaultOptions, ...options };

  // 错误状态
  const [error, setError] = useState<AppError | null>(null);
  const [errorInfo, setErrorInfo] = useState<FrontendErrorInfo | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRetrying, setIsRetrying] = useState(false);

  // 使用ref保存回调，避免依赖问题
  const lastOperationRef = useRef<(() => Promise<void>) | null>(null);

  /**
   * 处理错误
   */
  const handleError = useCallback((err: unknown) => {
    const appError = wrapError(err);
    const frontendErr = toFrontendError(appError);

    setError(appError);
    setErrorInfo(frontendErr);

    // 记录错误
    if (config.logErrors) {
      console.error('[ErrorHandler]', appError);
    }

    // 调用外部错误处理器
    options.onError?.(appError, frontendErr);

    return appError;
  }, [config.logErrors, options]);

  /**
   * 清除错误
   */
  const clearError = useCallback(() => {
    setError(null);
    setErrorInfo(null);
    lastOperationRef.current = null;
  }, []);

  /**
   * 显示Toast（简化版，实际使用时配合Toast组件）
   */
  const showToast = useCallback((message: string, type: ToastType = 'info') => {
    // 实际项目中，这里应该调用Toast系统的show方法
    // 例如: toast.show({ message, type, duration: config.toastDuration })
    if (config.showToast) {
      console.log(`[Toast:${type}]`, message);
    }
  }, [config.showToast]);

  /**
   * 执行异步操作
   */
  const execute = useCallback(async <T,>(
    promise: Promise<T>,
    executeOptions: ExecuteOptions<T> = {}
  ): Promise<T | null> => {
    const {
      onSuccess,
      onError,
      showErrorToast = true,
      retryable = false,
    } = executeOptions;

    setIsLoading(true);
    clearError();

    try {
      const data = await promise;

      onSuccess?.(data);
      return data;
    } catch (err) {
      const appError = handleError(err);

      // 显示错误Toast
      if (showErrorToast && errorInfo) {
        showToast(errorInfo.userMessage, errorInfo.type);
      }

      onError?.(appError);

      // 如果可重试，保存操作
      if (retryable) {
        lastOperationRef.current = async () => {
          await execute(promise, executeOptions);
        };
      }

      return null;
    } finally {
      setIsLoading(false);
    }
  }, [clearError, handleError, showToast, errorInfo]);

  /**
   * 重试上次操作
   */
  const retry = useCallback(() => {
    if (lastOperationRef.current) {
      setIsRetrying(true);
      options.onRetry?.();
      lastOperationRef.current().finally(() => {
        setIsRetrying(false);
      });
    }
  }, [options]);

  return {
    error,
    errorInfo,
    hasError: error !== null,
    isLoading,
    isRetrying,
    handleError,
    clearError,
    execute,
    retry,
    showToast,
  };
}

/**
 * useAsync - 简化异步操作的Hook
 *
 * 自动处理loading和error状态
 */
export interface UseAsyncOptions<T> {
  onSuccess?: (data: T) => void;
  onError?: (error: AppError) => void;
  initialData?: T;
  immediate?: boolean;
}

export interface UseAsyncReturn<T> {
  data: T | undefined;
  error: AppError | null;
  isLoading: boolean;
  isError: boolean;
  execute: (...args: any[]) => Promise<T | null>;
  reset: () => void;
}

export function useAsync<T>(
  asyncFunction: (...args: any[]) => Promise<T>,
  options: UseAsyncOptions<T> = {}
): UseAsyncReturn<T> {
  const { onSuccess, onError, initialData, immediate = false } = options;

  const [data, setData] = useState<T | undefined>(initialData);
  const [error, setError] = useState<AppError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const execute = useCallback(async (...args: any[]): Promise<T | null> => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await asyncFunction(...args);
      setData(result);
      onSuccess?.(result);
      return result;
    } catch (err) {
      const appError = wrapError(err);
      setError(appError);
      onError?.(appError);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [asyncFunction, onSuccess, onError]);

  const reset = useCallback(() => {
    setData(initialData);
    setError(null);
    setIsLoading(false);
  }, [initialData]);

  // 如果需要立即执行
  // 注意：这里使用useEffect会有lint警告，实际使用时应根据具体场景决定

  return {
    data,
    error,
    isLoading,
    isError: error !== null,
    execute,
    reset,
  };
}

export default useErrorHandler;
