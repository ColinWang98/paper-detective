/**
 * Virtual List Core - 虚拟滚动核心算法
 * 
 * 功能:
 * - 虚拟列表核心算法
 * - 可视区域计算
 * - 缓冲区管理
 * - 动态高度支持
 */

// ============================================================================
// 类型定义
// ============================================================================

/** 虚拟列表配置 */
export interface VirtualListConfig {
  /** 项目高度（固定高度）或高度计算函数（动态高度） */
  itemHeight: number | ((index: number) => number);
  /** 容器高度 */
  containerHeight: number;
  /** 缓冲区大小（上下额外渲染的项目数） */
  overscan: number;
  /** 项目总数 */
  totalCount: number;
  /** 滚动位置 */
  scrollTop: number;
  /** 估计高度（动态高度时使用） */
  estimatedItemHeight?: number;
}

/** 可视范围计算结果 */
export interface VisibleRange {
  /** 起始索引 */
  start: number;
  /** 结束索引 */
  end: number;
  /** 顶部偏移量 */
  offset: number;
  /** 总高度 */
  totalHeight: number;
  /** 是否需要重新计算（动态高度） */
  shouldRecalculate?: boolean;
}

/** 虚拟列表状态 */
export interface VirtualListState {
  /** 当前可视范围 */
  visibleRange: VisibleRange;
  /** 项目位置缓存（动态高度） */
  itemPositions: Map<number, ItemPosition>;
  /** 总高度 */
  totalHeight: number;
  /** 是否所有高度已测量 */
  allMeasured: boolean;
}

/** 项目位置信息 */
export interface ItemPosition {
  /** 项目索引 */
  index: number;
  /** 顶部偏移 */
  top: number;
  /** 高度 */
  height: number;
  /** 是否已测量 */
  measured: boolean;
}

/** 项目测量信息 */
export interface ItemMeasurement {
  index: number;
  height: number;
}

/** 滚动方向 */
export type ScrollDirection = 'up' | 'down' | 'none';

/** 滚动状态 */
export interface ScrollState {
  scrollTop: number;
  direction: ScrollDirection;
  velocity: number;
}

/** 渲染项目 */
export interface RenderItem {
  index: number;
  style: {
    position: 'absolute';
    top: number;
    left: number;
    width: string;
    height: number;
  };
}

// ============================================================================
// 核心算法
// ============================================================================

/**
 * 计算可视范围
 * 
 * 核心算法：根据滚动位置计算应该渲染哪些项目
 * 
 * @param scrollTop 滚动位置
 * @param config 虚拟列表配置
 * @returns 可视范围计算结果
 */
export function calculateVisibleRange(
  scrollTop: number,
  config: VirtualListConfig
): VisibleRange {
  const { itemHeight, containerHeight, overscan, totalCount } = config;

  if (totalCount === 0) {
    return {
      start: 0,
      end: 0,
      offset: 0,
      totalHeight: 0,
    };
  }

  const isDynamicHeight = typeof itemHeight === 'function';
  
  if (isDynamicHeight) {
    return calculateDynamicVisibleRange(scrollTop, config);
  }

  // 固定高度计算
  const fixedHeight = itemHeight as number;
  const totalHeight = fixedHeight * totalCount;
  
  // 计算起始索引
  let startIndex = Math.floor(scrollTop / fixedHeight);
  startIndex = Math.max(0, startIndex - overscan);
  
  // 计算结束索引
  const visibleCount = Math.ceil(containerHeight / fixedHeight);
  let endIndex = startIndex + visibleCount + overscan * 2;
  endIndex = Math.min(totalCount - 1, endIndex);
  
  // 计算偏移量
  const offset = startIndex * fixedHeight;

  return {
    start: startIndex,
    end: endIndex,
    offset,
    totalHeight,
  };
}

/**
 * 动态高度可视范围计算
 * 
 * 使用二分查找优化性能
 */
