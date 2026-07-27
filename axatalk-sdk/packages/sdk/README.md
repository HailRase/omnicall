# @axata/axatalk-sdk

Browser SDK client for Axatalk Desktop.

**Status:** product namespaces through SDK-08 + official browser WebSocket transport defaults.
Call/operator/account mutations and lifecycle are on `AxatalkClient`.

Depends on `@axata/axatalk-protocol` only. Must never import Axatalk Desktop Domain,
Application, Electron, JsSIP, React, or Zustand.

Public surface (highlights):

- `createAuthClient` — pairing / PoP / capabilities
- `createAxatalkClient` — product API on top of auth
- `createBrowserWebSocketTransport` — official `TransportPort` over browser `WebSocket`
- `createBrowserScheduler` / `createBrowserJitterSource` — production timer/jitter defaults
- `createIndexedDbPopKeyStore` / `createMemoryPopKeyStore` — PoP persistence
- Type helpers: `AxatalkEventOf`, snapshot/capability re-exports, typed error readers
  (`readInteractionRequiredDetails`, …) — see `docs/guide/typescript.md`

Constructor options `transportFactory`, `scheduler`, and `jitter` are **optional** in
browsers (defaults above). Unit tests should still inject FakeTransport + fake scheduler.

Internal production modules (not all exported as helpers):

- explicit connection state machine
- request correlation, timeouts, abort/disconnect cleanup
- heartbeat and bounded jittered reconnect
- snapshot cache, sequence-gap resync, redaction-safe diagnostics

`FakeTransport` / test helpers live under `src/internal/` for unit tests only and are
excluded from the published `dist/` tarball.

See `docs/guide/transport.md` for the transport contract.
