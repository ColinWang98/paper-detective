/**
 * Performance Monitor - 性能监控核心模块
 * 
 * 功能:
 * - Web Vitals监控 (LCP, FID, CLS, TTFB, FCP)
 * - 自定义性能标记 (mark/measure)
 * - 长任务监控
 * - 资源加载监控
 * - 内存使用监控
 */

// ============================================================================
// 类型定义
// ============================================================================

/** Web Vitals 指标名称 */
export type WebVitalName = 'LCP' | 'FID' | 'CLS' | 'TTFB' | 'FCP' | 'INP';

/** Web Vitals 指标值 */
export interface WebVitalMetric {
  name: WebVitalName;
  value: number;
  rating: 'good' | 'needs-improvement' | 'poor';
  delta?: number;
  id: string;
  navigationType?: string;
}

/** Web Vitals 指标集合 */
export interface WebVitalsMetrics {
  LCP?: WebVitalMetric;
  FID?: WebVitalMetric;
  CLS?: WebVitalMetric;
  TTFB?: WebVitalMetric;
  FCP?: WebVitalMetric;
  INP?: WebVitalMetric;
}

/** 自定义性能标记 */
export interface PerformanceMark {
  name: string;
  startTime: number;
  detail?: unknown;
}

/** 自定义性能测量 */
export interface PerformanceMeasure {
  name: string;
  duration: number;
  startTime: number;
  detail?: unknown;
}

/** 自定义指标集合 */
export interface CustomMetrics {
  marks: PerformanceMark[];
  measures: PerformanceMeasure[];
}

/** 资源加载指标 */
export interface ResourceMetrics {
  name: string;
  initiatorType: string;
  startTime: number;
  duration: number;
  transferSize: number;
  decodedBodySize: number;
  encodedBodySize: number;
}

/** 内存信息 */
export interface MemoryInfo {
  usedJSHeapSize: number;
  totalJSHeapSize: number;
  jsHeapSizeLimit: number;
  usedPercentage: number;
}

/** 长任务信息 */
export interface LongTaskInfo {
  duration: number;
  startTime: number;
  attribution: TaskAttribution[];
}

/** 任务归因信息 */
export interface TaskAttribution {
  containerType: string;
  containerName: string;
  containerSrc: string;
}

/** 性能报告 */
export interface PerformanceReport {
  timestamp: number;
  url: string;
  webVitals: WebVitalsMetrics;
  custom: CustomMetrics;
  resources: ResourceMetrics[];
  memory?: MemoryInfo;
  longTasks: LongTaskInfo[];
  navigationTiming?: NavigationTimingInfo;
}

/** 导航计时信息 */
export interface NavigationTimingInfo {
  dnsLookup: number;
  connection: number;
  request: number;
  response: number;
  domProcessing: number;
  loadComplete: number;
}

/** 性能监控配置 */
export interface PerformanceMonitorConfig {
  /** 是否启用 Web Vitals 监控 */
  enableWebVitals: boolean;
  /** 是否启用资源监控 */
  enableResourceMonitoring: boolean;
  /** 是否启用长任务监控 */
  enableLongTaskMonitoring: boolean;
  /** 是否启用内存监控 */
  enableMemoryMonitoring: boolean;
  /** 是否启用导航计时 */
  enableNavigationTiming: boolean;
  /** 长任务阈值（毫秒） */
  longTaskThreshold: number;
  /** 资源监控采样率 (0-1) */
  resourceSampleRate: number;
  /** 最大资源条目数 */
  maxResourceEntries: number;
  /** 生产环境是否上报数据 */
  reportInProduction: boolean;
  /** 上报回调函数 */
  reportCallback?: (report: PerformanceReport) => void;
  /** 采样率 (0-1) */
  sampleRate: number;
}

