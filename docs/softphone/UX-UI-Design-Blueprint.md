# Enterprise Softphone UX/UI Design Blueprint

## Type

DOCUMENT.

This document defines UX/UI design requirements for the Electron + React softphone.

## UX/UI Rules

- Design the state before designing the component.
- Every screen must map to `LF-XXX` legacy IDs.
- Every user action must map to a Use Case.
- Every disabled control must explain why it is disabled.
- Every critical telephony state must be visible without reading logs.
- Electron shell behavior must support call reliability before visual polish.

## Product UX Goal

The user must always know:

1. Am I connected?
2. Am I registered?
3. Am I available?
4. Is there an active call?
5. What can I safely do now?
6. What failed and how can I recover?

## Primary Layout

Desktop softphone shell:

```txt
┌──────────────────────────────┐
│ Header                       │
│ - avatar                     │
│ - operator status            │
│ - phone status               │
│ - connection indicators      │
├──────────────────────────────┤
│ Context Area                 │
│ - active call                │
│ - incoming call              │
│ - campaign prompt            │
│ - connection overlay         │
├──────────────────────────────┤
│ Dialpad / Controls           │
│ - number input               │
│ - call button                │
│ - DTMF                       │
│ - hold/mute/transfer/hangup  │
├──────────────────────────────┤
│ Footer / Secondary Actions   │
│ - history                    │
│ - settings                   │
│ - diagnostics                │
└──────────────────────────────┘
```

## Shell layout (always expanded)

The main softphone shell is **always fully expanded**. Dialpad and call context remain visible even when SIP is not registered; outbound call is disabled with a visible reason until registration succeeds.

## Electron Window UX

Required window behavior:

- predictable startup size
- minimum usable size
- optional always-on-top setting
- tray presence
- minimize to tray
- restore from tray
- close behavior with active-call warning
- incoming / outgoing call window focus policy (raise above other apps via shared
  main `bringBrowserWindowToFront`; ADR-0013)
- SDK Origin-trust / pairing / activate-consent operator attention raise (same helper)
- reconnect overlay visible after restore

Electron main process owns shell behavior.

React owns presentation only.

## Navigation Model

Use a small panel model, not route-heavy navigation. See `UI-Architecture.md` and `UI-Design-System.md`.

### Panel navigation (limited)

- **Call** — default surface (always available).
- **History** — full-screen panel only when **idle** (no established/connecting call). Disabled or overlay when call active.

### Overlay sheets (not panel swap)

Open **on top of** ContextZone; never unmount active call UI during established call:

- **Settings** — behavior, multi-session, auto-answer (P11 WU1+). v1: portal Panel; Radix optional later.
- **Diagnostics** — dev / `?debug=1` projection readout (P09 deferral for full product diagnostics).

### Modal flows (Radix Dialog v1)

- incoming call
- reject reason (within incoming modal)
- campaign request
- logout reason
- access denied
- lost connection — header SIP status line + Settings → «Состояние системы» (T-008 / ADR-0004)

### Shell → zone map

| Blueprint zone | Widget / shell |
| --- | --- |
| Header | `SoftphoneShellHeader`, `PhoneStatusBadge`, operator status |
| Context Area | `CallLinesShell`, `OutgoingCallCard`, policy banners |
| Dialpad / Controls | `Dialpad`, `ActiveCallControlsPanel`, `TransferPanel` |
| Footer actions | Settings / Diagnostics triggers → overlay |
| Overlays | incoming, campaign, recovery, settings sheet |

## Global Visual States

The shell must represent these global states:

