# P07 OCP Call Sync UX Design (WU1)

- Phase: `P07` WU1; Feature: `F-015`; Legacy: `LF-037` (WU1), `LF-038`/`LF-039` (design), `LF-040` (WU2+).
- Primary context: `Operator`; projections: `queueInfoProjection`, `incomingCallProjection`, `accountBootstrapProjection` (`isOcpMode`).
- Out of scope WU1: React campaign modal, real OCP WebSocket, `SyncMainAcallIdUseCase` E2E, `dlg_stop`.

## User Goal

See the correct queue name on incoming/active calls when OCP is connected; understand campaign context on incoming calls; SIP-only mode shows no OCP sync UI.

## Queue Label States (`LF-037`)

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `hidden` | SIP-only or OCP sync unavailable | `isOcpSyncAvailable` false |
| `loading` | Call active, queue name not yet mapped | call exists, no `queueNameByCallId` entry |
| `ready` | Queue name resolved | `QueueInfoReceived` mapped by exact `main_acallid` |
| `na` | OCP connected but no queue for this call | timeout or explicit empty (WU2+) |

## Campaign Context States (`LF-038` — design only WU1)

| State key | Meaning | Projection driver (WU3+) |
| --- | --- | --- |
| `hidden` | SIP-only or no campaign plugin | `isOcpSyncAvailable` false |
| `none` | Incoming call without campaign data | no `CampaignEventReceived` |
| `context_ready` | Campaign metadata on incoming modal | campaign projection + incoming call |
| `modal_open` | Non-progressive campaign request (`LF-039`) | campaign modal projection |

## Loading States

- Queue label shows `loading` (placeholder "Pending") from `IncomingCallReceived` until `QueueInfoReceived` with exact ID match.
- Campaign context loads in parallel; incoming modal remains answerable (WU3).

## Error States

| Feedback | When |
| --- | --- |
| Queue stays `loading` / `na` | `main_acallid` mismatch — no substring fallback |
| Campaign modal error banner | gateway reject on accept/reject (WU2+) |
| OCP sync unavailable | disconnect; queue labels cleared |

## Disabled States

- Campaign accept/reject disabled while gateway command in flight (WU3).
- No queue-specific disabled controls in WU1.

## Recovery States

- `CallEnded` / `IncomingCallEndedBeforeAnswer`: clear queue entry for that `callId`.
- `OcpAuthenticationFailed` / SIP-only bootstrap: clear all queue mappings, hide OCP sync UI.
- Reconnect (P08): re-sync `main_acallid` without polling (WU2).

## Layout (WU3–WU4)

```txt
[IncomingCallModal]
  CallerIdentityBlock
    queue-info-label (OCP only)
    campaign context line (LF-038, WU4)
[CampaignEventModal] (LF-039, WU4 — over incoming when required)
```

## Components (reserved test IDs)

| Test ID | Purpose |
| --- | --- |
| `queue-info-label` | Queue name on incoming/active call |
| `campaign-event-modal` | Non-progressive campaign request |
| `campaign-accept` | Accept campaign request |
| `campaign-reject` | Reject campaign request |

## Accessibility (WU4)

- `queue-info-label`: `aria-label="Queue"`; non-color-only when loading vs ready.
- Campaign modal: focus trap, Escape when allowed, labelled accept/reject buttons.
- SIP-only: queue and campaign elements not in tab order (not rendered).

## Domain Events — WU1 Implemented

- `QueueInfoReceived` — exact `callId` + `mainAcallId` + `queueName`

## Domain Events — Backlog

| Event | Work Unit | Legacy |
| --- | --- | --- |
| `CampaignEventReceived` | WU2–WU3 | LF-038 |
| `CampaignEventAnswered` | WU2 | LF-040 |
| `CallButtonBlocked` | WU2+ | LF-050 |
| `OcpNotificationReceived` | WU3+ | LF-059 |
| `DlgStopRequested` / `DlgStopSent` | WU3+ | LF-063–065 |

## SIP-Only Rules

- `isOcpSyncAvailable` false → queue label `hidden`, campaign `hidden`.
- No broken placeholders; incoming call UX unchanged except queue line omitted.

## Exact ID Mapping (`LF-037`, `LF-063`)

- Queue info binds only when `main_acallid` equals stored correlation exactly.
- Substring or fuzzy match is forbidden and covered by domain tests.
