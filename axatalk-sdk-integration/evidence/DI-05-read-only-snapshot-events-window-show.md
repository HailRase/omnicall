# DI-05 Evidence — Read-only Snapshot, Events, and Window Show

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` **PASS** 2026-07-20 re-gate after typecheck remediation)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Prerequisites verified

| Check | Result |
| --- | --- |
| DI-00…DI-04 | `done` (`/sdk-review` PASS) |
| SDK-01…SDK-03 | `done`; protocol fixtures/shapes consumed |
| F-011 | `in progress` |
| Package version | `0.11.2` |
| Auth gate fail-closed | preserved (Origin → pairing → PoP → capabilities → TTL) |

## Intake

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded contexts: Integration (primary); Telephony/Operator/Settings as read projections
- Layers: Application mappers/handlers; main window handler; gateway product dispatch; typed broker; preload IPC for events
- Non-goals: call/operator/account mutations (DI-06+); `window:hide`; Settings UX (DI-09); F-011 implemented; version bump

## What landed

1. **Snapshot** — authenticated + `session.read.redacted` → broker query → redacted product sections → main merges session/window → `sdk:snapshot` + reply `{ accepted: true }`.
2. **Events** — Domain → Application public drafts → preload IPC → per-connection fan-out with monotonic `sequence` (no cross-client broadcast). Campaign events omitted.
3. **`window:show`** — main `SdkWindowCommandHandler` (restore → show → focus →
   `moveTop` → temporary always-on-top pulse restoring prior pin + rate limit;
   ADR-0013 local focus policy); capability `window.show`; emits
   `window:visibility-changed`. Follow-up (2026-07-22): occluded/minimized
   Windows foreground raise; shared `bringBrowserWindowToFront` also used for
   telephony / SDK operator-attention raises (`ShellWindowAttentionController`).
4. **`window:get-state`** — main-only visibility read under `window.show`.
5. **Fail-closed** — unauth → `unauthenticated`; missing cap → `forbidden`; no product surface / broker not ready → `not_ready`; revoke stops further fan-out/snapshots; DI-06+ commands stay `not_ready`.
6. **Privacy** — ADR-0017 phone/display masks; OCP-disabled omits operator section; audit logs allowlisted (no payloads/PII).
7. **Remediation** — `window:hide` deny fixture is schema-valid (`expectedRevision` present); product denial remains `forbidden` (ADR-0013).

## Key files

| Area | Paths |
| --- | --- |
| Application | `ExternalSdkReadHandler.ts`, `ExternalSdkSnapshotAssembler.ts`, `ExternalSdkEventMapper.ts`, `sdkPrivacyRedaction.ts`, `readSdkProductStateFromStore.ts` |
| Gateway | `sdkGatewayProductDispatch.ts`, `sdkGatewaySnapshotMessage.ts`, `sdkGatewayEventFanout.ts`, `sdkGatewayWindowHandler.ts`, `sdkGatewayRouteInbound.ts` |
| Main | `createSdkGatewayProductSurface.ts`, `registerSdkGateway.ts` |
| Renderer bind | `bindSdkBrokerSession.ts`, `useAccountBootstrap.ts` |
| IPC | `SdkGatewayEventContract.ts`, `IpcChannels.sdkGatewayPublishEvent`, preload `publishSdkGatewayEvent` |
| Tests | `LocalWsServerAdapter.product.test.ts`, `sdkGatewayRouteInbound.test.ts`, privacy/assembler/event mapper unit tests |

## Verification (exact, re-gate 2026-07-20)

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsServerAdapter.auth.test.ts \
  src/adapters/integration/LocalWsServerAdapter.product.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/adapters/integration/MainToRendererBroker.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/application/integration/sdkPrivacyRedaction.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkEventMapper.test.ts
# → focused suites 60 passed (9 files)

npm test
# → 2407 passed / 1 skipped

npm run lint        # PASS
npm run typecheck   # PASS (prior High remediated)
npm run registry:check  # 71 found / 0 missing
```

## Adversarial coverage (product suite)

| Case | Result |
| --- | --- |
| Unauth snapshot | `unauthenticated` (DI-04 suite retained) |
| Auth without `session.read.redacted` | `forbidden` |
| Auth + cap | redacted snapshot success |
| Event fan-out | per-connection sequences; distinct eventIds |
| `window:show` | requires `window.show`; shell path; visibility event |
| `window:hide` | product-denied `forbidden`; fixture type-valid (`expectedRevision`) |
| Revoke | stops further events; SIP composition untouched |
| Log hygiene | no phone/nonce/signature in command logs |
| Domain boundary | `sdk-dependency-boundary` green |

## Explicit non-goals (confirmed absent)

- Call originate/control, operator write, logout, account activate
- `window:hide` product enablement
- Settings pairing UX
- Packaged E2E
- F-011 marked `implemented`
- Desktop version bump

## Remaining risks

- SDK-05 client package interoperability gate still pending (paired with this unit)
- OCP module flag sampled at broker bind time (settings change until rebind deferred)
- Initial post-auth push snapshot deferred; clients use `sdk:get-snapshot` + event stream + gap resync
- Full operator session-changed events from OCP projections deferred beyond Domain Event mapper subset

## Reviewer

`/sdk-review` **PASS** (2026-07-20 re-gate). Prior FAIL High closed: `sdkGatewayRouteInbound.test.ts` `window:hide` payload includes `expectedRevision: 12` (schema-valid deny); `npm run typecheck` exits 0; ADR-0013 deny semantics unchanged. No Blockers. DI-05 → `done`. F-011 remains `in progress`. Version `0.11.2` unchanged. Next: DI-06 only.
