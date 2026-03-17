# Paper Detective - 文献侦探

将科研文献重构为"案发现场"，研究者扮演"侦探"收集线索、拼凑真相。

## 项目概览

Paper Detective 是一个创新的研究文献阅读工具，采用侦探游戏的隐喻，让研究过程更加有趣和高效。

### 核心特性

- 📰 **报纸风格UI**: 复古报纸排版设计，营造沉浸式阅读体验
- 🎯 **智能高亮系统**: 多色标记，快速收集关键信息
- 📓 **侦探笔记本**: 拖拽分组，构建知识图谱
- 🤖 **AI助手**: Clip (高效模式) 和 Deep Throat (深度模式)
- 🔗 **知识关联**: 集成 Google Scholar，发现相关研究

## 技术栈

- **前端框架**: Next.js 15 + React 19
- **样式**: Tailwind CSS
- **拖拽**: @dnd-kit
- **动画**: Framer Motion
- **PDF渲染**: react-pdf (PDF.js)
- **图标**: Lucide React
- **语言**: TypeScript

## 安装与运行

### 1. 安装依赖

```bash
cd paper-detective
npm install
```

### 2. 启动开发服务器

```bash
npm run dev
```

应用将在 [http://localhost:3000](http://localhost:3000) 启动

### 3. 构建生产版本

```bash
npm run build
npm start
```

## 项目结构

```
paper-detective/
├── app/                    # Next.js App Router
│   ├── globals.css        # 全局样式和报纸主题
│   ├── layout.tsx         # 根布局
│   └── page.tsx           # 主页面
├── components/            # React 组件
│   ├── MainLayout.tsx    # 主布局（双栏设计）
│   ├── Header.tsx        # 报纸头部
│   ├── PDFViewer.tsx     # PDF 查看器
│   └── DetectiveNotebook.tsx  # 侦探笔记本
├── lib/                  # 工具函数和配置
├── styles/               # 额外样式文件
└── public/               # 静态资源
```

## 设计理念

### 报纸风格主题

- **颜色方案**:
  - 奶油色背景 (#f4f1ea)
  - 深墨色文字 (#2c2c2c)
  - 复古金点缀 (#d4a84b)
  - 警示红强调 (#8b2323)

- **排版**:
  - Georgia / Times New Roman 衬线字体
  - 优雅的行高和字间距
  - 报纸风格的装饰元素

### 交互设计

1. **阅读与收集**
   - 在左侧PDF区域选择文本
   - 自动添加到右侧"收集箱"
   - 拖拽到不同分组进行分类

2. **双模式系统**
   - B模式: 快速收集结构化信息
   - C模式: 深度分析和批判性思考

3. **AI辅助**
   - 智能提示分组建议
   - 自动生成结构化摘要
   - 渐进式揭示隐藏信息

## 当前进度

### ✅ 已完成

- [x] Next.js 项目结构
- [x] Tailwind CSS 配置
- [x] 报纸风格主题系统
- [x] 主界面双栏布局
- [x] PDF查看器UI（模拟内容）
- [ 侦探笔记本组件
- [x] 拖拽分组功能
- [x] 高亮收集系统

### 🚧 进行中

- [ ] 真实 PDF 渲染 (PDF.js 集成)
- [ ] AI 集成 (Claude API)
- [ ] 数据持久化 (IndexedDB/SQLite)
- [ ] 知识图谱可视化

### 📋 待实现

- [ ] Google Scholar 集成
- [ ] Deep Throat 深度模式
- [ ] 评估系统
- [ ] 导出报告功能
- [ ] 云同步

## 开发指南

### 添加新的UI组件

1. 在 `components/` 目录创建新组件
2. 使用报纸风格的颜色和排版
3. 添加响应式设计支持

### 样式规范

- 使用 `bg-newspaper-*` 类名引用主题颜色
- 使用 `typography-*` 类名应用排版样式
- 保持一致的间距和圆角

### 提交规范

```bash
git commit -m "feat: 添加新功能"
git commit -m "fix: 修复bug"
git commit -m "style: 样式调整"
git commit -m "refactor: 代码重构"
```

## 贡献

欢迎贡献！请先阅读设计文档：`docs/plans/2026-02-10-paper-detective-design.md`

## 许可证

MIT

---

**Paper Detective** - 让研究成为一场精彩的侦探游戏 🕵️‍♂️📰
