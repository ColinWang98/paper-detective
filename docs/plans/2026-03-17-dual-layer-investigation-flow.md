# Dual-Layer Investigation Flow Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the current PDF reader + notebook app into a dual-layer investigation experience where AI first builds a paper structure map and a suspense-light case task tree, then the player gathers evidence from the paper to complete tasks and unlock the final case report.

**Architecture:** Keep the current `Next.js app + Zustand store + IndexedDB + AI services` foundation. Add a new `Case Setup` stage between PDF upload and the existing notebook/brief flow. The bottom layer remains a paper structure tree derived from the PDF. The top layer is a task-oriented case tree with suspense-light framing. User highlights become evidence submissions tied to tasks. The current `IntelligenceBrief` becomes the final case report instead of the first AI output.

**Tech Stack:** Next.js 15, React 19, TypeScript 5, Zustand, IndexedDB/Dexie helpers, existing BigModel AI service, Jest, Testing Library

---

## Product Direction

### Experience Summary

The new core loop is:

1. Upload PDF
2. AI generates a `Case Setup`
3. System shows a case overview plus paper structure tree
4. Player completes investigation tasks by finding evidence in the paper
5. System unlocks additional tasks and clue summaries
6. Final report is generated from both AI setup data and player-submitted evidence

### Design Rules

- Suspense-light tone, not full roleplay
- Every case claim must be traceable to paper text
- AI sets the investigation frame but does not solve the case for the player
- Task completion requires player evidence, not button clicks
- Final report should reflect what the player proved, not only what the AI inferred

### MVP Scope

Only ship the minimum loop:

- `Case Setup` generation
- Structure tree display
- 4 core investigation tasks
- Evidence submission from highlights into tasks
- Task completion and unlock progression
- Final case report based on completed tasks

Out of scope for MVP:

- branching narratives
- NPC/character dialogue
- OCR fallback
- scoring systems
- achievements
- multiplayer or collaboration

## Proposed Data Model

### New Domain Objects

Add these objects near existing AI/domain types:

- `CaseSetup`
- `PaperStructureNode`
- `InvestigationTask`
- `EvidenceSubmission`
- `TaskProgress`
- `CaseProgressSnapshot`

### CaseSetup shape

```ts
interface CaseSetup {
  id?: number;
  paperId: number;
  caseTitle: string;
  caseBackground: string;
  coreDispute: string;
  openingJudgment: string;
  investigationGoal: string;
  structureNodes: PaperStructureNode[];
  tasks: InvestigationTask[];
  generatedAt: string;
  model: string;
  source: 'ai-generated' | 'cache';
}
```

### PaperStructureNode shape

```ts
interface PaperStructureNode {
  id: string;
  kind:
    | 'intro'
    | 'related-work'
    | 'method'
    | 'implementation'
    | 'experiment'
    | 'result'
    | 'discussion'
    | 'limitation'
    | 'other';
  title: string;
  summary: string;
  pageHints: number[];
  importance: 'critical' | 'important' | 'supporting';
  status: 'unseen' | 'investigating' | 'confirmed' | 'disputed';
}
```

### InvestigationTask shape

```ts
interface InvestigationTask {
  id: string;
  title: string;
  question: string;
  narrativeHook: string;
  linkedStructureKinds: PaperStructureNode['kind'][];
  requiredEvidenceTypes: Array<'claim' | 'comparison' | 'method' | 'result' | 'limitation'>;
  minEvidenceCount: number;
  unlocksTaskIds: string[];
  status: 'locked' | 'available' | 'in_progress' | 'completed';
}
```

### EvidenceSubmission shape

```ts
interface EvidenceSubmission {
  id?: number;
  paperId: number;
  taskId: string;
  highlightId: number;
  evidenceType: 'claim' | 'comparison' | 'method' | 'result' | 'limitation';
  note: string;
  createdAt: string;
}
```

## MVP Task Set

Start with exactly 4 tasks:

1. `Define the Case`
   - Question: What problem does the paper claim to solve?
   - Sections: `intro`
   - Evidence types: `claim`

