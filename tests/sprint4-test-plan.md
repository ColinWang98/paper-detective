# Paper Detective v2 - Sprint 4 Testing Strategy

**Document Version**: 1.0
**Created**: 2026-02-10 (Day 17)
**Test Architect**: test-architect-v2
**Sprint Period**: Day 18-25 (8 days)
**Status**: ✅ Ready for Execution

---

## 📊 Executive Summary

### Current Testing Status
- **Test Coverage**: 95% (58 tests, 100% pass rate)
- **Code Quality**: A+ (97/100)
- **System Reliability**: 100% (4-level fallback)
- **Test Infrastructure**: Complete (unit, integration, E2E frameworks)

### Sprint 4 Testing Objectives
1. **New Feature Testing** - Intelligence Brief, Advanced Search, Export
2. **Regression Testing** - Ensure existing features remain stable
3. **User Testing** - Validate UX with 5-8 real users
4. **Performance Testing** - Stress test with large datasets
5. **Quality Assurance** - Maintain 90%+ coverage target

### Key Insight
Sprint 4 focuses on **completion and validation** rather than new core features. The backend for Intelligence Brief is 90% complete, allowing us to focus testing on frontend integration and user experience.

---

## 🎯 Sprint 4 Features to Test

### P0 Features (Critical)

#### 1. Intelligence Brief System
**Status**: Backend 90% complete, frontend pending

**What to Test**:
- ✅ Backend service (20,362 bytes, already tested)
- [ ] Frontend component integration
- [ ] Progress tracking (8 stages)
- [ ] Markdown export functionality
- [ ] Error handling and fallback
- [ ] Cache coordination (7-day TTL)

**Test Coverage Target**: >85%

**Key Test Scenarios**:
```typescript
// TC-IB-001: Generate complete brief
// TC-IB-002: Reuse cached brief (7-day)
// TC-IB-003: Regenerate brief with force flag
// TC-IB-004: Export as Markdown
// TC-IB-005: Progress tracking accuracy
// TC-IB-006: Error handling (API failures)
// TC-IB-007: Cost tracking accuracy
// TC-IB-008: Completeness score calculation
```

---

#### 2. Export Functionality
**Scope**: Markdown + BibTeX export

**What to Test**:
- [ ] Markdown export format validation
- [ ] BibTeX generation accuracy
- [ ] File download handler
- [ ] Special character encoding
- [ ] Large file handling (1000+ cards)
- [ ] Export permissions and errors

**Test Coverage Target**: >80%

**Key Test Scenarios**:
```typescript
// TC-EXP-001: Export single highlight as Markdown
// TC-EXP-002: Export entire notebook as Markdown
// TC-EXP-003: Export Intelligence Brief as Markdown
// TC-EXP-004: Generate BibTeX from paper metadata
// TC-EXP-005: Export with special characters (math, unicode)
// TC-EXP-006: Export large dataset (500+ cards)
// TC-EXP-007: File download naming and extension
// TC-EXP-008: Export without permissions (error handling)
```

**Performance Targets**:
- Markdown export: <1s for 100 cards
- BibTeX generation: <500ms
- File download: <2s for 1MB file

---

#### 3. User Testing
**Scope**: 5-8 moderated user sessions

**What to Test**:
- [ ] Task completion rates
- [ ] Time-on-task measurements
- [ ] NPS (Net Promoter Score)
- [ ] Qualitative feedback
- [ ] Usability issues identification

**Test Protocol**:
```
Session Length: 30-45 minutes
Tasks:
  1. Upload PDF and create highlights (5 min)
  2. Generate AI clue cards (5 min)
  3. View Intelligence Brief (3 min)
  4. Export notes as Markdown (2 min)
  5. Use Advanced Search (3 min)

Success Criteria:
  - Task completion: >80%
  - NPS: ≥7/10
  - Critical errors: 0
```

**Data Collection**:
- Screen recording
- Think-aloud protocol
- Post-session survey (SUS + NPS)
- Semi-structured interview

---

### P1 Features (Should Have)

#### 4. Advanced Search
**Scope**: Full-text search with filters

