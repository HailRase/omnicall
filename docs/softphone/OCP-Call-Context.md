# OCP Call Context (Queue + Campaign)

- **Feature:** F-028 (extends E-09 / E-10); SDK surface F-011 / DI-05
- **Legacy parity:** LF-037, LF-038, LF-039, LF-040 (via F-028; P07 removed per ADR-0005)
- **Updated:** 2026-07-26 (campaign single-modal FSM + ADR-0020 snapshot `acdContext`)

## Purpose

Document how Axatalk projects OCP ACD queue names and campaign offers onto call UI **and**
onto the public Axatalk SDK — **without** legacy DOM CustomEvents, substring
call-id matching, or host `softphone-queue-info`.

## Sources

| Source | Wire | Application state | Desktop UI | Public SDK |
| --- | --- | --- | --- | --- |
| ACD queue | `get_main_acallid` → `entity: calls` (`OcpMainCallIdInfoPayload.queue`) | `CallOcpContextProjection` (`queueName` + full `acdWire`) | Badge on incoming / active call | Additive `queueLabel` on `call:*` / snapshot; `call:acd-context` live; snapshot `calls[].acdContext` under `ocp.acd_context.read` (ADR-0020) |
| Campaign preview | `entity: campaign_events` + `progressive: false` | `CampaignEventProjection.activeCampaign` (+ optional `pendingPreview`) | Centered blur modal (accept/reject) | `operator:campaign-offered` (`mode: preview`) + snapshot `operator.campaign` — requires `operator.campaign.read` (ADR-0019) |
| Campaign progressive | `entity: campaign_events` + `progressive: true` | `CampaignEventProjection.progressiveContext` | Badges only (no modal) | `operator:campaign-offered` (`mode: progressive`) when no preview modal open; snapshot `operator.campaign` |

## Outbound `get_main_acallid` wire contract

Application command (`OcpCommand`) uses camelCase; only
`buildOcpCommandPayload` maps to OCP JSON:

| Application (`OcpCommand`) | Wire JSON key | Meaning |
| --- | --- | --- |
| `callId` | **`acallid`** (no underscore) | SIP CallId / JsSIP `session.id` — **not** OCP main call id |
| `userLogin` | **`user_login`** | OCP connect login from `OcpSessionProjection.authenticatedLogin` |
| `callerId` | **`caller_id`** | Incoming: remote phone; outgoing: operator login |
| `calledId` | **`called_id`** | Incoming: operator login; outgoing: remote phone |
| `lifecycleEvent` | **`event`** | Legacy SIP lifecycle name (not Domain Event type) |

**Do not** send `call_id` for this command (legacy/working hosts expect `acallid`).
**Do not** rename Domain `callId` → `acallId` on the command: after the server
answers, inbound OCP call id is a different identifier stored in the bridge
correlation map for `dlg_stop`.

### Inbound `entity: calls` (MainCallIDInfo)

Live OCP replies use **no-underscore** keys in `payload`:

| Wire key | Normalized |
| --- | --- |
| `acallid` (preferred) or `acall_id` | `acallId` |
| `main_acallid` or `main_acall_id` | `mainAcallId` (optional) |
| `event`, `caller_id`, `called_id`, `queue` | same semantics |

`parseOcpMessage` accepts both spellings. Top-level `action` / `user_login` on the
envelope are ignored for this entity (queue lives in `payload.queue`).

After parse → `OcpTelephonyBridgeService` correlates via pending SIP `callId` →
`CallOcpContextProjection` + Domain `CallOcpContextResolved` → desktop badges and SDK:

| Public SDK | Payload |
| --- | --- |
| **`call:acd-context`** (ADR-0020) | Full OCP MainCallIDInfo wire: `main_acallid?`, `acallid`, `event`, `caller_id`, `called_id`, `queue`, `user_login` + desktop `callId`; optional `phase` / `direction`. Requires `ocp.acd_context.read`. |
| Additive `queueLabel` on existing `call:*` | Desktop-safe ACD title only (no wire ids; omitted when empty) |

**Still never** on `call:*` / campaign / snapshot: `acallid`, `main_acallid`, raw OCP frames.

Party / lifecycle resolution in `OcpTelephonyBridgeService`:
- remote from `IncomingCallReceived.phoneNumber` or `OutgoingCallRequested.phoneNumber`
- operator side = `authenticatedLogin`
- Domain → wire `event`:
  - `IncomingCallReceived` → `incomingCallProgress`
  - `OutgoingCallStarted` → `outgoingCallProgress`
  - `CallAnswered` → `incomingCallAccepted` / `outgoingCallAccepted` (by call direction)
- refuses to send when login, remote, or lifecycle event is missing (`markUnavailable` + warn)

## Campaign FSM (single modal)

`CampaignEventProjection` is a single-modal FSM:

| Field | Role |
| --- | --- |
| `phase` | `idle` \| `preview_offered` \| `progressive_offered` |
| `activeCampaign` | Non-progressive preview → blocking accept/reject modal |
| `progressiveContext` | Progressive dial → badges only (no modal) |
| `pendingPreview` | At most one held preview while the modal is still open |

Rules:

1. **Idle → preview:** first non-progressive `campaign_events` → `activeCampaign`, phase
   `preview_offered`, emit SDK `operator:campaign-offered` (`mode: preview`).
2. **Second preview while modal open:** do **not** wipe/supersede the visible modal.
   Store the new payload in `pendingPreview` (single slot; later preview replaces the held one).
   No SDK Offered/Cleared for the hold itself. Protocol `reasonCode: superseded` remains
   for compatibility; desktop **no longer emits** it for a second preview.
3. **Accept / reject / clear:** clear visible offer → if `pendingPreview` present, promote
   it into `activeCampaign` and emit SDK **Cleared then Offered** (promoted id). Otherwise
   return to `idle` after Cleared.
4. **Progressive while preview open:** update `progressiveContext` / badges only; do **not**
   emit SDK `operator:campaign-offered` and do **not** close the modal
   (`emitOffered: false`). When idle (no preview), progressive emits Offered as usual.
5. **Snapshot `operator.campaign`:** redacted DTO from `activeCampaign ?? progressiveContext`
   (gated by `operator.campaign.read`). Held `pendingPreview` is **not** exposed on the
   snapshot until promoted.

## Snapshot recovery (campaign + ACD)

| Surface | Recovery field | Capability | Notes |
| --- | --- | --- | --- |
| Campaign offer | `sections.operator.campaign` | `operator.campaign.read` | Same redacted shape as Offered; `activeCampaign ?? progressiveContext` |
| ACD queue title | `calls[].queueLabel` | `session.read.redacted` | Desktop-safe; never wire ids |
| ACD MainCallIDInfo | `calls[].acdContext` | `ocp.acd_context.read` | Additive snake_case wire (`main_acallid?`, `acallid`, `event`, parties, `queue`, `user_login`, optional `phase` / `direction`); stripped without capability |
| Live ACD | `call:acd-context` | `ocp.acd_context.read` | Unchanged live event; projection stores full `acdWire` per SIP `callId` |

`CallOcpContextProjection` keeps `acdWire` after resolve so reconnect/`getSnapshot` can rebuild
`acdContext` without replaying OCP. Empty/direct queue still recovers wire with `queue: ""`;
`queueLabel` stays omitted.

## Rules

1. **Queue badge (incoming only):** show when `direction === "incoming"` and `queueName` is non-empty after resolve.
2. **Direct / internal incoming:** OCP may return empty `queue` — parse keeps `queue: ""`; projection stores `queueName: null`; UI hides queue (no SIP `isInternal` flag); SDK omits `queueLabel`.
3. **Pending:** `resolveState: "pending"` shows a short skeleton; after 5s without resolve → `unavailable` (hide).
4. **One queue label:** OCP `calls.queue` wins over `campaign.queueTitle` (no duplicate tags).
5. **Modal:** only non-progressive (`activeCampaign`). Progressive never opens the modal. Second preview → `pendingPreview` hold (see Campaign FSM).
6. **Shell raise (preview only):** when `activeCampaign` appears, renderer edge
   `useShellWindowAttentionFromCampaign` → IPC `shell:window-raise`
   (`reason: ocp_campaign_offer`, dedupe = campaign `id`) → main
   `ShellWindowAttentionController` / `bringBrowserWindowToFront` (ADR-0013).
   Progressive context does **not** raise. Same path as incoming call — not a
   local `BrowserWindow` call from React.
7. **SIP-only / OCP offline:** all badges and modal hidden; SDK `queueLabel` / campaign absent.
8. **Correlation:** exact SIP `callId` via `OcpTelephonyBridgeService` pending map — no `session.id.includes`.
9. **Cleanup:** `CallEnded` / `CallFailed` clear call context entry and campaign slots; logout `resetToIdle` clears both; SDK emits `operator:campaign-cleared` with `reasonCode` (`accepted` / `rejected` / `call_ended` / `session_reset`).
10. **SDK privacy:** `call:acd-context` and snapshot `calls[].acdContext` may carry OCP MainCallIDInfo wire under `ocp.acd_context.read` (ADR-0020). Other `call:*` fields / campaign DTOs stay free of `acallid`; campaign remains redacted under `operator.campaign.read`.

## Layers

```txt
Domain events (Incoming/Outgoing/Answered/Ended)
  → OcpTelephonyBridgeService
  → OcpGateway get_main_acallid / dlg_stop
  → OcpProjectionHub CallOcpContext + Campaign projections
  → Zustand sync (subscribeOcpProjections)
  → deriveCallContextBadges / useOcpCampaignModal
  → CallContextBadges / OcpCampaignEventModal
  → (preview only) useShellWindowAttentionFromCampaign → shell:window-raise

On MainCallIDInfo resolve (any queue, including empty):
  → Domain CallOcpContextResolved (includes ocp wire block)
  → ExternalSdkEventMapper → call:acd-context (wire fields)
  → optional call:* + queueLabel when queue non-empty
  → fan-out call:acd-context only if session.read.redacted ∧ ocp.acd_context.read

On campaign_events / clear:
  → Domain OperatorCampaignOffered / OperatorCampaignCleared
  → ExternalSdkEventMapper → operator:campaign-*
  → fan-out only if session.read.redacted ∧ operator.campaign.read
```

