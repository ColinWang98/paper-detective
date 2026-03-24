# A/B Modes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Convert the current dual-layer MVP into a playable `A Mode` investigation loop with a separate `B Mode` AI brief path.

**Architecture:** Keep the existing `Next.js + Zustand + Dexie` stack, but expand the case/task domain into a question-centric model. Reuse the current case setup, evidence submission, and brief infrastructure where possible instead of replacing the whole flow at once.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand, Dexie, Jest, Testing Library

---

### Task 1: Expand Task And Evidence Types

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\types\case.types.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\types\index.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\types\case-types.test.ts`

**Step 1: Write the failing test**

Extend the type test to expect new fields on `InvestigationTask` and `EvidenceSubmission`:

- `section`
- `whereToLook`
- `whatToFind`
- `submissionMode`
- `recommendedEvidenceCount`
- `evaluationFocus`
- `score`
- `feedback`
- `submittedAt`
- `sourceSection`
- `userInterpretation`
- `aiTags`
- `clusterId`
- `scoreContribution`

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\types\case-types.test.ts --runInBand
```

Expected: FAIL because new fields and enums are missing.

**Step 3: Write minimal implementation**

Update `case.types.ts`:

- add `QuestionSection`
- add `TaskSubmissionMode`
- extend `InvestigationTask`
- extend `EvidenceSubmission`

Keep old fields that are still needed for compatibility.

**Step 4: Run test to verify it passes**

Run:

```powershell
npm.cmd test -- tests\unit\types\case-types.test.ts --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add types tests\unit\types
git commit -m "feat: expand investigation task and evidence models"
```

### Task 2: Replace Four Static Tasks With Question Map Generation

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\services\caseSetupService.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\app\api\ai\case-setup\route.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\services\caseSetupService.test.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\api\case-setup.test.ts`

**Step 1: Write the failing test**

Add service tests that expect:

- around 10 generated questions
- questions grouped by section
- different submission modes for different question types
- fallback generation still produces question-shaped tasks instead of generic 4-step scaffolds

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\services\caseSetupService.test.ts tests\unit\api\case-setup.test.ts --runInBand
```

Expected: FAIL because service still returns the old 4-task structure.

**Step 3: Write minimal implementation**

In `caseSetupService.ts`:

- replace `DEFAULT_TASKS` with a `DEFAULT_QUESTION_SET`
- generate question items per section
- set `section`, `whereToLook`, `whatToFind`, `submissionMode`, `recommendedEvidenceCount`, and `evaluationFocus`
- keep parse-error fallback behavior

In `route.ts`:

- keep current error handling
- do not change the response shape beyond updated task payloads

**Step 4: Run tests**

Run:

```powershell
npm.cmd test -- tests\unit\services\caseSetupService.test.ts tests\unit\api\case-setup.test.ts --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add services app\api tests\unit\services tests\unit\api
git commit -m "feat: generate section-aware investigation questions"
```

### Task 3: Add Welcome Modal And Tutorial Modal

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\app\page.tsx`
- Create: `D:\zhuomian\paper_key\paper-detective\components\case\WelcomeModal.tsx`
- Create: `D:\zhuomian\paper_key\paper-detective\components\case\TutorialModal.tsx`
- Modify: `D:\zhuomian\paper_key\paper-detective\lib\store.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\app\page-case-setup.test.tsx`

**Step 1: Write the failing test**

Add page tests that expect:

- welcome modal appears after upload before investigation starts
- player name can be entered
- tutorial opens after welcome confirmation
- tutorial can be dismissed to enter normal investigation workflow

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\app\page-case-setup.test.tsx --runInBand
```

Expected: FAIL because welcome/tutorial flow does not exist.

**Step 3: Write minimal implementation**

Add two lightweight modal components and minimal state in `page.tsx`:

- `playerName`
- `showWelcomeModal`
- `showTutorialModal`

Do not add persistence yet unless it is nearly free.

**Step 4: Run tests**

Run:

```powershell
npm.cmd test -- tests\unit\app\page-case-setup.test.tsx --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add app\page.tsx components\case lib\store.ts tests\unit\app
git commit -m "feat: add investigation welcome and tutorial flow"
```

### Task 4: Convert Right Panel Into Notebook Tabs

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\components\DetectiveNotebook.tsx`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\case\CaseSetupPanel.tsx`
- Create: `D:\zhuomian\paper_key\paper-detective\components\case\QuestionsTab.tsx`
- Create: `D:\zhuomian\paper_key\paper-detective\components\case\EvidenceBoxTab.tsx`
- Create: `D:\zhuomian\paper_key\paper-detective\components\case\ProgressTab.tsx`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\components\homeShell.test.tsx`

**Step 1: Write the failing test**

Add tests that expect:

- notebook tabs render
- `Questions` tab shows clickable question list
- `Evidence Box` shows current task evidence only
- `Progress` shows completed count and unlock status

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\components\homeShell.test.tsx --runInBand
```

Expected: FAIL because notebook tabs do not exist.

**Step 3: Write minimal implementation**

Refactor the right panel:

- add local tab state
- route existing investigation data into separate tab panels
- keep styling consistent with the current notebook aesthetic

**Step 4: Run tests**

Run:

```powershell
npm.cmd test -- tests\unit\components\homeShell.test.tsx --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add components tests\unit\components
git commit -m "feat: add notebook tabs for questions evidence and progress"
```