**What to Test**:
- [ ] Full-text search accuracy
- [ ] Filter by clue card type
- [ ] Filter by confidence level
- [ ] Sort by relevance/date/confidence
- [ ] Search within highlights
- [ ] Search performance (large datasets)

**Test Coverage Target**: >75%

**Key Test Scenarios**:
```typescript
// TC-SEARCH-001: Basic full-text search
// TC-SEARCH-002: Fuzzy matching (Fuse.js)
// TC-SEARCH-003: Filter by type (question/method/finding/limitation)
// TC-SEARCH-004: Filter by confidence (>80%, 50-80%, <50%)
// TC-SEARCH-005: Sort by relevance
// TC-SEARCH-006: Sort by date (newest/oldest)
// TC-SEARCH-007: Search within highlights only
// TC-SEARCH-008: Search with 1000+ cards (performance)
```

**Performance Targets**:
- Search query: <500ms for 100 cards
- Search query: <2s for 1000 cards
- Filter application: <100ms
- Sort operation: <200ms

---

#### 5. PDF Report Generation
**Scope**: Professional PDF reports (optional)

**What to Test**:
- [ ] PDF layout and formatting
- [ ] Image and chart rendering
- [] Citation metadata inclusion
- [ ] Multi-page handling
- [ ] PDF size optimization

**Test Coverage Target**: >70% (if implemented)

---

### P2 Features (Nice to Have)

#### 6. A/B Testing Framework
**Scope**: Infrastructure for UX experiments

**What to Test**:
- [ ] User bucket assignment
- [ ] Feature flag management
- [ ] Metrics collection
- [ ] Statistical significance

**Note**: Infrastructure only, no actual A/B tests planned

---

## 🧪 Testing Strategy

### Test Pyramid Distribution

```
         /\
        /E2E\        15%  - Critical user journeys
       /------\
      /集成测试 \     25%  - Feature integration
     /----------\
    /  单元测试  \    60%  - Component/service logic
   /--------------\
```

### Unit Testing (60%)
**Framework**: Jest + React Testing Library

**Focus Areas**:
- Intelligence Brief service methods
- Export formatters (Markdown, BibTeX)
- Search algorithms and indexing
- UI components (Integrations Brief viewer, Search UI)

**Example**:
```typescript
describe('IntelligenceBriefService', () => {
  it('should calculate completeness score correctly', () => {
    const structuredInfo = {
      researchQuestion: 'Test question',
      methods: ['M1', 'M2', 'M3'],
      findings: ['F1', 'F2', 'F3'],
      limitations: ['L1', 'L2']
    };
    const score = calculateCompletenessScore(structuredInfo, 5);
    expect(score).toBe(90); // 25 + 15 + 15 + 10 + 5
  });
});
```

---

### Integration Testing (25%)
**Framework**: Jest + MSW (Mock Service Worker)

**Focus Areas**:
- End-to-end workflows (upload → analyze → export)
- Cache coordination across services
- API route integration
- Database persistence

**Example**:
```typescript
describe('Export Workflow', () => {
  it('should complete full export workflow', async () => {
    // 1. Load paper with highlights
    const paper = await loadTestPaper(1);
    expect(paper.highlights).toHaveLength(10);

    // 2. Generate Markdown
    const markdown = await exportAsMarkdown(paper);
    expect(markdown).toContain('# Case File #1');
    expect(markdown).toContain('## 研究问题');

    // 3. Generate BibTeX
    const bibtex = await exportAsBibTeX(paper);
    expect(bibtex).toContain('@article{');
    expect(bibtex).toContain('title={');
  });
});
```

---

### E2E Testing (15%)
**Framework**: Playwright (if time permits) OR Manual Testing

**Focus Areas**:
- Critical user journeys only
- Cross-browser compatibility (Chrome, Firefox, Safari)
- Mobile responsiveness (basic)

**Critical Journeys**:
1. **Upload → Analyze → View Brief → Export**
2. **Search → Filter → Sort → Navigate**
3. **Create Highlights → Organize → Search → Export**