function calculateDynamicVisibleRange(
  scrollTop: number,
  config: VirtualListConfig
): VisibleRange {
  const { itemHeight, containerHeight, overscan, totalCount } = config;
  const getHeight = itemHeight as (index: number) => number;

  // 估算总高度
  const estimatedTotalHeight = Array.from({ length: totalCount })
    .reduce<number>((sum, _, i) => sum + getHeight(i), 0);

  // 二分查找起始索引
  let startIndex = binarySearchStartIndex(scrollTop, totalCount, getHeight);
  startIndex = Math.max(0, startIndex - overscan);

  // 从起始索引开始累加高度，直到填满可视区域
  let accumulatedHeight = 0;
  let endIndex = startIndex;
  const targetHeight = containerHeight + overscan * getHeight(startIndex);

  while (endIndex < totalCount && accumulatedHeight < targetHeight) {
    accumulatedHeight += getHeight(endIndex);
    endIndex++;
  }

  endIndex = Math.min(totalCount - 1, endIndex + overscan);

  // 计算起始偏移量
  const offset = calculateOffsetToIndex(startIndex, getHeight);

  return {
    start: startIndex,
    end: endIndex,
    offset,
    totalHeight: estimatedTotalHeight,
    shouldRecalculate: true,
  };
}

/**
 * 二分查找起始索引
 */
function binarySearchStartIndex(
  scrollTop: number,
  totalCount: number,
  getHeight: (index: number) => number
): number {
  let low = 0;
  let high = totalCount - 1;
  let accumulatedHeight = 0;
  
  // 预计算高度数组用于二分查找
  const heights: number[] = [];
  for (let i = 0; i < totalCount; i++) {
    heights[i] = getHeight(i);
  }
  
  // 预计算前缀和
  const prefixSum: number[] = new Array(totalCount + 1);
  prefixSum[0] = 0;
  for (let i = 0; i < totalCount; i++) {
    prefixSum[i + 1] = prefixSum[i] + heights[i];
  }

  // 二分查找
  while (low < high) {
    const mid = Math.floor((low + high) / 2);
    if (prefixSum[mid] < scrollTop) {
      low = mid + 1;
    } else {
      high = mid;
    }
  }

  return low;
}

/**
 * 计算到指定索引的偏移量
 */
function calculateOffsetToIndex(
  index: number,
  getHeight: (index: number) => number
): number {
  let offset = 0;
  for (let i = 0; i < index; i++) {
    offset += getHeight(i);
  }
  return offset;
}

// ============================================================================
// 虚拟列表状态管理
// ============================================================================

/**
 * 创建初始虚拟列表状态
 */
export function createVirtualListState(
  totalCount: number,
  estimatedItemHeight: number = 50
): VirtualListState {
  return {
    visibleRange: {
      start: 0,
      end: Math.min(10, totalCount - 1),
      offset: 0,
      totalHeight: totalCount * estimatedItemHeight,
    },
    itemPositions: new Map(),
    totalHeight: totalCount * estimatedItemHeight,
    allMeasured: false,
  };
}

/**
 * 更新项目测量
 * 
 * 在动态高度场景下，项目渲染后调用此函数更新实际高度
 */
export function updateItemMeasurement(
  state: VirtualListState,
  measurement: ItemMeasurement,
  estimatedItemHeight: number = 50
): VirtualListState {
  const { itemPositions } = state;
  const { index, height } = measurement;

  // 更新或创建位置信息
  const newPositions = new Map(itemPositions);
  const oldPosition = newPositions.get(index);
  
  if (!oldPosition || oldPosition.height !== height) {
    newPositions.set(index, {
      index,
      top: 0, // 稍后重新计算
      height,
      measured: true,
    });

    // 重新计算所有位置
    recalculatePositions(newPositions, estimatedItemHeight);

    // 检查是否所有项目都已测量
    const allMeasured = newPositions.size === state.visibleRange.end - state.visibleRange.start + 1;

    // 计算总高度
    let totalHeight = 0;
    const maxIndex = Math.max(...newPositions.keys());
    for (let i = 0; i <= maxIndex; i++) {
      const pos = newPositions.get(i);
      totalHeight += pos?.height || estimatedItemHeight;
    }
    // 加上未测量的项目高度
    const remainingCount = state.visibleRange.end - maxIndex;
    if (remainingCount > 0) {
      totalHeight += remainingCount * estimatedItemHeight;
    }

    return {
      ...state,
      itemPositions: newPositions,
      totalHeight,
      allMeasured,
    };
  }

  return state;
}

