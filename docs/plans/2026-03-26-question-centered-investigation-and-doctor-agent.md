# Question-Centered Investigation And Doctor Agent Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Rebuild the investigation workspace around structured question nodes, with evidence attached to questions and a persistent doctor agent that reacts to investigation progress.

**Architecture:** Replace the current evidence-first interaction loop with a question-first model. Questions become the primary graph nodes, evidence becomes an attachment on a question, and a doctor panel derives dynamic diagnostic state from question completion, evidence sufficiency, and graph consistency.

**Tech Stack:** Next.js 15, React 19, TypeScript, Zustand, Dexie, React Flow, Jest, Testing Library

---

## Product Rewrite Summary

The current workspace treats evidence as the primary working object. That makes the user organize fragments before they understand what question they are trying to answer.

The new architecture must invert that:

- AI generates structured `QuestionNode`s first
- users select a question before collecting evidence
- every submitted evidence item is attached to one question
- the graph visualizes question nodes and question relations
- the doctor panel reflects diagnostic state across the question graph

This is not an additive enhancement. It is a workflow rewrite.

## Target Domain Model

### QuestionNode

- `id`
- `paperId`
- `title`
- `prompt`
- `type`: `claim | evidence | method | limitation`
- `status`: `open | partial | supported | conflicted | limited`
- `parentQuestionId`
- `dependsOnQuestionIds`
- `assignedEvidenceIds`
- `position`
- `score`
- `feedback`

### QuestionRelation

- `id`
- `paperId`
- `sourceQuestionId`
- `targetQuestionId`
- `relationType`: `support | contrast | method-for | limitation-of`
- `note`
- `createdAt`

### QuestionEvidenceAttachment

Existing `EvidenceSubmission` should survive, but conceptually becomes:

- evidence attached to a question
- not a first-class graph node

Required persisted fields:

- `id`
- `paperId`
- `questionId`
- `highlightId`
- `evidenceType`
- `note`
- `createdAt`

### DoctorState

- `paperId`
- `activeQuestionId`
- `mode`: `skeptical | checking | partial-confirmation | strong-support | conflict-found | insufficient-evidence | limitation-found | diagnosis-complete`
- `message`
- `updatedAt`

## UX Rewrite

### Right Notebook Layout

Keep the notebook shell, but change the structure:

1. `Doctor Panel` fixed at the top
2. tabs below:
   - `Questions`
   - `Notes`
   - `Graph`
   - `Progress`

### Questions Tab

This becomes the primary investigation entry.

Responsibilities:

- show structured question tree
- show question type badges
- show completion state
- show dependencies
- allow selecting the active question

### Notes Tab

This becomes question-specific.

Responsibilities:

- show active question title and prompt
- show evidence attached to this question
- allow submitting more evidence to this question
- allow optional user judgment / answer text
- show AI score and feedback for this question

Do not show global evidence collections here.

### Graph Tab

This becomes question-node graph, not evidence-node graph.

Responsibilities:

- render `QuestionNode` bubbles in React Flow
- render `QuestionRelation` edges
- support dragging question nodes
- support creating question-to-question logical relations
- show question status and evidence count on each bubble

Evidence content should not become graph nodes.

### Doctor Panel

This is a persistent diagnostic agent at the top of the notebook.

Responsibilities:

- summarize current diagnosis state
- point to the most important unresolved question
- react to:
  - evidence attached to questions
  - question scoring
  - graph conflicts
  - detected limitations

The doctor is not a chat bot. It is a derived diagnosis surface with stateful messages.

## AI Generation Rewrite

### Case Setup

Case setup should no longer optimize for a generic task list.

It must generate:

- `storyBackground`
- `questionNodes`
- `questionDependencies`
- `initialDoctorState`

Question generation must include hierarchy:

- one or more claim questions
- evidence questions under claim questions
- method questions tied to evidence generation
- limitation questions tied to claim or method questions

### Scoring

Question evaluation must operate on:

- active question
- its attached evidence
- optional user answer

Verdict must update:

- question status
- question score
- doctor state

## Persistence Rewrite

### Store

Refactor store coordination to make questions first-class state.

Needed additions:

- `questionNodes`
- `questionRelations`
- `doctorState`
- `activeQuestionId`

Needed behavior changes:

- `submitEvidence` must require `questionId`
- `saveDeductionGraph` must save question graph, not evidence graph
- graph serialization must persist question positions and relation metadata

### Database

Add or repurpose tables for:

- `questionNodes`
- `questionRelations`
- `doctorStates`
- optional `interactionLogs`

Keep evidence attachments as separate persisted records.

## Migration Strategy

Do not attempt a big-bang rewrite.

Implement in this order:

### Task 1: Introduce Question-Centered Types

