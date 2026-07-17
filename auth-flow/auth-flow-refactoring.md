# Auth Flow Refactoring — SIP/OCP Account Unification

**Status:** implementation + automated gate complete — staging OCP smoke SM-1…20 pending external environment  
**Last updated:** 2026-07-17  
**Primary features:** F-001, F-014, F-016, F-023, F-024, F-028, F-029  
**Contexts:** Settings (primary), Integration, Telephony  
**Roadmap position:** corrective P11/P01/P08 cross-cutting work; it must not interrupt P13 video work without an explicit task claim.  
**Handoff:** `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`  
**TASK-QUEUE:** T-033  


## Purpose

Move the complete OCP sign-in flow to **Settings → Account**, retain a fully working SIP-only flow, make avatar logout the only user logout entry point, and remove unsafe/ambiguous OCP recovery semantics.

This document is an execution contract. An agent must implement only the first unchecked work unit assigned to it, preserve all stated invariants, complete its tests, update this document, and create a handoff/work-history entry before another agent starts a dependent unit.

## Source of truth and mandatory reading

Before touching code, read:

1. `AGENTS.md`
2. `docs/softphone/STATUS.md`
3. `docs/softphone/MASTER_SYSTEM_PROMPT.md`
4. `docs/softphone/Architecture-Constitution.md`
5. `docs/softphone/Feature-Registry.md` — F-001, F-014, F-016, F-023, F-024, F-028
6. `docs/softphone/Legacy-Feature-Coverage.md` — LF-006, LF-007, LF-008, LF-011, LF-077, LF-079, LF-086, LF-087; OCP parity is documented under LF-018/019/041–049
7. `docs/softphone/UI-Architecture.md`
8. `docs/softphone/P11-Local-Account-Profiles-Design.md`
9. `docs/softphone/handoffs/P11-F024-Saved-Account-Profiles-Handoff.md`
10. `docs/softphone/handoffs/P11-Unified-Authorization-Gate-Handoff.md`
11. `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`
12. This file.

For a visible renderer unit also read:

- `.cursor/skills/ui-implementation-agent/SKILL.md`
- `.cursor/skills/ux-ui-flow-design/SKILL.md`
- `docs/ui-kit/UI-KIT.md`
- `docs/ui-kit/VISUAL-SPEC.md`

For a Domain/Application unit also read:

- `.cursor/skills/domain-implementation-agent/SKILL.md`
- `.cursor/skills/feature-slice-design/SKILL.md`

## Non-negotiable invariants

1. SIP-only sign-in remains available and does not require OCP configuration, OCP secrets, WebSocket, or OCP adapters.
2. Renderer calls only actions hooks and `AccountBootstrapFacade`; it never imports ports, adapters, repositories, WebSocket, Electron, or Domain helpers.
3. `OcpGateway` remains the sole OCP transport boundary. No `window.ws`, raw WebSocket, or adapter objects leak above the adapter.
4. The Domain stays framework-independent. It must not know React, Zustand, Electron, browser APIs, storage, or WebSocket.
5. API keys, ephemeral OCP tokens, and SIP passwords never enter JSON profile/settings files, Domain Events, projection snapshots, toast payloads, test snapshots, or logs.
6. Every user-visible string, tooltip, disabled reason, aria label, and error key is localized in `ru`, `en`, `fr`, `de`, `bg`.
7. A disabled control receives a semantic reason from an Application projection/`derive*` helper; a component must not invent business state.
8. Exactly one active user session exists. A new identity cannot replace an active SIP session; the operator must use avatar logout first.
9. Server recovery must never create two live sockets or reuse a stale ephemeral token for a new socket.
10. Success for OCP sign-in means **SIP ready**, not only WebSocket open or OCP user received.
11. Existing active calls, OCP status handling, OCP logout cascade, SIP recovery, headset settings, and profile-scoped settings must remain intact.

## User requirement checklist — baseline and target

Legend: `[x]` delivered before this plan; `[~]` partially delivered; `[ ]` not delivered / must be implemented.

