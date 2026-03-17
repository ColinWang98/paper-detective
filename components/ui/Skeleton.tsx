'use client';

import React from 'react';
import { cn } from '@/lib/utils';

// ============================================================================
// 基础 Skeleton 组件
// ============================================================================

export interface SkeletonProps {
  /** 自定义类名 */
  className?: string;
  /** 动画效果 */
  animated?: boolean;
  /** 变体样式 */
  variant?: 'default' | 'circle' | 'rect';
  /** 宽度 */
  width?: string | number;
  /** 高度 */
  height?: string | number;
}

/**
 * 基础骨架屏组件
 */
export function Skeleton({
  className,
  animated = true,
  variant = 'default',
  width,
  height,
}: SkeletonProps) {
  const style: React.CSSProperties = {
    width: typeof width === 'number' ? `${width}px` : width,
    height: typeof height === 'number' ? `${height}px` : height,
  };

  return (
    <div
      className={cn(
        'bg-gray-200',
        {
          'animate-pulse': animated,
          'rounded-full': variant === 'circle',
          'rounded-md': variant === 'default',
          'rounded-none': variant === 'rect',
        },
        className
      )}
      style={style}
      aria-hidden="true"
    />
  );
}

// ============================================================================
// 文本骨架屏
// ============================================================================

export interface SkeletonTextProps {
  /** 行数 */
  lines?: number;
  /** 自定义类名 */
  className?: string;
  /** 最后一行宽度百分比（模拟文本自然结束） */
  lastLineWidth?: string;
  /** 行间距 */
  gap?: number;
  /** 每行高度 */
  lineHeight?: number;
}

/**
 * 文本骨架屏
 * 
 * @example
 * <SkeletonText lines={3} />
 */
export function SkeletonText({
  lines = 3,
  className,
  lastLineWidth = '60%',
  gap = 2,
  lineHeight = 4,
}: SkeletonTextProps) {
  return (
    <div className={cn('flex flex-col', className)} style={{ gap: `${gap * 0.25}rem` }}>
      {Array.from({ length: lines }).map((_, index) => (
        <Skeleton
          key={index}
          className={cn('rounded', `h-${lineHeight}`)}
          width={index === lines - 1 ? lastLineWidth : '100%'}
        />
      ))}
    </div>
  );
}

// ============================================================================
// 卡片骨架屏
// ============================================================================

export interface SkeletonCardProps {
  /** 自定义类名 */
  className?: string;
  /** 是否有图片 */
  hasImage?: boolean;
  /** 图片高度 */
  imageHeight?: number;
  /** 标题行数 */
  titleLines?: number;
  /** 内容行数 */
  contentLines?: number;
  /** 是否有底部操作区 */
  hasFooter?: boolean;
}

/**
 * 卡片骨架屏
 * 
 * @example
 * <SkeletonCard hasImage imageHeight={160} contentLines={3} />
 */
export function SkeletonCard({
  className,
  hasImage = true,
  imageHeight = 160,
  titleLines = 1,
  contentLines = 2,
  hasFooter = true,
}: SkeletonCardProps) {
  return (
    <div
      className={cn(
        'bg-white rounded-lg border border-gray-200 overflow-hidden',
        className
      )}
    >
      {/* 图片区域 */}
      {hasImage && (
        <Skeleton
          className="w-full rounded-none"
          height={imageHeight}
          animated
        />
      )}

      {/* 内容区域 */}
      <div className="p-4 space-y-3">
        {/* 标题 */}
        {titleLines > 0 && (
          <SkeletonText
            lines={titleLines}
            lineHeight={5}
            lastLineWidth={titleLines === 1 ? '70%' : '80%'}
          />
        )}

        {/* 内容 */}
        {contentLines > 0 && (
          <SkeletonText
            lines={contentLines}
            lineHeight={4}
            lastLineWidth="60%"
          />
        )}
      </div>

      {/* 底部操作区 */}
      {hasFooter && (
        <div className="px-4 py-3 border-t border-gray-100 flex items-center justify-between">
          <Skeleton width={80} height={20} />
          <Skeleton width={60} height={20} />
        </div>
      )}
    </div>
  );
}

// ============================================================================
// PDF 骨架屏
// ============================================================================

export interface SkeletonPDFProps {
  /** 自定义类名 */
  className?: string;
  /** 页数 */
  pageCount?: number;
  /** 是否显示工具栏 */
  hasToolbar?: boolean;
}

