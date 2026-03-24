# Paper Detective

Paper Detective turns paper reading into an investigation workflow.

Instead of only summarizing a PDF, the app lets a player-researcher:

- upload a paper
- generate an AI-backed case setup
- investigate through structured questions
- submit evidence from highlights
- organize evidence in notes and clusters
- build a deduction graph between evidence bubbles
- switch to a direct AI brief mode when fast reading is enough

## Current Product Shape

### A Mode: Investigation

The main mode is a detective workflow:

1. Upload PDF
2. Generate `Case Setup`
3. Review the paper structure and investigation questions
4. Highlight evidence from the PDF
5. Submit evidence to the active question
6. Organize submitted evidence inside `Notes`
7. Build relations between evidence inside `Graph`
8. Submit a question for AI scoring and feedback
9. Unlock the final report after enough questions are completed

### B Mode: Direct Brief

This mode skips the game layer and generates a direct AI brief for the paper.

## Core UI

The right-side notebook currently contains:

- `Questions`
- `Notes`
- `Graph`
- `Progress`

### Notes

`Notes` merges the earlier evidence box and cluster workflow into one workspace:

- current question evidence
- bubble-style evidence organization
- manual tags
- AI auto-cluster support
- question submission and scoring
- full evidence archive

### Graph

`Graph` is now built on `React Flow`.

- each submitted evidence item becomes a draggable evidence bubble
- bubbles are persisted as `nodes`
- links are persisted as `edges`
- relation types currently include:
  - `support`
  - `contrast`
  - `method`
  - `limitation`

The graph is stored as lightweight `nodes + edges` JSON for each question.

## AI Providers

The project currently supports switching providers from the API key modal:

- `DeepSeek` (default)
- `BigModel`
- `OpenRouter`

The active provider/model is shared across investigation tasks, graph-related AI helpers, and direct brief generation.

## Tech Stack

- `Next.js 15`
- `React 19`
- `TypeScript 5`
- `Tailwind CSS`
- `Zustand`
- `Dexie / IndexedDB`
- `react-pdf`
- `@xyflow/react`
- `@dnd-kit`

## Local Development

### Install

```bash
npm install
```

### Run dev server

```bash
npm run dev
```

### Build production bundle

```bash
npm run build
npm run start
```

## Verification Commands

```bash
npm run type-check
npm run type-check:tests
npm test -- --runInBand
npm run build
```

## Current Status

The repository is no longer in a planning-only phase.

Current state:

- A/B mode architecture implemented
- investigation loop implemented
- notes workspace implemented
- React Flow graph implemented
- provider switching implemented
- type-check green
- test baseline green
- build green

See also:

- [CURRENT_STATUS.md](D:\zhuomian\paper_key\paper-detective\CURRENT_STATUS.md)
- [2026-03-19-ab-modes-implementation-plan.md](D:\zhuomian\paper_key\paper-detective\docs\plans\2026-03-19-ab-modes-implementation-plan.md)
- [2026-03-21-phase-3-deduction-graph-and-investigation-depth.md](D:\zhuomian\paper_key\paper-detective\docs\plans\2026-03-21-phase-3-deduction-graph-and-investigation-depth.md)

## Repository Notes

Some older historical files still describe earlier MVP milestones. Treat `CURRENT_STATUS.md` and the recent plan docs as the source of truth.