| # | Requirement | Baseline | Target acceptance condition |
|---|---|---|---|
| 1 | Account has `SIP only` and `OCP module` tabs; OCP sign-in happens there | `[~]` Saved linked profile has an OCP/SIP method chooser; first-time OCP setup is in Integrations | `[x]` New and saved profiles can select both modes; OCP mode owns login/domain/key input and starts the only sign-in command |
| 2 | Remove Account logout, Account retry, and switch-account | `[ ]` Account has logout/retry and switch confirmation; Facade unregisters before switching | `[x]` Account Login is disabled while a session is active with localized tooltip; only avatar logout ends a session |
| 3 | Keep Save profile / Remember password in OCP mode | `[~]` Secure secret storage exists; OCP UI has API key persistence | `[x]` OCP mode exposes both controls and persists opted-in profile metadata + SIP password securely before login attempt |
| 4 | Saved profile supports both modes; ask OCP domain/key only when absent | `[~]` `linked + domain + API key` availability is computed, but via a different Account/Integrations split | `[x]` Selecting a profile hydrates SIP + OCP draft; OCP fields are hidden only when that profile has complete OCP configuration |
| 5 | Save profile/password before successful authorization | `[ ]` Saved profile and remembered SIP password are persisted after SIP registration; active SIP account may already persist pre-register | `[x]` Explicit opt-in saves draft profile metadata and secret before attempt; failed attempt leaves a reusable draft but never promotes it to active successful session/settings || 6 | Disable all Settings except Account before authorization | `[ ]` Default route is Account, but sidebar and deep links remain open | `[x]` Sidebar and route guard permit only Account until SIP is registered; every denied section has a reason tooltip and redirects safely |
| 7 | OCP Module is edit-only for authorized active user | `[ ]` Integrations has login picker, first-time setup, Connect/Disconnect, Retry | `[x]` OCP Module is inaccessible before SIP-ready and offers configuration editing only for the active authenticated profile |
| 8 | Separate Server and Authorization status/retry | `[~]` `connectionState`, `authFeedback`, timeout, and one general Retry exist; adapter auto-reconnects with old token | `[x]` dual FSM + Account recovery; Settings gate + OCP Module edit-only (WU-05) |

## Target interaction contract

### Account mode and profile selection

1. Account shows two tabs above the user field:
   - **SIP only**
   - **OCP module**
2. The mode is local UI intent, not a replacement for the SIP account type.
3. Account always lets the operator choose a saved profile or start a new draft.
4. In SIP mode, retain the existing SIP fields and sign-in behavior.
5. In OCP mode, render three `InputGroup` controls with `DropdownMenu` selection where relevant:
   - OCP login / user;
   - OCP Domain;
   - OCP Proxy API Key.
6. The profile picker in OCP mode lists only profiles whose OCP configuration is complete. A SIP-only profile remains selectable through the normal Account profile selector so it can be configured for OCP; it must not be incorrectly presented as OCP-ready.
7. Choosing a saved profile loads its secrets through the narrow ADR-AF-006 Facade boundary into local form state only. Password and API key are populated and masked by default; login remains in the profile tab.
8. Saved profiles show domain/server and applicable secret fields. A complete profile signs in with one button and does not trigger overwrite merely because stored secrets were hydrated.

### Login, save, and logout

1. Button label is `Войти` / localized equivalent, never `Авторизоваться`.
2. If SIP is registered, Login is disabled regardless of selected mode or profile. Tooltip: `Необходимо выйти из аккаунта` / localized key.
3. Account contains no logout action and no account-switch confirmation. Avatar logout is the only logout entry point and preserves existing OCP logout-reason cascade.
4. Account contains no generic Retry button. Recovery is attached to its corresponding Server or Authorization state; an Account sign-in may expose those state-specific actions while the session is not SIP-ready.
5. On explicit Save profile / Remember password selection, save:
   - profile metadata without secrets;
   - remembered SIP password in `SecretStoragePort`, if available;
   - OCP API key in its profile-scoped `SecretStoragePort` secret.
6. A save failure must be visible and must prevent a login attempt only when the operator explicitly requested that artifact. Never silently drop an opted-in save.
7. Invalid credentials do not force an impossible logout when no session exists. The draft stays editable and can be corrected/retried. The avatar-logout requirement applies only after a session becomes active.

### Settings access

1. Before SIP registration, Account is the only Settings section available.
2. Direct navigation to another Settings hash route redirects to Account with no data loss.
3. After SIP registration, all permitted settings return. Existing route behavior and overlay layout remain unchanged.
4. OCP Module receives the same gate and then edits only active-profile configuration; it must not sign in, connect, disconnect, or retry.

### OCP Server and Authorization recovery

Two independent state machines are required. Do not overload a single enum.

