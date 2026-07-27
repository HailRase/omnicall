# Pairing Quick Start

Constructor is **side-effect-free**. Network starts only on `connect()`.

> Runnable source of truth: [`examples/crm-pairing-lite`](../../examples/crm-pairing-lite/).  
> That example uses a **fake peer** — not a production desktop.

## Minimal flow

```ts
import {
  createAxatalkClient,
  createIndexedDbPopKeyStore,
  createMemoryPopKeyStore,
  isAxatalkClientError
} from '@axata/axatalk-sdk';

// Browser production: IndexedDB. Tests / Node demo: memory.
const keyStore =
  typeof indexedDB !== 'undefined'
    ? createIndexedDbPopKeyStore({ installId: 'crm-install-1' })
    : createMemoryPopKeyStore();

const client = createAxatalkClient({
  url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
  origin: 'https://crm.example', // exact Origin; must be allowed (or first-contact TOFU — ADR-0018)
  application: { name: 'my-crm', version: '1.2.0' },
  sdkVersion: '0.0.0',
  requestedProfile: 'call_controller',
  // Non-privileged only. Privileged ids are stripped — do not request them.
  requestedCapabilities: [
    'session.read.redacted',
    'window.show',
    'call.originate',
    'call.control',
    'session.logout',
    'operator.status.write'
  ],
  keyStore
  // Omitting transportFactory / scheduler / jitter uses browser defaults:
  // createBrowserWebSocketTransport, createBrowserScheduler, createBrowserJitterSource.
  // Unit tests should inject FakeTransport + createFakeScheduler + createFixedJitterSource.
});

client.onPairingRequired((info) => {
  // After Origin is allowed (TOFU modal Allow on first contact — ADR-0018), desktop may
  // still require pairing approval for this client install (ADR-0016).
  // Denied / blacklisted Origins never open the socket (`origin_blocked` on reconnect).
  console.info('pairing required', info.origin, info.requestedProfile);
});

client.onStateChange((state) => {
  console.info('state', state);
});

await client.connect();
await client.waitUntil((s) => s === 'ready');

const snapshot = await client.getSnapshot();
const revision = snapshot.revision;

client.subscribe('call:incoming', (event) => {
  // Handle redacted public event — never log full payload in production.
  void event.type;
});

void revision;
```

## State ladder

| State | Meaning | Host UI |
| --- | --- | --- |
| `idle` | Constructed | Show Connect |
| `connecting` / `handshaking` | Transport + hello | Spinner |
| `pairing_required` | Human approval needed | Instruct user to approve in desktop |
| `authenticating` | PoP challenge | Spinner |
| `ready` | Session + snapshot path live | Enable product UI |
| `reconnecting` | Bounded retry | Non-blocking banner |
| `revoked` / `incompatible` / `failed` / `closed` | Terminal-ish | Clear session UI; re-pair if needed |

## Checklist

- [ ] Origin exact match; unknown → renderer Allow/Deny modal (ADR-0018); then pairing
- [ ] Blacklisted → no upgrade (`origin_blocked`); Unblock restores prior `allowed` matrix when applicable
- [ ] PoP in IndexedDB (browser) or memory (tests) — never Web Storage
- [ ] Privileged caps **not** in `requestedCapabilities` (and would be stripped anyway)
- [ ] After ready: enable `window.hide` / `account.activate` only in Axatalk Settings →
      SDK Origin matrix, then call `client.window.hide({ expectedRevision })` /
      `activateProfile` (never request those caps at pairing)
- [ ] `getSnapshot()` / `getRevision()` before mutations
- [ ] Typed errors via `isAxatalkClientError`
- [ ] Do not confuse Origin deny / `origin_blocked` with product `not_ready` (broker / composition)
- [ ] Transport: see [Transport](./transport.md) — do not invent a second reconnect layer on the socket

## Privileged window hide (after ready)

`window.hide` is **product-available** in protocol v1 (ADR-0013 amended 2026-07-27).

1. Operator enables `window.hide` for your Origin in Axatalk → Settings → Axatalk SDK
   (Trusted sites matrix; default **off**).
2. Host calls `client.window.hide({ expectedRevision })` with a fresh revision.
3. Desktop denies with `conflict` while ringing / connecting / in-call; recovery is
   tray Show or `client.window.show()`.

See [API reference — window](./api-reference.md) and [Capabilities](./capabilities.md).
