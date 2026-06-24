# Real Integration Track (RAT)

Parallel track to connect production adapters without breaking mock/CI on `main`.

> **OCP (step 06 / R5): DEFERRED** — [ADR-0002](../adr/ADR-0002-defer-ocp-plugin.md), [OCP-PLUGIN-BACKLOG.md](../OCP-PLUGIN-BACKLOG.md). Active track: **SIP R1–R4 + step 07 transfer**.

## Start here

1. Read `00-SNAPSHOT.md` — frozen baseline.
2. Read `OCP-PLUGIN-BACKLOG.md` — OCP not in active scope.
3. Read `PROGRESS.md` — what is done in this branch.
4. Give the agent **`MASTER-AGENT-PROMPT.md`**.
5. Execute steps in order; after each step update `PROGRESS.md`.
6. After each step, run **`@real-integration-agent`** — gate review and next prompt.

## Agents

| Agent | Role | Trigger |
| --- | --- | --- |
| Implementation | Code + tests per step | `MASTER-AGENT-PROMPT.md` |
| Reviewer | Gate check, refactor or continuation prompt | `@real-integration-agent` |

Reviewer skill: `.cursor/skills/real-integration-agent/SKILL.md`

## Rules

- Default adapter mode stays **mock** (`npm run test` must stay green).
- Real mode is opt-in: `?adapters=real` or `VITE_ADAPTER_MODE=real`.
- No business rules in adapters or UI.
- No edits to Domain unless port contract gap is proven (then ADR).
- Do not grow `AccountBootstrapFacade` — swap deps in bootstrap only.

## Branch

`feature/real-adapters` — merge after smoke for active **SIP** slice (R1–R4 closed; R5 OCP deferred per ADR-0002).

## Dev credentials

Copy `env.local.example` to `.env.local` at repo root (gitignored).
