# P11 Auth Flow Refactoring — Corrective Track Handoff

- **Features:** F-001, F-014, F-016, F-023, F-024, F-028, F-029
- **Legacy:** LF-006, LF-007, LF-008, LF-011, LF-048, LF-049, LF-058, LF-077, LF-079, LF-086, LF-087 (+ OCP parity LF-018/019/041–049)
- **Plan (SoT):** `auth-flow/auth-flow-refactoring.md`
- **Phase:** P11 / P01 / P08 corrective cross-cut — does **not** interrupt P13 video WU8 without explicit claim
- **Prior related:** `handoffs/P11-Unified-Authorization-Gate-Handoff.md` (sign-in ownership superseded by ADR-AF-003)

## Purpose

Corrective track completed: SIP/OCP Account sign-in, avatar-only Application-owned logout, dual OCP FSM, five-stage progress, Settings gate, crash-safe profiles/secrets, selected-profile secret boundary, and rolling notification journal.

**Superseded (Account error channel):** any earlier “all Account sign-in errors → Alert only” wording is replaced by **ADR-0026 amendment 2026-08-06** — validation → Alert; server/register → toast + System State CTA.

## ADR gate (WU-00)

| ADR | Title | Status |
|---|---|---|
| ADR-AF-001 | Saved draft profile lifecycle | Accepted 2026-07-16 (amended by AF-005) |
| ADR-AF-002 | OCP transport/auth dual FSM and recovery ownership | Accepted 2026-07-16 |
| ADR-AF-003 | Account is the sole sign-in surface | Accepted 2026-07-16 (amended by AF-005) |
| ADR-AF-004 | Settings authorization gate | Accepted 2026-07-16 (amended by AF-005) |
| ADR-AF-005 | Account session activates before SIP-ready | Accepted 2026-07-16 |
| ADR-AF-006 | Renderer boundary for saved secret display | Accepted 2026-07-17 |
| ADR-AF-007 | Local user notification journal | Accepted 2026-07-17 |

## Work units

| WU | Status | First agent entry |
|---|---|---|
| WU-00 Freeze scope + ADRs | **done** 2026-07-16 | — |
| WU-01 Profile lifecycle + secrets | **done** 2026-07-16 | `/logic` |
| WU-02 OCP dual FSM + recovery | **done** 2026-07-16 | `/logic` |
| WU-03 Facade + Account VMs | **done** 2026-07-16 | `/logic` |
| WU-04 Account UI | **done** 2026-07-16 | `/ui` |
| WU-05 Settings gate + OCP Module reduction | **done** 2026-07-16 | `/logic` (+ UI wiring) |
| ADR-AF-005 promote-on-login + OCP System State shell | **logic done** 2026-07-16 | `/logic` |
| T-034 System State SIP/OCP tabs UI | **done** 2026-07-16 | `/ui` |
| WU-06 Cross-flow verification + Hardening WU-07-01…11 | **automated gate done** 2026-07-17; staging pending | implementation + automated full gate |

## User-visible states (frozen for UI work)

| ID | State | Surface |
|---|---|---|
| S-01 | New SIP profile draft | Account / SIP only |
| S-02 | Saved SIP profile (password / remembered) | Account / SIP only |
| S-03 | New OCP profile (domain + key required) | Account / OCP module |
| S-04 | Saved incomplete OCP profile (missing domain and/or key) | Account / OCP module |
| S-05 | Saved complete OCP profile (domain/key hidden) | Account / OCP module |
| S-06 | Saving opted-in artifacts (in progress / failed) | Account |
| S-07 | Auth progress (HTTP → WS → creds → SIP register) | Account |
| S-08 | Server failed / disconnected — Retry server | Account |
| S-09 | Authorization timeout/rejected, socket open — Retry authorization | Account |
| S-10 | `SESSION_EXIST` — Retry server only | Account |
| S-11 | SIP-ready — Login disabled (logout via avatar) | Account |
| S-12 | Pre-auth Settings — non-Account nav disabled + redirect | Settings shell |
| S-13 | Post-auth OCP Module edit-only (no Connect/Disconnect/Retry sign-in) | Integrations → OCP |
| S-14 | Avatar logout (+ OCP reason cascade when live) | Header avatar menu |

