'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
  memo,
} from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { getHighlightPriorityLabel, getHighlightPriorityOrder } from '@/lib/highlightPriority';
import type { Highlight, HighlightColor } from '@/types';

// ============================================================================
// 类型定义
// ============================================================================

export interface VirtualHighlightListProps {
  /** 高亮列表 */
  highlights: Highlight[];
  /** 渲染单项的函数 */
  renderItem: (highlight: Highlight, index: number) => React.ReactNode;
  /** 列表容器高度 */
  height?: number | string;
  /** 估计的项高度 */
  estimatedItemHeight?: number;
  /** 预加载项数 */
  overscan?: number;
  /** 搜索关键词 */
  searchQuery?: string;
  /** 自定义类名 */
  className?: string;
  /** 空状态渲染 */
  emptyRenderer?: () => React.ReactNode;
  /** 滚动到某高亮 */
  scrollToHighlightId?: number | null;
  /** 动态高度模式 */
  dynamicHeight?: boolean;
  /** 项变化回调 */
  onVisibleItemsChange?: (items: Highlight[]) => void;
  /** 是否启用平滑滚动 */
  smoothScroll?: boolean;
}

export interface VirtualHighlightListRef {
  /** 滚动到指定索引 */
  scrollToIndex: (index: number) => void;
  /** 滚动到指定高亮 */
  scrollToHighlight: (highlightId: number) => void;
  /** 获取当前可见项索引 */
  getVisibleRange: () => { start: number; end: number };
  /** 刷新布局 */
  refresh: () => void;
}

interface ItemMeasurement {
  height: number;
  offset: number;
}

// ============================================================================
// 虚拟滚动算法
// ============================================================================

/**
 * 二分查找找到指定偏移量对应的索引
 */
