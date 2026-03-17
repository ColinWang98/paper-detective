# Sprint 6 计划

**时间**: 2026-02-14 ~ 2026-02-27 (2周)  
**目标**: 性能优化 + 体验提升 + PWA支持  
**团队**: 5人

---

## 🎯 Sprint 目标

### 主要目标
1. **PWA支持** - 实现离线访问、添加到主屏、后台同步
2. **性能优化** - 虚拟滚动、懒加载、代码分割
3. **暗色模式** - 完整的深色主题支持
4. **多语言** - i18n国际化框架搭建

### 成功标准
- [ ] Lighthouse PWA评分 > 90
- [ ] 首屏加载时间 < 2s
- [ ] 支持离线阅读PDF
- [ ] 暗色模式完整覆盖所有组件
- [ ] 支持中英文切换

---

## 📋 任务分解

### 架构师 (Performance Architect)

#### 1. 性能监控架构
**文件**: `lib/performance/monitor.ts`
- Web Vitals监控 (LCP, FID, CLS)
- 自定义性能标记
- 性能数据上报

#### 2. 虚拟滚动架构
**文件**: `lib/performance/virtualList.ts`
- 虚拟列表核心算法
- 动态高度计算
- 缓冲策略

#### 3. 代码分割策略
**文件**: `docs/performance/code-splitting.md`
- 路由级分割
- 组件级分割
- 动态导入策略

---

### 高级程序员-1 (Performance Frontend)

#### 1. PDF虚拟滚动
**文件**: `components/VirtualPDFViewer.tsx`
- 只渲染可视区域页面
- 页面预加载
- 内存管理

#### 2. 高亮列表虚拟滚动
**文件**: `components/VirtualHighlightList.tsx`
- 大量高亮时的性能优化
- 平滑滚动体验

#### 3. 组件懒加载
**更新文件**: `app/page.tsx`, `components/DetectiveNotebook.tsx`
- React.lazy动态导入
- Suspense加载状态
- 骨架屏优化

#### 4. 图片/资源懒加载
**文件**: `hooks/useIntersectionObserver.ts`
- Intersection Observer Hook
- 图片懒加载
- 组件懒渲染

---

### 高级程序员-2 (PWA & Offline)

#### 1. Service Worker
**文件**: `public/sw.ts`, `app/sw-register.ts`
- Workbox集成
- 缓存策略
- 后台同步

#### 2. Web App Manifest
**文件**: `public/manifest.json`
- PWA配置
- 图标集
- 主题色

#### 3. 离线存储策略
**更新文件**: `lib/db.ts`
- 论文离线缓存
- 高亮数据同步
- 冲突解决

#### 4. 后台同步API
**文件**: `app/api/sync/route.ts`
- 离线操作队列
- 网络恢复后同步
- 冲突处理

---

### UI设计师 (Theme & i18n)

#### 1. 暗色模式
**文件**: `app/providers/ThemeProvider.tsx`, `app/globals.css`
- CSS变量系统
- 主题切换组件
- 系统偏好检测

**更新组件**:
- `components/RealPDFViewer.tsx`
- `components/DetectiveNotebook.tsx`
- `components/AIClueCard.tsx`
- 所有组件暗色适配

#### 2. i18n框架
**文件**: `i18n/config.ts`, `i18n/locales/`
- next-intl配置
- 语言文件结构
- 路由国际化

#### 3. 翻译内容
**文件**: 
- `i18n/locales/zh/common.json`
- `i18n/locales/en/common.json`
- 组件文本提取

---

## 📅 时间线

### Week 1 (02/14 - 02/20)

| 日期 | 任务 | 负责人 |
|------|------|--------|
| 02/14 | 架构设计、PWA基础配置 | 架构师 + 高级程序员-2 |
| 02/15 | Service Worker、Manifest | 高级程序员-2 |
| 02/16 | 虚拟滚动核心实现 | 高级程序员-1 |
| 02/17 | 暗色模式框架 | UI设计师 |
| 02/18 | 离线存储策略 | 高级程序员-2 |
| 02/19 | i18n框架搭建 | UI设计师 |
| 02/20 | 周中评审、问题修复 | 全员 |

