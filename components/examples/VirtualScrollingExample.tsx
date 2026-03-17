'use client';

/**
 * 虚拟滚动和懒加载功能使用示例
 * 
 * 展示如何使用：
 * 1. VirtualPDFViewer - PDF虚拟滚动查看器
 * 2. VirtualHighlightList - 高亮虚拟列表
 * 3. useIntersectionObserver - 懒加载Hook
 * 4. Skeleton - 骨架屏组件
 */

import React, { useRef, useState, useCallback } from 'react';
import { VirtualPDFViewer, VirtualPDFViewerRef } from '../VirtualPDFViewer';
import { VirtualHighlightList, VirtualHighlightListRef, HighlightCardItem } from '../VirtualHighlightList';
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';
import { Skeleton, SkeletonCard, SkeletonPDF, SkeletonHighlightCard, SkeletonText } from '../ui/Skeleton';
import type { Highlight } from '@/types';

// ============================================================================
// 示例 1: PDF 虚拟滚动查看器
// ============================================================================

export function PDFViewerExample() {
  const viewerRef = useRef<VirtualPDFViewerRef>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const handlePageChange = useCallback((page: number) => {
    setCurrentPage(page);
    console.log(`当前页面: ${page}`);
  }, []);

  const scrollToPage = (page: number) => {
    viewerRef.current?.scrollToPage(page);
  };

  return (
    <div className="h-screen flex flex-col">
      {/* 页面跳转控制 */}
      <div className="bg-gray-100 p-4 flex items-center gap-4">
        <span>当前页: {currentPage}</span>
        <button
          onClick={() => scrollToPage(1)}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          跳转到第1页
        </button>
        <button
          onClick={() => scrollToPage(50)}
          className="px-3 py-1 bg-blue-500 text-white rounded"
        >
          跳转到第50页
        </button>
      </div>

      {/* PDF 虚拟滚动查看器 */}
      <div className="flex-1">
        <VirtualPDFViewer
          ref={viewerRef}
          pdfUrl="/path/to/your.pdf"
          totalPages={100}
          initialPage={1}
          scale={1.2}
          onPageChange={handlePageChange}
          preloadPages={2}
          estimatedPageHeight={800}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 示例 2: 高亮虚拟列表
// ============================================================================

// 生成大量测试数据
function generateMockHighlights(count: number): Highlight[] {
  const colors: Highlight['color'][] = ['red', 'yellow', 'orange', 'gray'];
  
  return Array.from({ length: count }, (_, i) => ({
    id: i + 1,
    text: `这是第 ${i + 1} 条高亮内容示例。在大量数据场景下，虚拟滚动可以显著提升性能表现。`,
    color: colors[i % colors.length],
    priority: i % 2 === 0 ? 'important' : 'interesting',
    timestamp: new Date().toISOString(),
    createdAt: new Date().toISOString(),
    pageNumber: Math.floor(i / 5) + 1,
    paperId: 1,
  }));
}

export function HighlightListExample() {
  const listRef = useRef<VirtualHighlightListRef>(null);
  const [highlights] = useState(() => generateMockHighlights(1000));
  const [searchQuery, setSearchQuery] = useState('');
  const [activeHighlightId, setActiveHighlightId] = useState<number | null>(null);

  // 自定义渲染项
  const renderHighlight = useCallback((highlight: Highlight) => {
    return (
      <HighlightCardItem
        highlight={highlight}
        isActive={highlight.id === activeHighlightId}
        onClick={() => setActiveHighlightId(highlight.id ?? null)}
      />
    );
  }, [activeHighlightId]);

  const scrollToHighlight = (id: number) => {
    listRef.current?.scrollToHighlight(id);
  };

  return (
    <div className="h-screen flex flex-col p-4">
      {/* 搜索和导航控制 */}
      <div className="bg-gray-100 p-4 rounded-lg mb-4 space-y-2">
        <input
          type="text"
          placeholder="搜索高亮..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full px-3 py-2 border rounded"
        />
        <div className="flex gap-2">
          <button
            onClick={() => scrollToHighlight(500)}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            跳转到 #500
          </button>
          <button
            onClick={() => scrollToHighlight(999)}
            className="px-3 py-1 bg-blue-500 text-white rounded"
          >
            跳转到 #999
          </button>
        </div>
      </div>

      {/* 虚拟列表 */}
      <div className="flex-1 border rounded-lg overflow-hidden">
        <VirtualHighlightList
          ref={listRef}
          highlights={highlights}
          renderItem={renderHighlight}
          height="100%"
          estimatedItemHeight={100}
          overscan={5}
          searchQuery={searchQuery}
          dynamicHeight={true}
          scrollToHighlightId={activeHighlightId}
          onVisibleItemsChange={(items) => {
            console.log(`可见项数: ${items.length}`);
          }}
          emptyRenderer={() => (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
              <div className="text-4xl mb-2">🔍</div>
              <p>没有找到匹配的高亮</p>
            </div>
          )}
        />
      </div>
    </div>
  );
}

// ============================================================================
// 示例 3: Intersection Observer 懒加载
// ============================================================================

// 懒加载图片组件
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  const [isInView, setIsInView] = useState(false);

  const { ref } = useIntersectionObserver(
    (inView) => {
      setIsInView(inView);
    },
    {
      options: {
        rootMargin: '50px',
        threshold: 0.1,
      },
      once: true,
    }
  );

  return (
    <div
      ref={ref}
      className="w-full h-64 bg-gray-200 rounded-lg overflow-hidden"
    >
      {isInView ? (
        <img
          src={src}
          alt={alt}
          className={`w-full h-full object-cover transition-opacity duration-300 ${
            isLoaded ? 'opacity-100' : 'opacity-0'
          }`}
          onLoad={() => setIsLoaded(true)}
        />
      ) : (
        <div className="w-full h-full animate-pulse bg-gray-300" />
      )}
    </div>
  );
}

// 无限滚动加载更多
function InfiniteScrollExample() {
  const [items, setItems] = useState(() => 
    Array.from({ length: 20 }, (_, i) => `Item ${i + 1}`)
  );
  const [isLoading, setIsLoading] = useState(false);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (isLoading) return;
    
    setIsLoading(true);
    
    // 模拟 API 调用
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const newItems = Array.from({ length: 10 }, (_, i) => 
      `Item ${items.length + i + 1}`
    );
    
    setItems(prev => [...prev, ...newItems]);
    setIsLoading(false);
  }, [items.length, isLoading]);

  // 监听加载更多触发元素
  useIntersectionObserver(
    (isIntersecting) => {
      if (isIntersecting && !isLoading) {
        loadMore();
      }
    },
    {
      options: {
        rootMargin: '100px',
        threshold: 0,
      },
      once: false, // 持续监听
    }
  );

  return (
    <div className="max-w-md mx-auto p-4">
      <h2 className="text-xl font-bold mb-4">无限滚动示例</h2>
      
      <div className="space-y-4">
        {items.map((item, index) => (
          <div
            key={index}
            className="p-4 bg-white border rounded-lg shadow-sm"
          >
            {item}
          </div>
        ))}
      </div>

      {/* 加载更多触发器 */}
      <div ref={loadMoreRef} className="py-8 text-center">
        {isLoading && (
          <div className="flex items-center justify-center gap-2">
            <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
            <span className="text-gray-500">加载中...</span>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 示例 4: 骨架屏使用
// ============================================================================

export function SkeletonExample() {
  const [isLoading, setIsLoading] = useState(true);

  // 模拟数据加载
  setTimeout(() => setIsLoading(false), 3000);

  return (
    <div className="p-8 space-y-8">
      <h2 className="text-2xl font-bold">骨架屏示例</h2>

      {/* 基础骨架屏 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">基础骨架屏</h3>
        <div className="flex gap-4">
          <Skeleton width={100} height={100} variant="circle" />
          <div className="flex-1 space-y-2">
            <Skeleton width="60%" height={20} />
            <Skeleton width="80%" height={16} />
            <Skeleton width="40%" height={16} />
          </div>
        </div>
      </section>

      {/* 文本骨架屏 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">文本骨架屏</h3>
        <SkeletonText lines={5} lastLineWidth="40%" />
      </section>

      {/* 卡片骨架屏 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">卡片骨架屏</h3>
        <div className="grid grid-cols-3 gap-4">
          <SkeletonCard hasImage imageHeight={120} contentLines={2} />
          <SkeletonCard hasImage imageHeight={120} contentLines={2} />
          <SkeletonCard hasImage imageHeight={120} contentLines={2} />
        </div>
      </section>

      {/* 高亮卡片骨架屏 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">高亮卡片骨架屏</h3>
        <SkeletonHighlightCard count={3} />
      </section>

      {/* 加载状态切换示例 */}
      <section>
        <h3 className="text-lg font-semibold mb-4">加载状态切换</h3>
        {isLoading ? (
          <SkeletonCard hasImage imageHeight={200} titleLines={1} contentLines={3} />
        ) : (
          <div className="p-4 border rounded-lg">
            <img
              src="https://via.placeholder.com/400x200"
              alt="Loaded content"
              className="w-full h-48 object-cover rounded-lg mb-4"
            />
            <h4 className="text-xl font-bold mb-2">内容已加载</h4>
            <p className="text-gray-600">
              这是加载完成后的实际内容。骨架屏在数据加载期间提供了更好的用户体验。
            </p>
          </div>
        )}
      </section>
    </div>
  );
}

// ============================================================================
// 汇总展示
// ============================================================================

export default function VirtualScrollingExample() {
  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm py-4 px-8">
        <h1 className="text-2xl font-bold">虚拟滚动和懒加载示例</h1>
      </header>

      <main className="p-8 space-y-12">
        {/* 骨架屏示例 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">1. 骨架屏组件</h2>
          <SkeletonExample />
        </section>

        {/* 懒加载图片示例 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">2. 懒加载图片</h2>
          <div className="grid grid-cols-2 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <LazyImage
                key={i}
                src={`https://via.placeholder.com/400x300?text=Image+${i + 1}`}
                alt={`Lazy loaded image ${i + 1}`}
              />
            ))}
          </div>
        </section>

        {/* 无限滚动示例 */}
        <section className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-bold mb-4 border-b pb-2">3. 无限滚动</h2>
          <InfiniteScrollExample />
        </section>
      </main>
    </div>
  );
}