## Recovery actions (frozen)

| Action key | When allowed | Effect (Application) |
|---|---|---|
| `retry_server` | Server failed/disconnected, or `SESSION_EXIST` | Fresh HTTP token + new socket + auth |
| `retry_authorization` | Server connected; auth timeout/rejected; socket open | Auth resend on same socket |
| `reconnect` | Server connected + authorized (operator-initiated) | Close → fresh token → new socket → auth → SIP outcome |
| _(none)_ | SIP registered | Login disabled; avatar logout only |

## Canonical test IDs (target after WU-04/WU-05)

### Account (keep / rename)

| Test ID | Notes |
|---|---|
| `account-mode-tabs` | SIP only / OCP module tablist |
| `account-mode-sip` | SIP only tab |
| `account-mode-ocp` | OCP module tab |
| `account-authorize` | Primary «Войти» (retain id; label via i18n) |
| `account-ocp-login` | OCP login InputGroup |
| `account-ocp-domain` | OCP domain |
| `account-ocp-api-key` | OCP API key (never prefilled from storage) |
| `account-ocp-api-key-visibility-toggle` | Visibility toggle |
| `account-save-profile-row` / `account-remember-password-row` | Opt-in saves (both modes where applicable) |
| `account-auth-progress` | Progress region |
| `account-recovery-actions` | In-progress recovery only (no persistent status chrome after T-034) |
| `account-retry-server` | State-specific (during unfinished OCP sign-in) |
| `account-retry-authorization` | State-specific |
| `account-reconnect` | State-specific |

### Account (removed by WU-04)

| Test ID | Removal |
|---|---|
| `account-logout` | Avatar-only logout |
| `account-auth-retry` | Generic retry → state-specific IDs |
| `switch-saved-account-profile-modal` (+ confirm/cancel) | No switch-account flow |
| `account-authorize-via-ocp-checkbox` / `account-sign-in-via-sip-password` | Replaced by mode tabs |
| `account-sign-in-methods` | Replaced by mode tabs |

### Settings gate / OCP Module

| Test ID | Notes |
|---|---|
| `settings-nav-*` | Existing nav ids; disabled + tooltip when gated |
| `ocp-module-settings-card` | Edit-only after WU-05 / T-034 (no status chrome) |
| Removed: `ocp-module-server-status` / `ocp-module-authorization-status` / `ocp-module-open-account-recovery` | Status → System State OCP tab |
| Removed: `ocp-module-connect`, `ocp-module-disconnect`, `ocp-module-auth-retry`, progressive first-time connect path | Sign-in ownership → Account |

### System State (T-034)

| Test ID | Notes |
|---|---|
| `settings-system-state-tabs` | SIP / OCP tablist |
| `settings-system-state-tab-sip` | SIP server tab |
| `settings-system-state-tab-ocp` | OCP module tab (disabled when module off) |
| `settings-ocp-server-status` / `settings-ocp-authorization-status` | Dual FSM projection |
| `settings-ocp-retry-server` / `retry-authorization` / `reconnect` | Recovery actions |

### i18n keys (target; WU-04/WU-05)

| Key | Purpose |
|---|---|
| `account.action.signIn` | «Войти» |
| `account.signIn.disabled.logoutFirst` | Login disabled tooltip |
| `account.mode.sipOnly` / `account.mode.ocpModule` | Mode tabs |
| `account.recovery.retryServer` / `retryAuthorization` / `reconnect` | Recovery actions |
| `settings.nav.disabled.authorizeFirst` | Pre-auth nav tooltip |

## Stop gates

