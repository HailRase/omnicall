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

## Collapsed Layout

Collapsed shell must show:

- operator status
- phone status
- active call indicator
- ringing indicator
- reconnect indicator
- quick expand action

Collapsed mode must not hide critical failure state.

## Electron Window UX

Required window behavior:

- predictable startup size
- minimum usable size
- optional always-on-top setting
- tray presence
- minimize to tray
- restore from tray
- close behavior with active-call warning
- incoming call window focus policy
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
- lost connection (existing `ConnectionOverlay`)

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
| `booting` | App is starting | Show app loading state. |
| `sipOnlyReady` | SIP-only mode ready | Hide OCP-only controls. |
| `ocpAuthenticating` | OCP auth in progress | Show OCP loading state. |
| `ocpSessionExists` | OCP rejected duplicate session | Show recoverable error. |
| `ocpInvalidToken` | OCP token invalid | Show access denied. |
| `sipRegistering` | SIP registration in progress | Show registering status. |
| `sipRegistered` | SIP ready | Show online indicator. |
| `sipRegistrationFailed` | SIP registration failed | Show retry action/timer. |
| `dnd` | User is unavailable for calls | Show DND and block Ready if OCP enabled. |
| `ocpDisconnected` | OCP WS disconnected | Show overlay and retry state. |
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
- disabled by OCP reserved
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

## Operator Status UX

Status selector must show:

- current status
- duration in status
- allowed next statuses
- disabled Ready while DND is active
- break reasons when required
- post-call processing state
- logout reason flow

SIP-only mode must not display broken OCP-only controls.

## Connection UX

Lost connection overlay must show:

- which connection failed: OCP, SIP, or both
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

Campaign UX exists only when OCP plugin is enabled.

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
