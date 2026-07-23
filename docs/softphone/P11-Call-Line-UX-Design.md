# P11 WU2 — Call Line UX Design

Phase **P11 WU2**. Legacy-inspired operator call line presentation in **ContextZone** (not ControlsZone).

Related: `LF-011`, `LF-021`, `LF-022`, `LF-023`, `LF-057` (overlay blocking). Features: **F-016**, **F-003**, **F-004**.

## Decision log

| # | Topic | Decision |
|---|--------|----------|
| 1 | `ActiveCallControlsPanel` | **Removed** from ControlsZone. Hold/mute/transfer/hangup/resume live on `CallLineRow`. Error retry banner on active-unheld row. DTMF stays on dialpad only. |
| 2 | `OutgoingCallCard` | Shown only for pre-line outbound **Connecting** (no matching line in shell). Terminal `CallFailed` clears to Idle and surfaces a toast via `lastOutgoingFailure` — no sticky Failed card. |
| 3 | Transfer | Row transfer icon calls existing `useTransferActions.handleStartTransfer` (opens `TransferPanel` in ControlsZone). |
| 4 | Single-line list | `CallLinesShell.visible` when `lines.length >= 1` (not only 2+). |

## State inventory

| State | Projection inputs | UI |
|-------|-------------------|-----|
| Idle (no lines) | `multiLineCallProjection.lines` empty | No `CallLinesShell`; outbound failures use notification toast (`lastOutgoingFailure`) |
| Connecting / Ringing | line `state`, `displayLabel`, no `activeSinceMs` | Row with status label; hangup or answer primary |
| Active unheld | `state: Active`, `isActiveUnheld`, controls projection | Icon row (transfer, hold, mute); hangup primary; duration timer |
| Active muted | `muted: true` | Muted badge; unmute icon |
| Held | `state: Held` | No icon row; resume primary only |
| Transferring | `state: Transferring` | Status label; hangup primary; transfer/hold disabled from projection |
| Multi-line policy error | `multiCallProjection.lastPolicyViolation` | Banner above list |
| Operation failed | `activeCallControlsProjection.lastOperationError` on active-unheld row | Inline alert + retry |
| SIP-only | `!isOcpMode` | Queue label hidden (`queueLabelState: hidden`) |
| Blocking recovery | `connectionRecoveryShell.isBlocking` | Full-screen scrim blocks dialpad click-through |

## Wireframe (ContextZone)

```txt
┌─ CallLinesShell ─────────────────────────────────────┐
│ [policy error banner]                                 │
│ ┌─ CallLineRow ──────────────────────────────────┐   │
│ │ Alice Operator          [Queue]                 │   │
│ │ 1:05 · On line · Muted                          │   │
│ │                    [⇄] [‖] [🎤]  [Hang up]      │   │
│ │ [operation error + Retry]                       │   │
│ └─────────────────────────────────────────────────┘   │
└───────────────────────────────────────────────────────┘
┌─ OutgoingCallCard (pre-line Connecting only) ───────┐
└───────────────────────────────────────────────────────┘
┌─ Notification toast on CallFailed (not a card) ─────┐
└───────────────────────────────────────────────────────┘
```

Held row: hide icon row; prominent **Resume** on the right.

## Components and callbacks

| Component | Props (from derive / shell) | Callbacks → Use Cases / facade |
|-----------|----------------------------|--------------------------------|
| `CallLineRow` | `CallLineCardViewModel`, `lastOperationError?` | `onHold/Mute/Unmute/Transfer/Hangup/Resume/Answer` → `useCallLinesActions` + `handleTransferLine` |
| `CallLinesShell` | `CallLinesShellViewModel` | Forwards per-line callbacks |
| `CallDuration` (internal) | `durationStartedAt` | `useCallDuration` (UI-only) |

Human labels: `deriveCallLineStatusLabel` in `@application` (not inline in TSX).

## Test IDs

| ID | Element |
|----|---------|
| `call-lines-panel` | Shell section |
| `call-line-{callId}` | Row |
| `call-line-duration-{callId}` | Timer |
| `call-line-queue-{callId}` | Queue tag |
| `call-line-muted-{callId}` | Muted badge |
| `control-hold-line-{callId}` | Hold |
| `control-mute-line-{callId}` / `control-unmute-line-{callId}` | Mute toggle |
| `control-transfer-line-{callId}` | Transfer |
| `control-hangup-line-{callId}` | Hangup |
| `control-resume-line-{callId}` | Resume |
| `control-answer-line-{callId}` | Answer (ringing line in list) |
| `control-retry-line-{callId}` | Retry last operation |
| `call-line-error-{callId}` | Error banner |
| `connection-overlay-scrim` | Blocking click shield |

## Accessibility

- Row `aria-label` includes display name.
- Icon buttons: `aria-label` + `title` from disabled reason when disabled.
- Primary CTA: explicit hangup/resume/answer labels.
- Queue tag: `aria-busy` when loading.
- Blocking overlay: `role="alertdialog"`, `aria-modal="true"`, full-screen scrim.

## Manual smoke

1. Single outgoing → active: one row, timer, hangup; hold → resume; mute toggles badge.
2. Settings overlay open: row stays in DOM.
3. Blocking recovery overlay: dialpad not clickable through scrim.
4. Two lines: two rows; per-line resume/hangup.