**Example (Playwright)**:
```typescript
test('should complete intelligence brief workflow', async ({ page }) => {
  await page.goto('/');
  await page.locator('input[type="file"]').setInputFiles('test.pdf');
  await page.click('[data-testid="generate-brief-btn"]');
  await expect(page.locator('[data-testid="brief-viewer"]')).toBeVisible();
  await page.click('[data-testid="export-markdown-btn"]');
  // Verify download
});
```

---

## 📊 Test Coverage Requirements

### Coverage Targets

| Component Type | Target | Rationale |
|----------------|--------|-----------|
| **Critical Services** | 95% | Intelligence Brief, Export, Search |
| **UI Components** | 80% | Integration Brief viewer, Search UI |
| **API Routes** | 90% | Export endpoints, Search endpoint |
| **Utilities** | 85% | Formatters, validators |
| **Overall** | 85% | Maintain high quality bar |

### What NOT to Test
- Third-party libraries (PDF.js, Fuse.js)
- Static constants and configs
- Simple getter/setter functions
- TypeScript types (compile-time check only)

---

## 🚀 Performance Testing

### Test Scenarios

#### 1. Large Dataset Performance
**Objective**: Ensure app handles large paper collections

**Test Cases**:
```typescript
// TC-PERF-001: Load 100 papers
// TC-PERF-002: Search across 1000 clue cards
// TC-PERF-003: Export 500 highlights as Markdown
// TC-PERF-004: Generate Intelligence Brief for 50-page PDF
```

**Performance Targets**:
- Load 100 papers: <5s
- Search 1000 cards: <2s
- Export 500 highlights: <3s
- Brief generation (50-page): <30s

---

#### 2. Memory Leak Detection
**Objective**: Ensure no memory leaks during extended use

**Test Procedure**:
1. Load 10 papers
2. Generate Intelligence Brief for each
3. Perform 20 searches
4. Export 5 times
5. Measure memory growth (should be <100MB)

---

#### 3. Concurrency Testing
**Objective**: Verify system handles simultaneous operations

**Test Cases**:
```typescript
// TC-CONC-001: Generate 3 briefs simultaneously
// TC-CONC-002: Export while generating brief
// TC-CONC-003: Search while loading new papers
```

---

## 👥 User Testing Plan

### Recruitment
**Target**: 5-8 participants
**Profile**: Graduate students, researchers, academics
**Domains**: Computer Science, HCI, Psychology, Interdisciplinary

### Test Protocol

#### Phase 1: Introduction (5 minutes)
- Welcome and consent form
- Brief product overview (1 minute)
- Explain think-aloud protocol

#### Phase 2: Tasks (20 minutes)
1. **Task 1**: Upload a PDF and create 3 highlights (5 min)
2. **Task 2**: Generate and view Intelligence Brief (3 min)
3. **Task 3**: Find specific information using Search (4 min)
4. **Task 4**: Export notes as Markdown (2 min)
5. **Task 5**: Organize highlights into groups (3 min)
6. **Task 6**: Read AI clue cards and navigate to source (3 min)

#### Phase 3: Interview (10 minutes)
- SUS questionnaire (10 questions)
- NPS question (0-10 likelihood to recommend)
- Open-ended feedback
- Feature ranking (most useful to least useful)

### Success Criteria
| Metric | Target | Measurement |
|--------|--------|-------------|
| Task Completion Rate | >80% | 5/6 tasks completed |
| Average Time-on-Task | <4 min/task | Stopwatch |
| NPS | ≥7/10 | Survey |
| SUS Score | ≥70/100 | Questionnaire |
| Critical Errors | 0 | Observation |