function findStartIndex(measurements: ItemMeasurement[], scrollOffset: number): number {
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
 * 计算可见范围
 */
function calculateVisibleRange(
  measurements: ItemMeasurement[],
  scrollOffset: number,
  containerHeight: number,
  overscan: number
): { start: number; end: number } {
  const startIndex = findStartIndex(measurements, scrollOffset);
  const endIndex = findStartIndex(measurements, scrollOffset + containerHeight);

  return {
    start: Math.max(0, startIndex - overscan),
    end: Math.min(measurements.length - 1, endIndex + overscan),
  };
}

// ============================================================================
// 测量缓存
// ============================================================================

class MeasurementCache {
  private cache: Map<number, number> = new Map();
  private defaultHeight: number;

  constructor(defaultHeight: number) {
    this.defaultHeight = defaultHeight;
  }

  get(index: number): number {
    return this.cache.get(index) ?? this.defaultHeight;
  }

  set(index: number, height: number): void {
    this.cache.set(index, height);
  }

  clear(): void {
    this.cache.clear();
  }

  getMeasurements(itemCount: number): ItemMeasurement[] {
    const measurements: ItemMeasurement[] = [];
    let offset = 0;

    for (let i = 0; i < itemCount; i++) {
      const height = this.get(i);
      measurements.push({ height, offset });
      offset += height;
    }

    return measurements;
  }

  getTotalHeight(itemCount: number): number {
    let total = 0;
    for (let i = 0; i < itemCount; i++) {
      total += this.get(i);
    }
    return total;
  }
}

// ============================================================================
// 过滤和搜索
// ============================================================================

/**
 * 过滤高亮列表
 */
function filterHighlights(
  highlights: Highlight[],
  searchQuery: string
): Highlight[] {
  if (!searchQuery.trim()) return highlights;

  const query = searchQuery.toLowerCase().trim();
  
  return highlights.filter((highlight) => {
    const textMatch = highlight.text.toLowerCase().includes(query);
    const noteMatch = highlight.note?.toLowerCase().includes(query);
    const pageMatch = highlight.pageNumber?.toString().includes(query);
    
    return textMatch || noteMatch || pageMatch;
  });
}

/**
 * 按优先级排序高亮
 */
function sortHighlightsByPriority(highlights: Highlight[]): Highlight[] {
  const priorityOrder: Record<HighlightColor, number> = {
    red: 0,    // 关键 - 最高
    yellow: 1, // 重要
    orange: 2, // 有趣
    gray: 3,   // 存档 - 最低
  };

  return [...highlights].sort((a, b) => {
    const priorityDiff = getHighlightPriorityOrder(a) - getHighlightPriorityOrder(b);
    if (priorityDiff !== 0) return priorityDiff;
    
    // 相同优先级按时间倒序
    return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
  });
}

// ============================================================================
// 虚拟高亮列表主组件
// ============================================================================

export const VirtualHighlightList = forwardRef<
  VirtualHighlightListRef,
  VirtualHighlightListProps
>(function VirtualHighlightList(
  {
    highlights,
    renderItem,
    height = 400,
    estimatedItemHeight = 100,
    overscan = 3,
    searchQuery = '',
    className,
    emptyRenderer,
    scrollToHighlightId,
    dynamicHeight = true,
    onVisibleItemsChange,
    smoothScroll = true,
  },
  ref
) {
  // 容器引用
  const containerRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  
  // 测量缓存
  const cacheRef = useRef(new MeasurementCache(estimatedItemHeight));
  
  // 状态
  const [scrollOffset, setScrollOffset] = useState(0);
  const [containerHeight, setContainerHeight] = useState(0);
  const [visibleRange, setVisibleRange] = useState({ start: 0, end: 0 });
  const itemElementsRef = useRef<Map<number, HTMLElement>>(new Map());

  // 过滤和排序后的列表
  const filteredHighlights = useMemo(() => {
    const filtered = filterHighlights(highlights, searchQuery);
    return sortHighlightsByPriority(filtered);
  }, [highlights, searchQuery]);

  // 计算测量值
  const measurements = useMemo(() => {
    return cacheRef.current.getMeasurements(filteredHighlights.length);
  }, [filteredHighlights.length, cacheRef.current]);

  // 总高度
  const totalHeight = useMemo(() => {
    return cacheRef.current.getTotalHeight(filteredHighlights.length);
  }, [filteredHighlights.length, measurements]);

  // 更新可见范围
  const updateVisibleRange = useCallback(() => {
    if (containerHeight === 0) return;

    const range = calculateVisibleRange(
      measurements,
      scrollOffset,
      containerHeight,
      overscan
    );

    setVisibleRange(range);

    // 通知可见项变化
    if (onVisibleItemsChange) {
      const visibleItems = filteredHighlights.slice(range.start, range.end + 1);
      onVisibleItemsChange(visibleItems);
    }
  }, [measurements, scrollOffset, containerHeight, overscan, filteredHighlights, onVisibleItemsChange]);

  // 测量项高度
  const measureItem = useCallback((index: number, element: HTMLElement | null) => {
    if (!element || !dynamicHeight) return;

    const height = element.getBoundingClientRect().height;
    const cachedHeight = cacheRef.current.get(index);

    if (height !== cachedHeight) {
      cacheRef.current.set(index, height);
      // 重新计算测量值
      updateVisibleRange();
    }

    if (element) {
      itemElementsRef.current.set(index, element);
    }
  }, [dynamicHeight, updateVisibleRange]);

  // 滚动处理
  const handleScroll = useCallback((e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    setScrollOffset(target.scrollTop);
  }, []);

  // 更新容器高度
  useEffect(() => {
    if (containerRef.current) {
      const height = containerRef.current.clientHeight;
      setContainerHeight(height);
    }
  }, []);

  // 监听滚动更新可见范围
  useEffect(() => {
    updateVisibleRange();
  }, [scrollOffset, containerHeight, measurements, updateVisibleRange]);

  // 窗口大小变化时重新计算
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        setContainerHeight(containerRef.current.clientHeight);
        // 清除缓存，重新测量
        cacheRef.current.clear();
        updateVisibleRange();
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [updateVisibleRange]);

  // 高亮列表变化时清除缓存
  useEffect(() => {
    cacheRef.current.clear();
    updateVisibleRange();
  }, [filteredHighlights.length, updateVisibleRange]);

  // 滚动到指定索引
  const scrollToIndex = useCallback((index: number) => {
    const container = containerRef.current;
    if (!container || index < 0 || index >= filteredHighlights.length) return;

    const offset = measurements[index]?.offset ?? 0;
    container.scrollTo({
      top: offset,
      behavior: smoothScroll ? 'smooth' : 'auto',
    });
  }, [filteredHighlights.length, measurements, smoothScroll]);

  // 滚动到指定高亮
  const scrollToHighlight = useCallback((highlightId: number) => {
    const index = filteredHighlights.findIndex((h) => h.id === highlightId);
    if (index !== -1) {
      scrollToIndex(index);
    }
  }, [filteredHighlights, scrollToIndex]);

  // 监听外部传入的 scrollToHighlightId
  useEffect(() => {
    if (scrollToHighlightId !== null && scrollToHighlightId !== undefined) {
      scrollToHighlight(scrollToHighlightId);
    }
  }, [scrollToHighlightId, scrollToHighlight]);

  // 暴露方法
  useImperativeHandle(ref, () => ({
    scrollToIndex,
    scrollToHighlight,
    getVisibleRange: () => visibleRange,
    refresh: () => {
      cacheRef.current.clear();
      updateVisibleRange();
    },
  }));

  // 渲染可见项
  const visibleItems = useMemo(() => {
    return filteredHighlights.slice(visibleRange.start, visibleRange.end + 1);
  }, [filteredHighlights, visibleRange]);

  // 空状态
  if (filteredHighlights.length === 0) {
    return (
      <div
        ref={containerRef}
        className={cn(
          'overflow-auto bg-newspaper-cream',
          className
        )}
        style={{ height }}
      >
        {emptyRenderer ? (
          emptyRenderer()
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-newspaper-faded p-8">
            <div className="text-4xl mb-4">🔍</div>
            <p className="text-sm">
              {searchQuery ? '没有找到匹配的高亮' : '暂无高亮内容'}
            </p>
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={cn(
        'overflow-auto bg-newspaper-cream relative',
        className
      )}
      style={{ height }}
      onScroll={handleScroll}
    >
      {/* 总高度占位 */}
      <div style={{ height: totalHeight, position: 'relative' }}>
        {/* 渲染可见项 */}
        <AnimatePresence mode="popLayout">
          {visibleItems.map((highlight, arrayIndex) => {
            const index = visibleRange.start + arrayIndex;
            const measurement = measurements[index];
            
            if (!measurement) return null;

            return (
              <VirtualItem
                key={highlight.id ?? index}
                index={index}
                highlight={highlight}
                offset={measurement.offset}
                renderItem={renderItem}
                onMeasure={measureItem}
              />
            );
          })}
        </AnimatePresence>
      </div>

      {/* 搜索结果计数 */}
      {searchQuery && (
        <div className="sticky bottom-0 left-0 right-0 bg-newspaper-accent text-white px-4 py-2 text-center text-sm">
          找到 {filteredHighlights.length} 个匹配项
        </div>
      )}
    </div>
  );
});

// ============================================================================
// 虚拟项组件
// ============================================================================

interface VirtualItemProps {
  index: number;
  highlight: Highlight;
  offset: number;
  renderItem: (highlight: Highlight, index: number) => React.ReactNode;
  onMeasure: (index: number, element: HTMLElement | null) => void;
}

/**
 * 虚拟列表项 - 使用 memo 优化性能
 */
const VirtualItem = memo(function VirtualItem({
  index,
  highlight,
  offset,
  renderItem,
  onMeasure,
}: VirtualItemProps) {
  const itemRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    onMeasure(index, itemRef.current);
  }, [index, onMeasure]);

  return (
    <motion.div
      ref={itemRef}
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2, delay: index * 0.02 }}
      style={{
        position: 'absolute',
        top: offset,
        left: 0,
        right: 0,
        willChange: 'transform',
      }}
    >
      {renderItem(highlight, index)}
    </motion.div>
  );
});