UI never talks to the OCP WebSocket. Accept/Reject go through Facade Use Cases.
External hosts never use `window.dispatchEvent` / `OCPincomingCallProgress`.
Public SDK does **not** expose accept/reject commands in v1 (desktop modal owns control).

## Legacy CustomEvent → Axatalk map

| Legacy (jssip-phone) | Axatalk replacement |
| --- | --- |
| `incomingCallProgress` … `outgoingCallEnded` DOM events | Domain call events → SDK `call:incoming` / `call:outgoing` / `call:answered` / `call:ended` / … |
| `OCPincomingCallProgress` / `OCP` + event name | `CallOcpContextResolved` + projection; SDK `call:acd-context` (wire) + additive `queueLabel` |
| `campaignEvents` CustomEvent | Desktop `CampaignEventProjection` + modal/badges; SDK `operator:campaign-offered` / `cleared` |
| `softphone-queue-info` | Not ported (embed contract rejected) |
| `window.Softphone` | Axatalk SDK (`@axata/axatalk-sdk`) over Local WS |

## Public SDK: subscribe / snapshot

Requires `session.read.redacted`. Campaign notify/snapshot also require
`operator.campaign.read`. `call:acd-context` also requires `ocp.acd_context.read`
(both default on `operator` / `call_controller`; Origin matrix toggles in Settings).

```ts
import { createAxatalkClient } from '@axata/axatalk-sdk';

const client = createAxatalkClient(/* transport options */);
await client.connect();
// … pair / authenticate …

const stopIncoming = client.subscribe('call:incoming', (event) => {
  // First emit may omit queueLabel (OCP resolve is async).
  void event.payload.callId;
  void event.payload.queueLabel; // string | undefined
});

const stopCampaign = client.subscribe('operator:campaign-offered', (event) => {
  void event.payload.campaignId;
  void event.payload.mode; // 'preview' | 'progressive'
  void event.payload.remoteNumber; // masked
});

const stopCleared = client.subscribe('operator:campaign-cleared', (event) => {
  void event.payload.campaignId;
  void event.payload.reasonCode;
});

// Authoritative recovery after reconnect:
const snapshot = await client.getSnapshot();
for (const call of snapshot.sections.calls ?? []) {
  void call.queueLabel; // session.read.redacted
  void call.acdContext; // ocp.acd_context.read — MainCallIDInfo wire
}
void snapshot.sections.operator?.campaign; // activeCampaign ?? progressiveContext

stopIncoming();
stopCampaign();
stopCleared();
```

Notes:

- Re-emit for queue uses an existing public `call:*` type — **not** a new event name.
- Empty / direct queue → no `queueLabel`; `call:acd-context` / snapshot `acdContext` may still carry wire with `queue: ""`.
- Campaign offered/cleared are protocol v1 (ADR-0019); payloads never carry OCP wire ids.
- Second preview while modal open is held desktop-side; hosts see Cleared→Offered only on accept/reject/clear promote.

## Key files

| Area | Path |
| --- | --- |
| Projection | `src/application/projections/integration/callOcpContextProjection.ts` |
| Derive | `src/application/projections/integration/deriveCallContextBadges.ts` |
| Campaign gate | `src/application/projections/integration/campaignEventProjection.ts` |
| Bridge | `src/application/services/integration/OcpTelephonyBridgeService.ts` |
| Wire map (outbound) | `src/adapters/integration/ocp/buildOcpCommandPayload.ts` |
| Session login | `OcpSessionProjection.authenticatedLogin` via `OcpAuthenticateAndConnectService` |
| Lifecycle campaign Domain Events | `src/application/services/integration/OcpSessionLifecycleService.ts` |
| Domain signal (queue) | `src/domain/integration/ocp/events/CallOcpContextResolved.ts` |
| Domain signal (campaign) | `src/domain/integration/ocp/events/OperatorCampaignOffered.ts`, `OperatorCampaignCleared.ts` |
| SDK mapper | `src/application/integration/ExternalSdkEventMapper.ts` |
| Snapshot | `src/application/integration/ExternalSdkSnapshotAssembler.ts` |
| Hub | `src/application/read-models/OcpProjectionHub.ts` |
| Badges UI | `src/renderer/components/call/CallContextBadges.tsx` |
| Modal UI | `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx` |
| Shell raise | `src/renderer/hooks/useShellWindowAttentionFromCampaign.ts` → `shell:window-raise` |
| Protocol | `axatalk-sdk/packages/protocol/src/events.ts`, `snapshot.ts` |
| ADR | `docs/softphone/adr/ADR-0019-sdk-campaign-events-v1.md`, `ADR-0020-sdk-ocp-acd-context-wire.md` |

## Out of scope

- Host-page `softphone-queue-info` CustomEvent (legacy embed contract)
- Public SDK `operator:campaign-accept` / `operator:campaign-reject` (v1 non-goal; desktop UI)
- Restoring removed F-015 / P07 legacy operator stack
- Reintroducing DOM `dispatchEvent` / `window.Softphone` as a product API
