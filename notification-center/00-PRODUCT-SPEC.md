# F-034 Notification Center Product Specification

- Purpose: locked v1 behavior for a unified Notification Center that manages delivery preferences without regressing today’s toast or journal behavior.
- Inputs: user-facing notification descriptors from the central capture sink, active-profile `UserSettings`, and existing shell attention raises.
- Outputs: policy decisions (present / suppress popup, optional raise, later OS banner), persisted preferences, and a Settings hub (Policy + Appearance + History).

## Positioning and ownership

- Product path: Settings → **Notifications** becomes a Notification Center hub (not history-only).
- Audience: any authenticated or anonymous softphone user; preferences are profile-scoped via active `SettingsAccountKey`.
- Primary bounded context: **Settings**.
- Producers remain Telephony, Operator/OCP, Account, Headset, Media, Contacts, History, Integration (SDK / External Services / Updates when tagged).
- F-029 journal stays the append-only history sink; F-034 adds **preferences + policy** in front of presentation.
- Legacy: extends LF-060 (toast placement/settings) and F-029; no new LF ID required unless behavior removes a legacy capability (forbidden without ADR).

## Compatibility law (non-negotiable)

After F-034 ships with default preferences:

1. In-app toasts that appear today still appear (same levels, same copy keys, same CTA actions).
2. Journal still records every notification even when popups are disabled.
3. Existing ADR-0013 raises (`incoming_call`, `outgoing_call`, `ocp_campaign_offer`, SDK consent/pairing/trust, `second_instance`) still raise.
4. Toast viewport geometry (titlebar-safe offsets, compact shell clamp) remains intact.
5. Call DND, ringtone, SIP reconnect, OCP recovery banners, and campaign modal stay on their current UX paths.
6. Disabling a module’s popups never hides incoming-call UI, campaign modal, or SDK consent modal.

Any migration that would change defaults from “show” to “hide” for an existing toast class is a **product blocker**.

## Information architecture

Settings → Notifications contains three stacked sections in one leaf (tabs or vertically ordered panels):

1. **Preferences (Policy)** — master in-app popup switch + per-module controls.
2. **Appearance** — placement, stacking, duration, max visible (moved from General; General keeps a short link or loses the duplicated block).
3. **History** — existing F-029 journal table (filters, search, pagination) unchanged in capability.

No separate “notification inbox” overlay in the call shell for v1. History remains Settings-scoped.

## Master controls

| Control | Default | Effect |
| --- | --- | --- |
| Show in-app popups | `true` (from today’s `notificationPopupEnabled`) | When `false`, all in-app toasts suppressed; journal still records with `suppressedAtEmission: true` |
| Per-module enabled | `true` for every module | When `false`, that module’s popups suppressed; journal still records |
| Per-module minimum level | `info` | Show popups with level ≥ threshold (`info` < `success` < `warning` < `error`) |
| Per-module raise window | `never` | Optional `errors_only` for selected modules only (see channels doc) |

`notificationPopupEnabled` remains the persisted master field or migrates 1:1 into nested preferences with identical meaning. UI for this master switch **must exist** (today the field exists without Settings control — that gap is closed in F-034).

## Modules (v1 catalog)

Stable module codes used by journal, prefs, and filters:

| Module | Typical producers |
| --- | --- |
| `system` | Untagged fallback only during migration; target = eliminate new uses |
| `account` | Sign-in, logout, auth feedback |
| `telephony` | Outgoing failure, DTMF/transfer errors, SIP recovery toasts |
| `ocp` | OCP entity notifications, campaign/status operator toasts |
| `settings` | Settings save/update failures |
| `contacts` | Contacts CSV import/export |
| `history` | Call history export/actions |
| `headset` | Headset faults |
| `media` | Video downgrade and related media toasts |
| `sdk` | SDK operator-facing toast outcomes (non-modal) |
| `updates` | Manual update check outcomes surfaced as toast |
| `externalServices` | External Services Run/automation user-facing toasts if any |

Every `notify(...)` call must supply `module` + `functionId`. Missing values default to `system` / `renderer.notification` only as a temporary migration bridge; WU tagging removes new omissions.

## Interrupt classes (descriptor metadata, not user toggles)

| Class | Examples | User may suppress in-app toast? | May auto-raise window? |
| --- | --- | --- | --- |
| `critical` | Incoming call UI, campaign modal, SDK activate consent | N/A — not toast-pipeline primary UX | Yes via ADR-0013 only |
| `actionable` | SIP register failed + System State CTA, headset USB unplug, OCP auth recovery toast with CTA | Yes via module/master prefs | Only if module `raiseWindow = errors_only` and level ≥ warning |
| `informational` | SIP transport connected, CSV exported, status reserved success | Yes | Never |
| `remote` | OCP platform `notification` entity body | Yes (dedicated OCP remote toggle may alias module `ocp` + `functionId` prefix) | Never by default |

v1 does not expose interrupt class as a Settings control. Class is assigned by producers / mappers and enforced by Application policy.

## Delivery channels (v1 vs later)

| Channel | v1 | Later (explicit WU / non-goal until approved) |
| --- | --- | --- |
| In-app toast (Sonner / NotificationViewport) | Yes — primary | — |
| Journal (F-029) | Yes — always | — |
| Shell window raise | Existing ADR-0013 + optional per-module `errors_only` | Broader raise reasons need ADR amendment |
| OS / tray notification | Designed in architecture; **deferred** unless WU-OS is explicitly started | Electron `NotificationGateway` |
| Sound per notification | Out of v1 (ringtone/ringback remain F-018 / F-033 paths) | Optional |
| Badge / flashFrame | Out of v1 | Optional soft attention |

## Appearance preferences

Unchanged semantics from today, relocated under Notification Center → Appearance:

- `notificationPlacement`: bottom-right \| bottom-left \| top-right \| top-left
- `notificationStacking`: stacked \| single
- `notificationDurationMs`: clamped 2000…10000 (default 4200)
- `notificationMaxVisible`: clamped 1…5 (default 3)
- `notificationClosable`: remains `true` product default; no UX to disable close in v1 unless already exposed

## History (F-029 preserved)

- Rolling 24-hour app-scoped journal, secret redaction, identity/module filters, title search, pagination.
- Columns and suppressed marker remain.
- Module filter list updates when new module codes are added.
- Disabling popups never disables capture.

## Locked edge behavior

- Repeated operation outcomes are **not** deduplicated (current LF-060 law).
- Capture failure must fail open for presentation (today: enqueue toast if capture throws) unless ADR revises it; journal write failure is logged.
- OCP transport recovery banner continues to suppress duplicate OCP auth feedback toasts (existing SoftphoneReadyShell rule).
- Sticky OCP notifications (`durationMs: 0`) remain sticky when presented; suppression prefs still apply before presentation.
- SDK-hidden window: optional `errors_only` raise must respect ADR-0013 / SDK window policy and must not fight intentional host hide for informational toasts.
- Profile switch loads that profile’s preferences immediately; in-flight toast queue may drain with previous visual settings without crashing.

## Explicit non-goals (v1)

- Full OS Notification Center clone inside the call shell.
- Quiet hours / Focus mode schedules.
- Per-notification mute (“don’t show this again”) without journal.
- Cloud sync of notification prefs across machines beyond F-030 portable prefs.
- Replacing campaign modal, incoming banner, or SDK consent with toast+raise.
- Raising the window on every toast or on all success/info events.
- Changing Call Engine, SIP register semantics, OCP wire, or SDK protocol.
