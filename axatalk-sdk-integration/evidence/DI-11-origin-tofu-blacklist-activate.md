# DI-11 — Origin TOFU / Blacklist / Per-Origin Matrix / Always-On Gateway / Activate Consent

**Date:** 2026-07-21  
**Desktop version:** `0.12.0` (MINOR — DI-11 user-visible TOFU/Settings)  
**Work unit status:** `done` — `/sdk-review` **PASS** 2026-07-21; High/Low remediated same day  

> **Superseded note (2026-07-27):** `window.hide` is product-available under ADR-0013
> amendment (matrix + telephony-busy deny + tray). See
> `evidence/DI-05-window-hide-product.md`. Rows below that say “hide unavailable”
> describe DI-11 gate day only.

**ADR:** ADR-0018 Accepted  

## Prerequisites verified

| Item | Status |
| --- | --- |
| ADR-0018 Accepted | PASS |
| DI-04 / DI-09 `done` | PASS |
| DI-10 `done` (`/sdk-review` PASS 2026-07-21) | PASS |
| F-011 stays `in progress` | PASS (not marked implemented) |
| P12 stays open | PASS |
| `window.hide` unavailable **on DI-11 gate day** (superseded 2026-07-27) | PASS (historical) |
| No `sdk-demo/` re-added to softphone | PASS |

## Review refactor (2026-07-21) — blockers closed

| Blocker | Fix |
| --- | --- |
| Settings SDK leaf reused OCP branding | `settings.nav.integrations.sdk` + icon id `settings.integrations.sdk` (`Blocks`) wired in `settingsSections.ts`; OCP leaf still gated pre-auth; SDK leaf pre-auth via derive |
| Activate dismiss ≡ Deny | `ExternalSdkAccountHandler`: `onActivateConsentDenied` only on `deny`; `dismiss` → `forbidden`+`permission_denied` (no matrix persist) |
| Activate path tests false-positive | Extended handler + nav + migrateLegacy tests (see Verification) |
| Dead `settings.integrations.sdk.enabled*` | Removed from all locales |

## Files changed (grouped)

### Domain / Settings schema v11
- `src/domain/settings/SdkOriginTrust.ts`
- `src/domain/settings/SdkIntegrationSettings.ts` (remove `enabled`; origins + matrix)
- `src/domain/settings/sdkOriginTrustMutations.ts`
- `src/domain/settings/UserSettings.ts` (`SETTINGS_SCHEMA_VERSION = 11`)
- `src/domain/settings/migrateUserSettings.ts` (v10→v11)
- `src/domain/index.ts` exports

### Main gateway / Origin upgrade
- `src/adapters/integration/sdkGatewayOriginPolicy.ts`
- `src/adapters/integration/sdkGatewayOriginTrustApprover.ts`
- `src/adapters/integration/sdkGatewayOriginTrustSession.ts`
- `src/adapters/integration/sdkGatewayOriginTrustAdapterState.ts`
- `src/adapters/integration/localWsServerUpgrade.ts` (TOFU admit; blacklist reject)
- `src/adapters/integration/sdkGatewayHttp.ts` (CORS for unknown+allowed)
- `src/adapters/integration/LocalWsServerAdapter.ts` + lifecycle/bind/dispatch
- `src/adapters/integration/sdkGatewayCapabilities.ts` (grants ⊆ matrix)
- `src/adapters/integration/sdkGatewayActivateApproval.ts` (matrix activate gate)
- `src/main/sdk/registerSdkGateway.ts` (always-on except `AXATALK_SDK_GATEWAY=0`)
- `src/main/sdk/registerSdkGatewaySettingsIpc.ts` / `sdkGatewaySettingsOps.ts`

