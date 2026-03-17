# Project Stabilization And Delivery Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Stabilize the current Paper Detective codebase, remove known blockers, and create a reliable base for the next delivery sprint.

## Status Update

- Completed: product TypeScript baseline restored
- Completed: test TypeScript baseline restored
- Completed: focused Jest suites for API key management, intelligence brief API, BibTeX export, and intelligence brief services are green
- Remaining: broader Jest execution and manual happy-path verification

**Architecture:** Treat `paper-detective/` as the active application and stabilize it before adding new scope. Work from the outside in: repair broken tests and type-checking first, verify core app workflows second, then align docs and roadmap so implementation status matches reality.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Jest, React Testing Library, Anthropic SDK, Dexie, Zustand

---

### Task 1: Re-establish Source Of Truth

**Files:**
- Modify: `README.md`
- Modify: `PROJECT_OVERVIEW.md`
- Modify: `PROJECT-SUMMARY.md`
- Modify: `docs/plans/sprint6-plan.md`
- Reference: `package.json`

**Step 1: Write the failing validation**

Document the expected truth in notes before editing:

```md
- Active app root is `paper-detective/`
- Runtime stack is Next.js 15 + React 19
- Current version is 0.2.0
- Documentation must not mention the outer Vite scaffold as the production app
```

**Step 2: Verify current mismatch**

Run: `Get-Content package.json`
Expected: shows `next`, `react`, `react-dom`, and version `0.2.0`

**Step 3: Write minimal documentation corrections**

Update each doc so it states:

```md
- This repository contains legacy outer scaffolding plus the active `paper-detective/` app
- Current implementation baseline lives in `paper-detective/`
- Current delivery phase is stabilization, not greenfield MVP setup
```

**Step 4: Verify docs are internally consistent**

Run: `Select-String -Path README.md,PROJECT_OVERVIEW.md,PROJECT-SUMMARY.md,docs/plans/sprint6-plan.md -Pattern 'Vite|React 18|Sprint 1|MVP进行中'`
Expected: no stale claims remain, or only historical context remains with explicit labeling

**Step 5: Commit**

```bash
git add README.md PROJECT_OVERVIEW.md PROJECT-SUMMARY.md docs/plans/sprint6-plan.md
git commit -m "docs: align project status with active nextjs app"
```

### Task 2: Repair BibTeX Test Syntax Blocker

**Files:**
- Modify: `tests/unit/api/export/bibtex.test.ts`
- Test: `tests/unit/api/export/bibtex.test.ts`

**Step 1: Write the failing test condition**

Record the exact blocker:

```ts
// Current parser blocker near line 203
const fourAuthorsBrief = {
  ...mockBrief,
  caseFile: {
    ...mockBrief.caseFile,
    authors: ['John Smith', 'Jane Doe', 'Bob Johnson', 'Alice Williams'],
  },
};
```

**Step 2: Run the failing check**

Run: `npm.cmd run type-check`
Expected: FAIL at `tests/unit/api/export/bibtex.test.ts` with syntax errors near line 203

**Step 3: Write minimal implementation**

Fix the malformed object terminator and re-check the whole file for unmatched braces, parentheses, and test blocks.

**Step 4: Run focused verification**

Run: `npx.cmd jest tests/unit/api/export/bibtex.test.ts --runInBand`
Expected: test file parses and executes; remaining failures, if any, are behavioral rather than syntax-level

**Step 5: Commit**

```bash
git add tests/unit/api/export/bibtex.test.ts
git commit -m "test: fix bibtex export test syntax"
```

### Task 3: Restore TypeScript Green Baseline

**Files:**
- Modify: `tests/unit/api/export/bibtex.test.ts`
- Modify: `app/api/export/bibtex/route.ts`
- Modify: `types/ai.types.ts`
- Reference: `tsconfig.json`

**Step 1: Write the failing validation**

Run: `npm.cmd run type-check`
Expected: either pass, or surface the next concrete TS error after the BibTeX syntax fix