### Week 2 (02/21 - 02/27)

| 日期 | 任务 | 负责人 |
|------|------|--------|
| 02/21 | 组件暗色适配 | UI设计师 |
| 02/22 | PDF虚拟滚动优化 | 高级程序员-1 |
| 02/23 | 翻译内容完善 | UI设计师 |
| 02/24 | 性能测试优化 | 架构师 + 高级程序员-1 |
| 02/25 | PWA测试、Bug修复 | 高级程序员-2 |
| 02/26 | 集成测试 | 全员 |
| 02/27 | Sprint评审、回顾 | 全员 |

---

## 🔧 技术方案

### PWA架构
```
┌─────────────────────────────────────┐
│           PWA Architecture          │
├─────────────────────────────────────┤
│                                     │
│  ┌─────────┐     ┌─────────────┐   │
│  │   UI    │◄───►│  Service    │   │
│  │  Layer  │     │   Worker    │   │
│  └────┬────┘     └──────┬──────┘   │
│       │                 │          │
│       ▼                 ▼          │
│  ┌─────────┐     ┌─────────────┐   │
│  │ Indexed │◄───►│   Cache     │   │
│  │   DB    │     │  Storage    │   │
│  └─────────┘     └─────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │      Background Sync        │   │
│  └─────────────────────────────┘   │
│                                     │
└─────────────────────────────────────┘
```

### 性能优化策略
```
Before:
┌─────────────────────────────────────┐
│  Load All PDF Pages (50 pages)      │
│  Render All Highlights (500 items)  │
│  Load All Components                │
└─────────────────────────────────────┘

After:
┌─────────────────────────────────────┐
│  Virtual Scroll - Only visible      │
│  Lazy Load - On demand              │
│  Code Split - Route based           │
│  Cache - Service Worker             │
└─────────────────────────────────────┘
```

### 暗色模式实现
```css
/* CSS Variables */
:root {
  --bg-primary: #ffffff;
  --text-primary: #1a1a1a;
}

[data-theme="dark"] {
  --bg-primary: #1a1a1a;
  --text-primary: #ffffff;
}

/* Tailwind */
.bg-theme {
  @apply bg-[var(--bg-primary)];
}
```

---

## 📊 预期成果

### 性能指标
| 指标 | Before | After | 提升 |
|------|--------|-------|------|
| 首屏加载 | 2.5s | < 2s | 20% |
| PDF大文件 | 卡顿 | 流畅 | - |
| 内存占用 | 高 | 低 | 50% |
| Lighthouse | 70 | > 90 | 28% |

### 功能特性
- [ ] 离线阅读PDF
- [ ] 后台同步数据
- [ ] 添加到主屏
- [ ] 暗色模式
- [ ] 中英文切换

---

## 🚨 风险与缓解

| 风险 | 可能性 | 影响 | 缓解措施 |
|------|--------|------|----------|
| Service Worker兼容性 | 中 | 中 | 渐进增强，降级方案 |
| 虚拟滚动复杂度 | 中 | 高 | 使用成熟库，充分测试 |
| 暗色模式覆盖不全 | 高 | 低 | 系统检查清单 |
| i18n内容量大 | 中 | 中 | 分阶段，先核心功能 |

---

## 📚 参考文档

- [Workbox Documentation](https://developers.google.com/web/tools/workbox)
- [Next.js PWA Guide](https://nextjs.org/docs/app/building-your-your-application/configuring/progressive-web-apps)
- [React Virtualized](https://github.com/bvaughn/react-virtualized)
- [next-intl Documentation](https://next-intl-docs.vercel.app/

---

**Sprint 6 Ready! Let's build a faster, more accessible Paper Detective! 🚀**
