# Step 00: Branch & Guardrails

## Goal

Safe branch setup; ADR; secrets template; Feature Registry prep.

## Tasks

1. `git checkout -b feature/real-adapters` from `master`.
2. Read ADR `docs/softphone/adr/ADR-0001-real-adapter-integration.md`.
3. Copy `env.local.example` → `.env.local` at repo root for local dev (never commit).
4. Update Feature Registry notes under F-001, F-002, F-003, F-009: real adapter track `in_progress` on branch RAT.
5. Do **not** change runtime behavior in this step.

## Gate

- Branch `feature/real-adapters` exists
- ADR committed
- `env.local.example` committed
- `npm run test` still 488+

## Update PROGRESS

Mark step 00 `done` with commit hash.
