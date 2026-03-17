'use client';

import React, {
  useState,
  useCallback,
  useRef,
  useEffect,
  useMemo,
  forwardRef,
  useImperativeHandle,
} from 'react';
import { Document, Page, pdfjs } from 'react-pdf';

import { getPdfWorkerSrc } from '@/lib/pdfWorker';
import { cn } from '@/lib/utils';

// 配置PDF.js worker
if (typeof window !== 'undefined') {
  pdfjs.GlobalWorkerOptions.workerSrc = getPdfWorkerSrc(pdfjs.version);
}

// ============================================================================
// 类型定义
// ============================================================================

export interface VirtualPDFViewerProps {
  /** PDF文件URL */
  pdfUrl: string;
  /** 总页数 */
  totalPages: number;
  /** 初始页码 */
  initialPage?: number;
  /** 缩放比例 */
  scale?: number;
  /** 页码变化回调 */
  onPageChange?: (page: number) => void;
  /** 视口内前后预加载页数 */
  preloadPages?: number;
  /** 页面高度估计值（用于初始布局） */
  estimatedPageHeight?: number;
  /** 自定义类名 */
  className?: string;
  /** 页面渲染完成回调 */
  onPageRendered?: (pageNumber: number) => void;
  /** PDF加载成功回调 */
  onDocumentLoadSuccess?: (numPages: number) => void;
  /** 高亮覆盖层组件 */
  highlightOverlay?: React.ReactNode;
  /** 是否启用平滑滚动 */
  smoothScroll?: boolean;
}

export interface VirtualPDFViewerRef {
  /** 滚动到指定页 */
  scrollToPage: (pageNumber: number) => void;
  /** 获取当前可见页 */
  getCurrentPage: () => number;
  /** 刷新可见区域 */
  refresh: () => void;
}

interface PageCache {
  [pageNumber: number]: {
    height: number;
    width: number;
    loaded: boolean;
  };
}

// ============================================================================
// 虚拟滚动算法
// ============================================================================

interface VisibleRange {
  start: number;
  end: number;
}

/**
 * 计算可见页面范围
 * 
 * @param scrollTop - 滚动位置
 * @param viewportHeight - 视口高度
 * @param pageHeights - 页面高度数组
 * @param preloadCount - 预加载页数
 */
function calculateVisibleRange(
  scrollTop: number,
  viewportHeight: number,
  pageHeights: number[],
  preloadCount: number = 2
): VisibleRange {
  let accumulatedHeight = 0;
  let startIndex = 0;
  let endIndex = 0;

  // 找到可见起始页
  for (let i = 0; i < pageHeights.length; i++) {
    const pageHeight = pageHeights[i];
    if (accumulatedHeight + pageHeight > scrollTop) {
      startIndex = i;
      break;
    }
    accumulatedHeight += pageHeight;
  }

  // 找到可见结束页
  accumulatedHeight = 0;
  for (let i = 0; i < pageHeights.length; i++) {
    accumulatedHeight += pageHeights[i];
    if (accumulatedHeight >= scrollTop + viewportHeight) {
      endIndex = i;
      break;
    }
  }
  
  if (endIndex === 0) {
    endIndex = pageHeights.length - 1;
  }

  // 添加预加载页数
  const start = Math.max(0, startIndex - preloadCount);
  const end = Math.min(pageHeights.length - 1, endIndex + preloadCount);

  return { start, end };
}

/**
 * 计算滚动位置对应的页码
 */
function calculatePageFromScroll(
  scrollTop: number,
  pageHeights: number[]
): number {
  let accumulatedHeight = 0;
  
  for (let i = 0; i < pageHeights.length; i++) {
    accumulatedHeight += pageHeights[i];
    if (accumulatedHeight > scrollTop) {
      return i + 1;
    }
  }
  
  return pageHeights.length;
}

// ============================================================================
// 页面占位符组件
// ============================================================================

interface PagePlaceholderProps {
  height: number;
  pageNumber: number;
  isLoading?: boolean;
}

/**
 * 页面占位符 - 用于未渲染的页面
 */