- Do **not** mark F-028 production-ready from mock tests alone.
- Do **not** claim staging smoke complete unless `ocp-integration/OCP-Smoke-Checklist.md` is checked.
- P13 WU8 remains independent; claim explicitly if interrupting video smoke.

## WU-00 completion evidence

- ADRs: `docs/softphone/adr/ADR-AF-001` … `ADR-AF-004`
- Registry criteria updated for F-001 / F-014 / F-016 / F-023 / F-024 / F-028 (corrective pending track)
- `STATUS.md` + `TASK-QUEUE.md` point to this plan

## WU-01 completion evidence

- Domain: `savedAccountProfileLifecycle.ts`, schema v2 `persistedSavedAccountProfiles.ts` (v1 → successful migrate)
- Application: `PersistDraftAccountArtifactsUseCase`, `PromoteAuthorizedSipSessionUseCase`, `ResolveSavedAccountProfileAvailabilityUseCase`, deferred `AuthorizeSipAccountUseCase.promoteActiveSession`
- Facade: pre-auth draft persist before register; promote only after SIP success
- Ports/adapters: `markProfileSuccessful` on saved-profile repositories
- Tests: focused Domain/Application/Facade/File repo + OCP credential stubs; `npm run typecheck` + `npm run lint` green

## WU-02 completion evidence

- Domain: `OcpServerState`, `OcpAuthorizationState`, `ocpDualFsm` (+ pure reducer tests)
- Application: dual fields on `OcpSessionProjection` / `OcpProjectionHub` (attempt id, primary recovery action); `OcpAttemptTokenScope`; `OcpAuthenticateAndConnectService` (fresh HTTP + Application auth send + same-socket `retryAuthorization`); `OcpTransportRecoveryService`; `OcpBackedSignInOrchestrationService` recovery hooks; retry strategies `retry_ocp_server` / `retry_ocp_authorization` / `reconnect_ocp`
- Adapter: `OcpWebSocketAdapter` transport-only (no `ReconnectScheduler`, no auto-auth); `MockOcpGateway` aligned
- Compatibility: legacy `connectionState` / `isAuthenticated` derived for existing UI/host consumers
- Tests: dual FSM, adapter close/no-reconnect, auth-only same socket, fresh-token server retry, stale-attempt suppression, transport recovery, Facade/E-13 regressions; `npm run test` 2150 passed; typecheck + lint green
- Next implementation unit: **WU-03** (completed — see WU-03 evidence below)

## WU-03 completion evidence

- Application command: `accountSignInCommand.ts` (`sip_only` | `ocp`); Facade `signInAccount`
- Read model: `accountSignInViewModel.ts` + Facade `getAccountSignInViewModel` (secret booleans only; OCP-complete profile filter; login disabled reason; dual-FSM recovery keys)
- Recovery: `dispatchAccountRecoveryAction`; legacy `retryAuthorization` routes OCP strategies through it
- Active session: `rejectIfSipSessionActive` — no `ensureUnregisteredBeforeAccountSwitch` on Account path
- i18n: `account.signIn.disabled.logoutFirst`, mode/recovery keys (ru/en/fr/de/bg)
- Tests: `accountSignInCommand.test.ts`, `accountSignInViewModel.test.ts`, `AccountBootstrapFacade.accountSignIn.test.ts`; Facade A→B→A requires explicit logout
- Next implementation unit: **WU-04** (`/ui`)

## WU-04 completion evidence