| State | Meaning | UX Requirement |
|-------|---------|----------------|
| `booting` | App is starting | Single-stage `#boot-splash` bounce ball (`#42AAFF`, ~1000ms CSS loop) from first paint until settle (freeze→rest, no teleport), with UI-only min visible dwell `BOOTSTRAP_SPLASH_MIN_VISIBLE_MS` (4000; skipped under `prefers-reduced-motion`), then opacity crossfade exit over the ready shell — React only updates progress/copy via `bootSplashDom`, no second loading UI / no JS spring on the production path. See `Bootstrap-Splash-Contract.md`. |
| `sipOnlyReady` | SIP-only mode ready | Hide legacy operator platform-only controls. |
| `ocpAuthenticating` | legacy operator auth in progress | Show legacy operator platform loading state. |
| `ocpSessionExists` | legacy operator platform rejected duplicate session | Show recoverable error. |
| `ocpInvalidToken` | legacy operator platform token invalid | Show access denied. |
| `sipRegistering` | SIP registration in progress | Show registering status. |
| `sipRegistered` | SIP ready | Show online indicator. |
| `sipRegistrationFailed` | SIP registration failed | Show retry action/timer. |
| `dnd` | User is unavailable for calls | Show DND and block Ready if legacy operator platform enabled. |
| `ocpDisconnected` | legacy operator platform WS disconnected | Show overlay and retry state. |
| `callRinging` | Incoming call ringing | Show incoming modal and sound. |
| `callActive` | Call active | Show active controls. |
| `callHeld` | Call held | Show resume primary action. |
| `callTransferring` | Transfer flow active | Show transfer target and cancel. |
| `callFailed` | Last operation failed | Show normalized error and recovery action. |

## Call Panel UX

Dialpad states:

- idle
- entering number
- calling
- active call DTMF mode
- disabled by legacy operator platform reserved
- disabled by invalid registration
- disabled by second-session policy

Primary action rules:

- Idle with valid number: `Call`.
- Ringing incoming: `Answer` and `Reject`.
- Active: `Hang up`.
- Held: `Resume`.
- Transfer mode: `Transfer` and `Cancel`.
- Disconnected: primary action is recovery.

## Incoming Call UX

Incoming call modal must show:

- caller number
- display name when available
- queue name when available
- campaign context when available
- answer button
- reject button
- reject reason selector when required
- auto-answer countdown when enabled
- DND auto-reject state when active

The modal must not directly call adapter methods.

## Active Call UX

Active call presentation is unified in **ContextZone** via `CallLineRow` / `CallLinesShell` (single and multi-line). See **`docs/softphone/P11-Call-Line-UX-Design.md`** for state inventory, wireframe, and test IDs.

Active call card must show:

- call direction
- caller/callee identity
- call state
- duration
- hold state
- mute state
- transfer state
- queue/campaign labels when available

Controls:

- hold/resume
- mute/unmute
- keypad/DTMF
- transfer
- hangup

Disabled controls must reflect Domain projection, not UI guesses.

## Transfer UX

Transfer mode must be explicit.

Required states:

- transfer target entry
- blind transfer ready
- attended consultation call
- transfer in progress
- transfer success
- transfer failed
- auto-unhold recovery

Do not hide transfer failure.

Recovery must be obvious.

## Phone Status UX

Phone status (online/offline/dnd) is managed via settings and header controls.

SIP DND must block or auto-reject incoming calls per product policy.

## Connection UX

Lost connection overlay must show:

- which connection failed: legacy operator platform, SIP, or both
- current attempt number
- next retry countdown
- manual retry
- final failure state
- safe logout option when applicable

Reconnect UX must not block active SIP call controls unless required by actual state.

## Campaign UX

Campaign modal must show:

- campaign title or safe fallback
- caller context
- accept action
- reject action
- timeout state if provided
- progressive campaign behavior without unnecessary modal

Campaign UX exists when **OCP Module (F-028)** is authenticated (not the removed legacy operator stack). Preview (`progressive: false`) → centered Dialog with blur; progressive → badges on call surfaces only. Queue/campaign projection rules: `docs/softphone/OCP-Call-Context.md`.

## History UX

History panel must show:

- direction
- number
- display name
- status
- time
- duration
- queue/campaign labels when available
- redial action

History must not block call controls.

## Settings UX

Settings panels:

1. Account
2. Telephony behavior
3. Audio
4. Headset
5. Notifications
6. Diagnostics
7. Advanced

### Shared Settings content measure (layout rule)

Shared primitives in `SettingsForm.module.css` constrain Settings body content so wide windows do not stretch preference rows edge-to-edge:

| Rule | Target |
| --- | --- |
| Complex list pages (`panel-stack`, `section-card`, `content-column`) | **max-width 36rem** (range 32–40rem) |
| Simple preference fields / toggle rows / stacked forms | **max-width 28rem** |
| Preference / toggle rows | Label + description left; control immediately after text — **never** `space-between` across a full-bleed pane |
| Stacked forms (add site, grant access) | Vertical fields; primary action under fields |