| Projection | States | Meaning |
|---|---|---|
| Server / transport | `disconnected`, `connecting`, `connected`, `reconnecting`, `failed` | WebSocket lifecycle only |
| Authorization | `idle`, `pending`, `authorized`, `timeout`, `rejected` | OCP auth response only; `rejected` carries semantic reason such as `SESSION_EXIST` or `INVALID_TOKEN` |

Required actions:

| UI situation | Action | Required behavior |
|---|---|---|
| Server failed/disconnected | `Retry server` | close stale socket, acquire a **fresh HTTP token**, create one new WebSocket, send auth token |
| Server connected, Authorization timeout/rejected, socket still open | `Retry authorization` | send auth token again through the same open socket; do not create a second socket |
| `SESSION_EXIST` | `Retry server` | do not resend into old socket; request new HTTP token, open new socket, continue flow |
| Server connected + authorized | `Reconnect` | close old socket, fresh HTTP token, create new socket, send auth token, await OCP auth and SIP outcome |
| Socket drops | recovery policy | Application owns retry with fresh HTTP token; adapter must not retry using a retained token |

An ephemeral token may exist only in an in-memory, attempt-scoped Application object until the attempt ends. It must be cleared when the attempt succeeds, fails terminally, logs out, or is superseded.

## ADR gate — no implementation before approval

Create and approve ADRs before WU-01:

- [x] **ADR-AF-001 — Saved draft profile lifecycle.** Defines pre-auth draft persistence, successful-use marker, active profile/session semantics, cleanup, and migration/rollback of current pre-register active key behavior. → `docs/softphone/adr/ADR-AF-001-saved-draft-profile-lifecycle.md` (Accepted 2026-07-16)
- [x] **ADR-AF-002 — OCP transport/auth dual FSM and recovery ownership.** Defines Application-owned fresh-token reconnect, token lifetime, attempt identity, and adapter responsibilities. → `docs/softphone/adr/ADR-AF-002-ocp-transport-auth-dual-fsm.md` (Accepted 2026-07-16)
- [x] **ADR-AF-003 — Account is the sole sign-in surface.** Defines Account vs Integrations responsibility, avatar-only logout, removal of switch-account, and recovery UI location. → `docs/softphone/adr/ADR-AF-003-account-sole-sign-in-surface.md` (Accepted 2026-07-16)
- [x] **ADR-AF-004 — Settings authorization gate.** Defines SIP-ready as the gate condition, direct-route redirect, disabled navigation, and allowed pre-auth exceptions (only Account). → `docs/softphone/adr/ADR-AF-004-settings-authorization-gate.md` (Accepted 2026-07-16)
- [x] **ADR-AF-005 — Account session before SIP-ready.** Separates local account-session activation from SIP readiness. → `docs/softphone/adr/ADR-AF-005-account-session-before-sip-ready.md`
- [x] **ADR-AF-006 — Renderer boundary for saved secret display.** Allows selected-profile local form hydration without projection/storage leakage. → `docs/softphone/adr/ADR-AF-006-renderer-boundary-secret-display.md`
- [x] **ADR-AF-007 — Local user notification journal.** Defines central capture, sanitization, rolling retention and popup suppression semantics. → `docs/softphone/adr/ADR-AF-007-notification-journal.md`

The ADRs update F-016, F-024, and F-028 acceptance criteria. Removing the current switch flow is an intentional F-024 / LF-077 behavior change and is not allowed as an undocumented cleanup.

Frozen UX states, recovery actions, and canonical test IDs: see handoff `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`.

## Work units and dependency order

### WU-00 — Freeze scope and publish ADRs

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Settings + Integration; documentation and architecture only  
**Depends on:** none  
**Blocks:** every other work unit

#### How to do it

1. Reconcile the target contract in this document with Feature Registry acceptance criteria.
2. Add the four ADRs above. State rejected alternatives:
   - UI-only move without changing recovery ownership;
   - adapter auto-reconnect with stale token;
   - saved profile JSON containing passwords/API keys;
   - direct UI route checks without projection/route guard.
3. Create a new F-028 corrective work unit / handoff; do not silently mark existing F-028 as complete.
4. Update `STATUS.md` and `TASK-QUEUE.md` to point to this refactoring plan.
5. Define exact user-visible states, recovery actions, and test IDs before UI work begins.

#### Completion checklist

- [x] ADR-AF-001 through ADR-AF-004 approved.
- [x] F-001/F-014/F-016/F-023/F-024/F-028 criteria and test plans updated.
- [x] No claim that staging OCP smoke is complete unless `OCP-Smoke-Checklist.md` is actually checked.
- [x] Handoff names the first implementation unit: WU-01.

