# Intelligence Brief UI - Test Strategy

**Created**: 2026-02-10 by test-architect-v2
**Component**: Intelligence Brief UI (7 components)
**Testing Target**: >80% coverage for UI components
**Status**: Ready for implementation

---

## Test Coverage Strategy

### Component Hierarchy

Based on frontend-engineer-v2's design:

```
IntelligenceBriefViewer (root)
├── BriefHeader (case #, score, actions)
├── BriefGenerationProgress (animated progress)
├── BriefClipSummary (3-sentence summary)
├── BriefStructuredInfo (accordion sections)
├── BriefClueCards (reuses existing AIClueCard)
├── BriefUserHighlights (priority analysis)
└── BriefMetadataFooter (tokens, cost, export)
```

---

## Test Plan by Component

### 1. IntelligenceBriefViewer (Root Component)

**File**: `components/IntelligenceBriefViewer.tsx`

**Test Scenarios**:
```typescript
describe('IntelligenceBriefViewer', () => {
  // TC-IB-UI-001: Render correctly
  it('should render brief viewer with all sections', () => {
    const mockBrief = createMockBrief();
    render(<IntelligenceBriefViewer brief={mockBrief} />);

    expect(screen.getByTestId('brief-header')).toBeInTheDocument();
    expect(screen.getByTestId('brief-clip-summary')).toBeInTheDocument();
    expect(screen.getByTestId('brief-structured-info')).toBeInTheDocument();
    expect(screen.getByTestId('brief-clue-cards')).toBeInTheDocument();
    expect(screen.getByTestId('brief-user-highlights')).toBeInTheDocument();
    expect(screen.getByTestId('brief-metadata-footer')).toBeInTheDocument();
  });

  // TC-IB-UI-002: Loading state
  it('should show progress indicator during generation', () => {
    render(<IntelligenceBriefViewer status="generating" progress={45} />);

    expect(screen.getByTestId('brief-generation-progress')).toBeInTheDocument();
    expect(screen.getByText(/正在生成情报简报... 45%/)).toBeInTheDocument();
  });

  // TC-IB-UI-003: Error state
  it('should show error message on generation failure', () => {
    render(<IntelligenceBriefViewer status="error" error="API调用失败" />);

    expect(screen.getByTestId('brief-error-message')).toBeInTheDocument();
    expect(screen.getByText(/API调用失败/)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重试/ })).toBeInTheDocument();
  });

  // TC-IB-UI-004: Empty state
  it('should show empty state when no brief exists', () => {
    render(<IntelligenceBriefViewer status="idle" />);

    expect(screen.getByTestId('brief-empty-state')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /生成情报简报/ })).toBeInTheDocument();
  });

  // TC-IB-UI-005: Export functionality
  it('should export brief as markdown when export button clicked', async () => {
    const exportMock = jest.fn();
    render(<IntelligenceBriefViewer brief={mockBrief} onExport={exportMock} />);

    fireEvent.click(screen.getByRole('button', { name: /导出为Markdown/ }));

    await waitFor(() => {
      expect(exportMock).toHaveBeenCalledWith(mockBrief, 'markdown');
    });
  });
});
```

**Coverage Target**: >85%

---

### 2. BriefHeader

**File**: `components/brief/BriefHeader.tsx`

**Test Scenarios**:
```typescript
describe('BriefHeader', () => {
  it('should display case number and title', () => {
    const caseFile = {
      caseNumber: 142,
      title: 'Attention Is All You Need',
    };
    render(<BriefHeader caseFile={caseFile} />);

    expect(screen.getByText(/案件档案 #142/)).toBeInTheDocument();
    expect(screen.getByText('Attention Is All You Need')).toBeInTheDocument();
  });

  it('should display completeness score with stars', () => {
    const caseFile = { completenessScore: 85 };
    render(<BriefHeader caseFile={caseFile} />);

    expect(screen.getByText('85/100')).toBeInTheDocument();
    expect(screen.getByLabelText('4星评分')).toBeInTheDocument();
  });

  it('should render action buttons', () => {
    const onRegenerate = jest.fn();
    const onExport = jest.fn();
    render(<BriefHeader onRegenerate={onRegenerate} onExport={onExport} />);

    expect(screen.getByRole('button', { name: /重新生成/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /导出/ })).toBeInTheDocument();
  });
});
```