/**
 * 重新计算所有位置
 */
function recalculatePositions(
  positions: Map<number, ItemPosition>,
  estimatedItemHeight: number
): void {
  const sortedIndices = Array.from(positions.keys()).sort((a, b) => a - b);
  
  let currentTop = 0;
  for (const index of sortedIndices) {
    const position = positions.get(index);
    if (position) {
      position.top = currentTop;
      currentTop += position.height;
    }
  }
}

/**
 * 获取项目位置
 */
export function getItemPosition(
  state: VirtualListState,
  index: number,
  estimatedItemHeight: number = 50
): ItemPosition {
  const cached = state.itemPositions.get(index);
  if (cached) {
    return cached;
  }

  // 估算位置
  let top = 0;
  for (let i = 0; i < index; i++) {
    const pos = state.itemPositions.get(i);
    top += pos?.height || estimatedItemHeight;
  }

  return {
    index,
    top,
    height: estimatedItemHeight,
    measured: false,
  };
}

// ============================================================================
// 滚动处理
// ============================================================================

/**
 * 计算滚动方向
 */
export function getScrollDirection(
  currentScrollTop: number,
  previousScrollTop: number
): ScrollDirection {
  if (currentScrollTop > previousScrollTop) return 'down';
  if (currentScrollTop < previousScrollTop) return 'up';
  return 'none';
}

/**
 * 计算滚动速度
 */
export function getScrollVelocity(
  currentScrollTop: number,
  previousScrollTop: number,
  deltaTime: number
): number {
  if (deltaTime === 0) return 0;
  return Math.abs(currentScrollTop - previousScrollTop) / deltaTime;
}

/**
 * 判断是否需要更新可视范围
 * 
 * 基于滚动方向和距离进行优化
 */
export function shouldUpdateRange(
  currentRange: VisibleRange,
  scrollTop: number,
  itemHeight: number | ((index: number) => number),
  threshold: number = 0.5
): boolean {
  const avgHeight = typeof itemHeight === 'function' ? 50 : itemHeight;
  const visibleStartOffset = currentRange.offset;
  const visibleEndOffset = visibleStartOffset + (currentRange.end - currentRange.start + 1) * avgHeight;
  
  const buffer = avgHeight * threshold;
  
  return scrollTop < visibleStartOffset + buffer || scrollTop > visibleEndOffset - buffer;
}

/**
 * 滚动到指定索引
 */
export function scrollToIndex(
  index: number,
  config: VirtualListConfig,
  align: 'start' | 'center' | 'end' | 'auto' = 'auto'
): number {
  const { itemHeight, containerHeight, totalCount, estimatedItemHeight = 50 } = config;
  
  if (index < 0 || index >= totalCount) {
    return 0;
  }

  const isDynamic = typeof itemHeight === 'function';
  const getHeight = isDynamic 
    ? itemHeight as (i: number) => number 
    : () => itemHeight as number;

  // 计算到目标索引的偏移
  let targetOffset = 0;
  for (let i = 0; i < index; i++) {
    targetOffset += getHeight(i);
  }

  const targetHeight = getHeight(index);

  switch (align) {
    case 'start':
      return targetOffset;
    
    case 'center':
      return targetOffset - containerHeight / 2 + targetHeight / 2;
    
    case 'end':
      return targetOffset - containerHeight + targetHeight;
    
    case 'auto':
    default:
      // 智能对齐：如果目标项目在可视区域内，不滚动
      // 否则滚动到最近的边缘
      const { scrollTop } = config;
      if (targetOffset >= scrollTop && targetOffset + targetHeight <= scrollTop + containerHeight) {
        return scrollTop;
      }
      if (targetOffset < scrollTop) {
        return targetOffset;
      }
      return targetOffset - containerHeight + targetHeight;
  }
}

/**
 * 查找可视范围内的项目索引
 */