---

### WU-01 — Profile lifecycle and secret persistence

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Settings → Domain, Application, Ports, adapters/tests  
**Depends on:** WU-00  
**Blocks:** WU-03 and WU-04  
**Affected IDs:** F-001, F-023, F-024, F-028; LF-006, LF-007, LF-077

#### Goal

Permit an opted-in Account draft to persist reusable profile metadata and secure secrets before an authentication attempt, without switching the active SIP session/profile or applying settings before SIP registration succeeds.

#### How to do it

1. Model draft vs successful state explicitly in Application/Domain-facing profile data. Do not infer successful authorization from the mere existence of metadata or a secret.
2. Keep `SavedAccountProfile` JSON secret-free. Extend persistence only with non-secret fields justified by ADR-AF-001.
3. Introduce an application operation that atomically coordinates:
   - validated profile metadata persistence;
   - `SecretStoragePort.saveSecret` for opted-in SIP password;
   - profile-scoped OCP API key save;
   - classified compensation/error reporting if one required opted-in write fails.
4. Split the current early `AuthorizeSipAccountUseCase` side effect from session promotion if necessary:
   - do not change `activeProfileKey` for a failed candidate;
   - do not replace `getSipAccount()` active session while another session is active;
   - apply profile settings side effects only after registration success.
5. Preserve existing remembered-password quick sign-in and deletion behavior. Delete still removes profile-associated SIP and OCP secrets.
6. Add a query/view model that returns profile metadata plus booleans such as `hasSavedSipPassword`, `hasSavedOcpApiKey`, `hasCompleteOcpConfiguration`; never return secret strings.
7. Make profile lookup stable across saved profile IDs and provisional OCP account keys. If OCP credentials later yield a distinct SIP identity, follow ADR-AF-001 migration/link policy rather than creating duplicate secrets accidentally.

#### Do not

- Do not save passwords/API keys in `SavedAccountProfile`, `UserSettings`, index JSON, events, logs, or test fixtures.
- Do not make draft profiles auto-login at startup.
- Do not apply theme/language/headset/recovery settings for a failed candidate profile.
- Do not remove existing profile files or secrets in a migration without a reversible migration test.

#### Required tests

- Domain: key derivation, draft/successful lifecycle validation, no-secret serialization.
- Application: selected save options persist before a failed SIP/OCP attempt; active profile key/session remains unchanged after failure; success promotes only the authenticated profile.
- Adapter: file repository and secret storage round trip, atomic/compensated failure, corruption behavior.
- Regression: saved SIP profile quick sign-in, forget password, delete profile removes all relevant secrets, A→B→A restored settings after explicit logout.

#### Completion checklist

- [x] Pre-auth save is opt-in and observable.
- [x] Failed candidate does not become active SIP session/profile.
- [x] All persisted documents remain secret-free.
- [x] Mock and real composition use the same port contract.
- [x] WU-01 focused tests pass.

---

### WU-02 — OCP dual FSM and safe recovery orchestration

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Integration → Domain types, Application, ports, adapter/tests  
**Depends on:** WU-00  
**Blocks:** WU-03, WU-04, WU-05  
**Affected IDs:** F-014, F-028; LF-008, LF-048, LF-049, LF-058, LF-079

#### Goal

Replace the mixed OCP `connectionState`/generic retry behavior with separately projected Server and Authorization states, while making Application the sole owner of reconnects requiring a fresh HTTP token.

#### How to do it

1. Add serializable transport/auth state types and pure reducer tests. Retain compatibility selectors only temporarily; migrate every consumer before deleting old state.
2. Give each sign-in/recovery attempt an opaque correlation/attempt ID. Ignore late socket events from superseded attempts.
3. Keep `OcpWebSocketAdapter` transport-only:
   - create/close one socket;
   - emit typed connection/message events;
   - send a typed `auth` command;
   - no scheduled reconnect using stored `OcpConnectionConfig.authToken`.
4. Create Application services/use cases for:
   - fresh-token server retry/reconnect;
   - auth-only retry over the same open socket;
   - terminal cleanup on logout/terminate.
5. Let the Application service call `OcpProxyAuthenticatePort` before every new socket. It then provides the fresh token to `ConnectOcpUseCase`.
6. Preserve `OcpBackedSignInOrchestrationService` as the owner of HTTP → WS → credentials → SIP-ready sequencing. Refactor it rather than duplicating a second OCP/SIP flow.
7. Make all terminal branches cancel timers, credentials waiters, pending reconnect work, and obsolete socket listeners.
8. Keep `INVALID_TOKEN` and `SESSION_EXIST` classified separately; follow ADR-AF-002 for which action is permitted.