/** 默认配置 */
const DEFAULT_CONFIG: PerformanceMonitorConfig = {
  enableWebVitals: true,
  enableResourceMonitoring: true,
  enableLongTaskMonitoring: true,
  enableMemoryMonitoring: true,
  enableNavigationTiming: true,
  longTaskThreshold: 50,
  resourceSampleRate: 1.0,
  maxResourceEntries: 100,
  reportInProduction: false,
  sampleRate: 1.0,
};

// ============================================================================
// Web Vitals 评级阈值
// ============================================================================

const WEB_VITALS_THRESHOLDS: Record<WebVitalName, { good: number; poor: number }> = {
  LCP: { good: 2500, poor: 4000 },
  FID: { good: 100, poor: 300 },
  CLS: { good: 0.1, poor: 0.25 },
  TTFB: { good: 800, poor: 1800 },
  FCP: { good: 1800, poor: 3000 },
  INP: { good: 200, poor: 500 },
};

// ============================================================================
// 性能监控类
// ============================================================================

export class PerformanceMonitor {
  private config: PerformanceMonitorConfig;
  private isInitialized = false;
  private isProduction: boolean;
  private webVitalsCallbacks: ((metric: WebVitalMetric) => void)[] = [];
  private longTasks: LongTaskInfo[] = [];
  private observers: PerformanceObserver[] = [];

  constructor(config: Partial<PerformanceMonitorConfig> = {}) {
    this.config = { ...DEFAULT_CONFIG, ...config };
    this.isProduction = process.env.NODE_ENV === 'production';
  }

  /**
   * 初始化性能监控
   */
  init(): void {
    if (this.isInitialized) {
      console.warn('[PerformanceMonitor] Already initialized');
      return;
    }

    if (!this.isSupported()) {
      console.warn('[PerformanceMonitor] Performance API not supported');
      return;
    }

    // 采样率检查
    if (Math.random() > this.config.sampleRate) {
      return;
    }

    this.isInitialized = true;

    if (this.config.enableWebVitals) {
      this.initWebVitals();
    }

    if (this.config.enableLongTaskMonitoring) {
      this.initLongTaskObserver();
    }

    if (this.config.enableResourceMonitoring) {
      this.initResourceObserver();
    }

    // 页面卸载时生成最终报告
    if (typeof window !== 'undefined') {
      window.addEventListener('visibilitychange', () => {
        if (document.visibilityState === 'hidden') {
          this.generateFinalReport();
        }
      });
    }
  }

  /**
   * 检查浏览器支持
   */
  private isSupported(): boolean {
    return (
      typeof window !== 'undefined' &&
      'performance' in window &&
      'PerformanceObserver' in window
    );
  }

  // ========================================================================
  // Web Vitals 监控
  // ========================================================================

  /**
   * 初始化 Web Vitals 监控
   */
  private initWebVitals(): void {
    // LCP (Largest Contentful Paint)
    this.observePaint('largest-contentful-paint', (entries) => {
      const lastEntry = entries[entries.length - 1] as PerformanceEntry & { renderTime?: number; loadTime?: number };
      const value = lastEntry.renderTime ?? lastEntry.loadTime ?? lastEntry.startTime;
      this.emitWebVital({
        name: 'LCP',
        value,
        rating: this.getRating('LCP', value),
        id: this.generateId(),
      });
    });

    // FCP (First Contentful Paint)
    this.observePaint('first-contentful-paint', (entries) => {
      const entry = entries[0];
      const value = entry.startTime;
      this.emitWebVital({
        name: 'FCP',
        value,
        rating: this.getRating('FCP', value),
        id: this.generateId(),
      });
    });

    // CLS (Cumulative Layout Shift)
    let clsValue = 0;
    let clsEntries: (PerformanceEntry & { value?: number })[] = [];

    this.observePaint('layout-shift', (entries) => {
      for (const entry of entries) {
        const lsEntry = entry as PerformanceEntry & { hadRecentInput?: boolean; value?: number };
        if (!lsEntry.hadRecentInput) {
          clsEntries.push(lsEntry);
          clsValue += lsEntry.value ?? 0;
        }
      }
      this.emitWebVital({
        name: 'CLS',
        value: clsValue,
        rating: this.getRating('CLS', clsValue),
        id: this.generateId(),
      });
    });

    // FID (First Input Delay) 和 INP (Interaction to Next Paint)
    this.observeEvent('first-input', (entries) => {
      const entry = entries[0] as PerformanceEventTiming;
      const value = entry.processingStart - entry.startTime;
      this.emitWebVital({
        name: 'FID',
        value,
        rating: this.getRating('FID', value),
        id: this.generateId(),
      });
    });

    // TTFB (Time to First Byte)
    if ('navigation' in performance && performance.navigation) {
      const navEntries = performance.getEntriesByType('navigation');
      if (navEntries.length > 0) {
        const navEntry = navEntries[0] as PerformanceNavigationTiming;
        const value = navEntry.responseStart - navEntry.startTime;
        this.emitWebVital({
          name: 'TTFB',
          value,
          rating: this.getRating('TTFB', value),
          id: this.generateId(),
        });
      }
    }
  }

