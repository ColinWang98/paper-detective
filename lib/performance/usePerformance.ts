/**
 * usePerformance Hook - React性能监控Hook
 * 
 * 功能:
 * - React Hook封装
 * - 组件性能追踪
 * - 渲染时间测量
 * - 内存泄漏检测
 */

import { useEffect, useRef, useCallback, useState, useLayoutEffect } from 'react';
import { PerformanceMonitor, WebVitalMetric, PerformanceReport } from './monitor';

// ============================================================================
// 类型定义
// ============================================================================

/** 渲染性能信息 */
export interface RenderPerformanceInfo {
  /** 渲染次数 */
  renderCount: number;
  /** 首次渲染时间 */
  firstRenderTime: number | null;
  /** 上次渲染时间 */
  lastRenderTime: number | null;
  /** 平均渲染时间 */
  averageRenderTime: number;
  /** 最长渲染时间 */
  maxRenderTime: number;
  /** 渲染时间历史 */
  renderHistory: RenderEntry[];
}

/** 渲染条目 */
export interface RenderEntry {
  timestamp: number;
  duration: number;
  phase: 'mount' | 'update' | 'unmount';
}

/** 组件性能配置 */
export interface UsePerformanceConfig {
  /** 是否追踪渲染性能 */
  trackRender?: boolean;
  /** 渲染时间阈值（毫秒），超过则警告 */
  renderThreshold?: number;
  /** 是否检测内存泄漏 */
  detectMemoryLeak?: boolean;
  /** 内存泄漏检查间隔（毫秒） */
  memoryCheckInterval?: number;
  /** 内存增长阈值（百分比） */
  memoryGrowthThreshold?: number;
  /** 是否在生产环境启用 */
  enableInProduction?: boolean;
  /** 组件名称 */
  componentName?: string;
  /** 性能报告回调 */
  onPerformanceReport?: (report: ComponentPerformanceReport) => void;
  /** 慢渲染回调 */
  onSlowRender?: (info: RenderEntry) => void;
  /** 内存泄漏警告回调 */
  onMemoryLeakWarning?: (info: MemoryLeakInfo) => void;
}

/** 组件性能报告 */
export interface ComponentPerformanceReport {
  componentName: string;
  renderInfo: RenderPerformanceInfo;
  memorySnapshots: MemorySnapshot[];
  duration: number;
}

/** 内存快照 */
export interface MemorySnapshot {
  timestamp: number;
  usedJSHeapSize: number;
  totalJSHeapSize: number;
}

/** 内存泄漏信息 */
export interface MemoryLeakInfo {
  currentUsage: number;
  previousUsage: number;
  growthPercentage: number;
  snapshotCount: number;
}

/** Web Vitals Hook 返回类型 */
export interface UseWebVitalsReturn {
  /** LCP (Largest Contentful Paint) */
  lcp: WebVitalMetric | null;
  /** FID (First Input Delay) */
  fid: WebVitalMetric | null;
  /** CLS (Cumulative Layout Shift) */
  cls: WebVitalMetric | null;
  /** TTFB (Time to First Byte) */
  ttfb: WebVitalMetric | null;
  /** FCP (First Contentful Paint) */
  fcp: WebVitalMetric | null;
  /** INP (Interaction to Next Paint) */
  inp: WebVitalMetric | null;
  /** 所有指标是否已收集 */
  allMetricsCollected: boolean;
}

// ============================================================================
// 默认配置
// ============================================================================

const DEFAULT_CONFIG: UsePerformanceConfig = {
  trackRender: true,
  renderThreshold: 16, // 16ms = 60fps
  detectMemoryLeak: false,
  memoryCheckInterval: 30000, // 30秒
  memoryGrowthThreshold: 50, // 50% 增长
  enableInProduction: false,
};

// ============================================================================
// Hook: usePerformance - 组件性能追踪
// ============================================================================

/**
 * 组件性能追踪 Hook
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { renderInfo, takeMemorySnapshot } = usePerformance({
 *     componentName: 'MyComponent',
 *     trackRender: true,
 *     onSlowRender: (info) => console.warn('Slow render:', info),
 *   });
 *   
 *   return <div>Content</div>;
 * }
 * ```
 */