#### Do not

- Do not put HTTP authentication in `OcpWebSocketAdapter`.
- Do not expose raw socket state or token to React/Zustand.
- Do not use `setInterval`; timers must be owned, cancelable, and tested.
- Do not reconnect with the adapter's previous config token.
- Do not allow concurrent `connectOcp`, auto recovery, and auth retry to create duplicate sockets.

#### Required tests

- Pure FSM reducer tests for all state combinations and invalid action guards.
- Application unit tests: fresh HTTP token is acquired for every new socket; auth retry sends on same socket only; `SESSION_EXIST` forces server retry; no retry on logged-out terminal state.
- Adapter tests: `close` does not schedule stale-token reconnect; handlers are detached; send fails safely when not open.
- Integration tests: network drop, HTTP failure, auth timeout, `INVALID_TOKEN`, `SESSION_EXIST`, terminate, success to SIP-ready, concurrent retry clicks / stale event suppression.
- Regression: OCP telephony bridge, OCP logout cascade, auto-connect policy, SIP-only bootstrap.

#### Completion checklist

- [x] Server and Authorization projections are independent and serializable.
- [x] One-socket invariant is proven by tests.
- [x] All new socket attempts use fresh HTTP token.
- [x] Auth retry does not create a socket when server remains connected.
- [x] WU-02 focused tests pass.

---

### WU-03 — Facade contract and Account view models

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Application + renderer shell hooks/projections  
**Depends on:** WU-01 and WU-02  
**Blocks:** WU-04 and WU-05  
**Affected IDs:** F-001, F-014, F-024, F-028; LF-006, LF-007, LF-008, LF-077

#### Goal

Expose one typed, source-agnostic Account sign-in command and read models that make the renderer simple and prevent profile switching, secrets leakage, or protocol branching in components.

#### How to do it

1. Define typed Account intents, for example `sip_only` and `ocp`, and validate all input at Application boundaries.
2. Replace separate Account/Integrations sign-in entry points with one facade command that accepts:
   - selected/new profile identity;
   - mode;
   - non-secret fields;
   - secure values only at the call boundary;
   - save preferences;
   - correlation ID.
3. Return a typed result/projection reason, not localized strings and not raw protocol errors.
4. Add facade queries that supply:
   - profile options appropriate to SIP and OCP selectors;
   - selected profile’s non-secret configuration;
   - boolean secret availability;
   - Login disabled reason;
   - Server/Auth state and allowed action keys.
5. Remove `ensureUnregisteredBeforeAccountSwitch` from Account sign-in behavior. The facade must reject attempts when an active identity exists and return a reason key; it must never silently unregister.
6. Preserve avatar logout methods and its OCP-aware logout-reason modal contract.
7. Deprecate/remove generic `retryAuthorization` only after all callers use explicit state-specific facade actions.

#### Do not

- Do not give renderer components access to `AccountBootstrapFacade` instance, OCP ports, profile repositories, or secret adapters.
- Do not transport password/API key through `AuthorizationAttemptContext`, logs, or projections.
- Do not couple host API methods to renderer Account types; maintain source-agnostic Facade semantics.

#### Required tests

- Facade command tests for SIP-only and OCP paths, new/saved/draft/OCP-ready profiles.
- Active session blocks same and other profile login with correct semantic reason and no unregister call.
- Queries never return secrets and distinguish complete/incomplete OCP configuration.
- Explicit recovery action dispatch follows WU-02 policies.
- Existing external OCP host contract tests stay green.

#### Completion checklist

- [x] Account UI needs no protocol decision beyond rendering a typed view model.
- [x] Switch-account APIs are unused/removed from Account path.
- [x] No secret crosses a renderer-facing return type.
- [x] WU-03 focused tests pass.

---

### WU-04 — Account UI: modes, profiles, saving, and recovery

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Renderer UI  
**Depends on:** WU-01, WU-02, WU-03  
**Blocks:** WU-06  
**Affected IDs:** F-001, F-016, F-024, F-028; LF-006, LF-011, LF-077, LF-086

#### Goal

Implement the unified Account sign-in screen using existing UI Kit primitives and projections while removing Account logout/switch/generic retry UI.

#### How to do it

