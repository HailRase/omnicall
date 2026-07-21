# @axata/axatalk-sdk

Browser SDK client for Axatalk Desktop.

**Status:** SDK-05 — read-only `AxatalkClient` (lifecycle, snapshot, typed events,
capability-gated `window.show`). Call/operator/account mutations arrive in later units.

Depends on `@axata/axatalk-protocol` only. Must never import Axatalk Desktop Domain,
Application, Electron, JsSIP, React, or Zustand.

Public surface:

- `createAuthClient` — pairing / PoP / capabilities (SDK-04)
- `createAxatalkClient` — read-only product API on top of auth (SDK-05)

Internal production modules (not exported from package entry):

- injectable `TransportPort`
- explicit connection state machine
- request correlation, timeouts, abort/disconnect cleanup
- heartbeat and bounded jittered reconnect
- snapshot cache, sequence-gap resync, redaction-safe diagnostics

`FakeTransport` / test helpers live under `src/internal/` for unit tests only and are
excluded from the published `dist/` tarball.
