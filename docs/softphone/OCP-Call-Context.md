# OCP Call Context (Queue + Campaign)

- **Feature:** F-028 (extends E-09 / E-10); SDK surface F-011 / DI-05
- **Legacy parity:** LF-037, LF-038, LF-039, LF-040 (via F-028; P07 removed per ADR-0005)
- **Updated:** 2026-07-26

## Purpose

Document how Axatalk projects OCP ACD queue names and campaign offers onto call UI **and**
(optionally) onto the public Axatalk SDK — **without** legacy DOM CustomEvents, substring
call-id matching, or host `softphone-queue-info`.

## Sources

| Source | Wire | Application state | Desktop UI | Public SDK |
| --- | --- | --- | --- | --- |
| ACD queue | `get_main_acallid` → `entity: calls` (`OcpMainCallIdInfoPayload.queue`) | `CallOcpContextProjection` | Badge on incoming / active call | Additive `queueLabel` on `call:*` events + snapshot call summary |
| Campaign preview | `entity: campaign_events` + `progressive: false` | `CampaignEventProjection.activeCampaign` | Centered blur modal (accept/reject) | **Not in protocol v1** (ADR-0017 O-CAMP-1) |
| Campaign progressive | `entity: campaign_events` + `progressive: true` | `CampaignEventProjection.progressiveContext` | Badges only (no modal) | **Not in protocol v1** |

## Rules

1. **Queue badge (incoming only):** show when `direction === "incoming"` and `queueName` is non-empty after resolve.
2. **Direct / internal incoming:** OCP may return empty `queue` — parse keeps `queue: ""`; projection stores `queueName: null`; UI hides queue (no SIP `isInternal` flag); SDK omits `queueLabel`.
3. **Pending:** `resolveState: "pending"` shows a short skeleton; after 5s without resolve → `unavailable` (hide).
4. **One queue label:** OCP `calls.queue` wins over `campaign.queueTitle` (no duplicate tags).
5. **Modal:** only non-progressive (`activeCampaign`). Progressive never opens the modal.
6. **Shell raise (preview only):** when `activeCampaign` appears, renderer edge
   `useShellWindowAttentionFromCampaign` → IPC `shell:window-raise`
   (`reason: ocp_campaign_offer`, dedupe = campaign `id`) → main
   `ShellWindowAttentionController` / `bringBrowserWindowToFront` (ADR-0013).
   Progressive context does **not** raise. Same path as incoming call — not a
   local `BrowserWindow` call from React.
7. **SIP-only / OCP offline:** all badges and modal hidden; SDK `queueLabel` absent.
8. **Correlation:** exact SIP `callId` via `OcpTelephonyBridgeService` pending map — no `session.id.includes`.
9. **Cleanup:** `CallEnded` / `CallFailed` clear call context entry and campaign slots; logout `resetToIdle` clears both.
10. **SDK privacy:** never expose OCP `acallid` / wire ids; only desktop-safe `queueLabel` (max 128) when non-empty.

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

On non-empty queue resolve:
  → Domain CallOcpContextResolved
  → ExternalSdkEventMapper → call:* draft + queueLabel
  → Local WS fan-out → Axatalk SDK client.subscribe(...)
```

UI never talks to the OCP WebSocket. Accept/Reject go through Facade Use Cases.
External hosts never use `window.dispatchEvent` / `OCPincomingCallProgress`.

## Legacy CustomEvent → Axatalk map

| Legacy (jssip-phone) | Axatalk replacement |
| --- | --- |
| `incomingCallProgress` … `outgoingCallEnded` DOM events | Domain call events → SDK `call:incoming` / `call:outgoing` / `call:answered` / `call:ended` / … |
| `OCPincomingCallProgress` / `OCP` + event name | `CallOcpContextResolved` + projection; SDK additive `queueLabel` |
| `campaignEvents` CustomEvent | Desktop `CampaignEventProjection` + modal/badges only |
| `softphone-queue-info` | Not ported (embed contract rejected) |
| `window.Softphone` | Axatalk SDK (`@axata/axatalk-sdk`) over Local WS |

## Public SDK: subscribe / snapshot

Requires capability `session.read.redacted` (paired authenticated client).

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

// Enrichment after get_main_acallid (same callId, additive queueLabel):
const stopEnrichment = client.subscribe('call:incoming', (event) => {
  if (event.payload.queueLabel !== undefined) {
    // Show ACD queue in CRM UI
  }
});

// Authoritative recovery after reconnect:
const snapshot = await client.getSnapshot();
for (const call of snapshot.sections.calls ?? []) {
  void call.queueLabel;
}

stopIncoming();
stopEnrichment();
```

Notes:

- Re-emit uses an existing public `call:*` type (`call:incoming` / `call:outgoing` /
  `call:ringing` / `call:answered`) — **not** a new event name and **not** a Domain name.
- Empty / direct queue → no enrichment event; field omitted from snapshot.
- Campaign offered/cleared remain deferred (`operator:campaign-*`, ADR-0017).

## Key files

| Area | Path |
| --- | --- |
| Projection | `src/application/projections/integration/callOcpContextProjection.ts` |
| Derive | `src/application/projections/integration/deriveCallContextBadges.ts` |
| Campaign gate | `src/application/projections/integration/campaignEventProjection.ts` |
| Bridge | `src/application/services/integration/OcpTelephonyBridgeService.ts` |
| Domain signal | `src/domain/integration/ocp/events/CallOcpContextResolved.ts` |
| SDK mapper | `src/application/integration/ExternalSdkEventMapper.ts` |
| Snapshot | `src/application/integration/ExternalSdkSnapshotAssembler.ts` |
| Hub | `src/application/read-models/OcpProjectionHub.ts` |
| Badges UI | `src/renderer/components/call/CallContextBadges.tsx` |
| Modal UI | `src/renderer/components/integration/ocp/OcpCampaignEventModal.tsx` |
| Shell raise | `src/renderer/hooks/useShellWindowAttentionFromCampaign.ts` → `shell:window-raise` |
| Protocol | `axatalk-sdk/packages/protocol/src/events.ts`, `snapshot.ts` |

## Out of scope

- Host-page `softphone-queue-info` CustomEvent (legacy embed contract)
- SDK `operator:campaign-*` (ADR-0017 — out of protocol v1)
- Restoring removed F-015 / P07 legacy operator stack
- Reintroducing DOM `dispatchEvent` / `window.Softphone` as a product API