2. `Identify the Real Innovation`
   - Question: What is genuinely new compared with prior work?
   - Sections: `related-work`, `method`
   - Evidence types: `comparison`, `method`

3. `Check Whether the Results Hold Up`
   - Question: Do the experiments support the paper's main claim?
   - Sections: `experiment`, `result`
   - Evidence types: `result`

4. `Find the Weak Point`
   - Question: What limitation or unresolved risk remains?
   - Sections: `discussion`, `limitation`
   - Evidence types: `limitation`

Unlock order:

- Task 1 unlocked immediately
- Task 2 unlocks after Task 1
- Task 3 unlocks after Task 2
- Task 4 unlocks after Task 3
- Final report unlocks after all 4 complete

## UI Architecture

### Entry Flow

After PDF upload, route the user to a new first-stage panel before normal reading.

New UI sequence:

1. Upload PDF in `RealPDFViewer`
2. Persist paper and file context as today
3. Generate `CaseSetup`
4. Show `CaseSetupPanel`
5. On user confirmation, switch to investigation layout

### New Components

Create:

- `components/case/CaseSetupPanel.tsx`
- `components/case/CaseHeader.tsx`
- `components/case/StructureTree.tsx`
- `components/case/TaskBoard.tsx`
- `components/case/TaskCard.tsx`
- `components/case/EvidenceSubmitModal.tsx`
- `components/case/CaseProgressBar.tsx`
- `components/case/UnlockedInsightFeed.tsx`

### Existing Components To Reframe

- `app/page.tsx`
  - insert the new setup stage
  - manage active phase: `setup`, `investigate`, `report`
- `components/RealPDFViewer.tsx`
  - preserve upload and highlights
  - add callback support for task-linked evidence submission
- `components/DetectiveNotebook.tsx`
  - convert from loose notebook to task-driven evidence board
- `components/brief/IntelligenceBriefViewer.tsx`
  - treat as final `Case Report` instead of initial AI summary

### Layout Recommendation

During investigation:

- Left: PDF viewer
- Center: case header + structure tree
- Right: active tasks + submitted evidence + unlocked insights

Do not hide the paper structure tree. It is the rigor anchor for the suspense layer.

## Service Layer Changes

### New Service

Create:

- `services/caseSetupService.ts`

Responsibilities:

- call AI once after upload
- generate case framing
- generate structure tree
- generate initial tasks
- cache setup data by `paperId`

### Prompt Strategy

The first prompt must explicitly request:

- a section map of the paper
- a lightweight case framing
- no final conclusion certainty
- task prompts that require text evidence from the player

The AI should be instructed:

- do not invent facts absent from the paper
- keep suspense-light tone
- identify uncertainty explicitly
- produce structured JSON only

### Reuse Existing Services

- `aiService.ts`
  - keep as the transport layer
  - add one generic helper for structured case setup generation
- `intelligenceBriefService.ts`
  - update to consume `CaseSetup + EvidenceSubmission[] + Highlights[]`
  - final report should cite completed tasks and evidence-backed conclusions

## Store Layer Changes

### Extend Zustand Store

Modify `lib/store.ts` to include:

- `caseSetup: CaseSetup | null`
- `investigationTasks: InvestigationTask[]`
- `evidenceSubmissions: EvidenceSubmission[]`
- `activeTaskId: string | null`
- `investigationPhase: 'setup' | 'investigate' | 'report'`

Add actions:

- `loadCaseSetup(paperId)`
- `generateCaseSetup(pdfText)`
- `submitEvidence(taskId, highlightId, evidenceType, note)`
- `loadEvidenceSubmissions(paperId)`
- `evaluateTaskCompletion(taskId)`
- `setActiveTask(taskId)`
- `setInvestigationPhase(phase)`

### Persistence

Add IndexedDB tables and helpers for:

- case setups
- evidence submissions

Reuse existing `paperId` scoping and history patterns where practical.

## API Layer Changes

Create:

- `app/api/ai/case-setup/route.ts`

