# DI-09 — Settings and Operational UX (evidence)

**Date:** 2026-07-20  
**Status:** `done` (`/sdk-review` PASS 2026-07-20)  
**Desktop version:** `0.11.2` (unchanged)  
**Feature:** F-011 remains `in progress` (not `implemented`)

## Scope landed

Settings → Integrations → **SDK Server** operational surface (UI Kit):

| Surface | Behavior |
| --- | --- |
| Enable/disable | Persists `UserSettings.sdkIntegration.enabled` (schema v10); applies via main `applySdkGatewayPolicy`; SIP/OCP boot unaffected |
| Bind policy | Loopback-only display; host not editable |
| Origins | Exact allowlist editor; empty fail closed; unmanaged defaults inherit env until first save |
| Paired clients | Public metadata only; revoke via existing `revokePairedClient` (no SIP/account tear-down) |
| Pending pairing | Approve / deny |
| Activate grant | Desktop-owned `issueAccountActivateGrant` → opaque `profileRef` only |
| Diagnostics | Allowlisted counts/bind/status/lastErrorCode; `windowHideAvailable: false` |
| Hide | Permanently disabled with ADR-0013 reason |

## Hard-stop invariants preserved

- No second Facade / Call Engine / SIP stack in main
- No secrets (passwords, apiKeys, tokens, PoP private keys) in UI / WS / IPC / diagnostics
- `window:hide` remains product-denied
- F-011 not marked `implemented`; version remains `0.11.2`
- DI-10 not started

## Key files

- `src/domain/settings/SdkIntegrationSettings.ts` + `UserSettings` v10 migration
- `src/application/settings/persistSdkIntegrationSettings.ts`
- `src/shared/ipc/SdkGatewaySettingsContract.ts` + preload/main invoke
- `src/main/sdk/registerSdkGateway.ts` (`applySdkGatewayPolicy`)
- `src/main/sdk/registerSdkGatewaySettingsIpc.ts`
- `src/renderer/components/settings/panels/SdkModuleSettingsCard*.tsx`
- `src/renderer/hooks/useSdkSettingsPanel.ts`

## Verification (2026-07-20) — independent `/sdk-review` re-run

### Focused DI-09 + DI-04…DI-08 regression

```bash
npx vitest run \
  src/domain/settings/SdkIntegrationSettings.test.ts \
  src/shared/ipc/SdkGatewaySettingsContract.test.ts \
  src/application/settings/migrateUserSettings.test.ts \
  src/application/settings/sdkIntegrationSettingsCommands.test.ts \
  src/renderer/components/settings/panels/SdkModuleSettingsCard.test.tsx \
  src/renderer/components/settings/panels/SettingsIntegrationsPanel.test.tsx \
  src/adapters/integration/LocalWsServerAdapter.operator.test.ts \
  src/adapters/integration/sdkAccountActivateSession.test.ts \
  src/application/integration/ExternalSdkAccountHandler.test.ts \
  src/application/integration/createSdkAccountPortFromFacade.test.ts
```

**Result (gate):** **48 passed** (10 files)  
**Result (Low remediation 2026-07-20):** **51 passed** (same set; +deep IPC snapshot tests + card revoke/grant/approve interactions)

### Full suite / gates

| Check | Result |
| --- | --- |
| `npm test` | **2491 passed / 1 skipped** (gate); Low remediation re-verified focused + lint/typecheck/i18n |
| `npm run lint` | PASS |
| `npm run typecheck` | PASS |
| `npm run i18n:check` | PASS |
| `npm run registry:check` | **74 found / 0 missing** |
| `package.json` version | **0.11.2** |

Also re-verified: i18n key parity (`messages.test.ts`); `window:hide` product denial (`sdkGatewayRouteInbound.test.ts`).

## Low remediations (post-gate, same day)

- `parseSdkGatewaySettingsSnapshot.ts` — fail-closed deep parse of origins/paired/pending/diagnostics; reconstruct allowlisted shapes; reject forbidden secret-like keys
- `SdkModuleSettingsCard.test.tsx` — approve pending, issue grant, confirm revoke interaction coverage

## Residual risks (non-blocking)

- Packaged Electron E2E / hostile-client matrix remains DI-10
- SDK-08/09 browser package work may remain pending (non-blocking for desktop DI-09)
- Machine-wide gateway policy is persisted per active account settings bucket; first Settings apply overrides env allowlist when `originsManaged`

## Reviewer

`/sdk-review` **PASS** 2026-07-20 — DI-09 closed to **`done`**; Lows remediated same day. Next: **`/sdk-integration` DI-10 only** (separate session).
