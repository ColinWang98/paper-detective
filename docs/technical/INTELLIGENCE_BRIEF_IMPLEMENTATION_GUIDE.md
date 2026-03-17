# Intelligence Brief Implementation Guide

**Target**: Senior Developer & Frontend Engineer
**Status**: Backend 95% Complete | Frontend 0% Complete
**Updated**: 2026-02-10

---

## Quick Start

### Backend (95% Complete - Ready for Integration)

**Location**: `app/api/ai/intelligence-brief/route.ts`

**Usage**:
```typescript
// Generate brief
POST /api/ai/intelligence-brief
{
  "paperId": 1,
  "pdfText": "...",
  "highlights": [...],
  "forceRegenerate": false
}

// Get cached brief
GET /api/ai/intelligence-brief?paperId=1

// Delete cached brief
DELETE /api/ai/intelligence-brief?paperId=1
```

**Remaining Work** (1-2 hours):
- [ ] Fix ts-jest dependency for test execution
- [ ] Run test suite verification
- [ ] TypeScript final type check

### Frontend (0% Complete - Ready to Start)

**Required Components**:

1. **IntelligenceBriefViewer** - Main container
   - Display all sections of the brief
   - Loading states with progress indicators
   - Error handling with retry options

2. **CaseFileHeader** - Case number & metadata
   - Display: 案件档案 #142
   - Completeness score with visual indicator (stars/bars)

3. **ClipSummaryCard** - 3-sentence summary
   - Display formatted summary
   - Confidence indicator

4. **StructuredInfoSection** - Research details
   - Research question
   - Methods (bulleted list)
   - Findings (bulleted list)
   - Limitations (bulleted list)
   - Confidence badges for each

5. **AIClueCardsSection** - Reuse existing component
   - Already implemented: `components/AIClueCard.tsx`
   - Group by type with collapsible sections
   - Filter and sort options

6. **UserHighlightsSummary** - User data
   - Total highlights count
   - Priority distribution (pie chart or badges)
   - Top 3 highlights preview

7. **ExportButton** - Export functionality
   - Markdown export (already implemented in service)
   - PDF export (future)
   - BibTeX export (future)

**Integration Example**:
```typescript
// components/IntelligenceBriefViewer.tsx
'use client';

import { useEffect, useState } from 'react';
import { usePaperStore } from '@/lib/store';
import type { IntelligenceBrief } from '@/types';

export function IntelligenceBriefViewer({ paperId }: { paperId: number }) {
  const { currentPaper } = usePaperStore();
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [stage, setStage] = useState('');

  const generateBrief = async () => {
    setLoading(true);
    setProgress(0);

    try {
      // Get PDF text
      const pdfText = await extractPDFText(currentPaper);

      // Get highlights
      const highlights = await getHighlights(paperId);

      // Generate brief (with streaming progress)
      const response = await fetch('/api/ai/intelligence-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, pdfText, highlights }),
      });

      const data = await response.json();
      setBrief(data.data);
    } catch (error) {
      console.error('Failed to generate brief:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <LoadingProgress stage={stage} progress={progress} />;
  }

  if (!brief) {
    return <GenerateButton onClick={generateBrief} />;
  }

  return (
    <div className="intelligence-brief-viewer">
      <CaseFileHeader caseFile={brief.caseFile} />
      <ClipSummaryCard summary={brief.clipSummary} />
      <StructuredInfoSection info={brief.structuredInfo} />
      <AIClueCardsSection cards={brief.clueCards} />
      <UserHighlightsSummary highlights={brief.userHighlights} />
      <MetadataSection brief={brief} />
      <ExportButton brief={brief} format="markdown" />
    </div>
  );
}
```

---

## Design System

### Colors (Newspaper Theme)
```css
--newspaper-cream: #f4f1ea;    /* Background */
--newspaper-ink: #2c2c2c;      /* Text */
--newspaper-accent: #8b2323;   /* Red accent */
--newspaper-gold: #d4a84b;     /* Gold decoration */
```

### Typography
```css
font-family: Georgia, serif;   /* Body */
font-family: 'Playfair Display', serif; /* Headlines */
```

