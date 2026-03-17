# Current Project Status

Verified on `2026-03-17`.

## Source Of Truth

- Active application root: `paper-detective/`
- Current app version: `0.2.0`
- Active runtime: `Next.js 15`, `React 19`, `TypeScript 5`
- Primary architecture sources:
  - `package.json`
  - `app/`
  - `components/`
  - `lib/`
  - `services/`

## Current Phase

The dual-layer investigation MVP is now implemented and verified at the focused-suite level.

Current priority order:

1. Keep `npm run type-check`, `npm run type-check:tests`, and `npm run build` green
2. Expand focused integration coverage around upload, setup generation, evidence submission, and report unlock
3. Tighten the investigation layout so structure tree, task board, and report flow feel cohesive in the live UI
4. Run a broader regression pass before release packaging

## Delivered Direction

The app now supports the planned dual-layer investigation loop:

- PDF upload enters a `setup` phase and triggers `Case Setup` generation
- case framing, structure nodes, and 4 deterministic investigation tasks persist by `paperId`
- highlights can be submitted as task evidence
- task completion unlocks downstream tasks
- the final report stays locked until all 4 core tasks complete, then the flow enters `report`

## Current Baseline

- `npm run type-check` passes
- `npm run type-check:tests` passes
- `npm run build` passes
- Focused Jest verification passes for case setup, evidence submission, final report locking, and the browserless investigation happy path

## Remaining Risks

- Full Jest suite has not been run end-to-end in this session.
- The live investigation layout still needs broader manual UX review, especially around structure-tree visibility and report-mode transitions.
- Historical docs in the repository still describe older milestones and should not be treated as the current release state.

## Release Gate

The current MVP snapshot should not be treated as release-ready until all of the following are true:

- `npm run type-check` passes
- `npm run type-check:tests` passes
- `npm run build` passes
- focused Jest suites pass with `--runInBand`
- one manual upload -> setup -> evidence -> report walkthrough is recorded