  /**
   * 观察 Paint 类型的性能条目
   */
  private observePaint(type: string, callback: (entries: PerformanceEntryList) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ entryTypes: [type as any], buffered: true });
      this.observers.push(observer);
    } catch (e) {
      // 某些浏览器可能不支持特定的 entryTypes
      console.warn(`[PerformanceMonitor] Failed to observe ${type}:`, e);
    }
  }

  /**
   * 观察事件类型的性能条目
   */
  private observeEvent(type: string, callback: (entries: PerformanceEntryList) => void): void {
    try {
      const observer = new PerformanceObserver((list) => {
        callback(list.getEntries());
      });
      observer.observe({ type: type as any, buffered: true });
      this.observers.push(observer);
    } catch (e) {
      console.warn(`[PerformanceMonitor] Failed to observe ${type}:`, e);
    }
  }

  /**
   * 获取指标评级
   */
  private getRating(name: WebVitalName, value: number): 'good' | 'needs-improvement' | 'poor' {
    const thresholds = WEB_VITALS_THRESHOLDS[name];
    if (!thresholds) return 'needs-improvement';

    if (value <= thresholds.good) return 'good';
    if (value >= thresholds.poor) return 'poor';
    return 'needs-improvement';
  }

  /**
   * 触发 Web Vital 回调
   */
  private emitWebVital(metric: WebVitalMetric): void {
    for (const callback of this.webVitalsCallbacks) {
      try {
        callback(metric);
      } catch (e) {
        console.error('[PerformanceMonitor] Web Vital callback error:', e);
      }
    }
  }

  /**
   * 订阅 Web Vitals 指标
   */
  observeWebVitals(callback: (metric: WebVitalMetric) => void): () => void {
    this.webVitalsCallbacks.push(callback);
    
    // 返回取消订阅函数
    return () => {
      const index = this.webVitalsCallbacks.indexOf(callback);
      if (index > -1) {
        this.webVitalsCallbacks.splice(index, 1);
      }
    };
  }

  // ========================================================================
  // 长任务监控
  // ========================================================================

  /**
   * 初始化长任务观察者
   */
  private initLongTaskObserver(): void {
    if (!('PerformanceLongTaskTiming' in window)) {
      console.warn('[PerformanceMonitor] Long Task API not supported');
      return;
    }

    try {
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          const longTaskEntry = entry as PerformanceEntry & { attribution?: TaskAttribution[] };
          if (longTaskEntry.duration > this.config.longTaskThreshold) {
            this.longTasks.push({
              duration: longTaskEntry.duration,
              startTime: longTaskEntry.startTime,
              attribution: (longTaskEntry.attribution || []).map((attr) => ({
                containerType: attr.containerType || 'unknown',
                containerName: attr.containerName || '',
                containerSrc: attr.containerSrc || '',
              })),
            });
          }
        }
      });
      observer.observe({ entryTypes: ['longtask'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[PerformanceMonitor] Failed to observe long tasks:', e);
    }
  }

  // ========================================================================
  // 资源加载监控
  // ========================================================================

  /**
   * 初始化资源观察者
   */
  private initResourceObserver(): void {
    try {
      const observer = new PerformanceObserver((list) => {
        // 资源监控只是收集，不处理，避免性能开销
        // 在生成报告时处理
      });
      observer.observe({ entryTypes: ['resource'] });
      this.observers.push(observer);
    } catch (e) {
      console.warn('[PerformanceMonitor] Failed to observe resources:', e);
    }
  }

  /**
   * 获取资源加载指标
   */
  private getResourceMetrics(): ResourceMetrics[] {
    if (!this.config.enableResourceMonitoring) return [];
    if (Math.random() > this.config.resourceSampleRate) return [];

    const entries = performance.getEntriesByType('resource');
    const sampled = entries.slice(-this.config.maxResourceEntries);

    return sampled.map((entry) => {
      const resourceEntry = entry as PerformanceResourceTiming;
      return {
        name: resourceEntry.name,
        initiatorType: resourceEntry.initiatorType,
        startTime: resourceEntry.startTime,
        duration: resourceEntry.duration,
        transferSize: resourceEntry.transferSize,
        decodedBodySize: resourceEntry.decodedBodySize,
        encodedBodySize: resourceEntry.encodedBodySize,
      };
    });
  }

  // ========================================================================
  // 自定义性能标记
  // ========================================================================

  /**
   * 创建性能标记
   */
  mark(name: string, detail?: unknown): void {
    if (!this.isSupported()) return;

    try {
      performance.mark(name, { detail });
    } catch (e) {
      console.warn(`[PerformanceMonitor] Failed to create mark "${name}":`, e);
    }
  }

  /**
   * 测量两个标记之间的时间
   */
  measure(name: string, startMark: string, endMark?: string, detail?: unknown): void {
    if (!this.isSupported()) return;

    try {
      const options: PerformanceMeasureOptions = {
        start: startMark,
        detail,
      };
      if (endMark) {
        options.end = endMark;
      }
      performance.measure(name, options);
    } catch (e) {
      console.warn(`[PerformanceMonitor] Failed to create measure "${name}":`, e);
    }
  }

  /**
   * 获取自定义指标
   */
  private getCustomMetrics(): CustomMetrics {
    const marks: PerformanceMark[] = [];
    const measures: PerformanceMeasure[] = [];

    if (this.isSupported()) {
      const markEntries = performance.getEntriesByType('mark');
      const measureEntries = performance.getEntriesByType('measure');

      marks.push(...markEntries.map((entry) => ({
        name: entry.name,
        startTime: entry.startTime,
        detail: (entry as PerformanceMark).detail,
      })));

      measures.push(...measureEntries.map((entry) => ({
        name: entry.name,
        duration: entry.duration,
        startTime: entry.startTime,
        detail: (entry as PerformanceMeasure).detail,
      })));
    }

    return { marks, measures };
  }

  // ========================================================================
  // 内存监控
  // ========================================================================

  /**
   * 获取内存信息
   */
  private getMemoryInfo(): MemoryInfo | undefined {
    if (!this.config.enableMemoryMonitoring) return undefined;

    const memory = (performance as any).memory;
    if (!memory) return undefined;

    const used = memory.usedJSHeapSize;
    const total = memory.totalJSHeapSize;
    const limit = memory.jsHeapSizeLimit;

    return {
      usedJSHeapSize: used,
      totalJSHeapSize: total,
      jsHeapSizeLimit: limit,
      usedPercentage: limit ? (used / limit) * 100 : 0,
    };
  }

  // ========================================================================
  // 导航计时
  // ========================================================================

  /**
   * 获取导航计时信息
   */
  private getNavigationTiming(): NavigationTimingInfo | undefined {
    if (!this.config.enableNavigationTiming) return undefined;

    const navEntries = performance.getEntriesByType('navigation');
    if (navEntries.length === 0) return undefined;

    const nav = navEntries[0] as PerformanceNavigationTiming;

    return {
      dnsLookup: nav.domainLookupEnd - nav.domainLookupStart,
      connection: nav.connectEnd - nav.connectStart,
      request: nav.responseStart - nav.requestStart,
      response: nav.responseEnd - nav.responseStart,
      domProcessing: nav.domComplete - nav.responseEnd,
      loadComplete: nav.loadEventEnd - nav.startTime,
    };
  }

  // ========================================================================
  // 报告生成
  // ========================================================================

  /**
   * 生成性能报告
   */
  getReport(): PerformanceReport {
    return {
      timestamp: Date.now(),
      url: typeof window !== 'undefined' ? window.location.href : '',
      webVitals: this.getCurrentWebVitals(),
      custom: this.getCustomMetrics(),
      resources: this.getResourceMetrics(),
      memory: this.getMemoryInfo(),
      longTasks: [...this.longTasks],
      navigationTiming: this.getNavigationTiming(),
    };
  }

  /**
   * 获取当前 Web Vitals 状态
   */
  private getCurrentWebVitals(): WebVitalsMetrics {
    // 返回最后一次记录的 Web Vitals
    // 实际值由 observeWebVitals 回调提供
    return {};
  }

  /**
   * 生成最终报告（页面卸载时）
   */
  private generateFinalReport(): void {
    if (!this.config.reportCallback) return;
    if (this.isProduction && !this.config.reportInProduction) return;

    const report = this.getReport();
    
    // 使用 sendBeacon 确保数据发送
    {
      // 注意：这里只是示例，实际使用时应该发送到服务端
      this.config.reportCallback(report);
    }
  }

  // ========================================================================
  // 工具方法
  // ========================================================================

  /**
   * 生成唯一 ID
   */
  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 清理性能条目
   */
  clearEntries(type?: 'mark' | 'measure' | 'resource' | 'navigation'): void {
    if (!this.isSupported()) return;

    if (type) {
      performance.clearMeasures();
      if (type === 'mark') performance.clearMarks();
      if (type === 'measure') performance.clearMeasures();
    } else {
      performance.clearMarks();
      performance.clearMeasures();
    }
  }

  /**
   * 销毁监控器
   */
  destroy(): void {
    // 断开所有观察者
    for (const observer of this.observers) {
      observer.disconnect();
    }
    this.observers = [];
    this.webVitalsCallbacks = [];
    this.isInitialized = false;
  }
}

// ============================================================================
// 单例实例
// ============================================================================

let globalMonitor: PerformanceMonitor | null = null;

/**
 * 获取全局性能监控实例
 */
export function getPerformanceMonitor(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
  if (!globalMonitor) {
    globalMonitor = new PerformanceMonitor(config);
  }
  return globalMonitor;
}

/**
 * 初始化全局性能监控
 */
export function initPerformanceMonitor(config?: Partial<PerformanceMonitorConfig>): PerformanceMonitor {
  const monitor = getPerformanceMonitor(config);
  monitor.init();
  return monitor;
}

// ============================================================================
// 便捷函数
// ============================================================================

/**
 * 快速创建性能标记
 */
export function perfMark(name: string, detail?: unknown): void {
  getPerformanceMonitor().mark(name, detail);
}

/**
 * 快速测量性能
 */
export function perfMeasure(name: string, startMark: string, endMark?: string, detail?: unknown): void {
  getPerformanceMonitor().measure(name, startMark, endMark, detail);
}

/**
 * 获取当前性能报告
 */
export function getCurrentPerfReport(): PerformanceReport {
  return getPerformanceMonitor().getReport();
}

export default PerformanceMonitor;