This route should:

- accept `paperId` and `pdfText`
- call `caseSetupService`
- return validated JSON
- support cached retrieval via `GET ?paperId=...`

Potential later route, not required for MVP:

- `app/api/investigation/evaluate-task/route.ts`

For MVP, task evaluation can stay client-side if rules are simple and deterministic.

## Detailed Implementation Tasks

### Task 1: Add New Domain Types

**Files:**
- Modify: `types/ai.types.ts`
- Create: `types/case.types.ts`
- Modify: `types/index.ts`
- Test: `tests/unit/types/case-types.test.ts`

**Step 1: Write the failing test**

Add tests asserting:

- `CaseSetup` can store structure nodes and tasks
- `InvestigationTask.status` only accepts the allowed states
- `EvidenceSubmission` requires `taskId`, `highlightId`, and `note`

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\types\\case-types.test.ts --runInBand`
Expected: FAIL because the types/modules do not exist

**Step 3: Write minimal implementation**

Create `types/case.types.ts` with the interfaces defined above and export them.

**Step 4: Run test to verify it passes**

Run the same Jest command.
Expected: PASS

**Step 5: Commit**

```bash
git add types/case.types.ts types/ai.types.ts types/index.ts tests/unit/types/case-types.test.ts
git commit -m "feat: add case investigation domain types"
```

### Task 2: Add Persistence For Case Setup And Evidence

**Files:**
- Modify: `lib/db.ts`
- Modify: `lib/store.ts`
- Test: `tests/unit/lib/db-case-setup.test.ts`

**Step 1: Write the failing test**

Add tests for:

- saving/loading a `CaseSetup`
- saving/loading `EvidenceSubmission[]` by `paperId`

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\lib\\db-case-setup.test.ts --runInBand`
Expected: FAIL because db helpers/tables do not exist

**Step 3: Write minimal implementation**

Add tables and helper functions for `caseSetups` and `evidenceSubmissions`.

**Step 4: Run test to verify it passes**

Run the same Jest command.
Expected: PASS

**Step 5: Commit**

```bash
git add lib/db.ts lib/store.ts tests/unit/lib/db-case-setup.test.ts
git commit -m "feat: persist case setup and evidence submissions"
```

### Task 3: Build Case Setup Service

**Files:**
- Create: `services/caseSetupService.ts`
- Modify: `services/aiService.ts`
- Test: `tests/unit/services/caseSetupService.test.ts`

**Step 1: Write the failing test**

Add tests asserting:

- the service requests structure nodes and tasks
- output is normalized into `CaseSetup`
- cache is reused for repeated requests

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\services\\caseSetupService.test.ts --runInBand`
Expected: FAIL because service does not exist

**Step 3: Write minimal implementation**

Implement a JSON-only AI generation path and a small normalization layer.

**Step 4: Run test to verify it passes**

Run the same Jest command.
Expected: PASS

**Step 5: Commit**

```bash
git add services/caseSetupService.ts services/aiService.ts tests/unit/services/caseSetupService.test.ts
git commit -m "feat: generate case setup from PDF text"
```

### Task 4: Add Case Setup API Route

**Files:**
- Create: `app/api/ai/case-setup/route.ts`
- Test: `tests/unit/api/case-setup.test.ts`

**Step 1: Write the failing test**

Cover:

- `POST` with `paperId` and `pdfText`
- `GET` cached setup by `paperId`
- missing params returns `400`

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\api\\case-setup.test.ts --runInBand`
Expected: FAIL

**Step 3: Write minimal implementation**

Implement route with the current API response conventions.

**Step 4: Run test to verify it passes**

Run the same Jest command.
Expected: PASS

**Step 5: Commit**

```bash
git add app/api/ai/case-setup/route.ts tests/unit/api/case-setup.test.ts
git commit -m "feat: add case setup API route"
```

### Task 5: Insert Setup Stage Into Home Flow

**Files:**
- Modify: `app/page.tsx`
- Create: `components/case/CaseSetupPanel.tsx`
- Test: `tests/unit/app/page-case-setup.test.tsx`

