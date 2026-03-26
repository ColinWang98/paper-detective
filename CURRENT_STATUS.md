# Current Project Status

Verified on `2026-03-26`.

## Source Of Truth

- Active application root: `paper-detective/`
- Current app version: `0.2.0`
- Active runtime: `Next.js 15`, `React 19`, `TypeScript 5`

## Current Phase

The project has moved beyond MVP-only stabilization. The current state is:

- `A Mode` detective investigation flow implemented
- `B Mode` direct AI brief flow implemented
- Notes and Graph workspaces implemented
- engineering baseline restored and verified

This is now a `question-centered investigation redesign and doctor-agent planning` stage.

## Implemented Product Flow

- PDF upload enters `setup`
- AI generates a `Case Setup` with structure nodes and a clickable question map
- onboarding now includes:
  - welcome modal with player name
  - tutorial modal
- `A Mode` uses a notebook-style right panel with:
  - `Questions`
  - `Notes`
  - `Graph`
  - `Progress`
- a doctor panel redesign is planned as the next structural rewrite
- evidence submission binds to the active question
- each question can be submitted for AI scoring and feedback
- submitted evidence can be clustered and tagged
- deduction graph nodes and edges are persisted per task
- the final case report unlocks after the completed-question threshold is reached
- `B Mode` is now a direct AI brief flow and no longer depends on investigation progress

## Verified Baseline

- `npm run type-check` passes
- `npm run type-check:tests` passes
- `npm run build` passes
- `npm test -- --runInBand` passes

Latest full Jest result:

- `47/47` suites passed
- `328/328` tests passed

## Notes On Verification

- Full Jest still prints two expected `console.error` lines from the case-setup missing-key failure-path tests.
- Next.js build succeeds; the remaining webpack cache warnings shown during build are non-blocking cache restore warnings, not build failures.

## Current Risks

- The current workspace is still evidence-centered in several important places; the next rewrite must move the system to question-centered interaction.
- Bubble linking and graph ergonomics still need refinement before the graph is a strong reasoning surface.
- PDF zoom, focus, and evidence-capture ergonomics have improved but still need deeper guided-reading work.
- AI-generated investigation questions are still not consistently paper-specific enough.
- PDF evidence capture still depends on text-layer quality; OCR and region capture do not exist yet.
- Manual gameplay validation is still needed across multiple real papers.
- Some repository docs still describe older milestones and should not be treated as current.

## Next Recommended Phase

1. Execute the question-centered rewrite:
   question nodes, question relations, doctor panel, question-attached evidence
2. Rebuild Graph as a question graph rather than an evidence graph
3. Improve task generation quality so investigation prompts are tightly grounded in each paper
4. Improve PDF evidence capture with region-based selection and OCR fallback
5. Update remaining historical docs to match the current A/B mode architecture

Formal plans:

- `docs/plans/2026-03-26-phase-4-guided-reading-evidence-graph-and-feedback.md`
- `docs/plans/2026-03-26-question-centered-investigation-and-doctor-agent.md`