- Renderer: mode tabs (`account-mode-tabs` / sip / ocp); OCP `InputGroup` login/domain/api-key (no stored key prefills); Save/Remember in OCP; Login always `account.action.signIn`; SIP-ready disables Login with `account.signIn.disabled.logoutFirst`
- Removed: `account-logout`, generic `account-auth-retry`, `SwitchSavedAccountProfileConfirmationModal` (+ stories/tests/CSS), OCP-vs-SIP method chooser test IDs
- Hook: `useAccountActions` → `signInAccount` / `getAccountSignInViewModel` / `dispatchAccountRecoveryAction`; helpers `accountActionsHelpers.ts`
- Shell wiring: `SettingsAccountPanel`, `SettingsPanel`, `SoftphoneReadyShell`, `AuthAccountShell`; `deriveAccountPanelActionsShell` no switch-enable path
- Dual status + recovery: `account-server-status`, `account-authorization-status`, `account-retry-server` / `retry-authorization` / `reconnect`
- i18n: `account.mode.tabsAria`, `account.server.*`, `account.authorization.*` (ru/en/fr/de/bg)
- Tests: `AccountPanel.test.tsx`, `SettingsAccountPanel.test.tsx`, `useAccountActions.test.ts`, `accountActionsHelpers.test.ts`; full suite 2148 passed / 1 skipped; typecheck + lint + i18n + ui:catalog green
- Next implementation unit: **WU-05** (completed — see WU-05 evidence below)

## WU-05 completion evidence

- Application: `deriveSettingsNavigationAvailability` / `resolveAllowedSettingsSection`; `deriveOcpModuleEditShell`
- Route guard: `useOverlayShell` clamps open/set/deep-link/diagnostics to Account while pre-auth (`replace`, preserves `settingsReturnTo`)
- Sidebar: `SettingsSidebar` + `SettingsPanel` consume availability VM; disabled non-Account items + tooltip `settings.nav.disabled.authorizeFirst`; OmniCall Kit is a top-level leaf below Integrations (pre-auth reachable); Integrations is an always-open cluster (OCP + External Services) when expanded — gated until account session, no accordion
- OCP Module edit-only: `useOcpSettingsPanel` binds active SIP settings bucket; removed Connect/Disconnect/login picker/auth retry; dual status `ocp-module-server-status` / `ocp-module-authorization-status`; recovery CTA → Account
- i18n: `settings.integrations.ocp.editOnly.description` / `activeProfile` / `openAccountForRecovery` (ru/en/fr/de/bg)
- Tests: availability unit; sidebar pre-auth disable; overlay redirect suite; OCP Module edit-only component tests; typecheck + lint + i18n green
- Next implementation unit: **ADR-AF-005** (completed — see below)

## ADR-AF-005 completion evidence (logic)

- ADR: `docs/softphone/adr/ADR-AF-005-account-session-before-sip-ready.md` (amends AF-001/003/004)
- Domain: `AccountSessionActivated` event
- Application: promote-before-register in `authorizeManualAccount` + `OcpSipCredentialService`; Settings gate + Login lock on `hasActiveAccountSession`; early OCP account-session activate; `deriveOcpSystemStateShell`
- i18n keys: `settings.systemState.tab.*`, `settings.systemState.ocp.*` (ru/en/fr/de/bg)
- Tests: focused Application suite + typecheck/lint green
- Next implementation unit: **T-034 `/ui`** (completed — see below)

## T-034 completion evidence

- Renderer: `SettingsSystemStatePanel` SIP/OCP Tabs (`settings-system-state-tabs` / `tab-sip` / `tab-ocp`); `SettingsSystemStateOcpTab` dual status + recovery (`settings-ocp-server-status` / `authorization-status` / `retry-*`); OCP tab disabled + tooltip when `ocpIntegration.enabled === false`
- Hook: `useOcpSystemStateShell` → `deriveOcpSystemStateShell` + `dispatchAccountRecoveryAction`
- Removed persistent Server/Authorization chrome from `AccountPanel` / `OcpModuleSettingsCard` (Account keeps in-progress recovery action buttons only)
- i18n: `settings.systemState.ocp.metric.*` / `liveSummary` (ru/en/fr/de/bg)
- Tests: System State tabs/OCP recovery; Account/OCP Module no status chrome; overlay gate on `hasActiveAccountSession`; full suite 2154 passed / 1 skipped; typecheck + lint + i18n + `ui:catalog` green
- Next implementation unit: **WU-06** (`/preflight` → `/review`)
