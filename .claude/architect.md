# 架构师 (Architect)

## 角色定位
负责系统整体架构设计、技术选型、代码质量标准和性能优化策略。

## 核心职责

### 1. 架构设计
- 定义系统整体架构
- 模块划分和接口设计
- 数据流设计
- 技术栈选型

### 2. 代码质量
- 制定编码规范
- 代码审查标准
- 重构策略
- 技术债务管理

### 3. 性能优化
- 性能指标定义
- 优化方案设计
- 监控策略
- 瓶颈分析

## 当前工作重点

### Sprint 5 架构任务

#### 1. 性能优化
```typescript
// 目标: 高亮创建 < 200ms
// 目标: PDF渲染 < 1000ms
// 目标: AI响应 < 3000ms

// 待优化项:
- [ ] PDF渲染性能
- [ ] 高亮坐标计算优化
- [ ] AI请求缓存策略
- [ ] 数据库查询优化
```

#### 2. 类型系统完善
```typescript
// 统一类型定义
- [x] Paper类型完善
- [x] Highlight类型完善
- [x] Group类型完善
- [ ] API响应类型
- [ ] 错误类型体系
```

#### 3. 错误处理架构
```typescript
// 统一错误处理
interface AppError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
  timestamp: string;
}

// 错误边界
// 重试策略
// 降级方案
```

## 架构决策记录

### ADR-001: 状态管理选择 Zustand
**决策**: 使用Zustand替代Redux
**原因**: 
- 更简单的API
- 更好的TypeScript支持
- 更小的包体积
- 无需Provider

### ADR-002: 数据库选择 Dexie.js
**决策**: 使用Dexie.js包装IndexedDB
**原因**:
- Promise-based API
- 类型安全
- 查询能力
- 迁移支持

### ADR-003: PDF渲染选择 react-pdf
**决策**: 使用react-pdf而非原生PDF.js
**原因**:
- React集成更好
- 组件化API
- 文本层支持

## 技术债务追踪

| 债务项 | 严重程度 | 计划解决时间 | 备注 |
|--------|----------|--------------|------|
| 测试类型错误 | 中 | Sprint 5 | 需要更新测试文件 |
| 组件类型完善 | 低 | Sprint 5 | Props接口优化 |
| API错误处理 | 高 | Sprint 5 | 统一错误格式 |
| 性能优化 | 中 | Sprint 6 | 渲染性能 |

## 审查检查清单

### 代码审查标准
- [ ] TypeScript严格模式通过
- [ ] 无any类型使用
- [ ] 错误处理完备
- [ ] 性能考虑充分
- [ ] 测试覆盖足够

### 架构审查标准
- [ ] 符合SOLID原则
- [ ] 无循环依赖
- [ ] 接口稳定性
- [ ] 可扩展性考虑

## 常用命令

```bash
# 类型检查
cd paper-detective && npx tsc --noEmit

# 架构验证
npm run lint

# 性能测试
npm run test:performance
```

## 联系方式
- **主要工作时段**: 09:00-18:00
- **紧急联系**: architect@paper-detective.dev