1. Write the UX state inventory before JSX:
   - new SIP profile;
   - saved SIP profile;
   - new OCP profile with missing domain/key;
   - saved incomplete OCP profile;
   - saved complete OCP profile;
   - saving artifacts;
   - SIP/OCP progress;
   - Server error/retry;
   - Authorization error/retry;
   - SIP-ready locked Login;
   - keyboard, screen-reader, light, dark, reduced-motion states.
2. Add the two mode tabs above the user input. They are accessible tabs, not buttons that own authorization rules.
3. Use existing `InputGroup`, `DropdownMenu`, `Input`, `Button`, `Switch`, `Tooltip`/`IconTooltip`, and semantic `AppIcon`; do not create local primitive clones.
4. Render OCP Login, Domain, and API Key as `InputGroup` fields. The API key control must support visibility toggle without reading a stored key into the input.
5. When a profile changes, hydrate only non-secret values through the view model. Clear ephemeral drafts on mode/profile change only when that avoids cross-profile secret leakage.
6. Show Save profile and Remember password in OCP mode and bind them to the WU-03 facade command.
7. Replace Account button copy with `account.action.signIn` equivalent. For registered session, disable it and show the required localized logout-through-avatar reason.
8. Remove:
   - `account-logout`;
   - Account generic retry;
   - startup retry from Account unless WU-00 ADR retains a state-specific Account recovery placement;
   - `SwitchSavedAccountProfileConfirmationModal` imports, state, CSS, stories, and tests.
9. Show only actions allowed by the Server/Auth view model. The component sends callbacks; it does not decide whether to create/reuse a socket.
10. Update Storybook for all critical modes in light/dark if the component has stories. Regenerate UI catalog if component metadata/test IDs change.

#### Do not

- Do not put OCP HTTP/WS/SIP orchestration in React hooks or components.
- Do not hardcode copy, colors, or theme branches.
- Do not use browser storage or Electron from renderer UI.
- Do not render stored API key or password.

#### Required tests

- Component and hook tests for every state above, including keyboard tab behavior and disabled tooltip.
- New profile OCP saves opted-in artifacts before attempting login.
- Saved complete OCP profile hides domain/key; incomplete profile asks only missing inputs.
- SIP-only UI remains unchanged in behavior.
- No Account logout/switch/generic retry test IDs or behavior remain.
- i18n key coverage in all five locales; at least ru/en rendering tests.

#### Completion checklist

- [x] Account is the only sign-in surface.
- [x] Both modes work for new and saved profiles as specified.
- [x] Account cannot logout or switch identity.
- [x] UI remains presentational and accessible.
- [x] WU-04 focused tests and `npm run ui:catalog` pass.

---

### WU-05 — Settings authorization gate and OCP Module reduction

**Status:** `[x] done` (2026-07-16)  
**Context/layers:** Settings projections + renderer routing/UI  
**Depends on:** WU-02 and WU-03  
**Blocks:** WU-06  
**Affected IDs:** F-016, F-024, F-028; LF-076, LF-077, LF-082, LF-084, LF-086, LF-087

#### Goal

Make Account the only pre-auth Settings section and make OCP Module an active-user configuration editor with separated state display only.

#### How to do it

1. Create a pure Application `deriveSettingsNavigationAvailability`/equivalent view model from SIP registration projection:
   - Account enabled;
   - every other section disabled with `settings.nav.disabled.authorizeFirst`;
   - no localized text in the derive function.
2. Pass availability through shell hook → `SettingsPanel` → `SettingsSidebar`. Use UI Kit disabled behavior and tooltip; do not hardcode a disabled check in each component.
3. Add a route/overlay guard. On a direct route to blocked Settings section, redirect to Account using the existing navigation API and preserve the overlay/call context.
4. Gate OCP Module the same way. After SIP-ready, bind it only to active profile settings.
5. Remove first-time setup, free login picker, Connect, Disconnect, and generic Retry from `OcpModuleSettingsCard`.
6. Retain only active profile OCP configuration:
   - enabled;
   - autoConnect;
   - OCP Domain;
   - rotate/save/delete API key;
   - read-only Server and Authorization state with actions that route back to Account when sign-in/recovery is needed.
7. If settings changing can invalidate a live OCP session, define explicit save/apply semantics in ADR-AF-003; never silently reconnect from a form blur.

#### Do not

- Do not block Account itself.
- Do not bypass the route guard through sidebar group child navigation or `onOpenIntegrationsSettings`.
- Do not lose active call context while redirecting.
- Do not let Integrations mutate another inactive profile.

#### Required tests