/**
 * PDF 查看器骨架屏
 * 
 * @example
 * <SkeletonPDF pageCount={3} hasToolbar />
 */
export function SkeletonPDF({
  className,
  pageCount = 1,
  hasToolbar = true,
}: SkeletonPDFProps) {
  return (
    <div className={cn('flex flex-col h-full bg-newspaper-cream', className)}>
      {/* 工具栏 */}
      {hasToolbar && (
        <div className="bg-newspaper-aged border-b border-newspaper-border p-3">
          <div className="flex items-center justify-between">
            <Skeleton width={120} height={32} />
            <div className="flex items-center gap-2">
              <Skeleton width={80} height={32} />
              <Skeleton width={100} height={32} />
            </div>
          </div>
        </div>
      )}

      {/* PDF 页面 */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {Array.from({ length: pageCount }).map((_, index) => (
          <div
            key={index}
            className="bg-white shadow-paper mx-auto"
            style={{ maxWidth: '600px', minHeight: '800px' }}
          >
            <div className="p-8 space-y-4">
              {/* 标题区域 */}
              <SkeletonText lines={2} lineHeight={6} lastLineWidth="50%" />
              
              {/* 分隔线 */}
              <Skeleton height={2} className="my-4" />
              
              {/* 段落 */}
              {Array.from({ length: 8 }).map((_, pIndex) => (
                <SkeletonText
                  key={pIndex}
                  lines={3}
                  lineHeight={4}
                  lastLineWidth={pIndex % 3 === 0 ? '40%' : '100%'}
                />
              ))}
              
              {/* 图表占位 */}
              <Skeleton
                height={200}
                className="my-6 rounded-lg"
              />
              
              {/* 更多段落 */}
              {Array.from({ length: 4 }).map((_, pIndex) => (
                <SkeletonText
                  key={`more-${pIndex}`}
                  lines={3}
                  lineHeight={4}
                  lastLineWidth={pIndex === 3 ? '60%' : '100%'}
                />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// 列表骨架屏
// ============================================================================

export interface SkeletonListProps {
  /** 列表项数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
  /** 是否有图标 */
  hasIcon?: boolean;
  /** 是否有操作按钮 */
  hasAction?: boolean;
  /** 行高 */
  itemHeight?: number;
}

/**
 * 列表骨架屏
 * 
 * @example
 * <SkeletonList count={5} hasIcon hasAction />
 */
export function SkeletonList({
  count = 5,
  className,
  hasIcon = true,
  hasAction = true,
  itemHeight = 48,
}: SkeletonListProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="flex items-center gap-3 p-3 bg-white rounded-lg border border-gray-100"
          style={{ height: itemHeight }}
        >
          {hasIcon && (
            <Skeleton variant="circle" width={32} height={32} />
          )}
          <div className="flex-1">
            <Skeleton width="60%" height={16} />
          </div>
          {hasAction && (
            <Skeleton width={24} height={24} variant="circle" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 高亮卡片骨架屏
// ============================================================================

export interface SkeletonHighlightCardProps {
  /** 卡片数量 */
  count?: number;
  /** 自定义类名 */
  className?: string;
}

/**
 * 高亮卡片骨架屏
 * 
 * @example
 * <SkeletonHighlightCard count={3} />
 */
export function SkeletonHighlightCard({
  count = 3,
  className,
}: SkeletonHighlightCardProps) {
  return (
    <div className={cn('space-y-2', className)}>
      {Array.from({ length: count }).map((_, index) => (
        <div
          key={index}
          className="p-3 rounded-lg border-l-4 border-gray-300 bg-gray-100 shadow-sm"
        >
          {/* 优先级标签 */}
          <div className="flex items-center gap-2 mb-2">
            <Skeleton width={60} height={16} />
            <Skeleton width={40} height={16} />
          </div>
          
          {/* 内容 */}
          <SkeletonText lines={2} lineHeight={4} lastLineWidth="40%" />
          
          {/* 页脚 */}
          <div className="flex items-center justify-between mt-2 pt-2 border-t border-gray-200/50">
            <Skeleton width={50} height={12} />
            <Skeleton width={40} height={12} />
          </div>
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// 组合导出
// ============================================================================

export const SkeletonComponents = {
  Skeleton,
  SkeletonText,
  SkeletonCard,
  SkeletonPDF,
  SkeletonList,
  SkeletonHighlightCard,
};

export default SkeletonComponents;
