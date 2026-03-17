/**
 * Performance Module - Paper Detective 性能监控模块
 * 
 * 导出所有性能监控相关的功能
 */

// ============================================================================
// 核心监控功能
// ============================================================================

export {
  // 主要类
  PerformanceMonitor,
  
  // 便捷函数
  getPerformanceMonitor,
  initPerformanceMonitor,
  perfMark,
  perfMeasure,
  getCurrentPerfReport,
} from './monitor';

// ============================================================================
// 类型定义
// ============================================================================

export type {
  // Web Vitals
  WebVitalName,
  WebVitalMetric,
  WebVitalsMetrics,
  
  // 自定义指标
  PerformanceMark,
  PerformanceMeasure,
  CustomMetrics,
  
  // 资源和内存
  ResourceMetrics,
  MemoryInfo,
  LongTaskInfo,
  TaskAttribution,
  
  // 报告和配置
  PerformanceReport,
  NavigationTimingInfo,
  PerformanceMonitorConfig,
} from './monitor';

// ============================================================================
// React Hooks
// ============================================================================

export {
  // 主要 Hook
  usePerformance,
  useWebVitals,
  useRenderHighlight,
  useThrottleRender,
  useFrameRate,
  
  // 工具函数
  measureAsync,
  measureSync,
} from './usePerformance';

export type {
  // Hook 类型
  RenderPerformanceInfo,
  RenderEntry,
  UsePerformanceConfig,
  ComponentPerformanceReport,
  MemorySnapshot,
  MemoryLeakInfo,
  UseWebVitalsReturn,
} from './usePerformance';

// ============================================================================
// 虚拟列表
// ============================================================================

export {
  // 核心算法
  calculateVisibleRange,
  createVirtualListState,
  updateItemMeasurement,
  getItemPosition,
  getRenderItems,
  scrollToIndex,
  findVisibleItemIndex,
  getScrollDirection,
  getScrollVelocity,
  shouldUpdateRange,
  
  // 控制器
  VirtualListController,
  
  // 样式工具
  getContainerStyle,
  getContentStyle,
  
  // 配置创建
  createFixedHeightConfig,
  createDynamicHeightConfig,
  estimateAverageItemHeight,
} from './virtualList';

export type {
  // 虚拟列表类型
  VirtualListConfig,
  VisibleRange,
  VirtualListState,
  ItemPosition,
  ItemMeasurement,
  ScrollDirection,
  ScrollState,
  RenderItem,
} from './virtualList';
