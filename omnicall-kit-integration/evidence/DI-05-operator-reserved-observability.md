# DI-05 / DI-07 follow-up — Post-call reservation observability (evidence)

**Date:** 2026-07-23  
**Status:** additive follow-up (DI-05 / DI-07 / SDK-07 remain `done`)  
**Desktop SemVer:** unchanged (internal Integration + protocol additive fields)  
**Feature:** F-011 remains `in progress` until DI-10 / P12 close

## Goal

Expose active post-call Ready/Break **booking** to SDK hosts without a new command and
without leaking OCP wire / numeric enums. Preserve existing `changeStatus` →
`kind: applied|reserved` semantics (no downgrade).

## Contract (additive / compatible — ADR-0012)

| Surface | Change |
| --- | --- |
| Protocol snapshot `operator` | optional `reservedTarget`, `reservedReasonId` |
| Protocol event `operator:status-changed` | same optional fields |
| SDK `OperatorStatusChangeResult.kind` | narrowed to `"applied" \| "reserved"` (stricter parse) |
| Desktop assembler / event mapper | projects local reserved projection; maps `OperatorStatusReservationSet` |
| Revision gate | advances when reservation booking changes (even if coarse stays `unknown`) |

**Non-goals:** new `operator:reserve-status`, campaign events, optimistic chip flip,
SemVer bump, blocking unrelated SDK commands while reserved.

**Desktop UI follow-up (2026-07-23):** OperatorStatusSelector dropdown marks the reserved
Ready/Break reason as `isCurrent` during busy/PCP (chip still coarse). Finish without
local booking remains Ready — see `omnicall-kit/docs/guide/operator-status-reservation.md`.

## Key files

- Protocol: `omnicall-kit/packages/protocol/src/snapshot.ts`, `events.ts`, fixture
  `fixtures/valid/event/operator-status-changed-reserved.json`
- SDK: `packages/sdk/src/internal/operator-commands.ts` (`OperatorStatusChangeKind`)
- Desktop: `mapSdkOperatorStatus.ts`, `ExternalSdkSnapshotAssembler.ts`,
  `ExternalSdkEventMapper.ts`, `SdkOperatorEventRevisionGate.ts`,
  `readSdkProductStateFromStore.ts`, `bindSdkBrokerSession.ts`
- Guide: `omnicall-kit/docs/guide/operator-status-reservation.md`

## Verification (2026-07-23)

```bash
# Desktop focused → 48 passed
npx vitest run \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/SdkOperatorEventRevisionGate.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkOperatorHandler.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts

# SDK workspace
cd omnicall-kit
npm run build
npm run api:check   # PASS — sdk 55 symbols; protocol 176
npm run docs:check  # PASS
npx vitest run packages/sdk/src/public/omnicall-client.operator.test.ts \
  packages/sdk/src/index.test-d.ts
# → 32 passed
```

## Docs synced

- `omnicall-kit/docs/PROTOCOL.md`
- `omnicall-kit/docs/guide/events.md`, `api-reference.md`, `security-anti-patterns.md`, `README.md`
- `omnicall-kit/docs/guide/operator-status-reservation.md` (new)
- `omnicall-kit/packages/sdk/CHANGELOG.md` (Unreleased note)
- DI-07 evidence cross-link (this file)