// ============================================================================
// 高亮卡片渲染器
// ============================================================================

const priorityLabels: Record<HighlightColor, string> = {
  red: '🔴 关键',
  yellow: '🟡 重要',
  orange: '🟠 有趣',
  gray: '⚪ 存档',
};

const colorClasses: Record<HighlightColor, string> = {
  red: 'bg-red-100 border-l-red-500',
  yellow: 'bg-yellow-100 border-l-yellow-500',
  orange: 'bg-orange-100 border-l-orange-500',
  gray: 'bg-gray-100 border-l-gray-400',
};

export interface HighlightCardItemProps {
  highlight: Highlight;
  onClick?: () => void;
  isActive?: boolean;
}

/**
 * 高亮卡片项 - 用于虚拟列表的默认渲染
 */
export function HighlightCardItem({
  highlight,
  onClick,
  isActive = false,
}: HighlightCardItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'p-3 rounded-lg border-l-4 shadow-sm cursor-pointer mx-2 my-1',
        'hover:shadow-md transition-all duration-200',
        colorClasses[highlight.color],
        isActive && 'ring-2 ring-newspaper-accent'
      )}
    >
      {/* 优先级标签 */}
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-medium text-newspaper-ink">
          {getHighlightPriorityLabel(highlight)}
        </span>
        {highlight.pageNumber && (
          <span className="text-xs text-newspaper-faxed bg-white/50 px-2 py-0.5 rounded-full">
            p.{highlight.pageNumber}
          </span>
        )}
      </div>

      {/* 高亮文本 */}
      <p className="text-sm text-newspaper-ink line-clamp-3 leading-relaxed">
        {highlight.text}
      </p>

      {/* 笔记 */}
      {highlight.note && (
        <div className="mt-2 pt-2 border-t border-black/5">
          <p className="text-xs text-newspaper-faxed">
            📝 {highlight.note}
          </p>
        </div>
      )}

      {/* 页脚 */}
      <div className="flex items-center justify-between mt-2 pt-2 border-t border-black/5">
        <p className="text-xs text-newspaper-faxed">
          {new Date(highlight.createdAt).toLocaleTimeString('zh-CN', {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      </div>
    </div>
  );
}

export default VirtualHighlightList;
