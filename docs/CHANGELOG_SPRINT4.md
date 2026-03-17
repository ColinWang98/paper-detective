# Changelog - Sprint 4 Release (v0.2.0)

**Release Date:** 2026-02-11
**Version:** 0.1.0 → 0.2.0

---

## Added

### Features

- **Intelligence Brief Generation** - AI-powered comprehensive analysis of academic papers
  - 6-section structured brief (Abstract, Key Questions, Core Contributions, Methodology, Results, Limitations)
  - Real-time generation progress tracking
  - Error handling with retry logic

- **Markdown Export** - Export intelligence briefs as formatted Markdown files
  - Full markdown formatting with headers, bullets, code blocks
  - UTF-8 encoding support
  - Automatic file download

- **BibTeX Export** - Export paper citations in BibTeX format
  - Proper BibTeX citation format
  - Automatic citation key generation
  - Compatible with Zotero, Mendeley, EndNote

- **Standalone Brief Page** - Dedicated page for viewing intelligence briefs
  - Route: `/brief/[paperId]`
  - Responsive newspaper-style layout
  - Navigation with back button
  - Error handling for invalid IDs

### API Endpoints

- `POST /api/ai/intelligence-brief` - Generate intelligence brief
- `GET /api/ai/intelligence-brief?paperId=X` - Retrieve brief
- `DELETE /api/ai/intelligence-brief?paperId=X` - Delete brief
- `POST /api/export/markdown` - Export as Markdown
- `POST /api/export/bibtex` - Export as BibTeX

### Components

- `components/brief/IntelligenceBriefViewer.tsx` - Main brief viewer with export buttons
- `components/Modal.tsx` - Custom modal for confirmations
- `hooks/useIntelligenceBrief.ts` - Hook for brief generation and management

### Pages

- `app/brief/[paperId]/page.tsx` - Standalone brief viewing page

---

## Changed

- Updated useAIAnalysis hook to use proper extractPDFText import from @/lib/pdf
- Improved error handling across all AI features
- Enhanced export functionality with proper file naming

---

## Fixed

- Fixed hook architecture issue in useAIAnalysis.ts
- Replaced native confirm() with custom Modal component
- Replaced native alert() with Toast notifications
- Fixed card.evidence property access in intelligence brief hook

---

## Technical Details

### Build Status
- TypeScript Compilation: 0 errors ✅
- Production Build: Successful ✅
- Static Pages: 13/13 generated ✅

### Bundle Size
- Home First Load JS: 474 kB
- Brief Page First Load JS: 319 kB
- Shared JS: 105 kB

---

## Known Issues

See [SPRINT4_FINAL_DELIVERY.md](./SPRINT4_FINAL_DELIVERY.md) for details:
- 69 ESLint warnings (P2 - deferred to Sprint 4.1)
- Test infrastructure issues (P2 - manual testing confirms functionality)

---

## Documentation

- Sprint 4 Delivery Report: [SPRINT4_FINAL_DELIVERY.md](./SPRINT4_FINAL_DELIVERY.md)
- Execution Status: [Sprint4_EXECUTION_STATUS.md](./Sprint4_EXECUTION_STATUS.md)
- Day 18 Completion: [DAY18_COMPLETE.md](./DAY18_COMPLETE.md)
- Day 19 Tasks: [DAY19_TASKS.md](./DAY19_TASKS.md)

---

## Migration Guide

No migration required. This is a feature-only release with no breaking changes.

---

**End of Sprint 4 Changelog**
