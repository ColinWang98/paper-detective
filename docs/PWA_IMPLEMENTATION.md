# PWA (Progressive Web App) Implementation

本文档描述了 Paper Detective 的 PWA 功能实现。

## 功能概述

Paper Detective 现已完全支持 PWA，提供以下功能：

### ✅ 已实现功能

1. **Web App Manifest** - 应用清单配置
2. **Service Worker** - 离线缓存和后台同步
3. **离线页面** - 优雅的离线体验
4. **后台同步** - 离线操作队列和自动同步
5. **安装提示** - PWA 安装引导
6. **离线指示器** - 网络状态和同步状态显示

## 文件结构

```
paper-detective/
├── app/
│   ├── sw-register.ts          # Service Worker 注册模块
│   ├── offline/
│   │   └── page.tsx            # 离线页面
│   └── api/sync/
│       └── route.ts            # 同步 API 路由
├── components/
│   ├── PWAProvider.tsx         # PWA 提供者组件
│   ├── PWAInstallPrompt.tsx    # PWA 安装提示
│   └── OfflineIndicator.tsx    # 离线状态指示器
├── hooks/
│   ├── usePWA.ts               # PWA Hook
│   └── ...
├── lib/sync/
│   └── backgroundSync.ts       # 后台同步管理器
├── public/
│   ├── manifest.json           # Web App Manifest
│   ├── sw.js                   # Service Worker (生产)
│   ├── sw.ts                   # Service Worker (TypeScript)
│   ├── icons/                  # PWA 图标
│   └── splash/                 # iOS 启动屏
└── docs/PWA_IMPLEMENTATION.md  # 本文档
```

## 缓存策略

### 1. 核心资源 (Cache First)
- HTML、CSS、JavaScript 文件
- 字体文件
- 缓存时间：30 天

### 2. PDF 文件 (Cache First + 容量限制)
- 最多缓存 20 个 PDF 文件
- 缓存时间：7 天
- 敏感 PDF 可选择不缓存

### 3. API 响应 (Network First / Stale While Revalidate)
- AI 分析结果：Network First (10秒超时)
- 其他 API：Stale While Revalidate
- 缓存时间：1-7 天

### 4. 图片 (Cache First)
- 缓存时间：30 天
- 最大 200 张图片

## 后台同步

### 支持的操作类型

```typescript
type SyncOperationType = 
  | 'CREATE_HIGHLIGHT'
  | 'UPDATE_HIGHLIGHT' 
  | 'DELETE_HIGHLIGHT'
  | 'CREATE_GROUP'
  | 'UPDATE_GROUP'
  | 'DELETE_GROUP'
  | 'MOVE_HIGHLIGHT'
  | 'ADD_CLUE_CARD'
  | 'UPDATE_CLUE_CARD'
  | 'DELETE_CLUE_CARD'
  | 'UPDATE_BRIEF';
```

### 数据流

```
用户操作 → 本地存储(IndexedDB) → 添加到同步队列
                                          ↓
网络恢复 → 后台同步 → 发送到服务器
                                          ↓
服务器响应 → 更新本地状态 → 清除队列
```

## 使用方法

### 1. 使用 PWA Hook

```typescript
import { usePWA } from '@/hooks/usePWA';

function MyComponent() {
  const { 
    isInstallable, 
    isInstalled, 
    isOnline,
    promptInstall,
    checkForUpdates,
    applyUpdate 
  } = usePWA();

  // Check if app can be installed
  if (isInstallable) {
    // Show install button
  }
}
```

### 2. 使用后台同步

```typescript
import { useSync } from '@/lib/sync/backgroundSync';

function MyComponent() {
  const { queueOperation, triggerSync } = useSync();

  const handleCreateHighlight = async (highlight) => {
    // Save locally first
    await saveHighlight(highlight);
    
    // Queue for sync
    await queueOperation('CREATE_HIGHLIGHT', highlight, paperId);
  };
}
```