export function usePerformance(config: UsePerformanceConfig = {}) {
  const mergedConfig = { ...DEFAULT_CONFIG, ...config };
  const isEnabled = mergedConfig.enableInProduction || process.env.NODE_ENV !== 'production';
  
  const renderStartTime = useRef<number>(0);
  const renderCount = useRef(0);
  const renderHistoryRef = useRef<RenderEntry[]>([]);
  const memorySnapshotsRef = useRef<MemorySnapshot[]>([]);
  const memoryCheckTimerRef = useRef<NodeJS.Timeout | null>(null);
  const componentStartTime = useRef(Date.now());
  const isMounted = useRef(false);

  const [renderInfo, setRenderInfo] = useState<RenderPerformanceInfo>({
    renderCount: 0,
    firstRenderTime: null,
    lastRenderTime: null,
    averageRenderTime: 0,
    maxRenderTime: 0,
    renderHistory: [],
  });

  // 内存泄漏检测
  useEffect(() => {
    if (!isEnabled || !mergedConfig.detectMemoryLeak) return;

    const checkMemory = () => {
      const memory = (performance as any).memory;
      if (!memory) return;

      const snapshot: MemorySnapshot = {
        timestamp: Date.now(),
        usedJSHeapSize: memory.usedJSHeapSize,
        totalJSHeapSize: memory.totalJSHeapSize,
      };

      memorySnapshotsRef.current.push(snapshot);

      // 检查内存增长
      if (memorySnapshotsRef.current.length >= 3) {
        const recent = memorySnapshotsRef.current.slice(-3);
        const first = recent[0];
        const last = recent[recent.length - 1];
        const growth = ((last.usedJSHeapSize - first.usedJSHeapSize) / first.usedJSHeapSize) * 100;

        if (growth > (mergedConfig.memoryGrowthThreshold || 50)) {
          const leakInfo: MemoryLeakInfo = {
            currentUsage: last.usedJSHeapSize,
            previousUsage: first.usedJSHeapSize,
            growthPercentage: growth,
            snapshotCount: memorySnapshotsRef.current.length,
          };
          mergedConfig.onMemoryLeakWarning?.(leakInfo);
          
          if (process.env.NODE_ENV === 'development') {
            console.warn(
              `[Performance] Potential memory leak detected in ${mergedConfig.componentName || 'Component'}:`,
              leakInfo
            );
          }
        }
      }
    };

    memoryCheckTimerRef.current = setInterval(
      checkMemory,
      mergedConfig.memoryCheckInterval
    );

    return () => {
      if (memoryCheckTimerRef.current) {
        clearInterval(memoryCheckTimerRef.current);
      }
    };
  }, [isEnabled, mergedConfig]);

  // 渲染开始计时
  useLayoutEffect(() => {
    if (!isEnabled || !mergedConfig.trackRender) return;
    renderStartTime.current = performance.now();
  });

  // 渲染结束处理和性能计算
  useEffect(() => {
    if (!isEnabled || !mergedConfig.trackRender) return;

    const renderEndTime = performance.now();
    const renderDuration = renderEndTime - renderStartTime.current;
    const phase = isMounted.current ? 'update' : 'mount';
    isMounted.current = true;

    renderCount.current += 1;

    const entry: RenderEntry = {
      timestamp: Date.now(),
      duration: renderDuration,
      phase,
    };

    renderHistoryRef.current.push(entry);

    // 限制历史记录长度
    if (renderHistoryRef.current.length > 100) {
      renderHistoryRef.current = renderHistoryRef.current.slice(-100);
    }

    // 计算统计信息
    const history = renderHistoryRef.current;
    const times = history.map((h) => h.duration);
    const avg = times.reduce((a, b) => a + b, 0) / times.length;
    const max = Math.max(...times);

    setRenderInfo({
      renderCount: renderCount.current,
      firstRenderTime: renderInfo.firstRenderTime || renderDuration,
      lastRenderTime: renderDuration,
      averageRenderTime: avg,
      maxRenderTime: max,
      renderHistory: [...history],
    });

    // 慢渲染警告
    if (renderDuration > (mergedConfig.renderThreshold || 16)) {
      mergedConfig.onSlowRender?.(entry);
      
      if (process.env.NODE_ENV === 'development') {
        console.warn(
          `[Performance] Slow render detected in ${mergedConfig.componentName || 'Component'}:`,
          `${renderDuration.toFixed(2)}ms`
        );
      }
    }
  });

  // 组件卸载时生成报告
  useEffect(() => {
    return () => {
      if (!isEnabled) return;
      
      const report: ComponentPerformanceReport = {
        componentName: mergedConfig.componentName || 'Unknown',
        renderInfo: {
          ...renderInfo,
          renderHistory: [...renderHistoryRef.current],
        },
        memorySnapshots: [...memorySnapshotsRef.current],
        duration: Date.now() - componentStartTime.current,
      };

      mergedConfig.onPerformanceReport?.(report);
    };
  }, [isEnabled, mergedConfig.componentName]);

  /**
   * 手动获取内存快照
   */
  const takeMemorySnapshot = useCallback((): MemorySnapshot | null => {
    const memory = (performance as any).memory;
    if (!memory) return null;

    const snapshot: MemorySnapshot = {
      timestamp: Date.now(),
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
    };

    memorySnapshotsRef.current.push(snapshot);
    return snapshot;
  }, []);

  /**
   * 重置性能数据
   */
  const resetPerformanceData = useCallback(() => {
    renderCount.current = 0;
    renderHistoryRef.current = [];
    memorySnapshotsRef.current = [];
    componentStartTime.current = Date.now();
    
    setRenderInfo({
      renderCount: 0,
      firstRenderTime: null,
      lastRenderTime: null,
      averageRenderTime: 0,
      maxRenderTime: 0,
      renderHistory: [],
    });
  }, []);

  return {
    renderInfo,
    takeMemorySnapshot,
    resetPerformanceData,
    isEnabled,
  };
}