export function findVisibleItemIndex(
  scrollTop: number,
  itemHeight: number | ((index: number) => number),
  totalCount: number
): number {
  const isDynamic = typeof itemHeight === 'function';
  
  if (!isDynamic) {
    const height = itemHeight as number;
    return Math.min(Math.floor(scrollTop / height), totalCount - 1);
  }

  // 动态高度：使用二分查找
  return binarySearchStartIndex(scrollTop, totalCount, itemHeight as (i: number) => number);
}

// ============================================================================
// 渲染优化
// ============================================================================

/**
 * 生成渲染项目列表
 */
export function getRenderItems(
  range: VisibleRange,
  itemHeight: number | ((index: number) => number),
  containerWidth: string | number = '100%'
): RenderItem[] {
  const items: RenderItem[] = [];
  const isDynamic = typeof itemHeight === 'function';
  const getHeight = isDynamic ? itemHeight as (i: number) => number : () => itemHeight as number;

  let currentTop = range.offset;

  for (let i = range.start; i <= range.end; i++) {
    const height = getHeight(i);
    items.push({
      index: i,
      style: {
        position: 'absolute',
        top: currentTop,
        left: 0,
        width: typeof containerWidth === 'number' ? `${containerWidth}px` : containerWidth,
        height,
      },
    });
    currentTop += height;
  }

  return items;
}

/**
 * 计算容器样式
 */
export function getContainerStyle(
  totalHeight: number,
  containerHeight: number
): React.CSSProperties {
  return {
    position: 'relative',
    height: containerHeight,
    overflow: 'auto',
    willChange: 'transform',
  };
}

/**
 * 计算内容包装器样式
 */
export function getContentStyle(totalHeight: number): React.CSSProperties {
  return {
    position: 'relative',
    height: totalHeight,
    width: '100%',
  };
}

// ============================================================================
// 高级功能
// ============================================================================

/**
 * 虚拟列表控制器
 * 
 * 提供完整的虚拟列表控制功能
 */
export class VirtualListController {
  private config: VirtualListConfig;
  private state: VirtualListState;
  private listeners: Set<(state: VirtualListState) => void> = new Set();
  private rafId: number | null = null;
  private lastScrollTop = 0;
  private scrollVelocity = 0;
  private lastScrollTime = Date.now();

  constructor(config: Omit<VirtualListConfig, 'scrollTop'>) {
    this.config = { ...config, scrollTop: 0 };
    this.state = createVirtualListState(
      config.totalCount,
      typeof config.itemHeight === 'number' ? config.itemHeight : config.estimatedItemHeight
    );
  }

  /**
   * 更新滚动位置
   */
  setScrollTop(scrollTop: number): void {
    const now = Date.now();
    const deltaTime = now - this.lastScrollTime;
    
    this.scrollVelocity = getScrollVelocity(scrollTop, this.lastScrollTop, deltaTime);
    this.lastScrollTop = scrollTop;
    this.lastScrollTime = now;

    // 使用 requestAnimationFrame 批量更新
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }

    this.rafId = requestAnimationFrame(() => {
      this.config.scrollTop = scrollTop;
      const newRange = calculateVisibleRange(scrollTop, this.config);
      
      // 检查范围是否变化
      if (this.hasRangeChanged(newRange)) {
        this.state = {
          ...this.state,
          visibleRange: newRange,
        };
        this.notifyListeners();
      }
    });
  }

  /**
   * 更新项目测量
   */
  measureItem(index: number, height: number): void {
    const newState = updateItemMeasurement(
      this.state,
      { index, height },
      typeof this.config.itemHeight === 'number' ? this.config.itemHeight : this.config.estimatedItemHeight
    );

    if (newState !== this.state) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  /**
   * 批量更新项目测量
   */
  measureItems(measurements: ItemMeasurement[]): void {
    let newState = this.state;
    const estimatedHeight = typeof this.config.itemHeight === 'number' 
      ? this.config.itemHeight 
      : this.config.estimatedItemHeight || 50;

    for (const measurement of measurements) {
      newState = updateItemMeasurement(newState, measurement, estimatedHeight);
    }

    if (newState !== this.state) {
      this.state = newState;
      this.notifyListeners();
    }
  }

  /**
   * 更新配置
   */
  updateConfig(updates: Partial<Omit<VirtualListConfig, 'scrollTop'>>): void {
    this.config = { ...this.config, ...updates };
    
    // 重新计算可视范围
    const newRange = calculateVisibleRange(this.config.scrollTop, this.config);
    this.state = {
      ...this.state,
      visibleRange: newRange,
    };
    this.notifyListeners();
  }

  /**
   * 滚动到指定索引
   */
  scrollToIndex(index: number, align: 'start' | 'center' | 'end' | 'auto' = 'auto'): number {
    return scrollToIndex(index, this.config, align);
  }

  /**
   * 获取当前状态
   */
  getState(): VirtualListState {
    return this.state;
  }

  /**
   * 获取渲染项目
   */
  getRenderItems(containerWidth?: string | number): RenderItem[] {
    return getRenderItems(this.state.visibleRange, this.config.itemHeight, containerWidth);
  }

  /**
   * 获取容器样式
   */
  getContainerStyle(): React.CSSProperties {
    return getContainerStyle(this.state.totalHeight, this.config.containerHeight);
  }

  /**
   * 获取内容样式
   */
  getContentStyle(): React.CSSProperties {
    return getContentStyle(this.state.totalHeight);
  }

  /**
   * 获取滚动速度
   */
  getScrollVelocity(): number {
    return this.scrollVelocity;
  }

  /**
   * 判断是否快速滚动
   */
  isFastScrolling(threshold: number = 2): boolean {
    return this.scrollVelocity > threshold;
  }

  /**
   * 订阅状态变化
   */
  subscribe(listener: (state: VirtualListState) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /**
   * 销毁控制器
   */
  destroy(): void {
    if (this.rafId !== null) {
      cancelAnimationFrame(this.rafId);
    }
    this.listeners.clear();
  }

  /**
   * 检查范围是否变化
   */
  private hasRangeChanged(newRange: VisibleRange): boolean {
    const current = this.state.visibleRange;
    return (
      current.start !== newRange.start ||
      current.end !== newRange.end ||
      current.offset !== newRange.offset
    );
  }

  /**
   * 通知监听器
   */
  private notifyListeners(): void {
    for (const listener of this.listeners) {
      listener(this.state);
    }
  }
}

// ============================================================================
// 工具函数
// ============================================================================

/**
 * 创建固定高度虚拟列表配置
 */
export function createFixedHeightConfig(
  itemHeight: number,
  containerHeight: number,
  totalCount: number,
  overscan: number = 5
): Omit<VirtualListConfig, 'scrollTop'> {
  return {
    itemHeight,
    containerHeight,
    totalCount,
    overscan,
  };
}

/**
 * 创建动态高度虚拟列表配置
 */
export function createDynamicHeightConfig(
  getItemHeight: (index: number) => number,
  containerHeight: number,
  totalCount: number,
  overscan: number = 5,
  estimatedItemHeight: number = 50
): Omit<VirtualListConfig, 'scrollTop'> {
  return {
    itemHeight: getItemHeight,
    containerHeight,
    totalCount,
    overscan,
    estimatedItemHeight,
  };
}

/**
 * 估算平均项目高度
 */
export function estimateAverageItemHeight(
  measurements: ItemMeasurement[],
  totalCount: number,
  defaultHeight: number = 50
): number {
  if (measurements.length === 0) {
    return defaultHeight;
  }

  const measuredTotal = measurements.reduce((sum, m) => sum + m.height, 0);
  const measuredAvg = measuredTotal / measurements.length;
  
  // 结合已测量项目和估算项目
  const estimatedCount = totalCount - measurements.length;
  const totalHeight = measuredTotal + estimatedCount * defaultHeight;
  
  return totalHeight / totalCount;
}

// ============================================================================
// 导出默认
// ============================================================================

export default {
  calculateVisibleRange,
  createVirtualListState,
  updateItemMeasurement,
  getItemPosition,
  getRenderItems,
  scrollToIndex,
  findVisibleItemIndex,
  VirtualListController,
};