**Step 2: Fix one error class at a time**

For each error, apply the smallest correction:

```ts
type SafeExportResponse = {
  success: boolean;
  data?: unknown;
  error?: { code: string; message: string };
};
```

Use explicit types rather than `any`, especially in API response shaping and test fixtures.

**Step 3: Verify the baseline**

Run: `npm.cmd run type-check`
Expected: PASS

**Step 4: Lock in focused regressions**

Run: `npx.cmd jest tests/unit/api/export/bibtex.test.ts tests/unit/api/export/markdown.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/export/bibtex/route.ts types/ai.types.ts tests/unit/api/export/bibtex.test.ts
git commit -m "fix: restore type-safe export baseline"
```

### Task 4: Rebuild Test Execution Baseline

**Files:**
- Modify: `jest.config.js`
- Modify: `tests/setup.ts`
- Modify: `tests/README.md`

**Step 1: Write the failing validation**

Run: `npx.cmd jest --listTests --runInBand`
Expected: lists runnable suites without worker-spawn failures

**Step 2: Write minimal implementation**

Ensure the local default path for verification is serial execution:

```js
// docs only if config should stay parallel by default
npx jest --runInBand
```

Document when to use `--runInBand` locally and when CI may use workers.

**Step 3: Add a stable smoke command to docs**

```md
Smoke checks:
- npm run type-check
- npx jest tests/unit/api/export/bibtex.test.ts --runInBand
- npx jest tests/unit/services/aiService.test.ts --runInBand
```

**Step 4: Verify**

Run: `npx.cmd jest tests/unit/services/aiService.test.ts --runInBand`
Expected: suite starts successfully under the documented workflow

**Step 5: Commit**

```bash
git add jest.config.js tests/setup.ts tests/README.md
git commit -m "docs: define stable local test execution workflow"
```

### Task 5: Validate Core Product Paths

**Files:**
- Modify: `app/page.tsx`
- Modify: `components/RealPDFViewer.tsx`
- Modify: `components/DetectiveNotebook.tsx`
- Modify: `lib/store.ts`
- Test: `tests/integration/optimistic-ui-updates.test.ts`
- Test: `tests/unit/store/optimistic-updates.test.ts`

**Step 1: Write the failing verification list**

Core paths that must work:

```md
1. upload/select a paper
2. create highlight
3. highlight appears in notebook/inbox
4. move highlight to group
5. undo and redo restore the expected state
```

**Step 2: Run focused tests**

Run: `npx.cmd jest tests/unit/store/optimistic-updates.test.ts tests/integration/optimistic-ui-updates.test.ts --runInBand`
Expected: identify the first failing workflow

**Step 3: Write minimal implementation**

Patch only the failing state transitions, for example:

```ts
set(state => ({
  groups: state.groups.map(group =>
    group.id === targetId ? { ...group, items: nextItems } : group
  ),
}));
```

**Step 4: Verify**

Run: `npx.cmd jest tests/unit/store/optimistic-updates.test.ts tests/integration/optimistic-ui-updates.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add app/page.tsx components/RealPDFViewer.tsx components/DetectiveNotebook.tsx lib/store.ts tests/unit/store/optimistic-updates.test.ts tests/integration/optimistic-ui-updates.test.ts
git commit -m "fix: stabilize core notebook and highlight workflows"
```

### Task 6: Harden AI Service Paths

**Files:**
- Modify: `services/aiService.ts`
- Modify: `services/cacheService.ts`
- Modify: `services/apiKeyManager.ts`
- Test: `tests/unit/services/aiService.test.ts`
- Test: `tests/unit/services/clipAI.test.ts`
- Test: `tests/unit/services/structuredInfoExtraction.test.ts`

**Step 1: Write the failing validation**

Run: `npx.cmd jest tests/unit/services/aiService.test.ts tests/unit/services/clipAI.test.ts tests/unit/services/structuredInfoExtraction.test.ts --runInBand`
Expected: identify failures around parsing, fallback behavior, cache keys, or API-key gating

