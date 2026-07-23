# Transport (WebSocket port)

The SDK speaks the Axatalk local protocol over a **byte channel**. It does **not** own
desktop listening sockets. Electron main owns the gateway; the browser client opens a
WebSocket to loopback.

## Mental model

```text
AxatalkClient / AuthClient
  → TransportPort (connect / send / close / events)
  → createBrowserWebSocketTransport()  ← official default
  → browser WebSocket
  → ws://127.0.0.1:…/axatalk/v1/ws
  → Desktop gateway (main)
```

`TransportPort` is intentionally dumb:

- no JSON parse;
- no pairing / PoP / capabilities;
- no reconnect / backoff (owned by the connection session);
- text frames only.

## Happy path (production browser)

Omit `transportFactory`, `scheduler`, and `jitter` — defaults are:

| Option | Default |
| --- | --- |
| `transportFactory` | `createBrowserWebSocketTransport` |
| `scheduler` | `createBrowserScheduler()` (`Date` + `setTimeout`) |
| `jitter` | `createBrowserJitterSource()` (`Math.random`) |

```ts
import {
  createAxatalkClient,
  createIndexedDbPopKeyStore
} from '@axata/axatalk-sdk';

const client = createAxatalkClient({
  url: 'ws://127.0.0.1:17341/axatalk/v1/ws',
  origin: 'https://crm.example',
  application: { name: 'my-crm', version: '1.2.0' },
  sdkVersion: '0.1.0-rc.0',
  requestedProfile: 'call_controller',
  requestedCapabilities: ['session.read.redacted', 'call.originate', 'call.control'],
  keyStore: createIndexedDbPopKeyStore({ installId: 'crm-install-1' })
  // transportFactory / scheduler / jitter omitted → browser defaults
});
```

Explicit factory (same default):

```ts
import { createBrowserWebSocketTransport } from '@axata/axatalk-sdk';

transportFactory: createBrowserWebSocketTransport
```

## When to inject a custom `transportFactory`

| Scenario | What to do |
| --- | --- |
| Unit tests | Inject `FakeTransport` (workspace tests) or a mock `webSocket` ctor |
| Node / non-DOM | Pass your own `TransportPort` over `ws` / undici — browser default requires `WebSocket` |
| Proxy / harness | Implement `TransportPort` and keep protocol in the SDK |

Inject a **new** port instance per connect/reconnect (`TransportFactory = () => TransportPort`).
Do not reuse one open socket across reconnect attempts.

## Official adapter guarantees

`createBrowserWebSocketTransport`:

1. Maps `open` / text `message` / `close` / `error` to `TransportPort` listeners.
2. Rejects non-string frames (`Blob` / `ArrayBuffer`) → error `unsupported_data` + close `1003`.
3. Fail-closed if `WebSocket` is missing (clear Error) unless `webSocket` is injected for tests.
4. Fail-closed on reuse — create a fresh instance via the factory.

Optional test injection:

```ts
createBrowserWebSocketTransport({ webSocket: MyMockWebSocket })
```

## Anti-patterns

| Do not | Why |
| --- | --- |
| Put `originate` / `logout` on the socket wrapper | Product API lives on `AxatalkClient` |
| Parse protocol JSON inside `TransportPort` | Validation belongs after the port |
| Auto-reconnect inside the adapter | Session owns bounded reconnect + fresh snapshot |
| Use `localStorage` for transport secrets | There are no transport secrets; PoP is IndexedDB |
| Invent `fetch` fallbacks to desktop HTTP product APIs | Forbidden — see [installation](./installation.md) |

## Related

- [Pairing quick start](./pairing-quick-start.md)
- [Reconnect & multi-tab](./reconnect-multi-tab.md)
- [Security anti-patterns](./security-anti-patterns.md)
- Desktop: ADR-0010 / ADR-0015 (loopback bind, discovery, LNA)