**Coverage Target**: >80%

---

### 3. BriefGenerationProgress

**File**: `components/brief/BriefGenerationProgress.tsx`

**Test Scenarios**:
```typescript
describe('BriefGenerationProgress', () => {
  it('should display current stage and progress', () => {
    render(
      <BriefGenerationProgress
        currentStage="提取结构化信息"
        progress={40}
      />
    );

    expect(screen.getByText('提取结构化信息')).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toHaveAttribute('value', '40');
  });

  it('should animate progress bar changes', async () => {
    const { rerender } = render(
      <BriefGenerationProgress currentStage="准备生成" progress={0} />
    );

    const progressbar = screen.getByRole('progressbar');
    expect(progressbar).toHaveAttribute('value', '0');

    rerender(<BriefGenerationProgress currentStage="生成Clip摘要" progress={20} />);

    await waitFor(() => {
      expect(progressbar).toHaveAttribute('value', '20');
    });
  });

  it('should show all 8 stages', () => {
    render(<BriefGenerationProgress currentStage="完成" progress={100} />);

    expect(screen.getByText('准备生成')).toBeInTheDocument();
    expect(screen.getByText('提取PDF文本')).toBeInTheDocument();
    expect(screen.getByText('生成Clip摘要')).toBeInTheDocument();
    expect(screen.getByText('提取结构化信息')).toBeInTheDocument();
    expect(screen.getByText('生成侦探卡片')).toBeInTheDocument();
    expect(screen.getByText('整合情报')).toBeInTheDocument();
    expect(screen.getByText('完成')).toBeInTheDocument();
  });
});
```

**Coverage Target**: >85%

---

### 4. BriefClipSummary

**File**: `components/brief/BriefClipSummary.tsx`

**Test Scenarios**:
```typescript
describe('BriefClipSummary', () => {
  it('should render 3-sentence summary', () => {
    const summary = 'This paper introduces the Transformer architecture. It achieves superior performance on translation tasks. The model trains significantly faster than RNNs.';

    render(<BriefClipSummary summary={summary} />);

    expect(screen.getByText(summary)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: /Clip AI摘要/ })).toBeInTheDocument();
  });

  it('should handle empty summary gracefully', () => {
    render(<BriefClipSummary summary="" />);

    expect(screen.getByText(/暂无摘要/)).toBeInTheDocument();
  });

  it('should support text selection and copying', () => {
    render(<BriefClipSummary summary="Test summary" />);

    const textElement = screen.getByText('Test summary');
    expect(textElement).toHaveStyle({ cursor: 'text' });
  });
});
```

**Coverage Target**: >80%

---

### 5. BriefStructuredInfo

**File**: `components/brief/BriefStructuredInfo.tsx`

**Test Scenarios**:
```typescript
describe('BriefStructuredInfo', () => {
  const structuredInfo = {
    researchQuestion: { content: 'Test question?', confidence: 95 },
    methods: [
      { content: 'Method 1', confidence: 90 },
      { content: 'Method 2', confidence: 88 },
    ],
    findings: [
      { content: 'Finding 1', confidence: 92 },
    ],
    limitations: [
      { content: 'Limitation 1', confidence: 85 },
    ],
  };

  it('should render all sections collapsed by default', () => {
    render(<BriefStructuredInfo structuredInfo={structuredInfo} />);

    expect(screen.getByRole('button', { name: /研究问题/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /方法论/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /关键发现/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /局限性/ })).toBeInTheDocument();
  });

  it('should expand section when clicked', async () => {
    render(<BriefStructuredInfo structuredInfo={structuredInfo} />);

    fireEvent.click(screen.getByRole('button', { name: /方法论/ }));

    await waitFor(() => {
      expect(screen.getByText('Method 1')).toBeInTheDocument();
      expect(screen.getByText('90%')).toBeInTheDocument();
    });
  });

  it('should display confidence scores', () => {
    render(<BriefStructuredInfo structuredInfo={structuredInfo} />);

    fireEvent.click(screen.getByRole('button', { name: /研究问题/ }));

    expect(screen.getByText('95%')).toBeInTheDocument();
    expect(screen.getByLabelText(/高置信度/)).toBeInTheDocument();
  });

  it('should handle empty sections', () => {
    const emptyInfo = {
      researchQuestion: { content: '未知', confidence: 0 },
      methods: [],
      findings: [],
      limitations: [],
    };

    render(<BriefStructuredInfo structuredInfo={emptyInfo} />);

    expect(screen.getByText(/暂无信息/)).toBeInTheDocument();
  });
});
```

