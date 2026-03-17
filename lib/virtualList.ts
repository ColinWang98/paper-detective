/**
 * 虚拟滚动算法库
 * 
 * 提供高性能的虚拟滚动计算功能，支持：
 * - 固定高度列表
 * - 动态高度列表
 * - 二分查找优化
 * - 预加载计算
 */

// ============================================================================
// 类型定义
// ============================================================================

export interface VirtualItem {
  /** 唯一标识 */
  id: string | number;
  /** 高度（动态高度时为估计值） */
  height: number;
  /** 距离顶部的偏移量 */
  offset: number;
  /** 索引 */
  index: number;
}

export interface VisibleRange {
  /** 起始索引 */
  start: number;
  /** 结束索引 */
  end: number;
  /** 预加载后的起始索引 */
  overscanStart: number;
  /** 预加载后的结束索引 */
  overscanEnd: number;
}

export interface VirtualListState {
  /** 可见范围 */
  visibleRange: VisibleRange;
  /** 总高度 */
  totalHeight: number;
  /** 偏移量 */
  scrollOffset: number;
  /** 是否需要更新 */
  shouldUpdate: boolean;
}

export interface VirtualListOptions {
  /** 总项目数 */
  itemCount: number;
  /** 视口高度 */
  viewportHeight: number;
  /** 预加载数量（每边） */
  overscan?: number;
  /** 估计高度（用于动态高度） */
  estimatedHeight?: number;
  /** 滚动偏移量 */
  scrollOffset: number;
}

// ============================================================================
// 固定高度虚拟列表
// ============================================================================

/**
 * 计算固定高度列表的虚拟状态
 * 
 * @example
 * const state = calculateFixedVirtualState({
 *   itemCount: 1000,
 *   viewportHeight: 400,
 *   itemHeight: 50,
 *   scrollOffset: 500,
 *   overscan: 3,
 * });
 */
export function calculateFixedVirtualState(options: {
  itemCount: number;
  viewportHeight: number;
  itemHeight: number;
  scrollOffset: number;
  overscan?: number;
}): VirtualListState {
  const { itemCount, viewportHeight, itemHeight, scrollOffset, overscan = 2 } = options;

  // 计算总高度
  const totalHeight = itemCount * itemHeight;

  // 计算可见起始索引
  const startIndex = Math.floor(scrollOffset / itemHeight);
  
  // 计算可见项目数
  const visibleCount = Math.ceil(viewportHeight / itemHeight);
  
  // 计算可见结束索引
  const endIndex = Math.min(startIndex + visibleCount, itemCount - 1);

  // 应用预加载
  const overscanStart = Math.max(0, startIndex - overscan);
  const overscanEnd = Math.min(itemCount - 1, endIndex + overscan);

  return {
    visibleRange: {
      start: startIndex,
      end: endIndex,
      overscanStart,
      overscanEnd,
    },
    totalHeight,
    scrollOffset,
    shouldUpdate: true,
  };
}

/**
 * 计算固定高度列表中某项的偏移量
 */
export function getFixedItemOffset(index: number, itemHeight: number): number {
  return index * itemHeight;
}

// ============================================================================
// 动态高度虚拟列表
// ============================================================================

export interface DynamicHeightCache {
  /** 获取指定索引的高度 */
  get(index: number): number;
  /** 设置指定索引的高度 */
  set(index: number, height: number): void;
  /** 清除缓存 */
  clear(): void;
  /** 获取所有测量值 */
  getMeasurements(itemCount: number): VirtualItem[];
  /** 获取总高度 */
  getTotalHeight(itemCount: number): number;
  /** 获取指定索引的偏移量 */
  getOffset(index: number): number;
}

/**
 * 创建动态高度缓存
 */
export function createHeightCache(defaultHeight: number): DynamicHeightCache {
  const cache = new Map<number, number>();

  return {
    get(index: number): number {
      return cache.get(index) ?? defaultHeight;
    },

    set(index: number, height: number): void {
      cache.set(index, height);
    },

    clear(): void {
      cache.clear();
    },

    getMeasurements(itemCount: number): VirtualItem[] {
      const measurements: VirtualItem[] = [];
      let offset = 0;

      for (let i = 0; i < itemCount; i++) {
        const height = this.get(i);
        measurements.push({
          id: i,
          height,
          offset,
          index: i,
        });
        offset += height;
      }

      return measurements;
    },

    getTotalHeight(itemCount: number): number {
      let total = 0;
      for (let i = 0; i < itemCount; i++) {
        total += this.get(i);
      }
      return total;
    },

    getOffset(index: number): number {
      let offset = 0;
      for (let i = 0; i < index; i++) {
        offset += this.get(i);
      }
      return offset;
    },
  };
}

/**
 * 二分查找找到指定偏移量对应的索引
 */
