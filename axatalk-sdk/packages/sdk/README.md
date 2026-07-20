# @axatalk/sdk

Browser SDK client for Axatalk Desktop.

**Status:** SDK-03 — internal transport and connection state machine implemented.
Public `AxatalkClient` surface remains empty (`api:check` enforced) until SDK-05.

Depends on `@axatalk/protocol` only. Must never import Axatalk Desktop Domain,
Application, Electron, JsSIP, React, or Zustand.

Internal production modules (not exported from package entry):

- injectable `TransportPort`
- explicit connection state machine
- request correlation, timeouts, abort/disconnect cleanup
- heartbeat and bounded jittered reconnect
- redaction-safe diagnostics

`FakeTransport` / test helpers live under `src/internal/` for unit tests only and are
excluded from the published `dist/` tarball.
