# ADR-0026: Feedback Channel Law

- Status: **Accepted**
- Date: 2026-08-02
- Deciders: Softphone platform
- Related: F-016 / LF-060; F-029 / ADR-AF-007; F-034 / ADR-0025; ADR-0013

## Context

Renderer historically mixed outcome feedback across inline `Alert` strips, modal `role="alert"` blocks, and `useNotifications` toasts. Dual presentation (same error as toast **and** strip) created noise; migrating every message to toast alone would downgrade persistent form errors, connection recovery, and rich diagnostic payloads.

Affected: Settings, Account, Contacts, History, Telephony chrome, Integrations. Layers: UI + Application capture only.

## Decision

### 1. One channel per feedback class

| Class | Channel | Examples |
| --- | --- | --- |
| Ephemeral outcome | `notify` → Capture → toast (+ journal) | prefs export/import, contact save/delete, history delete, call op fail, SDK/OCP/EA/ES save ops, screen-share confirm |
| Form-persistent error | Inline Alert / FormField on owning surface | Account sign-in error; field validation |
| Persistent system state | Shell banner / Alert with action | `OcpConnectionBanner`, `UpdateAvailableBanner` |
| Blocking / multi-stage | Modal / overlay | OCP proxy conflict, sign-in progress, bootstrap/shutdown |
| Rich diagnostic result | Inline result panel | External Services run body/status |
| List / empty load state | Panel empty/error region | Contacts/history list load fail |

**Anti-dual:** one source must not render two presentational channels. Prefer OCP pattern: owning surface wins; skip or suppress the other.

**OCP remote `entity: "notification"`:** sole channel is `notify` → Capture → Sonner (no inline Alert). Mapper uses wire `body` + `type` only; Softphone Notification Center prefs own presentation; see ADR-0025 / `notification-center/03-POLICY-AND-CHANNELS.md`.

### 2. Account sign-in errors

- Owning surface: `AccountPanel` destructive `Alert` (persistent until next attempt).
- Producer still calls `notify` with `module: "account"`, `functionId: "account.sign_in"`, `interruptClass: "critical"` so Capture journals and policy suppresses toast (`interrupt_not_toast`).
- System State CTA lives on the Alert when `openSystemStateAction` is set (not on a toast).
- Account success/warning remain toast-only (`informational`).

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
- Replacing OCP/Update banners with toast
- Moving FormField validation into toast
- Disabling journal when popup suppressed (ADR-AF-007 / ADR-0025)

## Alternatives Considered

| Alternative | Rejected because |
| --- | --- |
| All feedback via toast only | Downgrades persistent auth errors and recovery banners |
| Keep dual Account Alert + toast | Noise; violates anti-dual |
| Skip `notify` for Account errors | Loses journal trail |

## Consequences

- Positive: single ownership; Notification Center prefs apply to ephemeral outcomes; docs guide future agents.
- Trade-offs: `critical` on account.sign_in means “toast-suppressed journaled event”, not ADR-0013 shell raise.
- Testing: producer tagging includes preferences transfer; AccountPanel System State action; no delete-modal error strips.
