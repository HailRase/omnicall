# Events Catalog

Subscribe only to **public protocol event type names**.  
Never import or mirror desktop Domain Event names.

Constant: `PUBLIC_EVENT_TYPES` from `@softomnitel/omnicall-kit`.

## Public types

| Type | Typical host reaction |
| --- | --- |
| `call:incoming` | Offer answer/reject UI; optional additive `queueLabel` (ACD) |
| `call:outgoing` | Show dialing; optional `queueLabel` |
| `call:ringing` | Ringing indicator; optional `queueLabel` |
| `call:answered` | Active call UI; optional `queueLabel` |
| `call:ended` | Tear down call UI |
| `call:failed` | Error toast (no raw SIP text) |
| `call:held` / `call:resumed` | Hold state |
| `call:muted` / `call:unmuted` | Mute state |
| `call:acd-context` | OCP MainCallIDInfo wire (`acallid` / `main_acallid` / parties / `queue`) — needs `ocp.acd_context.read` (ADR-0020) |
| `registration:changed` | SIP registration badge |
| `account:session-activated` | Account signed-in projection |
| `account:session-ended` | Account signed-out projection |
| `operator:session-changed` | Operator connectivity (`connected`) |
| `operator:status-changed` | Coarse Ready / Break / offline / post_call_processing / unknown UI; optional `reservedTarget` / `reservedReasonId` |
| `operator:campaign-offered` | OCP campaign offer (`mode: preview \| progressive`); redacted labels/phone — needs `operator.campaign.read`. Desktop holds a second preview until the modal clears (no immediate supersede). |
| `operator:campaign-cleared` | Offer cleared (`reasonCode` optional) — needs `operator.campaign.read`. After clear+promote: Cleared then Offered. |
| `window:visibility-changed` | Softphone window state |
| `sdk:server-shutdown` | Prompt reconnect / wait for desktop |

Desktop (OmniCall) emits the operator events above from OCP Domain Events via
`ExternalSdkEventMapper` (DI-05 follow-up). Mid-call OCP statuses (talking, hold, …)
project as public `unknown`. **Post-call processing** projects as
`post_call_processing` so CRM can enable `operator.finishAppeal`. Campaign notify
events require `operator.campaign.read` (ADR-0019); accept/reject stay on desktop UI.

`sdk:server-shutdown` is emitted best-effort on controlled desktop/gateway stop
(`beginAppShutdown` → `reasonCode: "app_quit"`; `stop` → `"gateway_stop"`) **before**
sockets terminate (ADR-0009). Hard process kill may omit it — rely on disconnect /
heartbeat as fallback.

### Call ACD context (OCP `get_main_acallid`)

When OCP resolves ACD context for a live SIP call, desktop emits:

1. **`call:acd-context`** — full OCP MainCallIDInfo wire (prefer for CRM):
   - `callId` (desktop SIP id) + `main_acallid?`, `acallid`, `event`,
     `caller_id`, `called_id`, `queue`, `user_login`
   - optional `phase` / `direction`
   - requires `ocp.acd_context.read` (ADR-0020)
2. **Additive `queueLabel` on an existing `call:*`** — desktop-safe title only
   (no wire ids; omitted when empty).

Empty/direct queue → `call:acd-context` still fires with `queue: ""`;
`queueLabel` on `call:*` omitted. Details: `docs/softphone/OCP-Call-Context.md`.

**Enrichment idempotency (hosts):** the secondary `call:*` + `queueLabel` re-emit
is **not** a new offer. Key local CRM state by `payload.callId` and treat a later
`call:incoming` / `call:outgoing` / `call:answered` with the same `callId` as an
additive update (attach `queueLabel`), never as a second lead/card.

**Snapshot recovery:** `getSnapshot().sections.calls[].acdContext` carries the same
MainCallIDInfo wire (capability-gated) so reconnect does not require a live
replay. `queueLabel` stays on every `session.read.redacted` call summary.