**Step 1: Write the failing test**

Test that:

- after a PDF is available and no case setup exists, the setup panel appears
- investigation mode is not entered until setup completes

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\app\\page-case-setup.test.tsx --runInBand`
Expected: FAIL

**Step 3: Write minimal implementation**

Add `investigationPhase` handling and render `CaseSetupPanel` before the notebook/brief split.

**Step 4: Run test to verify it passes**

Run the same Jest command.
Expected: PASS

**Step 5: Commit**

```bash
git add app/page.tsx components/case/CaseSetupPanel.tsx tests/unit/app/page-case-setup.test.tsx
git commit -m "feat: add case setup phase to home flow"
```

### Task 6: Add Structure Tree And Task Board

**Files:**
- Create: `components/case/StructureTree.tsx`
- Create: `components/case/TaskBoard.tsx`
- Create: `components/case/TaskCard.tsx`
- Test: `tests/unit/components/case/StructureTree.test.tsx`
- Test: `tests/unit/components/case/TaskBoard.test.tsx`

**Step 1: Write the failing test**

Verify:

- structure nodes render with statuses
- tasks show locked/available/completed state
- linked sections are visible per task

**Step 2: Run test to verify it fails**

Run:

- `npm.cmd test -- tests\\unit\\components\\case\\StructureTree.test.tsx --runInBand`
- `npm.cmd test -- tests\\unit\\components\\case\\TaskBoard.test.tsx --runInBand`

Expected: FAIL

**Step 3: Write minimal implementation**

Build low-friction presentational components first.

**Step 4: Run test to verify it passes**

Run the same commands.
Expected: PASS

**Step 5: Commit**

```bash
git add components/case tests/unit/components/case
git commit -m "feat: add structure tree and task board"
```

### Task 7: Convert Highlights Into Evidence Submission

**Files:**
- Modify: `components/RealPDFViewer.tsx`
- Modify: `components/DetectiveNotebook.tsx`
- Create: `components/case/EvidenceSubmitModal.tsx`
- Modify: `lib/store.ts`
- Test: `tests/unit/components/case/EvidenceSubmitModal.test.tsx`
- Test: `tests/integration/evidence-submission-flow.test.tsx`

**Step 1: Write the failing test**

Cover:

- selecting a highlight opens evidence submission flow
- user chooses task + evidence type + note
- submission persists and appears under the task

**Step 2: Run test to verify it fails**

Run:

- `npm.cmd test -- tests\\unit\\components\\case\\EvidenceSubmitModal.test.tsx --runInBand`
- `npm.cmd test -- tests\\integration\\evidence-submission-flow.test.tsx --runInBand`

Expected: FAIL

**Step 3: Write minimal implementation**

Reuse the existing highlight pipeline and add a follow-up modal instead of building a second selection system.

**Step 4: Run test to verify it passes**

Run the same commands.
Expected: PASS

**Step 5: Commit**

```bash
git add components/case/EvidenceSubmitModal.tsx components/RealPDFViewer.tsx components/DetectiveNotebook.tsx lib/store.ts tests
git commit -m "feat: submit highlights as task evidence"
```

### Task 8: Add Deterministic Task Completion Rules

**Files:**
- Modify: `lib/store.ts`
- Create: `lib/investigationRules.ts`
- Test: `tests/unit/lib/investigationRules.test.ts`

**Step 1: Write the failing test**

Rules to verify:

- task remains incomplete with insufficient evidence count
- task remains incomplete if required evidence type is missing
- task completes and unlocks the next task when criteria are met

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\unit\\lib\\investigationRules.test.ts --runInBand`
Expected: FAIL

**Step 3: Write minimal implementation**

Keep rules deterministic for MVP. Do not use AI to judge submission quality yet.

**Step 4: Run test to verify it passes**

Run the same command.
Expected: PASS

**Step 5: Commit**

```bash
git add lib/investigationRules.ts lib/store.ts tests/unit/lib/investigationRules.test.ts
git commit -m "feat: add investigation task completion rules"
```