**Coverage Target**: >85%

---

### 6. BriefClueCards

**File**: `components/brief/BriefClueCards.tsx`

**Test Scenarios**:
```typescript
describe('BriefClueCards', () => {
  const clueCards = [
    { id: '1', type: 'question', content: 'Test question?', confidence: 95, source: { page: 1 } },
    { id: '2', type: 'method', content: 'Test method', confidence: 90, source: { page: 2 } },
    { id: '3', type: 'finding', content: 'Test finding', confidence: 85, source: { page: 3 } },
  ];

  it('should render all clue cards', () => {
    render(<BriefClueCards cards={clueCards} />);

    expect(screen.getByText('Test question?')).toBeInTheDocument();
    expect(screen.getByText('Test method')).toBeInTheDocument();
    expect(screen.getByText('Test finding')).toBeInTheDocument();
  });

  it('should filter cards by type', () => {
    render(<BriefClueCards cards={clueCards} />);

    fireEvent.click(screen.getByRole('button', { name: /仅显示问题/ }));

    expect(screen.getByText('Test question?')).toBeInTheDocument();
    expect(screen.queryByText('Test method')).not.toBeInTheDocument();
  });

  it('should navigate to PDF source when card clicked', async () => {
    const onNavigate = jest.fn();
    render(<BriefClueCards cards={clueCards} onNavigate={onNavigate} />);

    fireEvent.click(screen.getByText('Test question?'));

    await waitFor(() => {
      expect(onNavigate).toHaveBeenCalledWith({ page: 1 });
    });
  });

  it('should display card count', () => {
    render(<BriefClueCards cards={clueCards} />);

    expect(screen.getByText(/共3张AI线索卡片/)).toBeInTheDocument();
  });
});
```

**Coverage Target**: >80%

---

### 7. BriefUserHighlights

**File**: `components/brief/BriefUserHighlights.tsx`

**Test Scenarios**:
```typescript
describe('BriefUserHighlights', () => {
  const userHighlights = {
    totalCount: 10,
    byColor: { red: 3, yellow: 3, orange: 2, gray: 2 },
    topHighlights: [
      { text: 'Highlight 1', color: 'red', page: 1 },
      { text: 'Highlight 2', color: 'yellow', page: 2 },
      { text: 'Highlight 3', color: 'orange', page: 3 },
    ],
  };

  it('should display highlight statistics', () => {
    render(<BriefUserHighlights highlights={userHighlights} />);

    expect(screen.getByText('总计10条高亮')).toBeInTheDocument();
    expect(screen.getByText(/红色.*3/)).toBeInTheDocument();
    expect(screen.getByText(/黄色.*3/)).toBeInTheDocument();
  });

  it('should display top 3 highlights', () => {
    render(<BriefUserHighlights highlights={userHighlights} />);

    expect(screen.getByText('Highlight 1')).toBeInTheDocument();
    expect(screen.getByText('Highlight 2')).toBeInTheDocument();
    expect(screen.getByText('Highlight 3')).toBeInTheDocument();
  });

  it('should show priority badge for each highlight', () => {
    render(<BriefUserHighlights highlights={userHighlights} />);

    expect(screen.getByLabelText(/critical priority/)).toBeInTheDocument();
    expect(screen.getByLabelText(/high priority/)).toBeInTheDocument();
  });

  it('should handle empty highlights', () => {
    const emptyHighlights = {
      totalCount: 0,
      byColor: { red: 0, yellow: 0, orange: 0, gray: 0 },
      topHighlights: [],
    };

    render(<BriefUserHighlights highlights={emptyHighlights} />);

    expect(screen.getByText(/暂无高亮/)).toBeInTheDocument();
  });
});
```

**Coverage Target**: >80%

---

### 8. BriefMetadataFooter

**File**: `components/brief/BriefMetadataFooter.tsx`

