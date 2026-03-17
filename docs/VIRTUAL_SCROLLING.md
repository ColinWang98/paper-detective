# 虚拟滚动和懒加载功能文档

本文档介绍了 Paper Detective 项目中实现的虚拟滚动和懒加载功能。

## 📚 功能概览

| 功能 | 文件 | 描述 |
|------|------|------|
| PDF 虚拟滚动 | `components/VirtualPDFViewer.tsx` | 只渲染可视区域的PDF页面 |
| 高亮虚拟列表 | `components/VirtualHighlightList.tsx` | 大量高亮时的虚拟滚动 |
| Intersection Observer | `hooks/useIntersectionObserver.ts` | 懒加载Hook封装 |
| 骨架屏 | `components/ui/Skeleton.tsx` | 加载状态占位组件 |
| 虚拟列表算法 | `lib/virtualList.ts` | 核心虚拟滚动算法 |

## 🚀 快速开始

### 1. PDF 虚拟滚动查看器

```tsx
import { useRef } from 'react';
import { VirtualPDFViewer, VirtualPDFViewerRef } from '@/components/VirtualPDFViewer';

function MyComponent() {
  const viewerRef = useRef<VirtualPDFViewerRef>(null);

  const handlePageChange = (page: number) => {
    console.log(`当前页面: ${page}`);
  };

  // 跳转到指定页
  const jumpToPage = (page: number) => {
    viewerRef.current?.scrollToPage(page);
  };

  return (
    <VirtualPDFViewer
      ref={viewerRef}
      pdfUrl="/path/to/document.pdf"
      totalPages={100}
      initialPage={1}
      scale={1.2}
      onPageChange={handlePageChange}
      preloadPages={2}           // 前后各预加载2页
      estimatedPageHeight={800}  // 估计页高
    />
  );
}
```

### 2. 高亮虚拟列表

```tsx
import { useRef, useCallback } from 'react';
import { VirtualHighlightList, VirtualHighlightListRef, HighlightCardItem } from '@/components/VirtualHighlightList';
import type { Highlight } from '@/types';

function MyComponent() {
  const listRef = useRef<VirtualHighlightListRef>(null);
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [searchQuery, setSearchQuery] = useState('');

  const renderHighlight = useCallback((highlight: Highlight) => {
    return (
      <HighlightCardItem
        highlight={highlight}
        onClick={() => console.log('Clicked:', highlight.id)}
      />
    );
  }, []);

  return (
    <VirtualHighlightList
      ref={listRef}
      highlights={highlights}
      renderItem={renderHighlight}
      height={400}
      estimatedItemHeight={100}
      overscan={5}              // 预加载5项
      searchQuery={searchQuery} // 搜索过滤
      dynamicHeight={true}      // 启用动态高度
      onVisibleItemsChange={(items) => {
        console.log(`可见项数: ${items.length}`);
      }}
    />
  );
}
```

### 3. 懒加载 Hook

```tsx
import { useIntersectionObserver } from '@/hooks/useIntersectionObserver';

// 基础用法 - 懒加载图片
function LazyImage({ src, alt }: { src: string; alt: string }) {
  const [isLoaded, setIsLoaded] = useState(false);
  
  const { ref, isIntersecting } = useIntersectionObserver(
    undefined,
    {
      options: { rootMargin: '50px' },
      once: true, // 只触发一次
    }
  );

  return (
    <div ref={ref}>
      {isIntersecting && (
        <img src={src} alt={alt} onLoad={() => setIsLoaded(true)} />
      )}
    </div>
  );
}

// 持续监听模式 - 无限滚动
function InfiniteScroll() {
  const [items, setItems] = useState([]);
  
  useIntersectionObserver(
    (isIntersecting) => {
      if (isIntersecting) {
        loadMoreItems().then(newItems => {
          setItems(prev => [...prev, ...newItems]);
        });
      }
    },
    {
      options: { rootMargin: '100px' },
      once: false, // 持续监听
    }
  );

  return <div>{/* ... */}</div>;
}
```

### 4. 骨架屏组件

```tsx
import { 
  Skeleton, 
  SkeletonText, 
  SkeletonCard, 
  SkeletonPDF,
  SkeletonHighlightCard 
} from '@/components/ui/Skeleton';

// 基础骨架屏
<Skeleton width={100} height={100} variant="circle" />

// 文本骨架屏
<SkeletonText lines={3} lastLineWidth="60%" />

// 卡片骨架屏
<SkeletonCard hasImage imageHeight={160} contentLines={2} />

// PDF 骨架屏
<SkeletonPDF pageCount={3} hasToolbar />

// 高亮卡片骨架屏
<SkeletonHighlightCard count={5} />
```

## 📐 虚拟列表算法

虚拟列表核心算法位于 `lib/virtualList.ts`，支持：

### 固定高度列表

```ts
import { calculateFixedVirtualState, getFixedItemOffset } from '@/lib/virtualList';

const state = calculateFixedVirtualState({
  itemCount: 1000,
  viewportHeight: 400,
  itemHeight: 50,
  scrollOffset: 500,
  overscan: 3,
});

// state.visibleRange = { start: 7, end: 15, overscanStart: 4, overscanEnd: 18 }
// state.totalHeight = 50000
```

### 动态高度列表