### Task 9: Reframe Intelligence Brief As Final Case Report

**Files:**
- Modify: `services/intelligenceBriefService.ts`
- Modify: `hooks/useIntelligenceBrief.ts`
- Modify: `components/brief/IntelligenceBriefViewer.tsx`
- Test: `tests/unit/services/intelligenceBriefService.test.ts`
- Test: `tests/unit/components/brief/IntelligenceBriefViewer.test.tsx`

**Step 1: Write the failing test**

Add expectations that:

- final report references completed investigation tasks
- report sections reflect evidence-backed findings
- report stays locked until all core tasks complete

**Step 2: Run test to verify it fails**

Run:

- `npm.cmd test -- tests\\unit\\services\\intelligenceBriefService.test.ts --runInBand`
- `npm.cmd test -- tests\\unit\\components\\brief\\IntelligenceBriefViewer.test.tsx --runInBand`

Expected: FAIL

**Step 3: Write minimal implementation**

Keep export features intact while changing the semantic framing and data inputs.

**Step 4: Run test to verify it passes**

Run the same commands.
Expected: PASS

**Step 5: Commit**

```bash
git add services/intelligenceBriefService.ts hooks/useIntelligenceBrief.ts components/brief/IntelligenceBriefViewer.tsx tests
git commit -m "feat: turn intelligence brief into final case report"
```

### Task 10: Integrate And Verify The MVP Loop

**Files:**
- Modify: `CURRENT_STATUS.md`
- Modify: `docs/plans/2026-03-17-dual-layer-investigation-flow.md`
- Test: `tests/integration/case-investigation-happy-path.test.tsx`

**Step 1: Write the failing test**

Cover one end-to-end browserless path:

- upload paper
- generate case setup
- submit evidence into 4 tasks
- unlock final report

**Step 2: Run test to verify it fails**

Run: `npm.cmd test -- tests\\integration\\case-investigation-happy-path.test.tsx --runInBand`
Expected: FAIL

**Step 3: Write minimal implementation**

Patch missing integration points only. Do not add new scope here.

**Step 4: Run test to verify it passes**

Run:

- `npm.cmd test -- tests\\integration\\case-investigation-happy-path.test.tsx --runInBand`
- `npm.cmd run type-check`
- `npm.cmd run type-check:tests`
- `npm.cmd run build`

Expected: PASS on all commands

**Step 5: Commit**

```bash
git add CURRENT_STATUS.md docs/plans/2026-03-17-dual-layer-investigation-flow.md tests/integration/case-investigation-happy-path.test.tsx
git commit -m "feat: complete dual-layer investigation MVP"
```

## Testing Strategy

### Unit Tests

- type definitions
- case setup service normalization
- task completion rules
- evidence submission UI
- case report generation

### API Tests

- `POST /api/ai/case-setup`
- `GET /api/ai/case-setup?paperId=...`

### Integration Tests

- upload -> setup -> tasks -> report
- highlight -> evidence submission -> task unlock

### Manual Verification Checklist

1. Upload a PDF
2. Confirm case setup appears before notebook mode
3. Confirm structure tree and first task are visible
4. Highlight text and attach it to a task
5. Complete all 4 tasks
6. Confirm final report unlocks
7. Export markdown and bibtex from the final report

## Risks And Guardrails

### Risks

- AI may generate tasks too generic to feel investigative
- structure extraction may be noisy on poorly formatted PDFs
- evidence quality may remain shallow if completion rules are too weak
- suspense copy can become cheesy and reduce trust

### Guardrails

- keep narrative copy short and factual
- require paper-section linkage for every task
- use deterministic completion rules for MVP
- only let the final report summarize evidence-backed tasks

## Recommended Rollout Order

Implement Tasks `1 -> 5` first to validate the setup stage and structure/task model.

Then implement Tasks `6 -> 8` to create the actual investigation loop.

Then implement Tasks `9 -> 10` to convert the brief into the final case report and validate the end-to-end path.