### Task 5: Make Questions Clickable And Bind Evidence To The Current Question

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\lib\store.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\DetectiveNotebook.tsx`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\case\EvidenceSubmitModal.tsx`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\integration\case-investigation-happy-path.test.tsx`

**Step 1: Write the failing test**

Add an integration test that verifies:

- clicking a question marks it as current
- evidence submission attaches to that question
- `Evidence Box` reflects only the current question's evidence

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\integration\case-investigation-happy-path.test.tsx --runInBand
```

Expected: FAIL because current-question behavior is incomplete.

**Step 3: Write minimal implementation**

In `store.ts`:

- add `currentQuestionId`
- add setter for active question

In notebook/evidence modal:

- default evidence submission to the active question
- show task-specific guidance in the modal

**Step 4: Run test**

Run:

```powershell
npm.cmd test -- tests\integration\case-investigation-happy-path.test.tsx --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add lib\store.ts components tests\integration
git commit -m "feat: bind evidence workflow to active investigation question"
```

### Task 6: Add Question Submission And Scoring

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\services\aiService.ts`
- Create: `D:\zhuomian\paper_key\paper-detective\services\questionEvaluationService.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\app\api\ai\case-setup\route.ts`
- Create: `D:\zhuomian\paper_key\paper-detective\app\api\ai\question-evaluate\route.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\case\EvidenceBoxTab.tsx`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\services\questionEvaluationService.test.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\api\question-evaluate.test.ts`

**Step 1: Write the failing test**

Add tests for:

- `evidence_only` submission scoring
- `evidence_plus_optional_judgment` submission scoring
- returned payload contains score, feedback, and missing-evidence hints

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\services\questionEvaluationService.test.ts tests\unit\api\question-evaluate.test.ts --runInBand
```

Expected: FAIL because the scoring service and route do not exist.

**Step 3: Write minimal implementation**

Add a dedicated evaluation service and route.

Keep the evaluation payload small:

- score
- feedback
- missingEvidence

Do not implement total-case scoring yet in this task.

**Step 4: Run tests**

Run:

```powershell
npm.cmd test -- tests\unit\services\questionEvaluationService.test.ts tests\unit\api\question-evaluate.test.ts --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add services app\api tests\unit\services tests\unit\api
git commit -m "feat: score investigation question submissions"
```

### Task 7: Add Final Case Evaluation Threshold

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\lib\investigationRules.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\hooks\useIntelligenceBrief.ts`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\case\ProgressTab.tsx`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\hooks\useIntelligenceBrief.test.ts`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\integration\case-investigation-happy-path.test.tsx`

**Step 1: Write the failing test**

Add tests that expect:

- final case evaluation stays locked before threshold
- unlock occurs after the configured number of completed questions
- progress tab shows completed count and readiness state

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\hooks\useIntelligenceBrief.test.ts tests\integration\case-investigation-happy-path.test.tsx --runInBand
```

Expected: FAIL because unlock logic still assumes the 4-task core path.

**Step 3: Write minimal implementation**

Update unlock logic to depend on completed-question threshold rather than only the original 4 task chain.

**Step 4: Run tests**

Run:

```powershell
npm.cmd test -- tests\unit\hooks\useIntelligenceBrief.test.ts tests\integration\case-investigation-happy-path.test.tsx --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add lib hooks components tests
git commit -m "feat: unlock final case evaluation after question threshold"
```

### Task 8: Split B Mode Into Direct AI Brief

**Files:**
- Modify: `D:\zhuomian\paper_key\paper-detective\app\page.tsx`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\Header.tsx`
- Modify: `D:\zhuomian\paper_key\paper-detective\components\brief\IntelligenceBriefViewer.tsx`
- Test: `D:\zhuomian\paper_key\paper-detective\tests\unit\app\page.test.tsx`

**Step 1: Write the failing test**

Add tests that expect:

- A mode enters the investigation flow
- B mode directly opens AI brief flow
- B mode does not require task scoring state to render basic AI brief generation

**Step 2: Run test to verify it fails**

Run:

```powershell
npm.cmd test -- tests\unit\app\page.test.tsx --runInBand
```

Expected: FAIL because B mode still depends too much on investigation state.

**Step 3: Write minimal implementation**

Decouple B mode from the question notebook path.

Keep shared PDF upload and paper context, but allow B mode to directly run brief generation.

**Step 4: Run test**

Run:

```powershell
npm.cmd test -- tests\unit\app\page.test.tsx --runInBand
```

Expected: PASS

**Step 5: Commit**

```powershell
git add app components tests\unit\app
git commit -m "feat: split direct ai brief mode from investigation mode"
```

### Task 9: Verification Sweep

**Files:**
- Modify if needed: `D:\zhuomian\paper_key\paper-detective\CURRENT_STATUS.md`
- Modify if needed: `D:\zhuomian\paper_key\paper-detective\docs\plans\2026-03-19-ab-modes-investigation-and-brief.md`

**Step 1: Run focused verification**

Run:

```powershell
npm.cmd run type-check
npm.cmd run type-check:tests
npm.cmd test -- --runInBand
```

Expected:

- all commands pass

**Step 2: Manual validation**

Check one full flow:

1. upload PDF
2. welcome modal
3. tutorial modal
4. clickable questions
5. evidence submission
6. per-question score
7. threshold unlock
8. B mode AI brief

**Step 3: Update docs**

Record:

- what is implemented
- what remains phase 2
- whether cluster view is still deferred

**Step 4: Commit**

```powershell
git add CURRENT_STATUS.md docs\plans
git commit -m "docs: update status for ab modes implementation"
```