### Application / broker / activate consent
- `ExternalCommandContext.origin`
- `SdkBrokerContract` origin field
- `ExternalSdkAccountHandler` + `DeferredSdkActivateConsent` + `SdkActivateConsentPort`
- `createSdkAccountPortFromFacade.lookupSavedProfileLabel`
- `src/renderer/bootstrap/sdkActivateConsentBridge.ts` + `bindSdkBrokerSession.ts`

### Settings UI / AF-004
- `deriveSettingsNavigationAvailability` — `integrations-sdk` pre-auth
- `settingsSections.ts` — Axatalk SDK nav leaf (`labelKey`/`iconId` distinct from OCP)
- `SdkModuleSettingsPolicySection` — no enable toggle; blacklist/Unblock/matrix
- `SdkOriginTrustConsentModal` / `SdkActivateProfileConsentModal`
- SoftphoneReadyShell wiring + i18n (`ru/en/fr/de/bg`)
- Icon Registry + catalog: `settings.integrations.sdk`

### SDK client (`axatalk-sdk`)
- `origin_blocked` in `PROTOCOL_ERROR_CODES`
- `origin-policy-errors.ts`, connect terminal mapping, `isOriginBlockedError`, `getConnectError()`
- API snapshots updated (`api:check` PASS)

## Schema / migration notes

- **v10 → v11:** flat `{ enabled, allowedOrigins, originsManaged }` migrates to  
  `{ origins: [{ origin, state: "allowed", matrix: defaults, previouslyAllowed: true }], originsManaged }`  
  Listener `enabled` discarded; kill-switch remains env-only.
- Default matrix on first Allow: call_controller non-privileged; `account.activate` **off**.
- Unblock: prior allowed → restore allowed+matrix; first-Deny-only → remove row (`unknown`).

## Verification (post-refactor)

### Desktop focused
```text
npx vitest run \
  src/application/integration/ExternalSdkAccountHandler.test.ts \
  src/application/projections/settings/deriveSettingsNavigationAvailability.test.ts \
  src/domain/settings/SdkIntegrationSettings.test.ts \
  src/domain/settings/sdkOriginTrustMutations.test.ts \
  src/adapters/integration/sdkGatewayOriginPolicy.test.ts \
  src/shared/ipc/SdkGatewaySettingsContract.test.ts \
  src/renderer/components/settings/panels/SdkModuleSettingsCard.test.tsx
→ 7 files / 34 passed
```

### Type / i18n
```text
npm run typecheck → PASS (after consent mock typing fix)
npm run i18n:check → PASS
```

### SDK
```text
cd axatalk-sdk && npx vitest run \
  packages/sdk/src/internal/origin-policy-errors.test.ts \
  packages/sdk/src/public/origin-policy-connect.test.ts
→ 2 files / 6 passed
```

## Security self-check

- Exact Origin match retained; blacklist rejects upgrade (no JSON) → client `origin_blocked`
- First Deny: wire `forbidden` + `origin_denied` then close
- TOFU modal is Origin trust only (not pairing)
- No secrets / passwords / PoP private material in logs or Settings snapshots
- Activate: opaque `profileRef` only; consent every login when matrix on
- Pending → `conflict` + `activate_consent_pending`
- Deny → persist matrix `account.activate=false` + `forbidden` + `activate_denied_for_origin`
- Dismiss → pending cleared only; `forbidden`+`permission_denied`; **no** `onActivateConsentDenied`
- Discovery CORS only for `unknown` + `allowed`

## Explicit non-claims

- F-011 remains **`in progress`**
- P12 remains **open**
- SemVer remains **`0.11.2`**
- `window.hide` unavailable **on DI-11 gate day** — superseded 2026-07-27
  (`DI-05-window-hide-product.md`)
- DI-10 OPEN smoke (Settings pair/revoke + live SIP/OCP call) **not** completed in this unit
- No npm publish / Mode B
- DI-11 not marked `done` until `/sdk-review` PASS

## Remaining risks