- Unit tests for availability view model.
- Sidebar tests: all non-Account sections disabled pre-auth with accessible reason.
- Route tests: all blocked direct hashes redirect to Account; registered user still opens all sections.
- OCP Module tests: no Connect/Disconnect/login picker/retry; active profile edit persists correctly.
- Regression: Settings overlay deep links, header menu, active call overlay, avatar logout.

#### Completion checklist

- [x] No pre-auth navigation path reaches editable non-Account settings.
- [x] OCP Module has no sign-in ownership.
- [x] Redirects preserve shell and active calls.
- [x] WU-05 focused tests pass.

---

### WU-06 — Cross-flow verification, documentation, and release gate

**Status:** `[~] automated gate done` (2026-07-17; real staging smoke pending)  
**Context/layers:** all; verification only  
**Depends on:** WU-04 and WU-05  
**Affected IDs:** all IDs named above

#### How to do it

1. Run focused suites after each WU, then full verification only once the feature slice is complete.
2. Update F-001/F-014/F-016/F-023/F-024/F-028 acceptance criteria and test evidence to match shipped behavior exactly.
3. Update `docs/softphone/I18N-Coverage.md`, UI Component Catalog, `STATUS.md`, relevant handoff, and this checklist.
4. Complete manual staging smoke; do not mark F-028 production-ready based on mock tests alone.
5. Run reviewer gate only after all evidence below is available.

#### Required automated commands

```bash
npm run test
npm run lint
npm run typecheck
npm run i18n:check
npm run registry:check
npm run ui:catalog:check
```

#### Required manual smoke

- [ ] SIP-only new profile: save/remember, valid login, logout via avatar, login again.
- [ ] SIP-only invalid credentials: draft remains editable; no active-profile/session corruption.
- [ ] OCP new profile: domain/key/login save, HTTP → WS → creds → SIP-ready.
- [ ] OCP saved complete profile: fields hidden as specified; no secret rendered.
- [ ] OCP saved incomplete profile: only missing configuration requested.
- [ ] Server network disconnect: one fresh-token reconnect; no duplicate socket.
- [ ] Authorization timeout with live socket: auth resend only; same socket instance.
- [ ] `SESSION_EXIST`: fresh-token/new-socket retry only.
- [ ] `INVALID_TOKEN`: ADR-defined recovery occurs once; terminal failure is understandable.
- [ ] Avatar logout: OCP reason path cascades and returns Account to sign-in state.
- [ ] Pre-auth direct routes to every Settings section redirect to Account.
- [ ] Active call is not unmounted or lost by Settings redirect/gate.
- [ ] Restart: no secret appears in profile JSON/logs; only explicitly remembered credentials are available.

#### Completion checklist

- [ ] All required commands pass.
- [ ] Manual smoke checklist is checked with environment/date evidence.
- [ ] `/preflight` then `/review` passes.
- [ ] Feature Registry, legacy coverage references, STATUS, handoff, i18n coverage, and UI catalog are synchronized.
- [ ] Version bump is evaluated under `.cursor/rules/version-release.mdc` after user-visible feature completion.

## Agent execution protocol

Use this template when assigning a work unit:

```text
Implement Auth Flow Refactoring <WU-NN> only.

Read:
- auth-flow/auth-flow-refactoring.md
- docs/softphone/MASTER_SYSTEM_PROMPT.md
- docs/softphone/Architecture-Constitution.md
- docs/softphone/Feature-Registry.md
- docs/softphone/Legacy-Feature-Coverage.md
- docs/softphone/UI-Architecture.md (renderer work)

Scope:
- Features and LF IDs exactly as declared by WU-NN.
- Do not start a dependent unchecked WU.

Before code:
1. Confirm ADR and predecessor WU gates are checked.
2. List changed events, ports, facade methods, projections, routes, and test files.
3. State how SIP-only mode and secret boundaries remain safe.

Implementation:
- Keep UI → Application → Domain → Ports → Adapters → Infrastructure.
- Use mock tests before real adapter behavior.
- Use semantic i18n keys in all five locales.
- Keep components presentational; actions flow through a facade/actions hook.

Completion:
- Run WU-focused tests and required lint/type/i18n checks.
- Update this plan's WU status/checklist, Feature Registry, relevant handoff, and work-history.
- Report blockers rather than making undocumented architectural decisions.
```

## Current file map

This is a starting map, not permission to edit every file in one WU.

