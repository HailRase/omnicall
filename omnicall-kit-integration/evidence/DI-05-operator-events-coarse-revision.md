# DI-05 follow-up — Operator public events + coarse revision (evidence)

**Date:** 2026-07-23  
**Status:** additive follow-up on DI-05 / DI-07 (DI units remain `done`)  
**Desktop version:** unchanged (no SemVer bump in this change)  
**Feature:** F-011 remains `in progress`

## Goal

Emit protocol `operator:status-changed` / `operator:session-changed` from OmniCall desktop
and apply **coarse-advance** on the shared `SdkSessionRevisionClock` so UI/OCP status
changes participate in SDK concurrency without spamming `stale_state` on mid-call
talking↔hold transitions.

## Policy matrix

| Publish | Advance revision? |
| --- | --- |
| Coarse status changes (`ready` / `break` / `offline` / `post_call_processing` / `unknown`) | Yes |
| `ready`/`break` with different `reasonId` | Yes |
| Same coarse `unknown` (e.g. talking→hold) | Emit event, **no** advance |
| `operator:session-changed` `connected` flip | Yes |
| Call / registration / account event publish | Unchanged (peek only) |
| `OperatorLoggedOut` | Not mapped (avoid double fan-out with SessionEnded) |

Snapshot remains source of truth; SDK client does not patch cache from events.

## Key files

- `src/application/integration/ExternalSdkEventMapper.ts`
- `src/application/integration/SdkOperatorEventRevisionGate.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- Tests: `ExternalSdkEventMapper.test.ts`, `SdkOperatorEventRevisionGate.test.ts`

## Verification

```bash
npx vitest run \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/SdkOperatorEventRevisionGate.test.ts \
  src/application/integration/ExternalSdkOperatorHandler.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts
# → 39 passed

npm run lint   # PASS
```

Shared-clock DI-06/DI-07 operator/call suites remain green (no contract downgrade).

## Docs synced

- `omnicall-kit/docs/guide/events.md` — host recipe + coarse-advance
- `omnicall-kit/docs/guide/errors.md` — `stale_state` after UI/OCP coarse change
- `omnicall-kit-integration/evidence/DI-05-read-only-snapshot-events-window-show.md` — follow-up section
- Feature Registry F-011 evidence line; STATUS note

## Non-goals (preserved)

- Campaign events, operator ownership, snapshot auto-patch, Use Case FSM changes,
  package version bump

## Follow-up (2026-07-23)

Post-call reservation observability (`reservedTarget` / `reservedReasonId` + revision
advance on booking change): `DI-05-operator-reserved-observability.md`.