1. DI-10 OPEN packaged smoke still required before F-011/`implemented`
2. Machine-common SoT is `sdk-origin-trust.json`; account-bucket `UserSettings.sdkIntegration` may lag as a mirror until Settings save — gateway admission uses machine store
3. Activate consent deny persists matrix via Facade + IPC; ensure Settings refresh after deny in long sessions
4. Full `release:preflight` not claimed as complete in this evidence — reviewer may request

## Lint + matrix-off follow-up (2026-07-21)

| Item | Fix |
| --- | --- |
| Lint Blocker `require-await` / `unbound-method` | `ExternalSdkAccountHandler.test.ts`: sync `vi.fn(() => Promise.resolve(...))` + local mock refs for expect |
| High: matrix `account.activate=false` | `sdkGatewayActivateApproval.test.ts` — immediate `forbidden`+`permission_denied`; grant not consumed |
| High: empty caps fail-open | `sdkGatewaySessionDispatch.isOriginActivateAllowed` → `caps.includes("account.activate")` only (fail-closed); DI-08 harness still elevates via `autoApprovePairing` |

### Verification (follow-up)
```text
npm run lint → PASS
npx vitest run \
  src/application/integration/ExternalSdkAccountHandler.test.ts \
  src/adapters/integration/sdkGatewayActivateApproval.test.ts
→ 2 files / 13 passed
npm run typecheck → PASS
npm run i18n:check → PASS
```

## Reviewer request

Re-run **`/sdk-review` DI-11 only**. Do not invent DI-12; do not close F-011/P12
from this unit alone. SemVer remains `0.11.2`.

## `/sdk-review` FAIL (2026-07-21, second pass)

Independent verification (no production fixes in review session):

| Check | Result |
| --- | --- |
| Prior lint Blocker | Cleared — `npm run lint` PASS |
| Focused desktop vitest (8 files) | 36 passed |
| SDK origin-policy tests + `api:check` | 6 passed; api:check PASS |
| Always-on / kill-switch / AF-004 SDK pre-auth | Spot-check OK |
| Activate dismiss≠deny; matrix-off; empty-caps fail-closed | Spot-check + tests OK |
| F-011 / P12 premature close | Not claimed — OK |

### Blocker

**Persisted Origin trust not applied at gateway startup.**

- `src/main/index.ts` → `startSdkGateway({ desktopVersion })` with no disk trust entries.
- Adapter seeds only `AXATALK_SDK_ALLOWED_ORIGINS` / constructor allowlist as `allowed`.
- `useSdkSettingsPanel` mount loads UserSettings origins but never `applyPolicy` disk→gateway.
- Consequence: after restart, blacklisted Origins become `unknown` (TOFU again) or, if
  present in env seed, return to **`allowed`** — violates ADR-0018 §B.5 and
  “blacklist wins over allow seed”.

### High

- ADR-0018 §C.4 machine/common: trust still lives in account-scoped `UserSettings`
  buckets (`__anonymous__` vs active SIP), not a machine-common store.
- Docs drift: `README.md` / `compatibility-matrix.md` still say DI-11 `pending`.

### Low

- SemVer still `0.11.2` (bump when DI-11 ships / gate closes per ADR Consequences).
- `startSdkGateway({ enabled? })` param unused (env-only).
- `onOriginTrustChanged` never wired in main registration.
- SIP-only regression not re-proven in DI-11-specific suite (preflight not claimed).

**Gate:** DI-11 stays `review` / not `done`. Refactor same unit only.

## Boot hydrate refactor (2026-07-21, third pass)

