# ADR-0025: Notification Center preferences and presentation policy

- Status: **Accepted**
- Date: 2026-08-02
- Deciders: Softphone platform
- Related: F-034; F-016 / LF-060 (toasts); F-029 / ADR-AF-007 (journal); F-030 (portability); ADR-0013 (critical raise); plan `notification-center/`

## Context

F-034 adds a Settings Notification Center (Preferences + Appearance + History) and per-module
delivery preferences on top of the existing LF-060 toast stack and F-029 capture journal.
Today `notificationPopupEnabled` and appearance fields exist on `UserSettings`, but master
popup lacks Settings UI, most producers are weakly tagged, and suppress rules risk drifting
into React hooks. Ownership of presentation policy, migration defaults, module catalog growth,
and raise/OS boundaries must be recorded before behavior code lands.

Affected: Settings (primary); Application capture path; Domain preference/policy pure types;
related producer contexts (Telephony, Operator, Media, Headset, Integration). Layers: Domain /
Application / UI projections only — no Domain Electron/React/Zustand/storage imports.

## Decision

### 1. CaptureService owns presentation policy

- `UserNotificationCaptureService` is the single choke point for popup present/suppress and
  optional raise decisions after journal record.
- Pure evaluation lives in Domain (`evaluateNotificationPresentationPolicy` or equivalent);
  CaptureService loads active-profile preferences and returns
  `{ shouldPresentPopup, shouldRaiseWindow, suppressReasons }`.
- Renderer/hooks must not invent independent suppress rules; they enqueue Sonner only when
  capture returns `shouldPresentPopup`.
- Rejected: toast components or Zustand owning policy; per-hook ad hoc `if (!popupEnabled)`.

### 2. Default-preserving migration

- Bump `SETTINGS_SCHEMA_VERSION` **13→14** at WU-01 with additive migration from flat
  `notification*` fields (and `notificationPopupEnabled`) into nested preferences.
- Defaults and migrated values must preserve pre-F-034 popup-on / appearance / journal semantics
  for every existing toast class (compatibility law).
- **Strategy A (chosen):** nested `notificationPreferences: UserNotificationPreferences` is the
  sole persisted source of truth on `UserSettings`. Flat `notificationPlacement` /
  `notificationStacking` / `notificationDurationMs` / `notificationClosable` /
  `notificationMaxVisible` / `notificationPopupEnabled` are migration-only inputs and are
  removed from the current-schema type (no dual-write).
- Outer F-030 bundle format version stays `1` unless the envelope itself changes.
- Malformed current prefs fail closed at validation boundaries; unknown module keys reject on
  current-schema validate and are stripped during migration coerce.

### 3. Module catalog expansion

- Expand `USER_NOTIFICATION_MODULES` with `sdk`, `updates`, `externalServices`
  alongside existing modules; journal filters and prefs share the same catalog.
- Every `notify(...)` must supply `module` + `functionId` (+ `interruptClass`); missing values
  may temporarily default to `system` / bridge function id only during migration.
- Do not add phantom modules without producers on the branch.
- `externalApplications` deferred (no producers on branch at WU-01).

### 4. Journal always-on (ADR-AF-007)

- Preferences never disable journal capture.
- Master or module popup off still records entries with `suppressedAtEmission: true`.
- Capture failure handling remains fail-open for presentation unless a later ADR revises it
  with tests; journal write failures are logged, not swallowed silently.

### 5. Raise and OS boundaries

- No toast→raise by default. Default per-module `raiseWindow` is `never`.
- ADR-0013 critical raises remain the only required attention path for incoming/outgoing/
  campaign/SDK consent/pairing/trust/`second_instance`.
- Optional actionable raise is **product-enabled (WU-08):** Capture forwards Domain
  `shouldRaiseWindow`; renderer calls `shell:window-raise` with reason
  `notification_actionable` and dedupeKey = notification id (ADR-0013 amended 2026-08-02).
  Preferences expose Never / On errors per module. Defaults keep zero new raises.
- OS / tray banners: **WU-09 deferred** for v1. Seam documented here; port
  `NotificationGateway` + `MockNotificationGateway` land without Electron adapter,
  typed OS IPC, or runtime banners. Product resumes only with an explicit WU-OS start.
  Focused-window OS spam remains forbidden.
- Informational and remote interrupt classes never auto-raise.
- SDK-hide: follow ADR-0013 shared bring-to-front + tray recovery; prefer no raise over
  violating intentional host hide for non-actionable classes (already policy-denied).

## Alternatives Considered

| Alternative | Benefit | Risk | Rejected because |
| --- | --- | --- | --- |
| Policy only in React hooks | Faster UI iteration | Divergent suppress rules; bypasses non-renderer sources | Capture choke-point law |
| Disable journal when popups off | Less disk | Loses audit trail; breaks ADR-AF-007 | Explicit product forbid |
| Raise on every toast | High attention | Focus steal; fights SDK-hide; UX hostile | Compatibility + ADR-0013 |
| OS banners for all toasts in v1 | Visible when minimized | Permission UX; duplication; scope | Defer to WU-09 |
| New LF ID for Notification Center | Explicit legacy mapping | No removed legacy capability | Extends LF-060 / F-029 |

## Consequences

- Positive: one policy owner; Settings hub can manage master/module prefs; F-030 can round-trip
  nested prefs; defaults do not silently hide existing toasts.
- Trade-offs: schema bump + producer tagging work; optional raise/OS remain deferrable.
- Testing: migration identity, policy matrix, capture outcome, non-regression of F-029/LF-060/
  ADR-0013 surfaces (`notification-center/08-TESTING.md`).
- Observability: suppress reasons and journal `suppressedAtEmission` remain inspectable.
- Migration: N→N+1 additive; rollback = prior schema readers fail closed on unknown future only.
- Acceptance: Proposed at WU-00; **Accepted** at WU-02; raise path enabled at WU-08
  (`notification_actionable` allowlisted; Preferences raise UI live; defaults unchanged).

## Architecture Checks

- Domain remains framework-independent (no Electron/Node/browser/React/Zustand/storage).
- UI does not own presentation policy or call adapters/raw IPC for suppress decisions.
- External toast library (Sonner) remains replaceable behind viewport/hook seams.
- State transitions and Domain Events for telephony/OCP/SDK remain unchanged by this ADR.
- Critical flows remain observable via F-029 journal.

## Related Links

- Feature Registry: F-034
- Plan: `notification-center/README.md`
- Handoff: `docs/softphone/handoffs/P15-Notification-Center-Master-Handoff.md`
- Supersedes: —
- Superseded By: —
- Amends (related): ADR-AF-007 (preserved); ADR-0013 (`notification_actionable`, 2026-08-02)