**Files:**
- Modify: `types/case.types.ts`
- Modify: `types/index.ts`
- Test: `tests/unit/types/case-types.test.ts`

Steps:

1. Write failing tests for `QuestionNode`, `QuestionRelation`, and `DoctorState`.
2. Run tests and confirm failure.
3. Add minimal type definitions and exports.
4. Run tests and confirm pass.
5. Commit.

### Task 2: Persist Question-Centered State

**Files:**
- Modify: `lib/db.ts`
- Modify: `lib/store.ts`
- Test: `tests/unit/lib/db-case-setup.test.ts`
- Test: `tests/unit/lib/question-graph-store.test.ts`

Steps:

1. Write failing persistence tests for question nodes, relations, and doctor state.
2. Run tests and confirm failure.
3. Add DB schema and minimal store actions.
4. Run tests and confirm pass.
5. Commit.

### Task 3: Rewrite Case Setup Output

**Files:**
- Modify: `services/caseSetupService.ts`
- Modify: `app/api/ai/case-setup/route.ts`
- Test: `tests/unit/services/caseSetupService.test.ts`
- Test: `tests/unit/api/case-setup.test.ts`

Steps:

1. Write failing tests asserting question-centered output.
2. Run tests and confirm failure.
3. Rewrite case-setup normalization to produce question nodes + doctor state.
4. Run tests and confirm pass.
5. Commit.

### Task 4: Add Doctor Panel

**Files:**
- Create: `components/case/DoctorPanel.tsx`
- Modify: `components/DetectiveNotebook.tsx`
- Test: `tests/unit/components/case/doctor-panel.test.tsx`
- Test: `tests/unit/components/homeShell.test.tsx`

Steps:

1. Write failing tests for doctor panel rendering and status changes.
2. Run tests and confirm failure.
3. Implement fixed top notebook doctor panel.
4. Run tests and confirm pass.
5. Commit.

### Task 5: Rewrite Questions Tab

**Files:**
- Modify: `components/case/QuestionsTab.tsx`
- Test: `tests/unit/components/case/questions-tab.test.tsx`

Steps:

1. Write failing tests for hierarchical question rendering and selection.
2. Run tests and confirm failure.
3. Implement question-centered list/tree UI.
4. Run tests and confirm pass.
5. Commit.

### Task 6: Rewrite Notes Tab Around Active Question

**Files:**
- Modify: `components/case/NotesTab.tsx`
- Modify: `components/case/EvidenceSubmitModal.tsx`
- Test: `tests/unit/components/case/notes-tab.test.tsx`
- Test: `tests/integration/evidence-submission-flow.test.tsx`

Steps:

1. Write failing tests asserting evidence must attach to active question.
2. Run tests and confirm failure.
3. Rewrite notes tab and evidence submit flow.
4. Run tests and confirm pass.
5. Commit.

### Task 7: Rewrite Graph Tab Around Questions

**Files:**
- Modify: `components/case/GraphTab.tsx`
- Test: `tests/unit/components/case/graph-tab.test.tsx`
- Test: `tests/unit/components/case/graph-tab.loop.test.tsx`

Steps:

1. Write failing tests asserting graph nodes are questions, not evidence ids.
2. Run tests and confirm failure.
3. Rewrite React Flow workspace around question bubbles and question relations.
4. Run tests and confirm pass.
5. Commit.

### Task 8: Add Doctor State Updates From User Actions

**Files:**
- Modify: `lib/store.ts`
- Create: `services/doctorStateService.ts`
- Test: `tests/unit/services/doctorStateService.test.ts`
- Test: `tests/integration/question-diagnosis-flow.test.tsx`

Steps:

1. Write failing tests for doctor mode transitions.
2. Run tests and confirm failure.
3. Implement doctor state derivation from question/evidence/graph changes.
4. Run tests and confirm pass.
5. Commit.

### Task 9: Verification And Cleanup

**Files:**
- Modify: `CURRENT_STATUS.md`
- Modify: `README.md`

Steps:

1. Run targeted tests for the rewritten workspace.
2. Run full type checks.
3. Run full Jest.
4. Run production build.
5. Update docs to describe the question-centered system.
6. Commit.

## Testing Requirements

At minimum, verify:

- `npm.cmd run type-check`
- `npm.cmd run type-check:tests`
- `npm.cmd test -- --runInBand`
- `npm.cmd run build`

Also keep targeted regression coverage for:

- case setup
- notes evidence attachment
- graph hydration loops
- doctor panel state updates

## Non-Goals For This Rewrite

Do not mix these into the same change set:

- OCR
- region-based evidence capture
- advanced graph physics layout
- animated doctor character system
- multiplayer or collaboration

The rewrite goal is structural correctness, not surface polish.