**Test Scenarios**:
```typescript
describe('BriefMetadataFooter', () => {
  const metadata = {
    tokenUsage: { input: 2500, output: 1000, total: 3500 },
    cost: 0.025,
    duration: 18.5,
    generatedAt: '2026-02-10 14:30:00',
  };

  it('should display token usage statistics', () => {
    render(<BriefMetadataFooter metadata={metadata} />);

    expect(screen.getByText(/3500 tokens/)).toBeInTheDocument();
    expect(screen.getByText(/输入: 2500/)).toBeInTheDocument();
    expect(screen.getByText(/输出: 1000/)).toBeInTheDocument();
  });

  it('should display generation cost', () => {
    render(<BriefMetadataFooter metadata={metadata} />);

    expect(screen.getByText(/\$0.025/)).toBeInTheDocument();
    expect(screen.getByText(/约¥0.18/)).toBeInTheDocument();
  });

  it('should display generation time', () => {
    render(<BriefMetadataFooter metadata={metadata} />);

    expect(screen.getByText(/18.5秒/)).toBeInTheDocument();
  });

  it('should provide export options', () => {
    const onExport = jest.fn();
    render(<BriefMetadataFooter metadata={metadata} onExport={onExport} />);

    expect(screen.getByRole('button', { name: /导出为Markdown/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /导出为BibTeX/ })).toBeInTheDocument();
  });

  it('should handle missing metadata gracefully', () => {
    render(<BriefMetadataFooter metadata={null} />);

    expect(screen.getByText(/元数据不可用/)).toBeInTheDocument();
  });
});
```

**Coverage Target**: >85%

---

## Integration Tests

### End-to-End Workflow

```typescript
describe('Intelligence Brief E2E', () => {
  it('should complete full generation workflow', async () => {
    const { container } = render(<IntelligenceBriefViewer paperId={1} />);

    // Click generate button
    fireEvent.click(screen.getByRole('button', { name: /生成情报简报/ }));

    // Verify progress stages
    await waitFor(() => {
      expect(screen.getByText('提取PDF文本')).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(screen.getByText('生成Clip摘要')).toBeInTheDocument();
    });

    // Verify completion
    await waitFor(() => {
      expect(screen.getByTestId('brief-header')).toBeInTheDocument();
      expect(screen.getByTestId('brief-clip-summary')).toBeInTheDocument();
    }, { timeout: 30000 });
  });

  it('should handle export workflow', async () => {
    const mockBrief = createMockBrief();
    const exportMock = jest.fn().mockReturnValue('# Test Markdown');

    render(
      <IntelligenceBriefViewer
        brief={mockBrief}
        onExport={exportMock}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /导出为Markdown/ }));

    await waitFor(() => {
      expect(exportMock).toHaveBeenCalled();
    });
  });
});
```

---

## Performance Tests

### Large Dataset Handling

```typescript
describe('Intelligence Brief Performance', () => {
  it('should render 20 clue cards without performance degradation', () => {
    const largeCards = Array.from({ length: 20 }, (_, i) => ({
      id: String(i),
      type: 'finding',
      content: `Finding ${i}`,
      confidence: 85 + Math.random() * 15,
    }));

    const startTime = performance.now();
    render(<BriefClueCards cards={largeCards} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(1000); // <1s render
  });

  it('should handle brief with 500 user highlights', () => {
    const largeHighlights = {
      totalCount: 500,
      byColor: { red: 150, yellow: 150, orange: 100, gray: 100 },
      topHighlights: Array.from({ length: 500 }, (_, i) => ({
        text: `Highlight ${i}`,
        color: ['red', 'yellow', 'orange', 'gray'][i % 4],
        page: Math.floor(i / 20) + 1,
      })),
    };

    const startTime = performance.now();
    render(<BriefUserHighlights highlights={largeHighlights} />);
    const endTime = performance.now();

    expect(endTime - startTime).toBeLessThan(500); // <500ms render
  });
});
```

---

## Accessibility Tests

### WCAG 2.1 AA Compliance