function PagePlaceholder({ height, pageNumber, isLoading }: PagePlaceholderProps) {
  return (
    <div
      className={cn(
        'w-full flex items-center justify-center bg-white border-b border-gray-200',
        'transition-opacity duration-200',
        isLoading ? 'animate-pulse bg-gray-50' : ''
      )}
      style={{ height }}
    >
      <div className="text-center">
        <div className="text-2xl text-gray-300 font-bold mb-2">{pageNumber}</div>
        {isLoading && (
          <div className="text-xs text-gray-400">加载中...</div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// 虚拟PDF查看器主组件
// ============================================================================

export const VirtualPDFViewer = forwardRef<VirtualPDFViewerRef, VirtualPDFViewerProps>(
  function VirtualPDFViewer(
    {
      pdfUrl,
      totalPages,
      initialPage = 1,
      scale = 1.0,
      onPageChange,
      preloadPages = 2,
      estimatedPageHeight = 800,
      className,
      onPageRendered,
      onDocumentLoadSuccess,
      highlightOverlay,
      smoothScroll = true,
    },
    ref
  ) {
    // 容器引用
    const containerRef = useRef<HTMLDivElement>(null);
    const scrollContainerRef = useRef<HTMLDivElement>(null);
    
    // 状态
    const [pageCache, setPageCache] = useState<PageCache>({});
    const [visibleRange, setVisibleRange] = useState<VisibleRange>({
      start: 0,
      end: Math.min(preloadPages * 2, totalPages - 1),
    });
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [isScrolling, setIsScrolling] = useState(false);
    const scrollTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const pageChangeTimeoutRef = useRef<NodeJS.Timeout | null>(null);

    // 页面高度数组（使用缓存的高度或估计高度）
    const pageHeights = useMemo(() => {
      return Array.from({ length: totalPages }, (_, i) => {
        const pageNum = i + 1;
        const cached = pageCache[pageNum];
        return cached?.height || estimatedPageHeight;
      });
    }, [totalPages, pageCache, estimatedPageHeight]);

    // 计算总高度
    const totalHeight = useMemo(() => {
      return pageHeights.reduce((sum, h) => sum + h, 0);
    }, [pageHeights]);

    // 计算页面偏移量
    const getPageOffset = useCallback((pageNumber: number): number => {
      let offset = 0;
      for (let i = 0; i < pageNumber - 1 && i < pageHeights.length; i++) {
        offset += pageHeights[i];
      }
      return offset;
    }, [pageHeights]);

    // 更新可见范围
    const updateVisibleRange = useCallback(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      const scrollTop = container.scrollTop;
      const viewportHeight = container.clientHeight;
      
      const range = calculateVisibleRange(
        scrollTop,
        viewportHeight,
        pageHeights,
        preloadPages
      );
      
      setVisibleRange(range);

      // 计算当前页码
      const newCurrentPage = calculatePageFromScroll(scrollTop, pageHeights);
      if (newCurrentPage !== currentPage) {
        setCurrentPage(newCurrentPage);
        
        // 防抖处理 page change 回调
        if (pageChangeTimeoutRef.current) {
          clearTimeout(pageChangeTimeoutRef.current);
        }
        pageChangeTimeoutRef.current = setTimeout(() => {
          onPageChange?.(newCurrentPage);
        }, 150);
      }
    }, [pageHeights, preloadPages, currentPage, onPageChange]);

    // 滚动处理
    const handleScroll = useCallback(() => {
      setIsScrolling(true);
      
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current);
      }
      
      scrollTimeoutRef.current = setTimeout(() => {
        setIsScrolling(false);
      }, 150);

      updateVisibleRange();
    }, [updateVisibleRange]);

    // 页面渲染完成处理
    const handlePageLoadSuccess = useCallback(
      (pageNumber: number, width: number, height: number) => {
        setPageCache((prev) => {
          // 如果高度没有变化，不更新
          const cached = prev[pageNumber];
          if (cached && cached.height === height && cached.width === width) {
            return prev;
          }
          
          return {
            ...prev,
            [pageNumber]: {
              width,
              height,
              loaded: true,
            },
          };
        });
        
        onPageRendered?.(pageNumber);
      },
      [onPageRendered]
    );

    // 滚动到指定页
    const scrollToPage = useCallback(
      (pageNumber: number) => {
        const container = scrollContainerRef.current;
        if (!container) return;

        const clampedPage = Math.max(1, Math.min(pageNumber, totalPages));
        const offset = getPageOffset(clampedPage);
        
        container.scrollTo({
          top: offset,
          behavior: smoothScroll ? 'smooth' : 'auto',
        });
        
        setCurrentPage(clampedPage);
      },
      [getPageOffset, totalPages, smoothScroll]
    );

    // 暴露方法给父组件
    useImperativeHandle(ref, () => ({
      scrollToPage,
      getCurrentPage: () => currentPage,
      refresh: updateVisibleRange,
    }));

    // 初始化滚动位置
    useEffect(() => {
      if (initialPage > 1) {
        const offset = getPageOffset(initialPage);
        if (scrollContainerRef.current) {
          scrollContainerRef.current.scrollTop = offset;
        }
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    // 监听滚动
    useEffect(() => {
      const container = scrollContainerRef.current;
      if (!container) return;

      container.addEventListener('scroll', handleScroll, { passive: true });
      return () => {
        container.removeEventListener('scroll', handleScroll);
      };
    }, [handleScroll]);

    // 窗口大小变化时更新可见范围
    useEffect(() => {
      const handleResize = () => {
        updateVisibleRange();
      };

      window.addEventListener('resize', handleResize);
      return () => window.removeEventListener('resize', handleResize);
    }, [updateVisibleRange]);

    // 清理定时器
    useEffect(() => {
      return () => {
        if (scrollTimeoutRef.current) {
          clearTimeout(scrollTimeoutRef.current);
        }
        if (pageChangeTimeoutRef.current) {
          clearTimeout(pageChangeTimeoutRef.current);
        }
      };
    }, []);

    // 文档加载成功
    const handleDocumentLoadSuccess = useCallback(
      ({ numPages }: { numPages: number }) => {
        onDocumentLoadSuccess?.(numPages);
        updateVisibleRange();
      },
      [onDocumentLoadSuccess, updateVisibleRange]
    );

    return (
      <div
        ref={containerRef}
        className={cn('flex flex-col h-full bg-newspaper-cream', className)}
      >
        {/* 滚动容器 */}
        <div
          ref={scrollContainerRef}
          className={cn(
            'flex-1 overflow-y-auto overflow-x-hidden',
            'scroll-smooth',
            isScrolling ? 'scroll-auto' : ''
          )}
        >
          <Document
            file={pdfUrl}
            onLoadSuccess={handleDocumentLoadSuccess}
            className="relative"
            loading={
              <div className="flex items-center justify-center p-12">
                <div className="text-newspaper-faded">加载PDF中...</div>
              </div>
            }
            error={
              <div className="flex flex-col items-center justify-center p-12 text-red-600">
                <p className="font-bold">PDF加载失败</p>
                <p className="text-sm">请尝试重新加载文件</p>
              </div>
            }
          >
            {/* 总高度占位 */}
            <div style={{ height: totalHeight, position: 'relative' }}>
              {/* 渲染可见页面 */}
              {Array.from({ length: totalPages }, (_, i) => {
                const pageNumber = i + 1;
                const isVisible =
                  pageNumber >= visibleRange.start + 1 &&
                  pageNumber <= visibleRange.end + 1;
                const cached = pageCache[pageNumber];

                if (!isVisible) {
                  // 不可见页面使用占位符
                  return (
                    <div
                      key={pageNumber}
                      style={{
                        position: 'absolute',
                        top: getPageOffset(pageNumber),
                        left: 0,
                        right: 0,
                      }}
                    >
                      <PagePlaceholder
                        height={pageHeights[i]}
                        pageNumber={pageNumber}
                        isLoading={false}
                      />
                    </div>
                  );
                }

                // 可见页面渲染实际内容
                return (
                  <div
                    key={pageNumber}
                    style={{
                      position: 'absolute',
                      top: getPageOffset(pageNumber),
                      left: 0,
                      right: 0,
                    }}
                  >
                    <VirtualPage
                      pageNumber={pageNumber}
                      scale={scale}
                      cached={cached}
                      onLoadSuccess={handlePageLoadSuccess}
                      highlightOverlay={highlightOverlay}
                    />
                  </div>
                );
              })}
            </div>
          </Document>
        </div>

        {/* 页码指示器 */}
        <PageIndicator
          currentPage={currentPage}
          totalPages={totalPages}
          onPageClick={scrollToPage}
        />
      </div>
    );
  }
);

// ============================================================================
// 虚拟页面组件
// ============================================================================

interface VirtualPageProps {
  pageNumber: number;
  scale: number;
  cached?: PageCache[number];
  onLoadSuccess: (pageNumber: number, width: number, height: number) => void;
  highlightOverlay?: React.ReactNode;
}

/**
 * 虚拟页面 - 实际渲染的PDF页面
 */
function VirtualPage({
  pageNumber,
  scale,
  cached,
  onLoadSuccess,
  highlightOverlay,
}: VirtualPageProps) {
  const handleLoadSuccess = useCallback(
    (page: pdfjs.PDFPageProxy) => {
      const viewport = page.getViewport({ scale });
      onLoadSuccess(pageNumber, viewport.width, viewport.height);
    },
    [pageNumber, scale, onLoadSuccess]
  );

  return (
    <div className="flex justify-center py-2">
      <div className="relative shadow-paper">
        <Page
          pageNumber={pageNumber}
          scale={scale}
          renderTextLayer={true}
          renderAnnotationLayer={false}
          className="bg-white"
          onLoadSuccess={handleLoadSuccess}
          loading={
            <PagePlaceholder
              height={cached?.height || 800}
              pageNumber={pageNumber}
              isLoading={true}
            />
          }
          error={
            <div className="p-8 text-center text-red-500">
              <p>页面 {pageNumber} 加载失败</p>
            </div>
          }
        />
        {highlightOverlay}
      </div>
    </div>
  );
}

// ============================================================================
// 页码指示器
// ============================================================================

interface PageIndicatorProps {
  currentPage: number;
  totalPages: number;
  onPageClick: (page: number) => void;
}

/**
 * 页码指示器 - 显示当前页码并提供快速跳转
 */
function PageIndicator({ currentPage, totalPages, onPageClick }: PageIndicatorProps) {
  const [inputValue, setInputValue] = useState(String(currentPage));
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!isEditing) {
      setInputValue(String(currentPage));
    }
  }, [currentPage, isEditing]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const page = parseInt(inputValue, 10);
    if (!isNaN(page) && page >= 1 && page <= totalPages) {
      onPageClick(page);
    }
    setIsEditing(false);
  };

  return (
    <div className="bg-newspaper-aged border-t border-newspaper-border px-4 py-2">
      <div className="flex items-center justify-center gap-4">
        <span className="text-sm text-newspaper-faded">页面</span>
        
        {isEditing ? (
          <form onSubmit={handleSubmit} className="flex items-center gap-2">
            <input
              type="number"
              min={1}
              max={totalPages}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onBlur={() => setIsEditing(false)}
              autoFocus
              className="w-16 px-2 py-1 text-center text-sm border border-newspaper-border rounded focus:outline-none focus:ring-2 focus:ring-newspaper-accent"
            />
            <span className="text-sm text-newspaper-faded">/ {totalPages}</span>
          </form>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="flex items-center gap-1 px-3 py-1 text-sm font-mono bg-white border border-newspaper-border rounded hover:bg-newspaper-cream transition-colors"
          >
            <span className="text-newspaper-accent font-bold">{currentPage}</span>
            <span className="text-newspaper-faded">/ {totalPages}</span>
          </button>
        )}
      </div>
    </div>
  );
}

export default VirtualPDFViewer;