Do not reintroduce `max-width: none` on shared Settings form stacks without an ADR-level layout decision.

### OmniCall Kit Settings IA (F-011)

Three UI Kit Tabs (same pattern as Account mode tabs, `indicator="slide"`):

1. **Main** — gateway status (+ refresh), paired clients (no global hide toggle — `window.hide`
   lives on Trusted sites Origin matrix, default off; ADR-0013)  
2. **Trusted sites** — add site; each site is a UI Kit Accordion item (permissions as labeled Selects allowed/denied; address edit with explicit Save/Cancel)  
3. **Blocked sites** — origin left, Unblock right  

Activate consent is a root overlay (`SdkActivateProfileConsentModal`): login from SDK →
lookup saved profile → method picker when SIP and OCP are both complete. No Settings
“temporary profile access / profileRef grant”.  

After Allow (OCP mode) — and for any other **user-initiated** OCP-backed sign-in (Account Login,
modal Reconnect, SDK activate with `uiSurface: modal`) — the **same** root overlay
`OcpSignInProgress` shows stage progress with Disconnect/Reconnect.
It is mounted in `SoftphoneReadyShell` (not inside Settings Account), so dialpad / contacts /
history / settings all share it. Density: `comfortable` when Settings is open, `compact` on
the main softphone window (smaller type/gaps; stage status **icons only**, failure tooltip
retained).

**Unexpected OCP socket drop (auto-recovery):** do **not** open `OcpSignInProgress`. Use
global `OcpConnectionBanner` in the shell **overlay layer** (same mount family as
`OcpSignInProgress`) with `--z-shell-status-banner` so it stays visible over dialpad,
contacts, history, video, and Settings fullscreen (`reconnecting` N/max → `failed` + Retry).
Still below Dialog/modals. Background recovery uses `authorizationProgress.uiSurface: silent`
so the sign-in Dialog gate stays closed. Manual banner Retry / System State Retry server may
open the modal when the Application marks progress `modal` again.

Activate consent footer: **Cancel** split-button (chevron → **Block site** / Deny) + **Allow**.
Deny persists `account.activate=false` on the Origin matrix (ADR-0018 §E); Settings Trusted
sites must reflect the gateway snapshot after Deny (sync via `sdkIntegrationSettingsSync`).
Window raise on activate consent uses a unique `attentionId` per episode (ADR-0013), so a
second request after Cancel still brings the softphone to front.

Attention for Origin TOFU / pairing is a root overlay (`SdkConnectCeremonyModal`) above any
shell route (including Settings). Settings → OmniCall Kit does not host pending TOFU/pairing
callouts. Pending must clear with the socket/policy (disconnect → TOFU cancel without
blacklist; pairing deny-by-connection; Origin leave-allowed closes WS without auto-revoke;
waiting Cancel/Escape). See ADR-0018 §G.

Settings must show:

- current value
- saved state
- validation error
- restart/reconnect requirement

Settings that affect calls must explain when they take effect.

## Diagnostics UX

Diagnostics panel must include:

- SIP debug toggle
- audio debug toggle
- log filters
- export logs
- clear old logs
- correlation ID search
- connection status snapshot

Diagnostics must hide secrets.

## Accessibility Requirements

Every interactive control must have:

- keyboard access
- visible focus
- accessible label
- disabled reason when disabled
- safe color contrast

Critical actions must be distinguishable without color alone.

## Visual Priority

Highest visual priority:

1. incoming call
2. active call
3. connection failure
4. transfer in progress
5. status transition failure
6. campaign request
7. diagnostics

Never let cosmetic UI obscure call state.

## Component Design Protocol

Before implementing a component define:

- `LF-XXX` IDs
- input props
- output callbacks
- visual states
- loading states
- error states
- disabled states
- accessibility behavior
- test IDs

Components must stay presentational.

Hooks bind Use Cases to UI.

Stores provide projections.

## UX Deliverables Per Phase

Each roadmap phase must produce:

- state inventory
- wireframe-level layout
- component list
- interaction map
- disabled-state rules
- error/recovery copy
- accessibility checklist
- test scenarios

Do not implement UI for a phase until these deliverables exist.