```ts
client.subscribe('call:acd-context', (event) => {
  void event.payload.main_acallid;
  void event.payload.acallid;
  void event.payload.queue;
  void event.payload.user_login;
});

const snapshot = await client.getSnapshot();
for (const call of snapshot.sections.calls ?? []) {
  void call.queueLabel;
  void call.acdContext?.acallid;
}
```

## Usage

```ts
const stop = client.subscribe('account:session-activated', (event) => {
  // Use protocol name only — never Domain Event aliases.
  void event.type;
});
// later
stop();
```

### Operator + revision (host recipe)

```ts
client.subscribe('operator:status-changed', (event) => {
  // Update UI from event.payload.status / reasonId / reservedTarget — hint only.
  void event.payload;
});

client.subscribe('operator:session-changed', (event) => {
  void event.payload.connected;
});

client.subscribe('operator:campaign-offered', (event) => {
  // Redacted DTO only — never expect OCP wire ids.
  // Desktop may hold a second preview until accept/reject; then Cleared → Offered.
  void event.payload.campaignId;
  void event.payload.mode;
  void event.payload.remoteNumber;
});

client.subscribe('operator:campaign-cleared', (event) => {
  void event.payload.campaignId;
  void event.payload.reasonCode; // superseded retained in schema; desktop hold path does not emit it
});

// Before operator:change-status / other mutations:
const revision =
  client.getRevision() ?? (await client.getSnapshot()).revision;

// Reconnect recovery for an active offer (visible preview or progressive; not held pending):
const campaignSnapshot = await client.getSnapshot();
void campaignSnapshot.sections.operator?.campaign;
```

Rules:

- Public events with `revision` advance latest-known `getRevision()` (monotonic).
- Snapshot sections remain the UI source of truth; events do **not** patch the
  snapshot cache — use `getCachedSnapshot()` only as the last full snapshot.
- Prefer `getRevision()` for the next `expectedRevision`; after reconnect/gap
  fetch a fresh snapshot before intentional mutations.
- On `event.sequence_gap` diagnostics the client already triggers `getSnapshot()`.
- Desktop **coarse-advances** the shared session revision when public coarse status
  changes (`ready|break|offline|post_call_processing|unknown`), when `reasonId` changes on
  `ready|break`, when `connected` flips, or when post-call **reservation**
  (`reservedTarget` / `reservedReasonId`) changes — not on every talking↔hold transition
  inside `unknown`.
- `operator:change-status` reply includes `kind: "applied" | "reserved"` — reserved
  means post-call booking, not an immediate Break/Ready chip.
- Snapshot / `operator:status-changed` may include additive `reservedTarget` /
  `reservedReasonId` so hosts recover booking after reconnect (see
  [Operator status & reservation](./operator-status-reservation.md)).
- `operator:finish-appeal` applies the reserved (or default Ready) status and is valid
  only while public status is `post_call_processing`.

## Wire sequence (product + auth)

Per authenticated Local WS connection, **all** `kind: "event"` frames share one
monotonic `sequence` — including non-public auth lifecycle events
(`sdk:permission-changed`, `sdk:revoked`) and public product events.

| Rule | Behavior |
| --- | --- |
| Public subscribe | `OmniCallClient.subscribe` delivers only `PUBLIC_EVENT_TYPES` |
| Auth lifecycle | Handled by auth orchestrator; **still advances** the client sequence cursor so the next public event does not false-gap |
| Fan-out | Desktop validates the wire candidate **before** bumping `eventSequence` |
| Gap recovery | Real gaps (lost frames) → `event.sequence_gap` → automatic `getSnapshot()` |

Hosts must not assume `sequence` only counts subscribed public types.

## Anti-corruption rules

| Do | Do not |
| --- | --- |
| Match on `PUBLIC_EVENT_TYPES` | Listen for internal Domain Event strings |
| Treat payload as redacted DTO | Assume full phone numbers / secrets |
| Re-fetch snapshot on sequence gaps | Patch local call graph from partial events blindly |
| Treat operator status as coarse enum | Expect full OCP numeric status mirror |