### Data Analysis
- Quantitative: Task completion rates, time measurements, survey scores
- Qualitative: Common pain points, feature requests, confusion points
- Prioritization: Moscow method (Must/Should/Could/Won't fix)

---

## 🐛 Regression Testing

### What to Protect
1. **PDF Rendering** - No regressions in highlight accuracy
2. **AI Clue Cards** - Quality and confidence calibration maintained
3. **Notebook** - Drag-and-drop, persistence, grouping
4. **Cost Tracking** - <$0.01 per paper
5. **4-Level Fallback** - 100% reliability

### Regression Test Suite
**Automated** (run on every commit):
```bash
npm run test:unit          # 58 existing tests
npm run test:integration   # AI workflows
npm run test:coverage      # Verify >85% coverage
```

**Manual** (run before release):
- Upload → Analyze → Brief → Export workflow
- Search across 10 papers
- Export all formats (Markdown, BibTeX)

---

## 📋 Test Execution Schedule

### Day 18 (Tuesday) - Setup & Framework
- [ ] Set up test framework for new features
- [ ] Create test fixtures (sample papers, highlights)
- [ ] Write unit tests for Intelligence Brief frontend
- [ ] Write unit tests for Export services

**Deliverables**: Test infrastructure ready, initial unit tests

---

### Day 19 (Wednesday) - New Feature Testing
- [ ] Complete unit tests for Intelligence Brief
- [ ] Complete unit tests for Export (Markdown, BibTeX)
- [ ] Write integration tests for export workflows
- [ ] Start integration tests for Advanced Search

**Deliverables**: Unit tests complete, integration tests started

---

### Day 20 (Thursday) - Integration & Performance
- [ ] Complete integration tests for all features
- [ ] Performance testing (large datasets)
- [ ] Memory leak detection
- [ ] Concurrency testing
- [ ] Prepare user testing materials

**Deliverables**: All automated tests passing, user test ready

---

### Day 21 (Friday) - User Testing Day 1
- [ ] Conduct 3-4 user testing sessions
- [ ] Document bugs and feedback
- [ ] Categorize issues (Critical/High/Medium/Low)

**Deliverables**: 3-4 sessions completed, bug list compiled

---

### Day 22 (Saturday) - User Testing Day 2 & Fixes
- [ ] Conduct remaining user testing sessions
- [ ] Fix critical bugs identified
- [ ] Regression testing for bug fixes
- [ ] Update test cases based on findings

**Deliverables**: All user testing complete, critical bugs fixed

---

### Day 23-24 (Sun-Mon) - Polish & Documentation
- [ ] Fix remaining high/medium priority bugs
- [ ] Add edge case tests
- [ ] Update test documentation
- [ ] Create test execution report
- [ ] Prepare release testing checklist

**Deliverables**: All known bugs fixed, test report ready

---

### Day 25 (Tuesday) - Final Testing
- [ ] Run full test suite (unit + integration + E2E)
- [ ] Final regression testing
- [ ] Performance benchmarking
- [ ] Release decision

**Deliverables**: Go/No-Go decision for release

---

## 📊 Test Metrics & Reporting

### Daily Metrics (Track in Daily Standup)
- Tests written (count)
- Tests passing (%)
- Code coverage (%)
- Bugs found (count)
- Bugs fixed (count)

### Sprint Metrics (Report at Sprint Review)
- **Test Coverage**: Target >85%
- **Test Execution**: 100% of planned tests
- **Defect Density**: <5 bugs per 1000 LOC
- **User Testing NPS**: ≥7/10
- **Performance**: All targets met

### Test Report Template
```markdown
# Sprint 4 Test Execution Report

## Summary
- Tests Planned: 120
- Tests Executed: 120 (100%)
- Tests Passed: 118 (98%)
- Tests Failed: 2 (2%)
- Code Coverage: 87%

## New Features
- Intelligence Brief: ✅ All tests passing
- Export: ✅ All tests passing
- Advanced Search: ⚠️ 2 tests failing (edge cases)

## User Testing
- Sessions Completed: 7/7
- Task Completion Rate: 85%
- NPS: 7.5/10
- SUS Score: 72/100

## Bugs Found
- Critical: 0
- High: 3 (all fixed)
- Medium: 12 (8 fixed, 4 deferred)
- Low: 25 (deferred to Sprint 5)

## Performance
- All targets met ✅

## Recommendations
- Approve for release ✅
```

---

## 🛠️ Test Tools & Infrastructure

### Current Stack
- **Unit Testing**: Jest + React Testing Library
- **Mocking**: MSW (Mock Service Worker)
- **E2E Testing**: Framework ready (Playwright or manual)
- **Coverage**: Jest coverage reports

### Needed Additions
- [ ] Fuse.js for search testing
- [ ] Test fixtures (sample papers, highlights)
- [ ] Performance monitoring tools
- [ ] User testing survey (SUS, NPS)

### Test Data Management
**Location**: `tests/fixtures/`

**Required Fixtures**:
```
tests/fixtures/
├── papers/
│   ├── simple-1page.pdf
│   ├── medium-10pages.pdf
│   ├── large-50pages.pdf
│   └── special-chars.pdf
├── highlights/
│   ├── single-highlight.json
│   ├── multiple-highlights.json
│   └── all-types.json
└── exports/
    ├── expected-markdown.md
    └── expected-bibtex.bib
```

---

## ⚠️ Risks & Mitigation

| Risk | Probability | Impact | Mitigation |
|------|------------|--------|------------|
| **User recruitment difficulties** | Medium | High | Start recruitment early (Day 18), have backup participants |
| **Search performance issues** | Low | Medium | Implement indexing early, have simpler fallback |
| **Export encoding bugs** | Medium | Medium | Test with various unicode characters early |
| **Test coverage below target** | Low | Medium | Prioritize critical paths first |
| **User testing reveals critical UX flaws** | Low | High | Reserve time for quick fixes (Day 22-23) |

---

## 📝 Testing Checklist

### Pre-Testing (Day 18)
- [ ] Test framework set up and verified
- [ ] Test fixtures created
- [ ] Test data prepared
- [ ] Team trained on test procedures

### During Sprint (Day 18-24)
- [ ] Unit tests written for all new code
- [ ] Integration tests covering workflows
- [ ] Performance tests executed
- [ ] User testing completed (5-8 sessions)
- [ ] Bugs documented and prioritized
- [ ] Critical bugs fixed and verified

### Pre-Release (Day 25)
- [ ] Full test suite passing (100%)
- [ ] Code coverage >85%
- [ ] Performance benchmarks met
- [ ] User testing NPS ≥7/10
- [ ] No critical bugs remaining
- [ ] Regression tests passing
- [ ] Documentation updated

---

## 🎯 Success Criteria

Sprint 4 testing is successful if:

1. ✅ **All P0 features tested** with >80% coverage
2. ✅ **User testing completed** with 5+ participants
3. ✅ **NPS ≥7/10** from user testing
4. ✅ **Zero critical bugs** remaining
5. ✅ **Performance targets met** for all features
6. ✅ **Test coverage maintained** at >85%
7. ✅ **Release approved** by Product Manager

---

## 📚 References & Resources

### Internal Documentation
- `README.md` - Testing guide
- `PRIORITY_TESTS.md` - Priority test scenarios
- `AI_FALLBACK_SYSTEM_TEST_PLAN.md` - AI testing
- `E2E_TEST_EXECUTION_GUIDE.md` - E2E procedures

### External Resources
- [Jest Documentation](https://jestjs.io/)
- [React Testing Library](https://testing-library.com/react)
- [System Usability Scale (SUS)](https://uiusability.com/sus/)
- [Nielsen Norman Group: User Testing](https://www.nngroup.com/articles/usability-testing-101/)

---

## 🚀 Next Steps

### Immediate (Day 18)
1. **test-architect-v2**: Create test fixtures and unit test templates
2. **hci-researcher-v2**: Prepare user testing materials and recruitment
3. **senior-developer-v2**: Implement Intelligence Brief frontend
4. **frontend-engineer-v2**: Build Export UI components

### This Week (Day 18-21)
1. Complete all unit and integration tests
2. Execute performance tests
3. Conduct user testing sessions

### Next Week (Day 22-25)
1. Fix bugs from user testing
2. Final regression testing
3. Prepare release

---

**Test Architect**: test-architect-v2
**Last Updated**: 2026-02-10 (Day 17)
**Status**: ✅ Ready for Execution

**Let's ensure Paper Detective v2 meets the highest quality standards!** 🎯