### 3. 组件中使用

```typescript
import PWAProvider from '@/components/PWAProvider';
import PWAInstallPrompt from '@/components/PWAInstallPrompt';
import OfflineIndicator from '@/components/OfflineIndicator';

// Wrap your app with PWAProvider
function App() {
  return (
    <PWAProvider>
      <YourApp />
    </PWAProvider>
  );
}
```

## 安装 PWA

### 桌面端 (Chrome/Edge)

1. 访问应用网址
2. 地址栏右侧会出现安装图标 (➕)
3. 点击"安装 Paper Detective"

### iOS (Safari)

1. 访问应用网址
2. 点击底部分享按钮
3. 选择"添加到主屏幕"
4. 点击"添加"

### Android (Chrome)

1. 访问应用网址
2. 底部会出现安装提示
3. 点击"添加到主屏幕"

## 离线功能

### 离线时可用的功能

- ✅ 查看已缓存的 PDF 文件
- ✅ 阅读已保存的高亮和笔记
- ✅ 创建新的高亮（会加入同步队列）
- ✅ 管理文件夹结构
- ✅ 查看情报摘要

### 离线时不可用的功能

- ❌ AI 分析（新请求）
- ❌ 上传新 PDF
- ❌ 导出功能

## 配置

### next.config.js

```javascript
const nextConfig = {
  // ... other config
  pwa: {
    dest: 'public',
    register: true,
    skipWaiting: true,
  },
};
```

### manifest.json

位于 `public/manifest.json`，包含：
- 应用名称和描述
- 图标配置
- 主题色和背景色
- 显示模式 (standalone)
- 快捷方式

## 开发注意事项

### 1. Service Worker 开发模式

在开发模式下，Service Worker 默认被禁用。要测试 PWA 功能：

```bash
npm run build
npm start
```

### 2. 清除缓存

在 Chrome DevTools:
1. Application > Clear storage > Clear site data
2. 或访问 `/offline` 页面点击"清除缓存"

### 3. 调试 Service Worker

1. 打开 DevTools > Application > Service Workers
2. 勾选 "Update on reload"
3. 勾选 "Bypass for network" (临时禁用缓存)

### 4. 测试离线功能

1. 打开 DevTools > Network
2. 选择 "Offline" 预设
3. 刷新页面测试离线体验

## 隐私考虑

### PDF 缓存隐私

敏感 PDF 文件可以通过添加 `sensitive=true` 参数避免被缓存：

```javascript
// 不会被缓存
fetch('/api/pdf/file?sensitive=true');
```

### 数据存储

- 所有数据存储在本地 IndexedDB
- 同步队列使用 localStorage 作为备份
- 不会上传用户数据到第三方服务

## 性能优化

### 缓存配额管理

- 自动清理过期缓存
- PDF 缓存 LRU (最近最少使用) 策略
- 超出配额时自动清理旧数据

### 带宽优化

- 图片懒加载
- API 响应缓存
- 增量同步（仅同步变更）

## 故障排除

### Service Worker 未注册

1. 检查 HTTPS（localhost 除外）
2. 检查 `sw.js` 文件是否存在
3. 检查浏览器控制台错误

### 缓存未更新

1. 手动清除浏览器缓存
2. 更新 Service Worker 版本号
3. 使用无痕模式测试

### 后台同步失败

1. 检查网络连接
2. 查看同步队列状态
3. 检查服务器 API 可用性

## 未来增强

- [ ] 推送通知支持
- [ ] 周期性后台同步
- [ ] 离线 AI 分析（边缘计算）
- [ ] 多设备同步
- [ ] 数据导出/导入

## 参考文档

- [Workbox Documentation](https://developer.chrome.com/docs/workbox/)
- [Web App Manifest](https://developer.mozilla.org/en-US/docs/Web/Manifest)
- [Service Worker API](https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API)
- [Background Sync API](https://developer.mozilla.org/en-US/docs/Web/API/Background_Synchronization_API)