| Concern | Current files |
|---|---|
| Account UI | `src/renderer/components/account/AccountPanel.tsx`, `SettingsAccountPanel.tsx`, `SavedAccountProfileSelector.tsx`, `useAccountActions.ts` |
| Account shell | `src/renderer/shells/SoftphoneReadyShell.tsx`, `useAccountPanelShell.ts`, `deriveAccountPanelActionsShell.ts` |
| OCP Settings UI | `OcpModuleSettingsCard.tsx`, `SettingsIntegrationsPanel.tsx`, `useOcpSettingsPanel.ts` |
| Settings navigation | `SettingsSidebar.tsx`, `SettingsPanel.tsx`, `settingsSections.ts`, `useOverlayShell.ts` |
| Profile domain/persistence | `SavedAccountProfile.ts`, `SettingsAccountKey.ts`, saved-profile repositories, `SecretStoragePort.ts` |
| Facade/application | `AccountBootstrapFacade.ts`, `AuthorizeSipAccountUseCase.ts`, `SaveAccountProfileUseCase.ts` |
| OCP orchestration | `OcpBackedSignInOrchestrationService.ts`, `OcpAuthenticateAndConnectService.ts`, `OcpInvalidTokenReauthService.ts`, `authorizationRetryContext.ts` |
| OCP transport/projection | `OcpWebSocketAdapter.ts`, `OcpGateway.ts`, `OcpConnectionState.ts`, `ocpSessionProjection.ts`, `OcpProjectionHub.ts` |

## Risks that require a stop, not a workaround

Stop and request an ADR clarification if an agent encounters any of the following:

- The implementation would persist a password, API key, or OCP token outside `SecretStoragePort`.
- The renderer needs direct adapter/repository/WebSocket/Electron access.
- The same action would create two OCP WebSockets or cannot identify stale events.
- A failed sign-in would overwrite active SIP account/profile settings with no rollback/promotion rule.
- A requested UI behavior conflicts with avatar-only logout or Account-only pre-auth access.
- A change would drop a listed F-024/LF-077 profile flow without documented replacement.
- An OCP recovery requirement cannot be proven in a mock/integration test.

## Change log

| Date | Change |
|---|---|
| 2026-07-16 | Plan created from architecture, UI, OCP orchestration, and profile-persistence analysis. No implementation performed. |
| 2026-07-16 | **WU-00 done:** ADR-AF-001…004 Accepted; Feature Registry corrective criteria; handoff `P11-Auth-Flow-Refactoring-Handoff.md`; STATUS/TASK-QUEUE T-033; frozen states/actions/test IDs. Next: WU-01. |
| 2026-07-16 | **WU-01 done:** draft/successful lifecycle (schema v2); `PersistDraftAccountArtifactsUseCase`; deferred session promotion after SIP register; availability VM (secret booleans only); secret migration link policy. Next: WU-02. |
| 2026-07-16 | **WU-02 done:** dual FSM (`OcpServerState`/`OcpAuthorizationState` + reducers); transport-only `OcpWebSocketAdapter` (no stale-token reconnect / no auto-auth); attempt-scoped token + auth-only retry; Application `OcpTransportRecoveryService`; legacy `connectionState` bridge. Next: WU-03. |
| 2026-07-16 | **WU-03 done:** `signInAccount` + `getAccountSignInViewModel` + `dispatchAccountRecoveryAction`; active-session reject (no unregister); secret-free VMs; i18n keys for login/recovery. Next: WU-04 (`/ui`). |
| 2026-07-16 | **WU-04 done:** Account mode tabs SIP/OCP; `signInAccount` wiring; removed logout/switch/generic retry; dual-status recovery actions; InputGroup OCP fields; Switch modal deleted. Next: WU-05 (`/ui`). |
| 2026-07-16 | **WU-05 done:** `deriveSettingsNavigationAvailability` + route/sidebar gate; OCP Module edit-only (no Connect/Disconnect/login picker); dual status read-only + Account recovery CTA. Next: WU-06. |
| 2026-07-16 | **ADR-AF-005 accepted + logic:** promote profile/settings on Login (not SIP-ready); Settings gate + Login lock on `hasActiveAccountSession`; `AccountSessionActivated`; `deriveOcpSystemStateShell`; amends AF-001/003/004. UI tabs → TASK-QUEUE T-034 `/ui`. |
| 2026-07-16 | **T-034 done:** System State SIP/OCP tabs; `useOcpSystemStateShell`; dual status removed from Account + OCP Module; overlay tests on account-session gate. Next: WU-06. |