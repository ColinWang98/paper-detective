'use client';

import { useCallback, useRef, useEffect, useState } from 'react';

export interface UseIntersectionObserverOptions {
  /** Intersection Observer 选项 */
  options?: IntersectionObserverInit;
  /** 是否只触发一次 */
  once?: boolean;
  /** 初始状态 */
  initialIsIntersecting?: boolean;
}

export interface UseIntersectionObserverReturn {
  /**  ref 回调函数，用于绑定到目标元素 */
  ref: (node: Element | null) => void;
  /** 当前是否在视口中 */
  isIntersecting: boolean;
  /** 交集中的边界信息 */
  intersectionRatio: number;
  /** 观察器实例（高级用法） */
  observer: IntersectionObserver | null;
}

/**
 * Intersection Observer Hook
 * 
 * 用于监听元素是否进入视口，支持懒加载、无限滚动等场景
 * 
 * @example
 * // 基础用法 - 懒加载图片
 * const { ref, isIntersecting } = useIntersectionObserver({ once: true });
 * 
 * @example
 * // 高级用法 - 带阈值和rootMargin
 * const { ref, isIntersecting } = useIntersectionObserver({
 *   options: {
 *     rootMargin: '100px',
 *     threshold: [0, 0.5, 1],
 *   },
 *   once: false,
 * });
 */
export function useIntersectionObserver(
  callback?: (isIntersecting: boolean, entry: IntersectionObserverEntry) => void,
  {
    options = {},
    once = false,
    initialIsIntersecting = false,
  }: UseIntersectionObserverOptions = {}
): UseIntersectionObserverReturn {
  const [isIntersecting, setIsIntersecting] = useState(initialIsIntersecting);
  const [intersectionRatio, setIntersectionRatio] = useState(0);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const elementRef = useRef<Element | null>(null);
  const hasTriggeredRef = useRef(false);
  const callbackRef = useRef(callback);

  // 保持 callback 引用最新
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // 清理观察器
  const cleanup = useCallback(() => {
    if (observerRef.current) {
      observerRef.current.disconnect();
      observerRef.current = null;
    }
  }, []);

  // ref 回调
  const ref = useCallback(
    (node: Element | null) => {
      // 清理之前的观察
      cleanup();

      if (!node) {
        elementRef.current = null;
        return;
      }

      elementRef.current = node;

      // 如果已经触发过一次且设置了一次性模式，则不再观察
      if (once && hasTriggeredRef.current) {
        return;
      }

      // 创建新的观察器
      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const newIsIntersecting = entry.isIntersecting;
            const ratio = entry.intersectionRatio;

            setIsIntersecting(newIsIntersecting);
            setIntersectionRatio(ratio);

            // 调用用户回调
            callbackRef.current?.(newIsIntersecting, entry);

            // 一次性模式：进入视口后停止观察
            if (once && newIsIntersecting && !hasTriggeredRef.current) {
              hasTriggeredRef.current = true;
              observer.unobserve(entry.target);
            }
          });
        },
        {
          root: options.root ?? null,
          rootMargin: options.rootMargin ?? '0px',
          threshold: options.threshold ?? 0,
        }
      );

      observerRef.current = observer;
      observer.observe(node);
    },
    [cleanup, once, options.root, options.rootMargin, options.threshold]
  );

  // 组件卸载时清理
  useEffect(() => {
    return cleanup;
  }, [cleanup]);

  return {
    ref,
    isIntersecting,
    intersectionRatio,
    observer: observerRef.current,
  };
}

/**
 * 简化的 useIntersectionObserver 版本
 * 直接返回 ref 回调，用于简单的懒加载场景
 * 
 * @example
 * const setRef = useIntersectionObserverSimple(
 *   (isIntersecting) => { console.log(isIntersecting); },
 *   { rootMargin: '100px' },
 *   true
 * );
 * 
 * <div ref={setRef}>Lazy content</div>
 */
export function useIntersectionObserverSimple(
  callback: (isIntersecting: boolean) => void,
  options?: IntersectionObserverInit,
  once?: boolean
): (node: Element | null) => void {
  const observerRef = useRef<IntersectionObserver | null>(null);
  const hasTriggeredRef = useRef(false);
  const callbackRef = useRef(callback);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  return useCallback(
    (node: Element | null) => {
      // 清理之前的观察器
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }

      if (!node) return;

      // 如果已经触发过一次且设置了一次性模式，则不再观察
      if (once && hasTriggeredRef.current) {
        return;
      }

      const observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            const isIntersecting = entry.isIntersecting;
            callbackRef.current(isIntersecting);

            // 一次性模式
            if (once && isIntersecting && !hasTriggeredRef.current) {
              hasTriggeredRef.current = true;
              observer.unobserve(entry.target);
            }
          });
        },
        {
          root: options?.root ?? null,
          rootMargin: options?.rootMargin ?? '0px',
          threshold: options?.threshold ?? 0,
        }
      );

      observerRef.current = observer;
      observer.observe(node);

      // 清理函数
      return () => {
        observer.disconnect();
      };
    },
    [options?.root, options?.rootMargin, options?.threshold, once]
  );
}

export default useIntersectionObserver;
