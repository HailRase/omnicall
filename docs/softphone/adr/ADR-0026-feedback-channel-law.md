# ADR-0026: Feedback Channel Law

- Status: **Accepted** (amended 2026-08-06)
- Date: 2026-08-02
- Amended: 2026-08-06 — Account sign-in channel split (form vs server/register)
- Deciders: Softphone platform
- Related: F-016 / LF-060; F-029 / ADR-AF-007; F-034 / ADR-0025; ADR-0013; F-001

## Context

Renderer historically mixed outcome feedback across inline `Alert` strips, modal `role="alert"` blocks, and `useNotifications` toasts. Dual presentation (same error as toast **and** strip) created noise; migrating every message to toast alone would downgrade persistent form errors, connection recovery, and rich diagnostic payloads.

The 2026-08-02 decision put **all** Account sign-in errors on a persistent `AccountPanel` Alert and journaled them with `interruptClass: "critical"` (toast suppressed). Operator feedback: SIP **403 / registration failed** with System State CTA above the password field reads like a password-field error and conflicts with notification UX.

Affected: Settings, Account, Contacts, History, Telephony chrome, Integrations. Layers: UI + Application capture only.

## Decision

### 1. One channel per feedback class

| Class | Channel | Examples |
| --- | --- | --- |
| Ephemeral outcome | `notify` → Capture → toast (+ journal) | prefs export/import, contact save/delete, history delete, call op fail, SDK/OCP/EA/ES save ops, screen-share confirm, **Account server/register failures** |
| Form-persistent error | Inline Alert / FormField on owning surface | Account **validation** / required fields / missing saved profile |
| Persistent system state | Shell banner / Alert with action | `OcpConnectionBanner`, `UpdateAvailableBanner` |
| Blocking / multi-stage | Modal / overlay | OCP proxy conflict, sign-in progress, bootstrap/shutdown |
| Rich diagnostic result | Inline result panel | External Services run body/status |
| List / empty load state | Panel empty/error region | Contacts/history list load fail |

**Anti-dual:** one source must not render two presentational channels. Prefer OCP pattern: owning surface wins; skip or suppress the other.

**OCP remote `entity: "notification"`:** sole channel is `notify` → Capture → Sonner (no inline Alert). Mapper uses wire `body` + `type` only; Softphone Notification Center prefs own presentation; see ADR-0025 / `notification-center/03-POLICY-AND-CHANNELS.md`.

### 2. Account sign-in errors (amended 2026-08-06)

Classifier (Application pure): `classifyAccountSignInErrorPresentation` / `assignAccountSignInErrorChannels`.

#### Account feedback matrix

| Outcome class | Channel | System State CTA | Journal |
| --- | --- | --- | --- |
| Form validation / required fields / profile not found | `AccountPanel` Alert (`inlineError`) | No | `notify` + `interruptClass: "critical"` (toast suppressed) |
| Server / transport / REGISTER failure (incl. 403, 401 from SIP) | Toast via `notify` (`notificationError`) | Toast action `account.notification.openSystemStateAction` | Yes — `interruptClass: "actionable"` (toast visible under default prefs) |
| Account success / soft warnings | Toast (`informational`) | No | Yes |
| OCP multi-stage attempt failure | `OcpSignInProgress` modal | Modal / progress owns UX | Suppress duplicate Account toast while modal owns attempt |
| OCP unexpected-drop recovery | `OcpConnectionBanner` only (`uiSurface: silent`) | Banner Retry | No Account toast dual |

Rules:

- **Form-persistent** = validation / input ownership that never left the form boundary → Alert only (no toast).
- **Ephemeral system outcome** = SIP/OCP-server/register failures discovered after submit → **toast only**; `setError(null)` so no stale Alert above password.
- System State CTA lives on the **toast action** for notification-class errors (not on Account Alert).
- Do not invent password FormField “invalid” from REGISTER 401/403 — map to notification with humanized keys (`mapAccountAuthorizationError`).
- `critical` remains “toast-suppressed journaled event” for **validation-class** Account errors only; it must **not** be used to hide server/register Account failures.
- True ADR-0013 critical shell raises are unchanged.

### 3. Confirm dialogs

Delete/confirm modals must not embed outcome error strips. Failures/successes use `notify` (history/contacts delete already tagged). Modal may stay open on failure; toast carries the message.

### 4. Multi-call policy chrome

`policyErrorMessage` renders once in `CallSessionStack`. `CallLinesShell` must not duplicate it.

### 5. Settings integration mutations (2026-08-02 continuation)

- SDK: save/revoke/user-initiated gateway fail → toast; `originsInvalid` + live poll gateway loss → inline strip (poll must not toast-spam).
- OCP Integrations edit: save/load fail → toast; `domainRequired` reserved for FormField.
- External Applications: save fail → toast; load/history remain panel regions.
- External Services: non-validation request mutate fail → toast via `presentExternalServicesOutcomeError`; `validation.*` stays inline; RunResult / journal load / collections load Alert unchanged.
- Screen share: `confirmFailed` → toast; `loadFailed` stays dialog region.

### 6. Non-goals (unchanged)

- Replacing ADR-0013 critical raises with toast
- Replacing OCP/Update banners with toast (compact chip polish of `OcpConnectionBanner` stays in the shell-banner channel — see `UI-Design-System.md` § OCP connection banner)
- Moving FormField validation into toast
- Disabling journal when popup suppressed (ADR-AF-007 / ADR-0025)
- Redesigning OcpSignInProgress / silent recovery banner **channel** in this amendment (visual density of the banner may evolve without migrating to Sonner)

## Alternatives Considered

| Alternative | Rejected because |
| --- | --- |
| All feedback via toast only | Downgrades persistent form validation and recovery banners |
| Keep all Account errors on Alert (2026-08-02) | 403/register above password feels like field error; conflicts with notification UX |
| Keep dual Account Alert + toast | Noise; violates anti-dual |
| Skip `notify` for Account errors | Loses journal trail |
| Use `critical` for server/register (toast-suppressed) | Hides the intended ephemeral channel |

## Consequences

- Positive: form ownership for validation; notification channel for post-submit system failures; System State CTA on toast; docs matrix prevents Alert-for-403 regressions.
- Trade-offs: `critical` on account.sign_in means “toast-suppressed journaled event” **only** for validation-class; server/register uses `actionable`.
- Testing: classifier unit tests; useAccountActions channel split; useActionNotifications toast CTA; AccountPanel Alert for validation only.
