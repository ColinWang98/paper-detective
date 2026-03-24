# Current Project Status

Verified on `2026-03-20`.

## Source Of Truth

- Active application root: `paper-detective/`
- Current app version: `0.2.0`
- Active runtime: `Next.js 15`, `React 19`, `TypeScript 5`

## Current Phase

The project is no longer in pre-implementation design. The current state is:

- `A Mode` detective investigation MVP implemented
- `B Mode` direct AI brief flow implemented
- engineering baseline restored and verified

This is now a `MVP verification and refinement` phase, not a planning-only phase.

## Implemented Product Flow

- PDF upload enters `setup`
- AI generates a `Case Setup` with structure nodes and a clickable question map
- onboarding now includes:
  - welcome modal with player name
  - tutorial modal
- `A Mode` uses a notebook-style right panel with:
  - `Questions`
  - `Evidence Box`
  - `Progress`
- evidence submission binds to the active question
- each question can be submitted for AI scoring and feedback
- the final case report unlocks after the completed-question threshold is reached
- `B Mode` is now a direct AI brief flow and no longer depends on investigation progress

## Verified Baseline

- `npm run type-check` passes
- `npm run type-check:tests` passes
- `npm run build` passes
- `npm test -- --runInBand` passes

Latest full Jest result:

- `41/41` suites passed
- `295/295` tests passed

## Notes On Verification

- Full Jest still prints two expected `console.error` lines from the case-setup missing-key failure-path tests.
- Next.js build succeeds; the remaining webpack cache warnings shown during build are non-blocking cache restore warnings, not build failures.

## Current Risks

- AI-generated investigation questions are still not consistently paper-specific enough; fallback questions are usable but not strong product output.
- PDF evidence capture still depends on text-layer quality; manual cleanup helps, but OCR/region capture does not exist yet.
- Manual gameplay validation is still needed across multiple real papers.
- Some repository docs still describe older milestones and should not be treated as current.

## Next Recommended Phase

1. Manual acceptance run:
   upload PDF -> complete several questions -> unlock final report -> compare against B mode brief
2. Improve task generation quality so investigation prompts are tightly grounded in each paper
3. Improve PDF evidence capture with region-based selection and OCR fallback
4. Update remaining historical docs to match the current A/B mode architecture