// ============================================================================
// Hook: useWebVitals - Web Vitals 监控
// ============================================================================

/**
 * Web Vitals 监控 Hook
 * 
 * @example
 * ```tsx
 * function App() {
 *   const { lcp, fid, cls, allMetricsCollected } = useWebVitals();
 *   
 *   useEffect(() => {
 *     if (allMetricsCollected) {
 *       console.log('All Web Vitals collected:', { lcp, fid, cls });
 *     }
 *   }, [allMetricsCollected]);
 *   
 *   return <div>App Content</div>;
 * }
 * ```
 */
export function useWebVitals(): UseWebVitalsReturn {
  const [metrics, setMetrics] = useState<{
    lcp: WebVitalMetric | null;
    fid: WebVitalMetric | null;
    cls: WebVitalMetric | null;
    ttfb: WebVitalMetric | null;
    fcp: WebVitalMetric | null;
    inp: WebVitalMetric | null;
  }>({
    lcp: null,
    fid: null,
    cls: null,
    ttfb: null,
    fcp: null,
    inp: null,
  });

  useEffect(() => {
    // 动态导入 web-vitals 库或使用内置监控
    const monitor = new PerformanceMonitor();
    monitor.init();

    const unsubscribe = monitor.observeWebVitals((metric) => {
      setMetrics((prev) => {
        const key = metric.name.toLowerCase() as keyof typeof prev;
        return { ...prev, [key]: metric };
      });
    });

    return () => {
      unsubscribe();
      monitor.destroy();
    };
  }, []);

  const allMetricsCollected = 
    metrics.lcp !== null &&
    metrics.fid !== null &&
    metrics.cls !== null &&
    metrics.ttfb !== null &&
    metrics.fcp !== null;

  return {
    lcp: metrics.lcp,
    fid: metrics.fid,
    cls: metrics.cls,
    ttfb: metrics.ttfb,
    fcp: metrics.fcp,
    inp: metrics.inp,
    allMetricsCollected,
  };
}

// ============================================================================
// Hook: useRenderHighlight - 渲染高亮（开发调试用）
// ============================================================================

/**
 * 渲染高亮 Hook（仅开发环境）
 * 
 * 在组件重新渲染时高亮显示组件边框
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const ref = useRenderHighlight();
 *   return <div ref={ref}>Content</div>;
 * }
 * ```
 */
export function useRenderHighlight<T extends HTMLElement = HTMLDivElement>() {
  const ref = useRef<T>(null);
  const renderCount = useRef(0);

  useEffect(() => {
    if (process.env.NODE_ENV === 'production') return;

    renderCount.current += 1;
    const element = ref.current;
    if (!element) return;

    // 高亮颜色根据渲染次数变化
    const hue = (renderCount.current * 60) % 360;
    const originalOutline = element.style.outline;
    const originalBoxShadow = element.style.boxShadow;

    element.style.outline = `3px solid hsl(${hue}, 80%, 50%)`;
    element.style.boxShadow = `0 0 10px hsl(${hue}, 80%, 50%)`;
    element.style.transition = 'outline 0.2s, box-shadow 0.2s';

    // 添加渲染计数标签
    const label = document.createElement('span');
    label.textContent = `${renderCount.current}`;
    label.style.cssText = `
      position: absolute;
      top: -20px;
      right: 0;
      background: hsl(${hue}, 80%, 50%);
      color: white;
      padding: 2px 6px;
      border-radius: 4px;
      font-size: 12px;
      font-family: monospace;
      z-index: 9999;
      pointer-events: none;
    `;

    if (getComputedStyle(element).position === 'static') {
      element.style.position = 'relative';
    }
    element.appendChild(label);

    // 500ms 后移除高亮
    const timeout = setTimeout(() => {
      element.style.outline = originalOutline;
      element.style.boxShadow = originalBoxShadow;
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }
    }, 500);

    return () => {
      clearTimeout(timeout);
      if (label.parentNode) {
        label.parentNode.removeChild(label);
      }
    };
  });

  return ref;
}

// ============================================================================
// Hook: useMemoCompare - 带深度比较的 useMemo
// ============================================================================