### Component Structure
```
IntelligenceBriefViewer
├── CaseFileHeader (📁 案件档案 #142)
├── ClipSummaryCard (📋 3句话摘要)
├── StructuredInfoSection
│   ├── ResearchQuestion (🔍)
│   ├── Methods (🔧)
│   ├── Findings (🎯)
│   └── Limitations (⚠️)
├── AIClueCardsSection (🕵️)
│   ├── QuestionCards (🔴)
│   ├── MethodCards (🔵)
│   ├── FindingCards (🟢)
│   └── LimitationCards (🟡)
├── UserHighlightsSummary (📝)
└── MetadataSection (💰 + ⏱️)
```

---

## API Integration

### Service Hook (Recommended)
```typescript
// hooks/useIntelligenceBrief.ts
import { useState } from 'react';

export function useIntelligenceBrief() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [brief, setBrief] = useState<IntelligenceBrief | null>(null);

  const generate = async (paperId: number, pdfText: string, highlights: Highlight[]) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/ai/intelligence-brief', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ paperId, pdfText, highlights }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || 'Generation failed');
      }

      setBrief(data.data);
      return data.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unknown error';
      setError(message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getCached = async (paperId: number) => {
    try {
      const response = await fetch(`/api/ai/intelligence-brief?paperId=${paperId}`);
      const data = await response.json();

      if (data.success) {
        setBrief(data.data);
        return data.data;
      }
    } catch (err) {
      console.error('Failed to get cached brief:', err);
    }
  };

  return { brief, loading, error, generate, getCached };
}
```

---

## Progress Tracking

### Backend Progress
- [x] Service layer (intelligenceBriefService.ts)
- [x] API endpoint (route.ts)
- [x] Unit tests
- [x] API documentation
- [x] TypeScript types
- [ ] Test execution (ts-jest dependency fix)

### Frontend Progress
- [ ] IntelligenceBriefViewer component
- [ ] CaseFileHeader component
- [ ] ClipSummaryCard component
- [ ] StructuredInfoSection component
- [ ] AIClueCardsSection (reuse existing)
- [ ] UserHighlightsSummary component
- [ ] ExportButton component
- [ ] LoadingProgress component
- [ ] ErrorBoundary integration
- [ ] Responsive design (mobile)
- [ ] Integration tests

---

## Testing Checklist

### Backend Tests
- [x] Unit tests written (15 suites)
- [x] API tests written (13 scenarios)
- [ ] Test execution verification
- [ ] Coverage report (>75%)

### Frontend Tests
- [ ] Component tests (React Testing Library)
- [ ] Integration tests (API mocking)
- [ ] E2E tests (Playwright)
- [ ] Accessibility tests (axe-core)

---

## Performance Targets

| Metric | Target | Notes |
|--------|--------|-------|
| First Contentful Paint | <1.5s | Lighthouse |
| Time to Interactive | <3s | Lighthouse |
| API Response (cache) | <100ms | Cached |
| API Response (cold) | <10s | Generation |
| Bundle Size | <500KB | Gzipped |

---

## Known Issues

1. **ts-jest dependency**: Not installed in paper-detective/node_modules
   - **Solution**: Install ts-jest or configure Jest for Next.js
   - **Priority**: Medium (tests written, just need execution)

2. **Streaming progress**: Not yet implemented
   - **Current**: Progress callback logs to console
   - **Future**: Server-sent events for real-time updates
   - **Priority**: Low (nice-to-have)

---

## Next Steps

1. **product-manager-v2**: Confirm feature priority
2. **frontend-engineer-v2**: Start component development
3. **senior-developer-v2**: Fix test infrastructure, verify tests
4. **test-architect-v2**: Review test coverage, add integration tests
5. **hci-researcher-v2**: Validate UX design

---

## Support

**Backend Questions**: senior-developer-v2
**Frontend Questions**: frontend-engineer-v2
**Design Questions**: hci-researcher-v2
**Test Questions**: test-architect-v2

---

**Version**: 1.0
**Last Updated**: 2026-02-10
**Author**: senior-developer-v2
