# Real Integration Track (RAT)

Parallel track to connect production adapters without breaking mock/CI on `main`.

## Start here

1. Read `00-SNAPSHOT.md` — frozen baseline.
2. Read `PROGRESS.md` — what is done in this branch.
3. Give the agent **`MASTER-AGENT-PROMPT.md`**.
4. Execute steps in order; after each step update `PROGRESS.md`.

## Rules

- Default adapter mode stays **mock** (`npm run test` must stay green).
- Real mode is opt-in: `?adapters=real` or `VITE_ADAPTER_MODE=real`.
- No business rules in adapters or UI.
- No edits to Domain unless port contract gap is proven (then ADR).
- Do not grow `AccountBootstrapFacade` — swap deps in bootstrap only.

## Branch

`feature/real-adapters` — merge only after smoke checklist for current slice passes.

## Dev credentials

Copy `env.local.example` to `.env.local` at repo root (gitignored).
