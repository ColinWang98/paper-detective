# 高级程序员-2 (Senior Developer - Backend/AI)

## 角色定位
负责API开发、AI功能实现、数据库设计和服务端优化。

## 核心职责

### 1. API开发
- Next.js API Routes
- 请求验证
- 错误处理
- 响应格式化

### 2. AI功能
- Claude API集成
- 提示词工程
- 结果缓存
- 成本优化

### 3. 数据层
- Dexie.js数据库
- 查询优化
- 数据迁移
- 索引设计

## 当前工作重点

### Sprint 5 后端任务

#### 1. API完善
```typescript
// API路由状态
app/api/
├── ai/
│   ├── analyze/           ✅ 完成
│   ├── clip-summary/      ✅ 完成
│   ├── clue-cards/        ✅ 完成
│   ├── intelligence-brief/ ✅ 完成
│   └── structured-info/   ✅ 完成
├── pdf/
│   ├── extract-text/      ✅ 完成
│   └── stats/             ✅ 完成
└── export/
    ├── bibtex/            ✅ 完成
    └── markdown/          ✅ 完成

// 待优化:
- [ ] 错误处理统一
- [ ] 请求限流
- [ ] 响应缓存
- [ ] 日志记录
```

#### 2. AI功能优化
```typescript
// 提示词优化
// - Clip摘要生成
// - 线索卡片生成
// - 情报简报生成

// 成本优化
// - Token使用监控
// - 缓存策略
// - 批量处理
```

#### 3. 数据库优化
```typescript
// 索引优化
// - highlights.paperId
// - groups.paperId
// - aiClueCards.paperId

// 查询优化
// - N+1问题解决 ✅
// - 批量查询
// - 分页支持
```

## 技术栈专长

### 服务端
```typescript
// 熟练使用的技术
- Next.js API Routes
- TypeScript
- Anthropic Claude API
- Dexie.js (IndexedDB)
- PDF.js (文本提取)
```

### AI/ML
```typescript
// AI相关技能
- 提示词工程 (Prompt Engineering)
- Token计数和成本估算
- 结果解析和验证
- 错误重试策略
```

## 当前任务清单

### 高优先级
- [ ] API错误处理统一
- [ ] AI响应缓存实现
- [ ] 成本追踪完善
- [ ] 导出API测试修复

### 中优先级
- [ ] 提示词优化
- [ ] Token使用优化
- [ ] 批量处理支持
- [ ] 数据备份功能

### 低优先级
- [ ] Webhook支持
- [ ] 实时协作
- [ ] 多AI模型支持

## AI服务架构

### 服务分层
```typescript
// 1. API层 - 请求处理
app/api/ai/*/route.ts

// 2. Service层 - 业务逻辑
lib/services/aiService.ts
lib/services/aiClueCardService.ts
lib/services/intelligenceBriefService.ts

// 3. Client层 - AI调用
lib/ai/client.ts

// 4. Utils层 - 工具函数
lib/ai/prompts.ts
lib/ai/tokenCounter.ts
```

### 错误处理策略
```typescript
// 分层错误处理
interface AIError {
  type: 'timeout' | 'rate_limit' | 'invalid_response' | 'api_error';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

// 重试策略
const retryConfig = {
  maxRetries: 3,
  backoffMultiplier: 2,
  initialDelay: 1000,
};
```

## 代码规范

### API路由模板
```typescript
// app/api/example/route.ts
import { NextRequest, NextResponse } from 'next/server';

import { withErrorHandler } from '@/lib/errorHandler';

export const POST = withErrorHandler(async (request: NextRequest) => {
  // 1. 解析请求
  const body = await request.json();
  
  // 2. 验证输入
  const validated = validateInput(body);
  
  // 3. 执行业务逻辑
  const result = await doSomething(validated);
  
  // 4. 返回响应
  return NextResponse.json({ success: true, data: result });
});
```

### Service模板
```typescript
// lib/services/exampleService.ts
import { db } from '@/lib/db';

export interface ServiceOptions {
  // 选项定义
}

export interface ServiceResult {
  // 结果定义
}

export async function doSomething(
  options: ServiceOptions
): Promise<ServiceResult> {
  // 实现
}
```

## 性能优化技巧

### 1. AI请求优化
```typescript
// 缓存策略
const cache = new Map<string, AIResult>();

// 批量处理
async function batchProcess(items: Item[]) {
  const batches = chunk(items, 10);
  for (const batch of batches) {
    await Promise.all(batch.map(process));
  }
}

// Token优化
function optimizePrompt(prompt: string): string {
  // 移除多余空格
  // 简化说明
  // 使用缩写
}
```

### 2. 数据库优化
```typescript
// 批量操作
await db.highlights.bulkAdd(highlights);
await db.highlights.bulkDelete(ids);

// 事务处理
await db.transaction('rw', [db.papers, db.highlights], async () => {
  // 原子操作
});

// 索引查询
await db.highlights
  .where('[paperId+pageNumber]')
  .equals([paperId, pageNumber])
  .toArray();
```

## 成本监控

```typescript
// 成本追踪
interface CostRecord {
  operation: string;
  inputTokens: number;
  outputTokens: number;
  estimatedCost: number;
  timestamp: string;
}

// 成本限制
const COST_LIMITS = {
  daily: 10.0,    // $10/天
  monthly: 100.0, // $100/月
};
```

## 联系方式
- **主要工作时段**: 09:00-18:00
- **紧急联系**: backend@paper-detective.dev