```typescript
describe('Intelligence Brief A11y', () => {
  it('should have no accessibility violations', async () => {
    const mockBrief = createMockBrief();
    const { container } = render(<IntelligenceBriefViewer brief={mockBrief} />);

    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });

  it('should support keyboard navigation', () => {
    const mockBrief = createMockBrief();
    render(<IntelligenceBriefViewer brief={mockBrief} />);

    // Tab through all interactive elements
    const user = userEvent.setup();

    await user.tab();
    expect(screen.getByRole('button', { name: /重新生成/ })).toHaveFocus();

    await user.tab();
    expect(screen.getByRole('button', { name: /导出/ })).toHaveFocus();
  });

  it('should have proper ARIA labels', () => {
    render(<BriefHeader caseFile={{ caseNumber: 142, title: 'Test' }} />);

    expect(screen.getByRole('banner')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /重新生成/ })).toHaveAttribute('aria-label');
  });
});
```

---

## Test Execution Plan

### Phase 1: Component Unit Tests (Day 18-19)

**Timeline**: 4-6 hours

**Components to test**:
1. BriefHeader (1 hour)
2. BriefGenerationProgress (1 hour)
3. BriefClipSummary (30 minutes)
4. BriefStructuredInfo (1.5 hours)
5. BriefClueCards (1 hour)
6. BriefUserHighlights (1 hour)
7. BriefMetadataFooter (30 minutes)

**Total estimated time**: 6 hours

### Phase 2: Integration Tests (Day 20)

**Timeline**: 3-4 hours

**Scenarios**:
1. Full generation workflow
2. Export workflow
3. Navigation workflow
4. Error handling workflow

### Phase 3: E2E Tests (Day 20-21)

**Timeline**: 2-3 hours

**Scenarios**:
1. Upload PDF → Generate Brief → Export
2. Generate → Navigate cards → Edit → Regenerate
3. Error recovery → Retry → Success

### Phase 4: Performance & A11y Tests (Day 21)

**Timeline**: 2-3 hours

**Scenarios**:
1. Large dataset rendering (20+ cards, 500+ highlights)
2. Accessibility audit (axe-core)
3. Keyboard navigation

---

## Testing Commands

```bash
# Run all Intelligence Brief tests
npm test -- intelligenceBrief

# Run with coverage
npm run test:coverage -- intelligenceBrief

# Run specific component
npm test -- BriefHeader

# Run integration tests
npm run test:integration -- brief
```

---

## Coverage Targets

| Component | Target | Priority |
|-----------|--------|----------|
| IntelligenceBriefViewer | >85% | P0 |
| BriefHeader | >80% | P1 |
| BriefGenerationProgress | >85% | P0 |
| BriefClipSummary | >80% | P1 |
| BriefStructuredInfo | >85% | P0 |
| BriefClueCards | >80% | P1 |
| BriefUserHighlights | >80% | P1 |
| BriefMetadataFooter | >85% | P0 |

**Overall Target**: >80% for UI components

---

## Test Data Requirements

**Mock Objects**:

```typescript
// Mock brief object
const mockBrief: IntelligenceBrief = {
  caseFile: {
    caseNumber: 142,
    title: 'Test Paper',
    researchQuestion: 'Test question?',
    coreMethod: 'Test method',
    keyFindings: ['F1', 'F2', 'F3'],
    completenessScore: 85,
  },
  clipSummary: 'Three sentence summary here.',
  structuredInfo: {
    researchQuestion: { content: 'Test question?', confidence: 95 },
    methods: [{ content: 'Method 1', confidence: 90 }],
    findings: [{ content: 'Finding 1', confidence: 85 }],
    limitations: [{ content: 'Limitation 1', confidence: 80 }],
  },
  clueCards: [
    { id: '1', type: 'question', content: 'Test?', confidence: 95 },
  ],
  userHighlights: {
    totalCount: 5,
    byColor: { red: 2, yellow: 2, orange: 1, gray: 0 },
    topHighlights: [
      { text: 'H1', color: 'red', page: 1 },
    ],
  },
  tokenUsage: { input: 2500, output: 1000, total: 3500 },
  cost: 0.025,
  duration: 18.5,
  generatedAt: '2026-02-10T14:30:00Z',
};
```

---

## Next Steps

1. ✅ Review frontend-engineer-v2's design document
2. ✅ Create comprehensive test plan (this document)
3. ⏳ Wait for PM approval and UI implementation
4. ⏳ Execute tests in parallel with development
5. ⏳ Verify >80% coverage target

---

**Test Architect**: test-architect-v2
**Created**: 2026-02-10
**Status**: Ready for implementation
**Estimated Test Writing Time**: 6-8 hours

**All test scenarios planned and ready for implementation!** 🎯