**Step 2: Write minimal implementation**

Keep service contracts explicit:

```ts
if (!this.isConfigured()) {
  throw new AIError('API_KEY_MISSING', 'Please configure API key first');
}
```

Normalize parse failures into a stable fallback response instead of leaking raw transport errors.

**Step 3: Verify**

Run: `npx.cmd jest tests/unit/services/aiService.test.ts tests/unit/services/clipAI.test.ts tests/unit/services/structuredInfoExtraction.test.ts --runInBand`
Expected: PASS

**Step 4: Extend confidence checks**

Run: `npx.cmd jest tests/unit/services/cacheService.test.ts tests/unit/services/costTracker.test.ts --runInBand`
Expected: PASS

**Step 5: Commit**

```bash
git add services/aiService.ts services/cacheService.ts services/apiKeyManager.ts tests/unit/services/aiService.test.ts tests/unit/services/clipAI.test.ts tests/unit/services/structuredInfoExtraction.test.ts tests/unit/services/cacheService.test.ts tests/unit/services/costTracker.test.ts
git commit -m "fix: harden ai analysis and cache workflows"
```

### Task 7: Re-scope The Next Delivery Sprint

**Files:**
- Modify: `docs/plans/sprint6-plan.md`
- Modify: `PROJECT_OVERVIEW.md`
- Modify: `tests/TEST_TEAM_READINESS_REPORT.md`

**Step 1: Write the target sprint shape**

```md
Sprint 6 priorities:
1. codebase health and doc alignment
2. export and AI stability
3. core workflow verification
4. release gate definition
5. only then new UX/PWA enhancements
```

**Step 2: Remove non-essential near-term scope**

Push these after stabilization unless already verified:

```md
- new PWA polish
- broader i18n expansion
- new intelligence brief surface area
- extra performance work without a measured bottleneck
```

**Step 3: Add release gates**

```md
Release gate:
- type-check passes
- targeted Jest suites pass
- docs reflect actual architecture
- one manual end-to-end happy path is recorded
```

**Step 4: Verify**

Run: `Select-String -Path docs/plans/sprint6-plan.md,PROJECT_OVERVIEW.md,tests/TEST_TEAM_READINESS_REPORT.md -Pattern 'Release gate|stabilization|type-check|runInBand'`
Expected: all planning artifacts reflect the new priority order

**Step 5: Commit**

```bash
git add docs/plans/sprint6-plan.md PROJECT_OVERVIEW.md tests/TEST_TEAM_READINESS_REPORT.md
git commit -m "docs: shift next sprint to stabilization-first delivery"
```

### Task 8: Final Verification And Release Readiness Snapshot

**Files:**
- Modify: `PROJECT_OVERVIEW.md`
- Modify: `tests/TEST_TEAM_READINESS_REPORT.md`

**Step 1: Run the full release snapshot**

Run: `npm.cmd run type-check`
Expected: PASS

**Step 2: Run the targeted stable suites**

Run: `npx.cmd jest tests/unit/api/export/bibtex.test.ts tests/unit/api/export/markdown.test.ts tests/unit/services/aiService.test.ts tests/unit/store/optimistic-updates.test.ts tests/integration/optimistic-ui-updates.test.ts --runInBand`
Expected: PASS

**Step 3: Record the result**

Update status docs with:

```md
- Verified on 2026-03-15
- Type-check: pass/fail
- Focused tests: pass/fail
- Known blockers: explicit list only
- Recommendation: continue sprint / stop feature work / prepare release
```

**Step 4: Verify docs were updated**

Run: `Get-Content PROJECT_OVERVIEW.md | Select-String 'Verified on 2026-03-15'`
Expected: verification stamp present

**Step 5: Commit**

```bash
git add PROJECT_OVERVIEW.md tests/TEST_TEAM_READINESS_REPORT.md
git commit -m "docs: add release readiness verification snapshot"
```
