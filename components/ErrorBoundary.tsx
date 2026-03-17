'use client';

import React, { Component, ErrorInfo, ReactNode } from 'react';

import { AlertCircle, RefreshCcw, Home } from 'lucide-react';

import { AppError } from '@/lib/errors';
import { getErrorMessage } from '@/lib/errorTypes';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
  resetKeys?: Array<string | number>;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

/**
 * ErrorBoundary - React错误边界组件
 *
 * 捕获React组件树中的错误，防止应用崩溃
 */
export class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo): void {
    this.setState({ errorInfo });

    // 调用外部错误处理器
    this.props.onError?.(error, errorInfo);

    // 开发环境打印错误
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // 可集成错误监控服务
    // reportError(error, errorInfo);
  }

  public componentDidUpdate(prevProps: Props): void {
    const { hasError } = this.state;
    const { resetKeys } = this.props;

    // 如果提供了resetKeys，当它们变化时重置错误状态
    if (
      hasError &&
      resetKeys &&
      resetKeys.some((key, index) => key !== prevProps.resetKeys?.[index])
    ) {
      this.resetErrorBoundary();
    }
  }

  private resetErrorBoundary = (): void => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  private handleReload = (): void => {
    window.location.reload();
  };

  private handleGoHome = (): void => {
    window.location.href = '/';
  };

  public render(): ReactNode {
    const { hasError, error } = this.state;
    const { children, fallback } = this.props;

    if (hasError) {
      // 使用自定义fallback
      if (fallback) {
        return fallback;
      }

      // 默认错误UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 p-4">
          <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="w-6 h-6 text-red-600" />
              </div>
              <h2 className="text-lg font-semibold text-gray-900">
                出错了
              </h2>
            </div>

            <p className="text-gray-600 mb-4">
              应用遇到了意外错误，请尝试刷新页面或返回首页。
            </p>

            {process.env.NODE_ENV === 'development' && error && (
              <div className="mb-4 p-3 bg-gray-100 rounded text-sm">
                <p className="font-mono text-red-600 mb-2">
                  {getErrorMessage(error)}
                </p>
                {error instanceof AppError && error.code && (
                  <p className="text-gray-500 text-xs">
                    Error Code: {error.code}
                  </p>
                )}
              </div>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.resetErrorBoundary}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                重试
              </button>
              <button
                onClick={this.handleReload}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <RefreshCcw className="w-4 h-4" />
                刷新
              </button>
              <button
                onClick={this.handleGoHome}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <Home className="w-4 h-4" />
                首页
              </button>
            </div>
          </div>
        </div>
      );
    }

    return children;
  }
}

/**
 * withErrorBoundary HOC - 为组件添加错误边界
 */
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
): React.FC<P> {
  const WrappedComponent: React.FC<P> = (props) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;

  return WrappedComponent;
}

export default ErrorBoundary;
