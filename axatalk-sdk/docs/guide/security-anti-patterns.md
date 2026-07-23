# Security Anti-Patterns

Fail closed. If a pattern is not listed as allowed, treat it as forbidden.

## Forbidden

| Anti-pattern | Why | Correct approach |
| --- | --- | --- |
| `requestedCapabilities: ['account.activate']` at pairing | Privileged; SDK **strips** it (`sanitizeRequestedCapabilities`) | Operator grants via desktop Settings (DI-09); SDK receives grant on wire |
| Requesting `window.hide` | Privileged + **unavailable in v1 product** | Do not call; do not document as available |
| SIP password / OCP `apiKey` in SDK calls | Secrets must stay in desktop secure storage | Saved-account `login` + `account.activateProfile` when granted |
| Persist PoP / tokens in `localStorage` / `sessionStorage` | XSS-readable | `createIndexedDbPopKeyStore` (browser) or `createMemoryPopKeyStore` (tests) |
| Log pairing material, tokens, phones, reply payloads | PII / secret leak | Log `code`, `retryable`, `requestId`, command type only |
| Auto-replay mutations after reconnect | Non-idempotent; can double-originate | Bind `expectedRevision` on a **fresh** snapshot; user re-issues |
| Hang up / logout / activate on `disconnect()` | Desktop session must survive SDK crash | `disconnect()` closes transport only |
| Custom reconnect inside `TransportPort` | Session owns bounded reconnect + snapshot | Thin `createBrowserWebSocketTransport` only |
| Binary WebSocket frames / own JSON parser in transport | Protocol validation is above the port | Text frames via `TransportPort.onMessage` |
| Invent `account:list-profiles` | Not in protocol v1 | Supply the saved-account `login` from your product |
| Auto-logout on disconnect | Destructive side effect | Host calls `logout` only after user confirms; cancel = do not call |
| Treat Origin substring / wildcard as OK | Exact Origin only | Exact approved Origin string |

## Privilege fortress (activate)

```ts
// WRONG — stripped; never becomes a working grant
createAxatalkClient({
  requestedCapabilities: ['account.activate'], // stripped client-side
  // ...
});

// RIGHT — activate only after desktop has granted the cap on the session
const caps = client.getGrantedCapabilities();
if (!caps.includes('account.activate')) {
  // show host UI: ask operator to grant in Axatalk Settings
  return;
}
await client.account.activateProfile({ login, expectedRevision });
```

Enforcement lives in product code (`packages/sdk/src/internal/requested-capabilities.ts`),
not in this markdown. Unit proof: `auth-client.test.ts` / activate privilege tests.

## Storage checklist

| Store | Allowed for PoP private key? |
| --- | --- |
| IndexedDB via `createIndexedDbPopKeyStore` | Yes |
| In-memory `createMemoryPopKeyStore` | Yes (tests / short-lived) |
| `localStorage` / `sessionStorage` | **Never** |
| Cookies / URL query | **Never** |

## Disconnect / reconnect checklist

| Action | Allowed side effect |
| --- | --- |
| `client.disconnect()` | Close WS; reject in-flight; **no** hangup / logout / activate |
| Reconnect after drop | New auth + **fresh** `getSnapshot`; **no** automatic mutation replay |
| Tab B races Tab A | Expect `conflict` / `not_owner`; do not retry blindly |
