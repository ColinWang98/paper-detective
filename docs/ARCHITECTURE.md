# Paper Detective - 架构设计文档

> 📰 游戏化科研文献阅读工具 - 架构全景图

## 目录

1. [技术栈概览](#技术栈概览)
2. [整体架构图](#整体架构图)
3. [数据流图](#数据流图)
4. [组件关系图](#组件关系图)
5. [数据库ER图](#数据库er图)
6. [目录结构](#目录结构)
7. [关键设计决策](#关键设计决策)

---

## 技术栈概览

| 层级 | 技术 | 用途 |
|------|------|------|
| **框架** | Next.js 15 + React 19 | 全栈React框架 |
| **语言** | TypeScript | 类型安全 |
| **PDF处理** | PDF.js + react-pdf | PDF渲染与文本提取 |
| **拖拽** | @dnd-kit | 现代化拖拽体验 |
| **状态管理** | Zustand | 轻量级状态管理 |
| **本地数据库** | Dexie.js + IndexedDB | 浏览器本地存储 |
| **样式** | TailwindCSS | 原子化CSS |
| **AI服务** | Claude AI API | 智能分析 |

---

## 整体架构图

```mermaid
flowchart TB
    subgraph User["👤 用户层"]
        U1["PDF阅读"]
        U2["高亮标记"]
        U3["拖拽分组"]
        U4["AI分析"]
    end

    subgraph Frontend["🎨 前端层 (Next.js + React)"]
        subgraph UI["UI组件"]
            C1["RealPDFViewer<br/>PDF查看器"]
            C2["DetectiveNotebook<br/>侦探笔记本"]
            C3["AIClueCard*<br/>AI线索卡片"]
            C4["EvidenceFolder<br/>证据分组"]
        end
        
        subgraph State["状态管理"]
            S1["Zustand Store<br/>全局状态"]
            S2["Undo/Redo<br/>历史记录"]
        end
        
        subgraph Hooks["自定义Hooks"]
            H1["useAIAnalysis<br/>AI分析Hook"]
            H2["useIntelligenceBrief<br/>情报简报Hook"]
            H3["useAIClueCards<br/>线索卡片Hook"]
            H4["useKeyboardShortcuts<br/>快捷键Hook"]
        end
    end

    subgraph Backend["⚙️ 后端层 (Next.js API Routes)"]
        subgraph API["API路由"]
            A1["/api/ai/*<br/>AI分析服务"]
            A2["/api/pdf/*<br/>PDF处理服务"]
            A3["/api/export/*<br/>导出服务"]
        end
        
        subgraph Services["服务层"]
            SV1["aiService<br/>AI服务封装"]
            SV2["pdfService<br/>PDF处理服务"]
        end
    end

    subgraph Data["💾 数据层"]
        subgraph LocalDB["本地存储"]
            D1["Dexie.js<br/>IndexedDB封装"]
            D2["PaperDetectiveDB<br/>应用数据库"]
        end
        
        subgraph External["外部服务"]
            E1["Claude AI API<br/>Anthropic"]
            E2["CDN<br/>PDF.js Worker"]
        end
    end

    %% 连接关系
    U1 --> C1
    U2 --> C1
    U3 --> C2
    U4 --> C3
    
    C1 --> S1
    C2 --> S1
    C3 --> S1
    C4 --> S1
    
    S1 --> S2
    S1 --> D1
    
    H1 --> SV1
    H2 --> SV1
    H3 --> SV1
    
    C1 --> H4
    
    A1 --> SV1
    A2 --> SV2
    
    SV1 --> E1
    SV2 --> E2
    
    D1 --> D2
```

---

## 数据流图

### 核心数据流

```mermaid
sequenceDiagram
    actor User as 用户
    participant PDF as RealPDFViewer
    participant Store as Zustand Store
    participant DB as Dexie/IndexedDB
    participant API as API Routes
    participant AI as Claude AI

    %% 导入PDF流程
    rect rgb(230, 245, 255)
        Note over User,AI: 📄 导入PDF流程
        User->>PDF: 选择PDF文件
        PDF->>Store: addPaper(file)
        Store->>DB: 保存Paper元数据
        DB-->>Store: 返回paperId
        Store->>DB: 创建默认Inbox分组
        Store-->>PDF: 更新当前论文
    end

    %% 高亮标记流程
    rect rgb(255, 245, 230)
        Note over User,AI: 🖍️ 高亮标记流程
        User->>PDF: 选中文本
        PDF->>Store: addHighlight(data)
        Store->>DB: 保存Highlight
        DB-->>Store: 返回highlightId
        Store->>DB: 自动添加到Inbox
        Store-->>PDF: 乐观更新UI
    end

    %% 拖拽分组流程
    rect rgb(230, 255, 230)
        Note over User,AI: 🗂️ 拖拽分组流程
        User->>Store: 拖拽高亮到分组
        Store->>DB: moveHighlightToGroup()
        DB-->>Store: 确认移动
        Store-->>User: 更新分组显示
    end

    %% AI分析流程
    rect rgb(255, 230, 245)
        Note over User,AI: 🤖 AI分析流程
        User->>Store: 请求AI分析
        Store->>API: POST /api/ai/analyze
        API->>AI: 调用Claude API
        AI-->>API: 流式返回分析结果
        API-->>Store: 返回结构化数据
        Store->>DB: 保存AIClueCards
        Store-->>User: 显示线索卡片
    end

    %% 情报简报流程
    rect rgb(255, 248, 220)
        Note over User,AI: 📋 情报简报流程
        User->>API: POST /api/ai/intelligence-brief
        API->>AI: 生成完整简报
        AI-->>API: 返回Brief数据
        API->>DB: 缓存IntelligenceBrief
        API-->>User: 显示情报简报
    end
```

### 状态管理数据流

```mermaid
flowchart LR
    subgraph Action["用户操作"]
        A1["添加高亮"]
        A2["移动分组"]
        A3["AI分析"]
        A4["撤销/重做"]
    end

    subgraph Store["Zustand Store"]
        S1["当前状态"]
        S2["历史记录栈<br/>HistoryEntry[]"]
        S3["重做栈<br/>HistoryEntry[]"]
    end

    subgraph Optimistic["乐观更新"]
        O1["立即更新UI"]
        O2["后台持久化"]
        O3["错误回滚"]
    end

    subgraph DB["Dexie/IndexedDB"]
        D1["papers"]
        D2["highlights"]
        D3["groups"]
        D4["aiClueCards"]
        D5["intelligenceBriefs"]
    end

    A1 --> S1
    A2 --> S1
    A3 --> S1
    A4 --> S2
    
    S1 --> O1
    O1 --> O2
    O2 --> D2
    O2 -.->|失败| O3
    O3 --> S1
    
    S2 -->|undo| S3
    S3 -->|redo| S2
```

---

## 组件关系图

### 页面组件结构

```mermaid
flowchart TB
    subgraph Pages["📄 页面 (App Router)"]
        P1["/page.tsx<br/>主页"]
        P2["/brief/[paperId]/page.tsx<br/>情报简报页"]
        P3["/layout.tsx<br/>根布局"]
    end

    subgraph CoreComponents["🔧 核心组件"]
        C1["RealPDFViewer<br/>PDF查看与阅读"]
        C2["DetectiveNotebook<br/>侦探笔记本"]
        C3["Header<br/>页头"]
    end

    subgraph PDFComponents["📄 PDF组件"]
        PC1["HighlightOverlay<br/>高亮覆盖层"]
        PC2["PriorityLegend<br/>优先级图例"]
    end

    subgraph NotebookComponents["📓 笔记本组件"]
        NC1["EvidenceFolder<br/>证据文件夹"]
        NC2["AIClueCardList<br/>AI线索列表"]
        NC3["AIClueCardGenerator<br/>AI卡片生成器"]
    end

    subgraph AIComponents["🤖 AI组件"]
        AC1["AIClueCard<br/>线索卡片"]
        AC2["AIClueCardNew<br/>新建卡片"]
        AC3["AIControlPanel<br/>AI控制面板"]
        AC4["APIKeyManager<br/>API密钥管理"]
    end

    subgraph BriefComponents["📋 简报组件"]
        BC1["IntelligenceBriefViewer<br/>简报查看器"]
        BC2["BriefHeader<br/>简报头部"]
        BC3["BriefClipSummary<br/>摘要部分"]
        BC4["BriefStructuredInfo<br/>结构化信息"]
        BC5["BriefClueCards<br/>卡片部分"]
        BC6["BriefUserHighlights<br/>用户高亮分析"]
    end

    subgraph CommonComponents["🧩 通用组件"]
        CM1["Modal<br/>模态框"]
        CM2["Toast<br/>提示消息"]
        CM3["Onboarding<br/>引导"]
    end

    %% 页面关系
    P3 --> P1
    P1 --> C1
    P1 --> C2
    P1 --> C3
    P2 --> BC1
    
    %% PDF组件关系
    C1 --> PC1
    C1 --> PC2
    
    %% 笔记本组件关系
    C2 --> NC1
    C2 --> NC2
    C2 --> NC3
    
    %% AI组件关系
    NC2 --> AC1
    NC2 --> AC2
    NC3 --> AC3
    AC3 --> AC4
    
    %% 简报组件关系
    BC1 --> BC2
    BC1 --> BC3
    BC1 --> BC4
    BC1 --> BC5
    BC1 --> BC6
    
    %% 通用组件
    C2 --> CM1
    C1 --> CM2
    P1 --> CM3
```

### 组件依赖关系

```mermaid
flowchart LR
    subgraph Store["Zustand Store"]
        S1["usePaperStore"]
    end

    subgraph Hooks["自定义Hooks"]
        H1["useAIAnalysis"]
        H2["useIntelligenceBrief"]
        H3["useAIClueCards"]
        H4["useClipSummary"]
        H5["useStructuredExtraction"]
        H6["useKeyboardShortcuts"]
    end

    subgraph Lib["工具库"]
        L1["db.ts<br/>Dexie数据库"]
        L2["pdf.ts<br/>PDF工具"]
        L3["store.ts<br/>状态定义"]
    end

    subgraph Types["类型定义"]
        T1["types/index.ts"]
        T2["types/ai.types.ts"]
    end

    %% 依赖关系
    S1 --> L1
    S1 --> L3
    S1 --> T1
    
    H1 --> S1
    H1 --> L2
    H2 --> S1
    H2 --> L2
    H3 --> S1
    H4 --> S1
    H5 --> S1
    H6 --> S1
    
    L1 --> T1
    L1 --> T2
    L3 --> T1
    L3 --> L1
```

---

## 数据库ER图

### 实体关系图

```mermaid
erDiagram
    PAPER ||--o{ HIGHLIGHT : contains
    PAPER ||--o{ GROUP : has
    PAPER ||--o{ AI_CLUE_CARD : generates
    PAPER ||--o{ INTELLIGENCE_BRIEF : produces
    PAPER ||--o{ AI_ANALYSIS : analyzes
    
    GROUP ||--o{ GROUP_HIGHLIGHT : contains
    HIGHLIGHT ||--o{ GROUP_HIGHLIGHT : belongs_to
    
    BRIEF_VERSION ||--o{ INTELLIGENCE_BRIEF : versions
    
    PAPER {
        number id PK "主键"
        string title "论文标题"
        string[] authors "作者列表"
        number year "年份"
        string journal "期刊"
        string doi "DOI"
        string arxivId "arXiv ID"
        string fileURL "文件URL"
        string fileName "文件名"
        string uploadDate "上传日期"
        number totalPages "总页数"
    }
    
    HIGHLIGHT {
        number id PK "主键"
        number paperId FK "论文ID"
        string text "高亮文本"
        string color "颜色"
        string priority "优先级"
        number pageNumber "页码"
        object position "位置{x,y,w,h}"
        string timestamp "时间戳"
        string createdAt "创建时间"
        string note "用户笔记"
        string understandingStatus "理解状态"
    }
    
    GROUP {
        number id PK "主键"
        number paperId FK "论文ID"
        string name "分组名称"
        string type "类型:inbox/custom"
        string color "颜色"
        number position "排序位置"
        boolean isSystem "是否系统分组"
        string createdAt "创建时间"
    }
    
    GROUP_HIGHLIGHT {
        number id PK "主键"
        number groupId FK "分组ID"
        number highlightId FK "高亮ID"
        number position "排序位置"
        string addedAt "添加时间"
    }
    
    AI_CLUE_CARD {
        number id PK "主键"
        number paperId FK "论文ID"
        string type "卡片类型"
        string source "来源"
        string title "标题"
        string content "内容"
        number pageNumber "页码"
        number[] highlightIds "关联高亮IDs"
        number confidence "置信度"
        number position "显示顺序"
        boolean isExpanded "是否展开"
        string createdAt "创建时间"
        string updatedAt "更新时间"
        object tokenUsage "Token使用"
        number cost "成本(USD)"
    }
    
    INTELLIGENCE_BRIEF {
        number id PK "主键"
        number paperId FK "论文ID"
        object caseFile "案件档案"
        string clipSummary "Clip摘要"
        object structuredInfo "结构化信息"
        object[] clueCards "线索卡片"
        object userHighlights "用户高亮分析"
        object tokenUsage "Token使用"
        number cost "成本"
        number duration "耗时(ms)"
        string generatedAt "生成时间"
        string model "AI模型"
        string source "来源"
        object completeness "完整度"
    }
    
    AI_ANALYSIS {
        number id PK "主键"
        number paperId FK "论文ID"
        string summary "摘要"
        string researchQuestion "研究问题"
        string[] methods "方法"
        string[] findings "发现"
        string[] limitations "局限性"
        object tokenUsage "Token使用"
        number estimatedCost "预估成本"
        string createdAt "创建时间"
        string model "AI模型"
    }
    
    BRIEF_VERSION {
        number id PK "主键"
        number briefId FK "简报ID"
        number versionNumber "版本号"
        string status "状态:draft/published/archived"
        object caseFile "案件档案"
        string clipSummary "摘要"
        object structuredInfo "结构化信息"
        object[] clueCards "线索卡片"
        object userHighlights "用户高亮"
        string createdAt "创建时间"
        string createdBy "创建者:ai/user"
        string editedAt "编辑时间"
        number editCount "编辑次数"
        object editorState "编辑器状态"
    }
```

### 数据库Schema版本演进

```mermaid
timeline
    title Paper Detective 数据库版本演进
    
    section V1.0 初始版本
        V1 : papers表
           : highlights表
           : groups表
           : groupHighlights表
           : aiAnalysis表
           
    section V2.0 AI线索卡片
        V2 : + aiClueCards表
           : Story 2.2.1
           
    section V3.0 情报简报
        V3 : + intelligenceBriefs表
           : Story 2.2.2
           
    section V4.0 版本控制
        V4 : + briefVersions表
           : 简报版本管理
           : Sprint 5
```

---

## 目录结构

```
paper-detective/
├── app/                          # Next.js App Router
│   ├── page.tsx                  # 主页 - 双栏布局
│   ├── layout.tsx                # 根布局
│   ├── globals.css               # 全局样式 + 主题变量
│   ├── brief/                    # 情报简报页面
│   │   └── [paperId]/
│   │       └── page.tsx          # 动态路由简报页
│   └── api/                      # API路由
│       ├── ai/                   # AI服务API
│       │   ├── analyze/          # 综合分析
│       │   ├── clue-cards/       # 线索卡片
│       │   ├── clip-summary/     # Clip摘要
│       │   ├── intelligence-brief/  # 情报简报
│       │   └── structured-info/  # 结构化信息
│       ├── pdf/                  # PDF处理API
│       │   ├── extract-text/     # 文本提取
│       │   └── stats/            # PDF统计
│       └── export/               # 导出API
│           ├── markdown/         # Markdown导出
│           └── bibtex/           # BibTeX导出
│
├── components/                   # React组件
│   ├── RealPDFViewer.tsx         # PDF查看器(核心)
│   ├── DetectiveNotebook.tsx     # 侦探笔记本(核心)
│   ├── Header.tsx                # 页头
│   ├── HighlightOverlay.tsx      # 高亮覆盖层
│   ├── PriorityLegend.tsx        # 优先级图例
│   ├── EvidenceFolder.tsx        # 证据文件夹
│   ├── Modal.tsx                 # 模态框
│   ├── Toast.tsx                 # 提示消息
│   ├── Onboarding.tsx            # 用户引导
│   ├── AIAnalysisButton.tsx      # AI分析按钮
│   ├── AIClueCard.tsx            # AI线索卡片
│   ├── AIClueCardNew.tsx         # 新建卡片
│   ├── AIClueCardList.tsx        # 卡片列表
│   ├── AIClueCardGenerator.tsx   # 卡片生成器
│   ├── AIControlPanel.tsx        # AI控制面板
│   ├── APIKeyManager.tsx         # API密钥管理
│   └── brief/                    # 简报专用组件
│       ├── IntelligenceBriefViewer.tsx
│       ├── BriefHeader.tsx
│       ├── BriefClipSummary.tsx
│       ├── BriefStructuredInfo.tsx
│       ├── BriefClueCards.tsx
│       └── BriefUserHighlights.tsx
│
├── hooks/                        # 自定义Hooks
│   ├── useAIAnalysis.ts          # AI分析Hook
│   ├── useIntelligenceBrief.ts   # 情报简报Hook
│   ├── useAIClueCards.ts         # 线索卡片Hook
│   ├── useClipSummary.ts         # Clip摘要Hook
│   ├── useStructuredExtraction.ts  # 结构化提取Hook
│   └── useKeyboardShortcuts.ts   # 快捷键Hook
│
├── lib/                          # 工具库
│   ├── db.ts                     # Dexie数据库配置
│   ├── store.ts                  # Zustand状态管理
│   ├── pdf.ts                    # PDF处理工具
│   ├── errorTypes.ts             # 错误类型定义
│   └── utils/                    # 工具函数
│       └── format.ts             # 格式化工具
│
├── types/                        # TypeScript类型
│   ├── index.ts                  # 核心类型
│   └── ai.types.ts               # AI相关类型
│
├── services/                     # 服务层
│   └── aiService.ts              # AI服务封装
│
├── docs/                         # 文档
│   ├── ARCHITECTURE.md           # 本文档
│   ├── API_DOCUMENTATION.md      # API文档
│   ├── PRODUCT_REQUIREMENTS_DOCUMENT.md  # PRD
│   └── ...                       # 其他文档
│
├── public/                       # 静态资源
├── tests/                        # 测试文件
├── jest.config.js               # Jest配置
├── next.config.js               # Next.js配置
├── tailwind.config.ts           # Tailwind配置
└── tsconfig.json                # TypeScript配置
```

---

## 关键设计决策

### 1. 状态管理策略

| 状态类型 | 存储位置 | 说明 |
|---------|---------|------|
| 全局UI状态 | Zustand | 当前论文、高亮列表、分组状态 |
| 持久化数据 | IndexedDB (Dexie) | Papers、Highlights、Groups、AI结果 |
| 临时状态 | React useState | 模态框开关、加载状态 |
| 历史记录 | Zustand + 内存 | Undo/Redo栈 |

### 2. 数据流模式

```mermaid
flowchart LR
    UI["UI组件"] -->|用户操作| Store["Zustand Store"]
    Store -->|乐观更新| UI
    Store -->|异步持久化| DB["IndexedDB"]
    DB -->|加载数据| Store
    
    Store -->|API调用| API["Next.js API"]
    API -->|调用| AI["Claude AI"]
    AI -->|返回结果| API
    API -->|保存| DB
```

### 3. 乐观更新机制

1. **立即更新UI**: 用户操作后首先更新Zustand状态
2. **后台持久化**: 异步保存到IndexedDB
3. **错误回滚**: 失败时恢复之前的状态

```typescript
// 伪代码示例
async addHighlight(highlight) {
  // 1. 乐观更新UI
  setState(prev => [...prev, highlight]);
  
  try {
    // 2. 后台保存
    const id = await db.highlights.add(highlight);
    // 3. 确认更新（替换临时ID）
    setState(prev => updateId(prev, tempId, id));
  } catch (error) {
    // 4. 错误回滚
    setState(prev => removeById(prev, tempId));
  }
}
```

### 4. AI服务架构

```mermaid
flowchart TB
    subgraph Client["客户端"]
        C1["React Components"]
        C2["Custom Hooks"]
    end
    
    subgraph API["Next.js API Routes"]
        A1["/api/ai/analyze"]
        A2["/api/ai/clue-cards"]
        A3["/api/ai/intelligence-brief"]
    end
    
    subgraph Service["服务层"]
        S1["aiService"]
        S2["Prompt Templates"]
        S3["Response Parser"]
    end
    
    subgraph External["外部服务"]
        E1["Claude AI API"]
    end
    
    C1 --> C2
    C2 --> A1
    C2 --> A2
    C2 --> A3
    
    A1 --> S1
    A2 --> S1
    A3 --> S1
    
    S1 --> S2
    S1 --> S3
    S1 --> E1
```

### 5. 安全考虑

- **API密钥**: 存储在环境变量，通过API路由代理调用
- **文件上传**: 限制50MB，仅接受PDF类型
- **数据隔离**: 所有数据存储在浏览器本地，无服务端持久化

### 6. 性能优化

| 优化点 | 实现方式 |
|-------|---------|
| PDF渲染 | react-pdf + 虚拟滚动 |
| 状态更新 | 乐观更新 + 批量处理 |
| 拖拽性能 | @dnd-kit + 防抖处理 |
| AI响应 | 流式输出 + 进度指示 |
| 数据库 | IndexedDB索引优化 |

---

## 附录

### A. 类型定义速查

```typescript
// 核心类型
interface Paper { id, title, authors, fileURL, ... }
interface Highlight { id, paperId, text, color, priority, position, ... }
interface Group { id, paperId, name, type, position, items, ... }
interface AIClueCard { id, paperId, type, title, content, confidence, ... }
interface IntelligenceBrief { id, paperId, caseFile, clueCards, ... }
```

### B. API端点速查

| 端点 | 方法 | 说明 |
|-----|------|------|
| `/api/ai/analyze` | POST | 综合分析论文 |
| `/api/ai/clue-cards` | POST | 生成线索卡片 |
| `/api/ai/intelligence-brief` | GET/POST/DELETE | 情报简报管理 |
| `/api/pdf/extract-text` | POST | 提取PDF文本 |
| `/api/export/markdown` | POST | 导出Markdown |

### C. 数据库版本

当前数据库版本: **V3** (包含 IntelligenceBriefs)

---

*文档版本: 1.0*  
*最后更新: 2026-02-13*  
*作者: Paper Detective Team*
