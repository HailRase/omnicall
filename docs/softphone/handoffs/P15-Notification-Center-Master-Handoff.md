# P15 Notification Center (F-034) — Master Handoff

## Status

| Field | Value |
| --- | --- |
| Feature | F-034 Notification Center |
| Legacy | Extends `LF-060`; builds on F-029 — no new LF ID |
| Phase | P15 Notification Center (Settings) |
| Feature status | **implemented** (WU-00…WU-08 done; WU-09 deferred; WU-10 close 2026-08-02) |
| Branch | `feature/notification-center` |
| Task | T-053 **done** |
| Plan | `notification-center/` (live: `PROGRESS.md`) |
| ADR | [ADR-0025](../adr/ADR-0025-notification-center-preferences-policy.md) — **Accepted**; ADR-0013 amended (`notification_actionable`) |
| Next | `/preflight` → `/review`; `/release` only with explicit ship auth (MINOR) |

## Mission

Ship a Settings Notification Center hub (Preferences + Appearance + History) with capture-owned
presentation policy on top of LF-060 toasts and F-029 journal, without regressing default popup,
journal always-on, or ADR-0013 critical raises.

## Locked non-goals

- Full OS Notification Center clone inside the call shell.
- Quiet hours / Focus schedules; per-notification “don’t show again” without journal.
- Cloud sync beyond F-030 portable prefs.
- Replacing campaign modal, incoming banner, or SDK consent with toast+raise.
- Raising the window on every toast or on success/info events.
- Changing Call Engine, SIP register, OCP wire, headset HID, or SDK protocol.

## Explicit non-overlap

| Feature | Relationship |
| --- | --- |
| LF-060 / F-016 toast viewport | Sole in-app toast renderer; appearance prefs relocate under Notification Center |
| F-029 / ADR-AF-007 journal | Always-on history sink; prefs never disable journal |
| ADR-0013 shell raise | Critical attention path unchanged; optional `errors_only` via `notification_actionable` (WU-08) |
| Call DND | Unrelated telephony auto-reject |
| F-030 Preferences | Nested Notification Center prefs round-trip; journal excluded |
| F-011 / F-028 | No SDK/OCP wire mutation |
| OS banners | WU-09 **deferred** (port+mock seam only) |

## Compatibility law checklist

- [x] Default prefs present the same in-app toasts as pre-F-034 for existing producers
- [x] Journal records when popups disabled (`suppressedAtEmission`)
- [x] ADR-0013 critical raises unchanged (optional raise is additive, defaults `never`)
- [x] Incoming / campaign / SDK consent modals not replaced by toast policy
- [x] Toast viewport geometry non-regression
- [x] Call DND semantics unchanged

## WU / evidence table

| WU | Title | Status | Evidence |
| --- | --- | --- | --- |
| WU-00 | Registry, ADR, handoff bootstrap | **done** | F-034 registry; T-053; STATUS; ADR-0025; `registry:check` |
| WU-01 | Domain preferences model and settings migration | **done** | Schema **14** nested prefs; Strategy A; domain migrate/validate tests |
| WU-02 | Capture policy and facade wiring | **done** | Domain policy; CaptureService+facade; ADR-0025 Accepted |
| WU-03 | Producer module/function tagging | **done** | Tagged producers; `notificationProducerTagging.test.ts` |
| WU-04 | Notification Center Preferences UI | **done** | Hub Preferences/Appearance/History; master+modules+presets |
| WU-05 | Appearance relocation and General cleanup | **done** | Appearance panel; General hint; viewport tests |
| WU-06 | History panel module expansion | **done** | Expanded module filters; journal catalog round-trip |
| WU-07 | F-030 preferences portability | **done** | Nested prefs export/import; journals excluded |
| WU-08 | Optional actionable window raise | **done** | `notification_actionable`; Capture raise; Preferences raise UI; defaults never |
| WU-09 | OS notification seam | **deferred** | Port+mock only; no Electron OS banners in v1 |
| WU-10 | Documentation close, preflight, release decision | **done** | Acceptance + preflight; F-034 `implemented`; no SemVer without ship auth |

Live machine status: `notification-center/PROGRESS.md`.

## ADR-0025 decision state

| Decision | State |
| --- | --- |
| CaptureService owns presentation policy | **Accepted** (WU-02) |
| Default-preserving migration (schema 13→14, Strategy A nested) | **Accepted** (WU-01) |
| Module catalog expansion (`sdk`, `updates`, `externalServices`) | **Accepted** (`externalApplications` deferred) |
| Journal always-on (ADR-AF-007 preserved) | **Accepted** |
| Raise/OS boundaries; no toast→raise by default | **Accepted** (WU-08 raise path live; defaults never; WU-09 OS deferred) |

## Module catalog (v1)

`system`, `account`, `telephony`, `ocp`, `settings`, `contacts`, `history`, `headset`, `media`,
`sdk`, `updates`, `externalServices`.

## Settings schema and F-030

| Item | Target |
| --- | --- |
| Schema | `UserSettings` **14** nested `notificationPreferences` |
| Defaults | Behavior-preserving vs pre-F-034 |
| F-030 | Nested prefs round-trip; F-029 journal excluded |

## Runtime composition

```txt
Producers → notify(descriptor)
  → Facade.captureUserNotification
      → UserNotificationCaptureService
          → journal always (F-029)
          → evaluateNotificationPresentationPolicy
      ← { shouldPresentPopup, shouldRaiseWindow, suppressReasons }
  → Sonner enqueue iff shouldPresentPopup
  → raiseShellWindow(notification_actionable) iff shouldRaiseWindow
```

## Acceptance

Product gate: `notification-center/11-ACCEPTANCE.md` — closed at WU-10.

## Non-regression

- SIP-only staged sign-in toasts remain correct.
- Headset fault toasts surface under defaults.
- OCP sticky notifications remain sticky when presented.
- Contacts/history CSV toasts surface under defaults.
- Toast viewport geometry intact.
- No F-011 / F-028 / SIP / headset HID behavior mutation.
- Default prefs ⇒ zero new shell raises.

## Open risks

- New untagged `notify({...})` guarded by `notificationProducerTagging.test.ts`.
- OS banners remain future work (explicit WU-OS).

## Review gate

- Track close: `/preflight` → `/review`; `/release` only with explicit ship auth (MINOR).
