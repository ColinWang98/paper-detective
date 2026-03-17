# Day 19 任务分配

**日期:** 2026-02-11 (Day 19)
**状态:** 🚀 执行中

---

## 🔴 P0 任务（今天必须完成）

### Task #1: 集成测试
**负责人:** senior-dev-1 + senior-dev-2
**预计时间:** 2-3小时
**状态:** ⏳ 待开始

**工作内容:**
- [ ] 测试完整用户流程：PDF → Brief生成 → 导出
- [ ] 验证API端点：
  - [ ] POST /api/ai/intelligence-brief
  - [ ] GET /api/ai/intelligence-brief?paperId=X
  - [ ] DELETE /api/ai/intelligence-brief?paperId=X
  - [ ] POST /api/export/markdown
  - [ ] POST /api/export/bibtex
- [ ] 边界测试：
  - [ ] 空数据
  - [ ] 错误处理
  - [ ] 大PDF (>100页)
  - [ ] 无效paperId
- [ ] 性能基准测试（Brief生成 < 30秒）

**成功标准:**
- 所有API端点正常工作
- 错误处理正确
- 性能满足目标

---

### Task #2: UX P0问题修复
**负责人:** ux-specialist + senior-dev-2
**预计时间:** 2小时
**状态:** ⏳ 待开始

**工作内容:**
- [ ] 创建自定义Modal确认组件（替换原生confirm）
- [ ] 集成Toast到导出错误处理（替换原生alert）
- [ ] 添加导出按钮文件格式图标
  - [ ] Markdown logo
  - [ ] BibTeX logo

**文件修改:**
- [ ] components/brief/IntelligenceBriefViewer.tsx:128 (confirm)
- [ ] components/brief/IntelligenceBriefViewer.tsx:139, 154 (alert)
- [ ] components/brief/IntelligenceBriefViewer.tsx:292-315 (导出按钮)

**成功标准:**
- 无原生confirm/alert
- UX一致性提升
- 保持98.6/100 A+标准

---

### Task #3: 架构P0修复
**负责人:** architect + senior-dev-1
**预计时间:** 2小时
**状态:** ⏳ 待开始

**工作内容:**
- [ ] 修复15个ESLint any类型错误
- [ ] 为导出函数添加useMemo优化
  - [ ] exportAsMarkdown()
  - [ ] exportAsBibTeX()

**成功标准:**
- 0 ESLint错误
- 性能提升（缓存生效）
- 保持0 TypeScript错误

---

## 🟡 P1 任务（今天尽可能完成）

### Task #4: 性能基准测试
**负责人:** senior-dev-1
**预计时间:** 1-2小时
**状态:** ⏳ 待开始

**工作内容:**
- [ ] Brief生成时间基准（目标: < 30秒）
- [ ] API响应时间基准
- [ ] 内存使用分析
- [ ] 生成性能报告

**成功标准:**
- 建立性能基准线
- 识别性能瓶颈

---

### Task #5: 用户测试准备
**负责人:** hci-professor + product-manager
**预计时间:** 2小时
**状态:** ⏳ 待开始

**工作内容:**
- [ ] 审查用户测试协议
- [ ] 优化SUS/NPS数据收集模板
- [ ] 确定测试环境部署方案
- [ ] 准备测试材料

**成功标准:**
- 用户测试协议就绪
- Day 20可以开始招募

---

## 📊 成功标准

### 技术指标
- ✅ TypeScript: 0 errors
- ✅ ESLint: 0 errors (从15→0)
- ✅ 所有集成测试通过
- ✅ 性能: Brief生成 < 30秒

### UX指标
- ✅ 98.6/100 A+标准保持
- ✅ P0 UX问题全部修复
- ✅ 100% WCAG 2.1 AA合规

### 团队协作
- ✅ 三重验证标准维护
- ✅ 每2小时进度更新
- ✅ 阻塞问题及时报告

---

## 📞 进度跟踪

| 任务 | 负责人 | 状态 | 进度 |
|------|--------|------|------|
| #1 集成测试 | senior-dev-1, senior-dev-2 | ⏳ | 0% |
| #2 UX P0修复 | ux-specialist, senior-dev-2 | ⏳ | 0% |
| #3 架构P0修复 | architect, senior-dev-1 | ⏳ | 0% |
| #4 性能基准 | senior-dev-1 | ⏳ | 0% |
| #5 用户测试准备 | hci-professor, product-manager | ⏳ | 0% |

---

**最后更新:** 2026-02-11 启动时
**下次更新:** 2小时后或任务完成时
