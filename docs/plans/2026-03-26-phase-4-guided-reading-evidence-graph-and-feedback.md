# Phase 4: Guided Reading, Evidence Graph, and Measurable Feedback

Verified and drafted on `2026-03-26`.

## Goal

Upgrade the current investigation workspace from a usable MVP into a controlled reading-and-reasoning system that supports:

- guided attention during PDF reading
- automatic evidence-to-bubble extraction
- stronger graph-based relationship modeling
- LLM-based evidence correctness feedback
- complete behavioral logging for later research analysis

This phase is explicitly about making the system experimentally useful, not just feature-rich.

## Product Scope

### 1. Guided Reading Layer

The PDF reader should no longer expose all content with equal weight.

Desired behavior:

- the full page is shown in a reduced-attention state by default
- the area under mouse hover or keyboard focus becomes clearer
- already submitted evidence remains visually emphasized
- emphasized evidence preserves local context rather than isolating only the highlighted sentence

Design intent:

- reduce cognitive overload
- make the user feel they are uncovering clues rather than scanning a flat document
- support more controlled reading behavior for research capture

### 2. Evidence Extraction Pipeline

Evidence submission should become a first-class modeling event.

Desired behavior:

- user selects text in the PDF
- user submits it as evidence
- the system creates a durable evidence record
- the system automatically creates a matching bubble node in the graph

Required node data:

- `id`
- `paperId`
- `taskId`
- `submissionId`
- `text`
- `summary`
- `pageNumber`
- `sourceRange`
- `position`
- `evidenceType`
- `tags`

Design intent:

- remove the gap between selection and graph modeling
- make every submitted clue immediately available for reasoning work

### 3. Relationship Modeling

The graph should become a proper evidence modeling interface, not just a compact node board.

Desired behavior:

- evidence bubbles are draggable
- when two bubbles enter a connection radius, the system creates a draft edge automatically
- users can confirm or retype the edge relationship
- edge style reflects semantics

Target relation types:

- `support`
- `contrast`
- `method`
- `limitation`

Target visual language:

- `support`: solid line
- `contrast`: dashed line
- `method`: directional arrow
- `limitation`: special marked line

Design intent:

- represent the paper's argument structure visually
- let users organize not only evidence items, but evidence logic

### 4. Measurable Feedback

The system must judge evidence quality in a way that can be studied later.

Desired behavior:

- for the current claim/task, the system evaluates whether selected evidence is:
  - `correct`
  - `partial`
  - `incorrect`
- the system returns a short explanation
- the system stores user behavior and graph state for analysis

Required persisted data:

- `nodes + edges` JSON per task
- evidence selection history
- drag and position updates
- edge creation, deletion, and relation changes
- verdict history and feedback text

Design intent:

- support experimental measurement
- distinguish "user built a graph" from "user built a justified graph"

## Execution Order

### Track A: Guided Reading

Implement first because it changes how every other action is perceived.

Tasks:

1. Add a reading-focus overlay layer to the PDF reader.
2. Default non-focused regions to reduced contrast or softened rendering.
3. Make hovered/focused regions clearer with a smooth transition.
4. Keep submitted evidence visibly annotated with stronger clue styling.
5. Preserve a small amount of surrounding text context around evidence.

Definition of done:

- focus effect works on real PDF pages
- submitted evidence remains readable and visibly distinct
- the effect does not break selection or highlight coordinates

### Track B: Evidence-to-Bubble Pipeline

Implement second because graph quality depends on reliable evidence objects.

Tasks:

1. Make evidence submission automatically create or update a graph node.
2. Define a stable mapping from evidence submission to graph node id.
3. Store source metadata needed for later relocation and evaluation.
4. Keep graph node summaries compact while preserving original source text in details.

Definition of done:

- submitted evidence appears in graph without manual duplication
- graph restoration after reload preserves node identity

### Track C: Auto-Link Graph

Implement third because it upgrades graph use from manual record-keeping to reasoning behavior.

Tasks:

1. Add proximity detection for node-to-node auto-link creation.
2. Represent auto-created edges as draft edges first.
3. Allow user confirmation or relation retyping.
4. Apply visual differentiation for relation types.
5. Save graph as `nodes + edges` JSON per task.

Definition of done:

- users can create edges by proximity or explicit action
- saved graph restores nodes, edges, and relation types correctly

### Track D: LLM Evidence Feedback

Implement fourth because it depends on stable tasks, evidence records, and graph context.

Tasks:

1. Add a service that evaluates evidence against the active claim/task.
2. Return a structured verdict:
   - `verdict`
   - `confidence`
   - `shortReason`
3. Store feedback alongside the task or submission record.
4. Keep all interaction logs required for later analysis.

Definition of done:

- the system can explain whether evidence meaningfully supports the current claim
- verdicts are persisted and traceable

## Technical Plan

### Frontend

- extend `RealPDFViewer` for focus-layer rendering
- promote evidence submission to graph-node creation
- upgrade `GraphTab` into a graph workspace with auto-link behavior
- keep graph nodes compact and move details into side panels

### State and Persistence

- continue using the existing store as the coordination layer
- persist graph state as `nodes + edges` JSON
- add structured interaction logs rather than inferring behavior from current state only

### AI Services

- keep provider switching intact
- add a dedicated evaluation service for evidence correctness
- do not couple evaluation to case-setup generation

## Risks

- reading-focus effects may interfere with text selection if implemented at the wrong DOM layer
- auto-link thresholds can create noisy graphs if proximity rules are too loose
- graph persistence must avoid the render/save feedback loops already seen in React Flow integration
- LLM feedback can become generic unless it is tied tightly to the active task and selected evidence

## Recommended MVP For This Phase

Do not build the entire phase at once.

The smallest credible Phase 4 slice is:

1. guided reading overlay
2. evidence submission auto-creates graph nodes
3. proximity-based draft edges
4. explicit relation typing
5. evidence verdict API with `correct / partial / incorrect`

Behavior logging can begin in parallel but should not block the first usable iteration.

## Acceptance Criteria

Phase 4 should be considered complete only when all of the following are true:

- reading guidance works without breaking PDF selection
- submitted evidence appears automatically as graph nodes
- users can create and edit relationship edges reliably
- relationship styles communicate semantics clearly
- the system can return and persist structured evidence verdicts
- interaction logs are sufficient for later experimental analysis