```ts
import { createHeightCache, calculateDynamicVirtualState, findStartIndex } from '@/lib/virtualList';

const cache = createHeightCache(100); // 默认高度100

// 设置实际高度
cache.set(0, 120);
cache.set(1, 80);

const measurements = cache.getMeasurements(itemCount);
const state = calculateDynamicVirtualState({
  measurements,
  viewportHeight: 400,
  scrollOffset: 500,
  overscan: 3,
});
```

## 🎨 组件懒加载

使用 React.lazy 和 Suspense 实现组件级懒加载：

```tsx
import { lazy, Suspense } from 'react';
import { SkeletonPDF } from '@/components/ui/Skeleton';

// 懒加载重型组件
const RealPDFViewer = lazy(() => import('@/components/RealPDFViewer'));
const DetectiveNotebook = lazy(() => import('@/components/DetectiveNotebook'));

function App() {
  return (
    <div>
      <Suspense fallback={<SkeletonPDF pageCount={1} />}>
        <RealPDFViewer />
      </Suspense>
      
      <Suspense fallback={<NotebookSkeleton />}>
        <DetectiveNotebook />
      </Suspense>
    </div>
  );
}
```

## ⚡ 性能优化建议

### 1. 合理设置预加载数量

```tsx
// 移动端建议较小的预加载数量
const overscan = isMobile ? 2 : 5;

// PDF查看器预加载
const preloadPages = 2; // 前后各2页
```

### 2. 使用 useCallback 缓存渲染函数

```tsx
const renderItem = useCallback((item: Item) => {
  return <MyItemComponent item={item} />;
}, []); // 依赖项变化时才重新创建
```

### 3. 防抖/节流滚动事件

```tsx
import { debounce, throttle } from '@/lib/virtualList';

// 防抖 - 适用于搜索输入
const debouncedSearch = debounce((query: string) => {
  performSearch(query);
}, 300);

// 节流 - 适用于滚动事件
const throttledScroll = throttle((offset: number) => {
  updateVisibleRange(offset);
}, 16); // 约60fps
```

### 4. 动态高度优化

```tsx
// 测量缓存只在高度变化时更新
const measureItem = useCallback((index: number, element: HTMLElement | null) => {
  if (!element) return;
  
  const height = element.getBoundingClientRect().height;
  const cachedHeight = cache.get(index);
  
  // 高度变化时才更新
  if (Math.abs(height - cachedHeight) > 1) {
    cache.set(index, height);
    updateLayout();
  }
}, []);
```

## 🔧 API 参考

### VirtualPDFViewer Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| pdfUrl | string | 必填 | PDF文件URL |
| totalPages | number | 必填 | 总页数 |
| initialPage | number | 1 | 初始页码 |
| scale | number | 1.0 | 缩放比例 |
| onPageChange | (page: number) => void | - | 页码变化回调 |
| preloadPages | number | 2 | 预加载页数 |
| estimatedPageHeight | number | 800 | 估计页高 |

### VirtualHighlightList Props

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| highlights | Highlight[] | 必填 | 高亮列表 |
| renderItem | (highlight: Highlight) => ReactNode | 必填 | 渲染函数 |
| height | number \| string | 400 | 容器高度 |
| estimatedItemHeight | number | 100 | 估计项高 |
| overscan | number | 3 | 预加载项数 |
| searchQuery | string | '' | 搜索关键词 |
| dynamicHeight | boolean | true | 启用动态高度 |

### useIntersectionObserver Options

| 属性 | 类型 | 默认值 | 描述 |
|------|------|--------|------|
| options.root | Element \| null | null | 根元素 |
| options.rootMargin | string | '0px' | 根边距 |
| options.threshold | number \| number[] | 0 | 阈值 |
| once | boolean | false | 只触发一次 |

## 📝 示例

查看 `components/examples/VirtualScrollingExample.tsx` 获取完整的使用示例。

## 🐛 常见问题

### Q: 虚拟滚动列表出现空白？

A: 检查 `estimatedItemHeight` 是否设置合理。如果估计值与实际高度差异过大，会导致计算偏差。

### Q: 动态高度列表闪烁？

A: 确保 `measureItem` 回调正确绑定到元素，并且只在高度真正变化时才更新缓存。

### Q: 快速滚动时卡顿？

A: 
1. 减小 `overscan` 值
2. 使用 `will-change: transform` CSS 属性
3. 考虑使用 `requestAnimationFrame` 优化滚动处理

### Q: Intersection Observer 不触发？

A: 确保目标元素有实际的尺寸（宽高不为0），并且正确设置了 `root` 和 `rootMargin`。

## 📄 文件清单

```
paper-detective/
├── components/
│   ├── VirtualPDFViewer.tsx      # PDF虚拟滚动查看器
│   ├── VirtualHighlightList.tsx  # 高亮虚拟列表
│   ├── ui/
│   │   └── Skeleton.tsx          # 骨架屏组件
│   └── examples/
│       └── VirtualScrollingExample.tsx  # 使用示例
├── hooks/
│   └── useIntersectionObserver.ts  # 懒加载Hook
├── lib/
│   ├── virtualList.ts            # 虚拟滚动算法
│   └── utils.ts                  # 工具函数 (cn)
└── docs/
    └── VIRTUAL_SCROLLING.md      # 本文档
```

## 🔗 相关链接

- [React Virtualization Patterns](https://web.dev/virtualize-long-lists-react-window/)
- [Intersection Observer API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [React.lazy and Suspense](https://react.dev/reference/react/lazy)
