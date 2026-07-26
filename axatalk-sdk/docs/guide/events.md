# Events Catalog

Subscribe only to **public protocol event type names**.  
Never import or mirror desktop Domain Event names.

Constant: `PUBLIC_EVENT_TYPES` from `@axata/axatalk-sdk`.

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
| `registration:changed` | SIP registration badge |
| `account:session-activated` | Account signed-in projection |
| `account:session-ended` | Account signed-out projection |
| `operator:session-changed` | Operator connectivity (`connected`) |
| `operator:status-changed` | Coarse Ready / Break / offline / post_call_processing / unknown UI; optional `reservedTarget` / `reservedReasonId` |
| `window:visibility-changed` | Softphone window state |
| `sdk:server-shutdown` | Prompt reconnect / wait for desktop |

Desktop (Axatalk) emits the operator events above from OCP Domain Events via
`ExternalSdkEventMapper` (DI-05 follow-up). Mid-call OCP statuses (talking, hold, …)
project as public `unknown`. **Post-call processing** projects as
`post_call_processing` so CRM can enable `operator.finishAppeal`. Campaign events remain
out of v1.

### Call queue label (OCP ACD, additive)

When OCP resolves an ACD queue for a live SIP call, desktop may re-emit an existing
`call:*` event (usually `call:incoming` / `call:outgoing` / `call:answered`) with
optional `payload.queueLabel` (max 128). The same field appears on snapshot call
summaries. **Never** expect legacy DOM names (`OCPincomingCallProgress`) or OCP
`acallid`. Empty/direct queue → field omitted. Details:
`docs/softphone/OCP-Call-Context.md`.

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

// Before operator:change-status / other mutations:
const revision =
  client.getRevision() ?? (await client.getSnapshot()).revision;
```

Rules:

- **Do not** use `event.revision` alone as the next `expectedRevision` without a
  fresh snapshot when you are unsure the cache is current.
- Snapshot remains source of truth; the SDK does **not** patch the snapshot cache
  from events.
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

## Anti-corruption rules

| Do | Do not |
| --- | --- |
| Match on `PUBLIC_EVENT_TYPES` | Listen for internal Domain Event strings |
| Treat payload as redacted DTO | Assume full phone numbers / secrets |
| Re-fetch snapshot on sequence gaps | Patch local call graph from partial events blindly |
| Treat operator status as coarse enum | Expect full OCP numeric status mirror |
