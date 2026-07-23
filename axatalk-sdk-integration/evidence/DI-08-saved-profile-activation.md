# DI-08 — Saved-Profile Activation (evidence)

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20; Low remediation same day)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Scope landed

Authenticated sessions with **short-lived privileged grant** may activate a desktop-approved opaque saved profile reference through the unified Account sign-in path:

| Public command | Capability | Local approval | Path |
| --- | --- | --- | --- |
| `account:activate-profile` | privileged `account.activate` (never in pairing defaults) | `SdkAccountActivateGrantStore` per `clientId`+`profileRef` (TTL 120s) | `ExternalSdkAccountHandler` → `createSdkAccountPortFromFacade` → `AccountBootstrapFacade.signInAccount` |

Still product-denied: `window:hide`.  
SDK-08 browser client package may remain pending (non-blocking; protocol DTOs from SDK-02).

## Security model (ADR-0013 §B + ADR-0016 + AF-003/005/006)

```text
WS (DI-04 auth + caps)
  -> capability account.activate (fail closed; elevated only via issueAccountActivateGrant)
  -> local approval: grant matches payload.profileRef (fail closed)
  -> SdkRequestDedupCache (TTL 120s)
  -> MainToRendererBroker (+ clientId)
  -> ExternalSdkProductHandler → ExternalSdkAccountHandler
       -> decode opaque profileRef → SavedAccountProfileId
       -> reject draft / unknown / OCP-when-disabled
       -> signInAccount({ mode, profile: { kind: "saved" } }) — secrets hydrated desktop-only
  -> public reply { activated, mode, profileLabel? } + revision advance on success
```

- Opaque `profileRef` = `prf_` + base64url(profileId) — profile ids contain `@`/`|` forbidden by OpaqueIdSchema.
- Presentation / pairing defaults never receive `account.activate`.
- Active session → Facade logout-first → protocol `conflict` (no silent switch / unregister).
- Disconnect/revoke clears grants + strips capability; does **not** tear SIP or complete activation.
- Allowlisted logs: no passwords, apiKeys, tokens, raw profile secrets.

## Revision contract (preserved)

```text
peek() = current aggregate R
account:activate-profile success → advance() → reply.revision = R+1
stale expectedRevision → stale_state + currentRevision (no sign-in)
reads / logout remain peek-or-mutate per DI-07 (no prepare token)
```

Shared `SdkSessionRevisionClock` + shared `SdkAggregateMutex` (`__sdk_account__`) from `bindSdkBrokerSession`.

## Key files

- `src/application/integration/ExternalSdkAccountHandler.ts`
- `src/application/integration/ExternalSdkAccountPort.ts`
- `src/application/integration/createSdkAccountPortFromFacade.ts`
- `src/application/integration/ExternalSdkProductHandler.ts`
- `src/application/integration/mapPlatformErrorToSdkCode.ts` (logout-first → `conflict`)
- `src/shared/integration/sdkProfileRefCodec.ts`
- `src/adapters/integration/sdkAccountActivateGrantStore.ts`
- `src/adapters/integration/sdkAccountActivateCapability.ts`
- `src/adapters/integration/sdkGatewayActivateApproval.ts`
- `src/adapters/integration/sdkGatewayRouteInbound.ts` (`command_broker`)
- `src/adapters/integration/LocalWsServerAdapter.ts` (`issueAccountActivateGrant`)
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`

## Verification (2026-07-20)

### Focused DI-04…DI-08 set

```bash
npx vitest run \
  src/adapters/integration/LocalWsServerAdapter.test.ts \
  src/adapters/integration/LocalWsServerAdapter.auth.test.ts \
  src/adapters/integration/LocalWsServerAdapter.product.test.ts \
  src/adapters/integration/LocalWsServerAdapter.call.test.ts \
  src/adapters/integration/LocalWsServerAdapter.operator.test.ts \
  src/adapters/integration/sdkGatewayRouteInbound.test.ts \
  src/adapters/integration/sdkAccountActivateGrantStore.test.ts \
  src/adapters/integration/MainToRendererBroker.test.ts \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/application/integration/ExternalSdkCallHandler.test.ts \
  src/application/integration/ExternalSdkOperatorHandler.test.ts \
  src/application/integration/ExternalSdkAccountHandler.test.ts \
  src/application/integration/createSdkAccountPortFromFacade.test.ts \
  src/application/integration/createSdkOperatorPortFromFacade.test.ts \
  src/application/integration/mapSdkOperatorReasons.test.ts \
  src/application/integration/ExternalSdkSnapshotAssembler.test.ts \
  src/application/integration/ExternalSdkEventMapper.test.ts \
  src/application/integration/sdkPrivacyRedaction.test.ts \
  src/application/integration/SdkCallOwnershipRegistry.test.ts \
  src/shared/ipc/SdkBrokerContract.test.ts
```

**Result:** **134 passed** (implementer + independent `/sdk-review` re-run)

### Low remediation (same day, post `/sdk-review` PASS)

| Low | Fix |
| --- | --- |
| WS revoke/disconnect → activate forbidden | `LocalWsServerAdapter.operator.test.ts` DI-08 disconnect + revoke cases |
| OCP-disabled rejection | `createSdkAccountPortFromFacade.test.ts` |
| Stale `account.activate` after grant TTL | `syncAccountActivateCapabilityForConnection` before capability routing + TTL WS test |
| `LocalWsSessionRegistry` >300 lines | split inbound/revoke/activate session helpers |

Focused re-verify after remediation: **140 passed** (includes `sdkAccountActivateSession.test.ts` + expanded operator DI-08 cases).

### Full suite / gates

| Check | Result |
| --- | --- |
| `npm test` | **2482 passed / 1 skipped** |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run registry:check` | **74 found / 0 missing** |
| `package.json` version | **0.11.2** |

## Residual risks (non-blocking)

- SDK-08 browser client package still pending (non-blocking).
- Settings UX for issuing activate grants is DI-09 (`issueAccountActivateGrant` is desktop API / test surface).
- Packaged E2E deferred to DI-10.

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — DI-08 closed to **`done`**; Lows remediated same day. Next: `/sdk-integration` **DI-09 only**. Do not mark F-011 `implemented`. Version stays `0.11.2`.

## Delta — activate timeout sync (2026-07-23)

- Consent TTL (`SDK_ACTIVATE_CONSENT_TTL_MS` = 120s) auto-dismiss → wire `timeout` + `activate_phase: consent`.
- Broker hop for `account:activate-profile` only uses `SDK_ACTIVATE_BROKER_TIMEOUT_MS` (~240s); other commands remain 5s.
- After Allow: auth budget by mode (sip 60s / OCP stage sum + slack); budget expiry cancels in-flight OCP via `cancelOcpSignInAttempt`.
- Additive failure details: `activate_phase`, `auth_mode`, `failure_kind` (incl. `session_exist`).
- SSoT: `src/shared/integration/sdkActivateTimeouts.ts` (+ Application re-export) + protocol constants; ADR-0018 §E/F + PROTOCOL.md updated.