| Item | Fix |
| --- | --- |
| Blocker: cold start ignore disk trust | `hydrateSdkOriginTrustForGatewayBoot` loads machine store **before** `gateway.start()` / upgrade |
| Blocker: env seed re-allows blacklist | `mergePersistedOriginTrustWithEnvSeed` — persisted `denied` always wins over `AXATALK_SDK_ALLOWED_ORIGINS` |
| High: ADR-0018 §C.4 machine-common | SoT `profiles/sdk-origin-trust.json`; one-shot migrate from profile `UserSettings.sdkIntegration` silos; ADR §C.4 implementation note |
| High: docs drift | README / compatibility-matrix / IMPLEMENTATION-PLAN / 00-SNAPSHOT → DI-11 `review` |
| Persist path | `onOriginTrustChanged` / `setOriginTrustEntries` → machine store; Settings `applyPolicy` merges seed + persists |
| Settings mount | prefer live gateway snapshot origins over account silo |

### New / changed files (hydrate)
- `src/adapters/integration/sdkOriginTrustMachineStore.ts` (+ test)
- `src/adapters/integration/sdkGatewayOriginPolicy.ts` (`mergePersistedOriginTrustWithEnvSeed`)
- `src/adapters/settings/profileStoragePaths.ts` (`sdk-origin-trust.json`)
- `src/main/sdk/registerSdkGateway.ts` + `sdkGatewayRegistrationHelpers.ts`
- `src/renderer/hooks/useSdkSettingsPanel.ts` (snapshot-first origins)

### Verification (boot hydrate)
```text
npm run lint → PASS
npx vitest run \
  src/adapters/integration/sdkGatewayOriginPolicy.test.ts \
  src/adapters/integration/sdkOriginTrustMachineStore.test.ts \
  src/application/integration/ExternalSdkAccountHandler.test.ts \
  src/adapters/integration/sdkGatewayActivateApproval.test.ts \
  src/application/projections/settings/deriveSettingsNavigationAvailability.test.ts \
  src/domain/settings/SdkIntegrationSettings.test.ts \
  src/domain/settings/sdkOriginTrustMutations.test.ts \
  src/shared/ipc/SdkGatewaySettingsContract.test.ts \
  src/renderer/components/settings/panels/SdkModuleSettingsCard.test.tsx \
  src/main/sdk/registerSdkGateway.test.ts
→ 10 files / 42 passed
npm run typecheck → PASS
npm run i18n:check → PASS
(cd axatalk-sdk && npx vitest run origin-policy-*.test.ts) → 2 files / 6 passed
```

## `/sdk-review` PASS (2026-07-21, third pass)

Independent verification (no production fixes in review session):

| Check | Result |
| --- | --- |
| Prior boot-hydrate Blocker | Cleared — `hydrateSdkOriginTrustForGatewayBoot` before `gateway.start()`; denied-wins merge tested |
| Machine-common SoT (`sdk-origin-trust.json`) | Present; profile-bucket one-shot migrate covered |
| Focused desktop vitest (10 files) | **42 passed** |
| SDK origin-policy tests + `api:check` | 6 passed; api:check PASS |
| `npm run lint` / `typecheck` / `i18n:check` | PASS |
| Always-on / kill-switch / AF-004 SDK pre-auth | Spot-check OK |
| Activate dismiss≠deny; matrix-off; empty-caps fail-closed | Spot-check + tests OK |
| F-011 / P12 premature close | Not claimed — OK |

### High/Low remediation (2026-07-21, post-PASS)

| Finding | Fix |
| --- | --- |
| High: corrupt store → env seed fail-open | `load` returns `corrupt`; hydrate throws; gateway **does not listen** (no env-only reopen) |
| High: account-bucket mirror lag | `mirrorSdkOriginTrustToProfileBuckets` on persist; Settings mount mirrors live snapshot |
| Low: unused `enabled?` | Removed from `startSdkGateway` options (env kill-switch only) |
| Low: synthetic `requestId` | Deny uses real `originTrustRequestId` opaque id + details |
| Low: SemVer | Bumped **`0.12.0`** (CHANGELOG + manifest sync) |
| Low: preflight | Re-run focused suite + `release:preflight` in remediation session |

**Gate:** DI-11 remains **`done`**. F-011/P12 open until remaining DI-10 smoke/waivers.
