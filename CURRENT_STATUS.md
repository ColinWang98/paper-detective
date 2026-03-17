# Current Project Status

Verified on `2026-03-15`.

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

The project is in a stabilization and delivery-hardening phase, not an MVP bootstrap phase.

Current priority order:

1. Restore `npm run type-check`
2. Repair broken export tests
3. Verify core highlight/notebook/undo flows
4. Verify AI service and cache flows
5. Resume feature expansion only after the baseline is green

## Next Product Direction

With the stability baseline restored, the next major feature direction is a product-logic redesign rather than more generic AI helpers.

Planned direction:

- move from `reader + notebook + summary` to a dual-layer investigation flow
- let AI first generate a paper structure map and a suspense-light case setup
- require user highlights to be submitted as task evidence
- unlock the final report only after the core investigation tasks are completed

Reference plan:

- `docs/plans/2026-03-17-dual-layer-investigation-flow.md`

## Current Baseline

- `npm run type-check` passes
- `npm run type-check:tests` passes
- Focused Jest verification passes for API export, API key management, intelligence brief API, and intelligence brief service flows

## Remaining Risks

- Historical docs in the repository describe older milestones and should not be treated as the final release state.
- The workspace root still contains older scaffolding; the active product app is the `paper-detective/` subdirectory.
- Full test suite has not yet been run end-to-end in this session.

## Release Gate

The next release candidate should not be considered ready until all of the following are true:

- `npm run type-check` passes
- `npm run type-check:tests` passes
- focused Jest suites pass with `--runInBand`
- docs match the active Next.js app structure
- one manual happy-path verification is recorded
