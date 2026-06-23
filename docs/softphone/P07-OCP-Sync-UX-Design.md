# P07 OCP Call Sync UX Design (WU1–WU3)

- Phase: `P07` WU3; Feature: `F-015`; Legacy: `LF-037`–`LF-040`.
- Primary context: `Operator`; projections: `queueInfoProjection`, `campaignProjection`, `incomingCallProjection`, `accountBootstrapProjection` (`isOcpMode`).
- Out of scope WU3: real OCP WebSocket, `dlg_stop`, toast notifications (LF-059), P08 reconnect overlay.

## User Goal

See the correct queue name on incoming/active calls when OCP is connected; understand campaign context on incoming calls; SIP-only mode shows no OCP sync UI.

## Queue Label States (`LF-037`)

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `hidden` | SIP-only or OCP sync unavailable | `isOcpSyncAvailable` false |
| `loading` | Call active, queue name not yet mapped | call exists, no `queueNameByCallId` entry |
| `ready` | Queue name resolved | `QueueInfoReceived` mapped by exact `main_acallid` |
| `na` | OCP connected but no queue for this call | timeout or explicit empty (WU2+) |

## Campaign Context States (`LF-038`)

| State key | Meaning | Projection driver |
| --- | --- | --- |
| `hidden` | SIP-only or no campaign plugin | `isOcpSyncAvailable` false |
| `none` | Incoming call without campaign data | no `CampaignEventReceived` |
| `context_ready` | Campaign metadata on incoming modal | `campaignProjection` + incoming `callId` |
| `modal_open` | Non-progressive campaign request (`LF-039`) | `useCampaignActions` local modal state |

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

## Layout (WU3)

```txt
[IncomingCallModal]
  CallerIdentityBlock
    queue-info-label (OCP only, LF-037)
    incoming-campaign-context (LF-038)
[CampaignEventModal] (LF-039 — over shell when non-progressive)
```

## Components (reserved test IDs)

| Test ID | Purpose |
| --- | --- |
| `queue-info-label` | Queue name on incoming/active call |
| `campaign-event-modal` | Non-progressive campaign request |
| `campaign-accept` | Accept campaign request |
| `campaign-reject` | Reject campaign request |

## Accessibility (WU3)

- `queue-info-label`: `aria-label="Queue"`; `aria-busy` when loading; non-color-only pending vs ready text.
- Campaign modal: focus trap, Escape → close when not in-flight, labelled accept/reject buttons.
- SIP-only: queue and campaign elements not rendered (not in tab order).

## Domain Events — WU2–WU3 Implemented

- `QueueInfoReceived` — exact `callId` + `mainAcallId` + `queueName`
- `CampaignEventReceived` — campaign metadata matched to call
- `CampaignEventAnswered` — gateway-confirmed accept/reject (LF-040)

## WU3 Implementation Notes

### Queue label (`LF-037`)

| UI state | `deriveQueueLabelState` | Copy | Component |
| --- | --- | --- | --- |
| hidden | SIP-only / no call | not rendered | `QueueInfoLabel` |
| loading | OCP on, no `queueNameByCallId` | "Pending" + `aria-busy` | `QueueInfoLabel` |
| ready | exact match in projection | queue name | `QueueInfoLabel` |
| na | WU4+ timeout path | "N/A" | reserved |

Hook: `useIncomingCallShell` composes `queueInfoProjection` + `incomingCallProjection.callId`.

### Campaign modal flow (`LF-038`–`LF-040`)

1. `CampaignEventReceived` with `progressive: false` → `useCampaignActions` opens modal.
2. `progressive: true` → modal skipped (auto path; no user prompt in WU3).
3. Accept/reject → `RespondToCampaignUseCase` → `OcpSyncGateway.respondToCampaign` → `CampaignEventAnswered`.
4. Gateway failure → error banner in modal; no success event before confirm.
5. SIP-only → `campaignProjection.isOcpSyncAvailable` false → hidden context + no modal.

## Domain Events — Backlog

| Event | Work Unit | Legacy |
| --- | --- | --- |
| `CallButtonBlocked` | WU4+ | LF-050 |
| `OcpNotificationReceived` | WU4+ | LF-059 |
| `DlgStopRequested` / `DlgStopSent` | WU4+ | LF-063–065 |

## SIP-Only Rules

- `isOcpSyncAvailable` false → queue label `hidden`, campaign `hidden`.
- No broken placeholders; incoming call UX unchanged except queue line omitted.

## Exact ID Mapping (`LF-037`, `LF-063`)

- Queue info binds only when `main_acallid` equals stored correlation exactly.
- Substring or fuzzy match is forbidden and covered by domain tests.
