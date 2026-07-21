# Events Catalog

Subscribe only to **public protocol event type names**.  
Never import or mirror desktop Domain Event names.

Constant: `PUBLIC_EVENT_TYPES` from `@axata/axatalk-sdk`.

## Public types

| Type | Typical host reaction |
| --- | --- |
| `call:incoming` | Offer answer/reject UI |
| `call:outgoing` | Show dialing |
| `call:ringing` | Ringing indicator |
| `call:answered` | Active call UI |
| `call:ended` | Tear down call UI |
| `call:failed` | Error toast (no raw SIP text) |
| `call:held` / `call:resumed` | Hold state |
| `call:muted` / `call:unmuted` | Mute state |
| `registration:changed` | SIP registration badge |
| `account:session-activated` | Account signed-in projection |
| `account:session-ended` | Account signed-out projection |
| `operator:session-changed` | Operator connectivity |
| `operator:status-changed` | Ready / break UI |
| `window:visibility-changed` | Softphone window state |
| `sdk:server-shutdown` | Prompt reconnect / wait for desktop |

## Usage

```ts
const stop = client.subscribe('account:session-activated', (event) => {
  // Use protocol name only — never Domain Event aliases.
  void event.type;
});
// later
stop();
```

## Anti-corruption rules

| Do | Do not |
| --- | --- |
| Match on `PUBLIC_EVENT_TYPES` | Listen for internal Domain Event strings |
| Treat payload as redacted DTO | Assume full phone numbers / secrets |
| Re-fetch snapshot on sequence gaps | Patch local call graph from partial events blindly |