/**
 * 带深度比较的 useMemo
 * 
 * @example
 * ```tsx
 * const memoizedValue = useMemoCompare(
 *   () => computeExpensiveValue(deps),
 *   deps,
 *   (prev, next) => isEqual(prev, next)
 * );
 * ```
 */
export function useMemoCompare<T>(
  factory: () => T,
  deps: React.DependencyList,
  compare: (prev: T, next: T) => boolean
): T {
  const memoizedRef = useRef<T | undefined>(undefined);
  const depsRef = useRef<React.DependencyList>([]);

  const hasChanged = deps.length !== depsRef.current.length ||
    deps.some((dep, i) => dep !== depsRef.current[i]);

  if (hasChanged || memoizedRef.current === undefined) {
    const newValue = factory();
    
    if (memoizedRef.current !== undefined && compare(memoizedRef.current, newValue)) {
      // 值相等，保持原引用
      depsRef.current = deps;
      return memoizedRef.current;
    }

    memoizedRef.current = newValue;
    depsRef.current = deps;
  }

  return memoizedRef.current as T;
}

// ============================================================================
// Hook: useThrottleRender - 节流渲染
// ============================================================================

/**
 * 节流渲染 Hook
 * 
 * 限制组件更新频率，适用于高频数据更新场景
 * 
 * @example
 * ```tsx
 * function LiveChart({ data }) {
 *   const throttledData = useThrottleRender(data, 100); // 最多每100ms更新一次
 *   return <Chart data={throttledData} />;
 * }
 * ```
 */
export function useThrottleRender<T>(value: T, limitMs: number): T {
  const [throttledValue, setThrottledValue] = useState(value);
  const lastUpdate = useRef(Date.now());
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastUpdate = now - lastUpdate.current;

    if (timeSinceLastUpdate >= limitMs) {
      // 超过限制时间，立即更新
      lastUpdate.current = now;
      setThrottledValue(value);
    } else {
      // 延迟更新
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      timeoutRef.current = setTimeout(() => {
        lastUpdate.current = Date.now();
        setThrottledValue(value);
      }, limitMs - timeSinceLastUpdate);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [value, limitMs]);

  return throttledValue;
}

// ============================================================================
// Hook: useFrameRate - 帧率监控
// ============================================================================

/**
 * 帧率监控 Hook
 * 
 * @example
 * ```tsx
 * function Game() {
 *   const { fps, isStable } = useFrameRate();
 *   
 *   useEffect(() => {
 *     if (!isStable) {
 *       console.warn('Frame rate dropped:', fps);
 *     }
 *   }, [fps, isStable]);
 *   
 *   return <Canvas />;
 * }
 * ```
 */
export function useFrameRate(targetFps: number = 60) {
  const [fps, setFps] = useState(targetFps);
  const [isStable, setIsStable] = useState(true);
  const frameCount = useRef(0);
  const lastTime = useRef(performance.now());
  const rafId = useRef<number | null>(null);

  useEffect(() => {
    const measureFrameRate = () => {
      frameCount.current += 1;
      const currentTime = performance.now();
      const elapsed = currentTime - lastTime.current;

      if (elapsed >= 1000) {
        const currentFps = Math.round((frameCount.current * 1000) / elapsed);
        setFps(currentFps);
        setIsStable(currentFps >= targetFps * 0.9); // 低于目标90%认为不稳定
        
        frameCount.current = 0;
        lastTime.current = currentTime;
      }

      rafId.current = requestAnimationFrame(measureFrameRate);
    };

    rafId.current = requestAnimationFrame(measureFrameRate);

    return () => {
      if (rafId.current) {
        cancelAnimationFrame(rafId.current);
      }
    };
  }, [targetFps]);

  return { fps, isStable };
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 测量异步操作性能
 * 
 * @example
 * ```ts
 * const result = await measureAsync('fetchData', async () => {
 *   return await fetch('/api/data').then(r => r.json());
 * });
 * ```
 */
export async function measureAsync<T>(
  name: string,
  fn: () => Promise<T>,
  onComplete?: (duration: number) => void
): Promise<T> {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    onComplete?.(duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

/**
 * 测量同步操作性能
 * 
 * @example
 * ```ts
 * const result = measureSync('computeData', () => {
 *   return expensiveComputation();
 * });
 * ```
 */
export function measureSync<T>(
  name: string,
  fn: () => T,
  onComplete?: (duration: number) => void
): T {
  const start = performance.now();
  try {
    const result = fn();
    const duration = performance.now() - start;
    onComplete?.(duration);
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`[Performance] ${name}: ${duration.toFixed(2)}ms`);
    }
    
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    console.error(`[Performance] ${name} failed after ${duration.toFixed(2)}ms`);
    throw error;
  }
}

// ============================================================================
// 导出默认
// ============================================================================

export default usePerformance;