export function findStartIndex(measurements: VirtualItem[], scrollOffset: number): number {
  let start = 0;
  let end = measurements.length - 1;

  while (start <= end) {
    const middle = Math.floor((start + end) / 2);
    const currentOffset = measurements[middle].offset;

    if (currentOffset === scrollOffset) {
      return middle;
    } else if (currentOffset < scrollOffset) {
      start = middle + 1;
    } else {
      end = middle - 1;
    }
  }

  return Math.max(0, start - 1);
}

/**
 * 计算动态高度列表的虚拟状态
 */
export function calculateDynamicVirtualState(options: {
  measurements: VirtualItem[];
  viewportHeight: number;
  scrollOffset: number;
  overscan?: number;
}): VirtualListState {
  const { measurements, viewportHeight, scrollOffset, overscan = 2 } = options;
  const itemCount = measurements.length;

  if (itemCount === 0) {
    return {
      visibleRange: {
        start: 0,
        end: 0,
        overscanStart: 0,
        overscanEnd: 0,
      },
      totalHeight: 0,
      scrollOffset,
      shouldUpdate: false,
    };
  }

  // 计算总高度
  const totalHeight = measurements[itemCount - 1].offset + measurements[itemCount - 1].height;

  // 找到可见起始索引
  const startIndex = findStartIndex(measurements, scrollOffset);
  
  // 找到可见结束索引
  const endIndex = findStartIndex(measurements, scrollOffset + viewportHeight);

  // 应用预加载
  const overscanStart = Math.max(0, startIndex - overscan);
  const overscanEnd = Math.min(itemCount - 1, endIndex + overscan);

  return {
    visibleRange: {
      start: startIndex,
      end: Math.min(endIndex, itemCount - 1),
      overscanStart,
      overscanEnd,
    },
    totalHeight,
    scrollOffset,
    shouldUpdate: true,
  };
}

// ============================================================================
// 通用虚拟列表计算
// ============================================================================

/**
 * 通用虚拟列表状态计算
 * 根据传入的选项自动选择固定高度或动态高度算法
 */
export function calculateVirtualState(options: VirtualListOptions & {
  itemHeight?: number;
  measurements?: VirtualItem[];
}): VirtualListState {
  // 如果有测量数据，使用动态高度算法
  if (options.measurements) {
    return calculateDynamicVirtualState({
      measurements: options.measurements,
      viewportHeight: options.viewportHeight,
      scrollOffset: options.scrollOffset,
      overscan: options.overscan,
    });
  }

  // 如果有固定高度，使用固定高度算法
  if (options.estimatedHeight) {
    return calculateFixedVirtualState({
      itemCount: options.itemCount,
      viewportHeight: options.viewportHeight,
      itemHeight: options.estimatedHeight,
      scrollOffset: options.scrollOffset,
      overscan: options.overscan,
    });
  }

  throw new Error('Either measurements or estimatedHeight must be provided');
}

// ============================================================================
// 性能优化工具
// ============================================================================

/**
 * 防抖函数 - 用于滚动事件优化
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null;
  
  return (...args: Parameters<T>) => {
    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 节流函数 - 用于滚动事件优化
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle = false;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}

/**
 * 判断是否需要更新可见范围
 * 用于避免不必要的重新渲染
 */
export function shouldUpdateVisibleRange(
  oldRange: VisibleRange,
  newRange: VisibleRange,
  threshold: number = 0
): boolean {
  return (
    Math.abs(oldRange.start - newRange.start) > threshold ||
    Math.abs(oldRange.end - newRange.end) > threshold
  );
}

// ============================================================================
// React Hooks 辅助函数
// ============================================================================

/**
 * 计算项目的样式
 */
export function getItemStyle(
  index: number,
  measurements: VirtualItem[]
): React.CSSProperties {
  const measurement = measurements[index];
  if (!measurement) {
    return { display: 'none' };
  }

  return {
    position: 'absolute',
    top: measurement.offset,
    left: 0,
    right: 0,
    height: measurement.height,
    willChange: 'transform',
  };
}

/**
 * 计算容器的样式
 */
export function getContainerStyle(totalHeight: number): React.CSSProperties {
  return {
    position: 'relative',
    height: totalHeight,
    width: '100%',
  };
}

// ============================================================================
// 导出默认对象
// ============================================================================

export const VirtualList = {
  // 固定高度
  calculateFixedVirtualState,
  getFixedItemOffset,
  
  // 动态高度
  createHeightCache,
  findStartIndex,
  calculateDynamicVirtualState,
  
  // 通用
  calculateVirtualState,
  
  // 性能优化
  debounce,
  throttle,
  shouldUpdateVisibleRange,
  
  // 样式
  getItemStyle,
  getContainerStyle,
};

export default VirtualList;
