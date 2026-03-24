# A/B Modes Reconstruction Plan

Verified on `2026-03-19`.

## Goal

Restructure the product into two explicit modes:

- `A Mode: Detective Investigation`
- `B Mode: AI Brief`

The current dual-layer MVP proved the basic loop, but two gaps are now clear:

1. Investigation tasks are not specific enough to feel tied to the uploaded paper.
2. PDF evidence capture depends too heavily on raw text selection and breaks down on noisy text layers.

This phase shifts the product from a generic AI-assisted paper tool into a playable investigation workflow with a separate fast-reading lane.

## Product Direction

### A Mode: Detective Investigation

This is the primary game-like flow.

The user uploads a paper, enters a short welcome modal, sets a player name, and receives a story frame:

- the user is an academic detective
- each paper is a case
- the job is to verify claims, not passively consume summaries

After that, a short onboarding modal explains:

- how to collect evidence
- how to submit evidence to a task
- how scoring works

The main layout stays:

- `left`: PDF reader
- `right`: a notebook with tabs

The notebook tabs for MVP should be:

- `Questions`
- `Evidence Box`
- `Progress`

`Clusters` should be treated as phase 2, not MVP-critical.

### B Mode: AI Brief

This remains a non-gameplay path.

It should directly analyze the paper and generate:

- key points
- paper structure
- method summary
- evidence summary
- limitation summary

B mode should not depend on the task-scoring system. It is the fast lane for users who want direct AI interpretation.

## A Mode UX Flow

### Entry

1. Upload PDF
2. Show `Welcome Modal`
3. Collect player name
4. Show short story frame
5. Show `Tutorial Modal`
6. Enter investigation workspace

### Investigation Workspace

The right-side notebook becomes the center of the investigation loop.

#### Questions Tab

The task list is now a clickable question map rather than a static setup summary.

Questions should be:

- grouped by section such as `Intro`, `Related Work`, `Method`, `Result`, `Discussion`
- individually clickable
- explicit about:
  - where to look
  - what to collect
  - what counts as completion

Question count target for MVP:

- around `10` questions per paper

Example question types:

- identify the exact core claim
- identify the closest prior method
- isolate what is truly new
- find the strongest supporting result
- find the biggest limitation

### Evidence Box Tab

This tab shows evidence for the currently selected question.

It must support:

- list of submitted evidence items
- evidence type labels
- optional player interpretation
- submission mode display

Submission modes:

- `evidence_only`
- `evidence_plus_optional_judgment`

Do not require free-text judgment for every question. Some question types, especially related-work tasks, should allow pure evidence submission.

### Progress Tab

This tab shows:

- completed questions
- current score by question
- total completed count
- whether final case evaluation is unlocked

The report should unlock after the user has completed at least `10` questions or whatever final threshold is selected in implementation.

## Task Model Changes

`InvestigationTask` should evolve from a generic four-step object into a paper-specific question model.

Add fields like:

- `section`
- `whereToLook`
- `whatToFind`
- `submissionMode`
- `recommendedEvidenceCount`
- `evaluationFocus`
- `score`
- `feedback`
- `submittedAt`

Recommended submission mode enum:

- `evidence_only`
- `evidence_plus_optional_judgment`

Keep `required_judgment` out of the first implementation.

## Evidence Model Changes

`EvidenceSubmission` should support more than just task linkage.

Add or prepare for:

- `sourceSection`
- `userInterpretation`
- `aiTags`
- `clusterId`
- `scoreContribution`

This allows later support for clustering, scoring, and richer evaluation without redesigning the store again.

## AI Requirements

### Question Generation

Replace the current generic fallback-style tasks with paper-specific question generation.

AI output should generate:

- section-aware questions
- explicit evidence requirements
- section targeting
- evaluation focus

Questions should not be phrased as generic summaries. They should read like investigation prompts.

Bad:

- "Check whether the results hold up"

Better:

- "Find the strongest experimental result that directly supports the paper's main claim"

### Question Evaluation

When the user submits a question:

- AI evaluates evidence coverage
- AI optionally evaluates the user's judgment text
- AI returns:
  - score
  - brief feedback
  - missing evidence hints

### Final Case Evaluation

After enough questions are completed:

- AI returns total score
- final verdict
- strengths of the investigation
- missing angles

## PDF Evidence Capture

The current PDF UX should stop assuming native text selection is reliable.

MVP improvements:

- limit selection capture to PDF text-layer elements
- show editable extracted text before saving
- let the user correct noisy extraction manually

Next phase:

- add region-based capture
- optionally support OCR fallback

This matters because many academic PDFs have poor text-layer fidelity, especially in double-column layouts.

## Bubble/Cluster View

This should be deferred to phase 2.

Desired behavior:

- each evidence item can become a bubble
- user can manually drag evidence into groups
- AI can suggest clustering
- cluster labels can represent:
  - supports claim
  - weakens claim
  - prior work overlap
  - unresolved question

This is valuable, but it should not block the first playable scoring loop.

## MVP Scope

### Must Build First

1. Welcome modal with player name
2. Tutorial modal
3. Question-map generation with around 10 questions
4. Notebook tabs:
   - Questions
   - Evidence Box
   - Progress
5. Question submission with optional judgment
6. Per-question scoring
7. Final case score after threshold completion
8. B-mode direct AI brief

### Defer

- Bubble/cluster visualization
- AI-assisted clustering
- OCR fallback
- complex task branching
- multiplayer or persistent player identity

## Engineering Sequence

### Phase 1

- update task and evidence data models
- generate section-aware question map
- replace static setup-task display with clickable question list

### Phase 2

- build notebook tabs
- support current-question evidence box
- support optional judgment submission

### Phase 3

- add question scoring and feedback
- add progress tracking and unlock rules
- add final case evaluation

### Phase 4

- split B mode cleanly from A mode
- polish UX copy
- run manual playthrough validation

## Success Criteria

This phase is successful when:

- uploaded papers generate paper-specific questions, not generic task scaffolds
- users can understand what to do from the question card alone
- evidence can be submitted even when PDF text extraction is imperfect
- a user can complete enough questions to receive a final case score
- B mode remains usable as a quick AI reading mode

## Immediate Next Step

Implement the first structural slice:

1. expand the task model
2. replace the current 4-task setup with a clickable question map
3. add the welcome/tutorial entry flow

