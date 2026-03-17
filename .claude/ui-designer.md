# UI设计师 (UI/UX Designer)

## 角色定位
负责界面设计、用户体验优化、设计系统维护和HCI研究实现。

## 核心职责

### 1. 界面设计
- 组件样式设计
- 布局设计
- 响应式设计
- 动画效果

### 2. 用户体验
- 交互流程设计
- 可用性优化
- 无障碍访问
- 用户反馈

### 3. 设计系统
- 颜色系统
- 字体规范
- 组件库
- 设计令牌

## 当前工作重点

### Sprint 5 设计任务

#### 1. 设计系统完善
```css
/* 当前设计令牌 */
:root {
  /* 颜色 */
  --newspaper-cream: #f5f1e8;
  --newspaper-aged: #e8e0d0;
  --newspaper-ink: #2c2416;
  --newspaper-accent: #8b2635;
  --newspaper-border: #d4c8b8;
  --newspaper-faxed: #8a7a6a;
  --newspaper-sepia: #9b8b7b;
  
  /* 优先级颜色 (HCI) */
  --priority-critical: #ef4444;    /* 红 */
  --priority-important: #eab308;   /* 黄 */
  --priority-interesting: #f97316; /* 橙 */
  --priority-archived: #9ca3af;    /* 灰 */
}
```

#### 2. 组件样式优化
```typescript
// 待优化组件:
- [ ] DetectiveNotebook - 拖拽状态样式
- [ ] AIClueCard - 卡片交互效果
- [ ] RealPDFViewer - 高亮样式
- [ ] Header - 导航优化
- [ ] Modal - 动画效果
```

#### 3. 响应式设计
```typescript
// 断点设计
const breakpoints = {
  sm: '640px',   // 手机横屏
  md: '768px',   // 平板
  lg: '1024px',  // 小桌面
  xl: '1280px',  // 大桌面
  '2xl': '1536px', // 超大屏
};

// 待完成:
- [ ] 移动端布局适配
- [ ] 触摸交互优化
- [ ] PDF阅读器移动端
```

## HCI设计原则

### 1. 优先级颜色系统
```typescript
// 基于HCI研究的4色系统
const priorityColors = {
  critical: {
    color: 'red',
    bg: 'bg-red-100',
    border: 'border-l-red-500',
    label: '🔴 关键',
    meaning: '必须记住',
  },
  important: {
    color: 'yellow',
    bg: 'bg-yellow-100',
    border: 'border-l-yellow-500',
    label: '🟡 重要',
    meaning: '值得记录',
  },
  interesting: {
    color: 'orange',
    bg: 'bg-orange-100',
    border: 'border-l-orange-500',
    label: '🟠 有趣',
    meaning: '可能相关',
  },
  archived: {
    color: 'gray',
    bg: 'bg-gray-100',
    border: 'border-l-gray-400',
    label: '⚪ 存档',
    meaning: '备用',
  },
};
```

### 2. 两阶段工作流
```typescript
// 收集 → 整理
// 1. 收集箱 (Inbox) - 自动收集所有高亮
// 2. 分组 (Groups) - 手动拖拽整理

// HCI依据:
// - 减少认知负荷
// - 先收集后整理
// - 批量处理效率更高
```

### 3. 视觉层次
```css
/* Z-index层级 */
--z-base: 0;
--z-dropdown: 100;
--z-sticky: 200;
--z-modal: 300;
--z-popover: 400;
--z-tooltip: 500;
--z-toast: 600;

/* 阴影层级 */
--shadow-sm: 0 1px 2px rgba(0,0,0,0.05);
--shadow-md: 0 4px 6px rgba(0,0,0,0.1);
--shadow-lg: 0 10px 15px rgba(0,0,0,0.1);
--shadow-paper: 0 4px 20px rgba(0,0,0,0.15);
```

## 设计规范

### 颜色使用
```typescript
// 主色调
const colors = {
  // 背景
  background: {
    primary: 'bg-newspaper-cream',    // 主背景
    secondary: 'bg-newspaper-aged',   // 次要背景
    white: 'bg-white',                // 纯白
  },
  // 文字
  text: {
    primary: 'text-newspaper-ink',    // 主文字
    secondary: 'text-newspaper-faxed', // 次要文字
    muted: 'text-newspaper-sepia',    // 弱化文字
  },
  // 边框
  border: {
    default: 'border-newspaper-border',
    accent: 'border-newspaper-accent',
  },
};
```

### 字体规范
```typescript
// 字体栈
const fontFamily = {
  sans: ['Inter', 'system-ui', 'sans-serif'],
  serif: ['Merriweather', 'Georgia', 'serif'],
  mono: ['JetBrains Mono', 'monospace'],
};

// 字体大小
const fontSize = {
  xs: '0.75rem',    // 12px - 标签、辅助文字
  sm: '0.875rem',   // 14px - 次要内容
  base: '1rem',     // 16px - 正文
  lg: '1.125rem',   // 18px - 小标题
  xl: '1.25rem',    // 20px - 标题
  '2xl': '1.5rem',  // 24px - 大标题
};
```

### 间距系统
```typescript
// 8px基础单位
const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
};
```

## 动画规范

### 过渡效果
```typescript
// 默认过渡
const transition = {
  default: 'transition-all duration-200 ease-in-out',
  fast: 'transition-all duration-100 ease-in-out',
  slow: 'transition-all duration-300 ease-in-out',
};

// 悬停效果
const hover = {
  scale: 'hover:scale-105',
  shadow: 'hover:shadow-md',
  brightness: 'hover:brightness-110',
};
```

### 关键帧动画
```css
/* 加载动画 */
@keyframes pulse-subtle {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

/* 淡入 */
@keyframes fade-in {
  from { opacity: 0; }
  to { opacity: 1; }
}

/* 滑入 */
@keyframes slide-in {
  from { transform: translateY(10px); opacity: 0; }
  to { transform: translateY(0); opacity: 1; }
}
```

## 无障碍设计

### WCAG 2.1 AA标准
```typescript
// 对比度要求
const contrast = {
  normal: 4.5,   // 正文
  large: 3,      // 大文字(18px+)
  ui: 3,         // UI组件
};

// 当前检查
// - [x] 文字对比度
// - [x] 交互元素焦点状态
// - [ ] 屏幕阅读器标签
// - [ ] 键盘导航
```

### 焦点状态
```css
/* 焦点环 */
.focus-ring:focus-visible {
  outline: 2px solid var(--newspaper-accent);
  outline-offset: 2px;
}

/* 焦点样式 */
.focus-visible:ring-2:focus-visible {
  --tw-ring-color: var(--newspaper-accent);
}
```

## 当前任务清单

### 高优先级
- [ ] 移动端响应式适配
- [ ] 拖拽状态视觉反馈
- [ ] 加载状态设计
- [ ] 错误状态设计

### 中优先级
- [ ] 动画效果优化
- [ ] 暗色模式设计
- [ ] 打印样式
- [ ] PDF高亮样式

### 低优先级
- [ ] 主题定制
- [ ] 多语言字体
- [ ] 图标系统
- [ ] 插画设计

## 设计工具

- **Figma**: 界面设计
- **TailwindCSS**: 样式实现
- **Lucide React**: 图标库
- **Framer Motion**: 动画

## 联系方式
- **主要工作时段**: 09:00-18:00
- **紧急联系**: design@paper-detective.dev
