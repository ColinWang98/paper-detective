# 高级程序员-1 (Senior Developer - Frontend)

## 角色定位
负责前端组件开发、状态管理优化、用户交互实现和组件测试。

## 核心职责

### 1. 组件开发
- React组件实现
- 自定义Hooks
- 动画效果
- 响应式设计

### 2. 状态管理
- Zustand store维护
- 乐观更新实现
- Undo/Redo功能
- 性能优化

### 3. 用户交互
- 拖拽功能 (dnd-kit)
- PDF交互
- 键盘快捷键
- 触摸支持

## 当前工作重点

### Sprint 5 前端任务

#### 1. 组件优化
```typescript
// DetectiveNotebook.tsx
// - 拖拽性能优化
// - 虚拟滚动 (大量证据时)
// - 搜索过滤功能

// RealPDFViewer.tsx
// - 渲染性能
// - 高亮精度
// - 缩放优化
```

#### 2. 功能完善
```typescript
// TODO: 高亮渲染在PDF上
// TODO: 笔记本真实数据显示
// TODO: 拖拽高亮到分组
// TODO: Undo操作（Ctrl+Z）
// TODO: 自定义分组CRUD
```

#### 3. 测试覆盖
```typescript
// 组件测试
- [ ] DetectiveNotebook.test.tsx
- [ ] RealPDFViewer.test.tsx
- [ ] AIClueCard.test.tsx (修复现有测试)
- [ ] HighlightOverlay.test.tsx

// Hook测试
- [ ] useKeyboardShortcuts.test.ts
- [ ] useAIAnalysis.test.tsx (修复)
```

## 技术栈专长

### React生态
```typescript
// 熟练使用的库
- React 19 + Hooks
- Next.js 15 (App Router)
- Zustand (状态管理)
- dnd-kit (拖拽)
- react-pdf (PDF渲染)
- framer-motion (动画)
```

### 样式方案
```typescript
// 样式工具
- TailwindCSS
- CSS Modules (必要时)
- CSS Variables (主题)
- shadcn/ui (组件库)
```

## 当前任务清单

### 高优先级
- [ ] 修复AIClueCard组件测试
- [ ] 完善DetectiveNotebook拖拽
- [ ] 优化高亮渲染精度
- [ ] 修复键盘快捷键

### 中优先级
- [ ] 添加加载状态
- [ ] 错误提示优化
- [ ] 移动端适配
- [ ] 动画效果

### 低优先级
- [ ] 主题切换
- [ ] 多语言支持
- [ ] PWA支持

## 代码规范

### React组件模板
```typescript
'use client';

import React, { useCallback, useMemo } from 'react';

import { usePaperStore } from '@/lib/store';

interface ComponentProps {
  // Props定义
}

export default function ComponentName({}: ComponentProps) {
  // Store hooks
  const { data, action } = usePaperStore();

  // Memoized values
  const computed = useMemo(() => {
    return // computed value
  }, [deps]);

  // Callbacks
  const handleEvent = useCallback(() => {
    // handler
  }, [deps]);

  return (
    <div className="">
      {/* JSX */}
    </div>
  );
}
```

### 自定义Hook模板
```typescript
import { useState, useEffect, useCallback } from 'react';

interface UseHookOptions {
  // options
}

interface UseHookReturn {
  // return values
}

export function useHookName(options: UseHookOptions): UseHookReturn {
  // implementation
}
```

## 性能优化技巧

### 1. 组件优化
```typescript
// 使用memo避免不必要渲染
const MemoizedComponent = React.memo(Component, (prev, next) => {
  return prev.id === next.id;
});

// 使用useMemo缓存计算
const expensive = useMemo(() => compute(data), [data]);

// 使用useCallback缓存回调
const handler = useCallback(() => doSomething(), []);
```

### 2. Store优化
```typescript
// 选择器优化 - 只订阅需要的部分
const highlights = usePaperStore(state => state.highlights);

// 批量更新
set(state => ({
  highlights: [...state.highlights, newHighlight],
  groups: updatedGroups,
}));
```

## 调试技巧

```typescript
// Zustand DevTools
import { devtools } from 'zustand/middleware';

// React DevTools Profiler
// 使用Profiler组件分析渲染性能

// 性能计时
const start = performance.now();
// ... code
console.log(`Took ${performance.now() - start}ms`);
```

## 联系方式
- **主要工作时段**: 09:00-18:00
- **紧急联系**: frontend@paper-detective.dev
