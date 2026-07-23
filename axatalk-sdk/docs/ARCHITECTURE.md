# Axatalk SDK Architecture

## Decision

Axatalk SDK is a thin browser client over a versioned local protocol. It contains no
telephony, operator, account, or Electron business logic.

```text
Web application
  -> @axata/axatalk-sdk
  -> secure local WebSocket
  -> Axatalk Desktop gateway
  -> typed main-to-renderer broker
  -> Application command router
  -> existing Facades / Use Cases / Call Engine
```

## Package Boundaries

### `@axata/axatalk-protocol`

Owns:

- command, reply, event, handshake, snapshot, and error schemas;
- protocol version negotiation types;
- public opaque identifiers;
- compatibility fixtures;
- redaction-safe payload definitions.

Must not own:

- transport implementation;
- retries or timers;
- desktop policy;
- business rules;
- generated user-facing text.

### `@axata/axatalk-sdk`

Owns:

- official browser WebSocket transport (`createBrowserWebSocketTransport`) behind
  injectable `TransportPort` / `transportFactory` (tests and non-DOM hosts may inject);
- handshake and session lifecycle;
- request correlation, timeouts, cancellation, and bounded reconnect;
- typed method groups and subscriptions;
- snapshot cache with revision handling;
- public diagnostics that contain no secrets or PII.

Must not own:

- server authorization;
- command arbitration;
- telephony state transitions;
- credentials or profile persistence;
- Electron window behavior;
- desktop listening sockets (Electron main owns the gateway).

### `@axata/axatalk-sdk-testing`

Optional after SDK-05. Owns deterministic fixtures and a fake protocol peer for integrators.
It must never contain production credentials or desktop implementation code.

## Public Client Shape

The constructor accepts only client and transport configuration:

- application/client identity;
- endpoint URL (and discovery strategy where documented);
- requested capabilities;
- reconnect and timeout policy;
- optional diagnostics sink;
- optional `transportFactory` / `scheduler` / `jitter` (browser defaults when omitted).

The constructor does not connect, pair, authenticate, or sign in.

The public surface is grouped:

- client lifecycle: connect, disconnect, get connection state, get snapshot;
- `calls`: originate, answer, reject, hang up, hold, resume, mute, unmute, DTMF;
- `account`: activate a saved profile, prepare logout, confirm logout;
- `operator`: get reasons, change status;
- `window`: show, get visibility; hide only if desktop grants it;
- events: typed subscription by event name and unsubscribe.

The exact v1 list is frozen by SDK-02. New methods require protocol review.

## State Model

The SDK has an explicit connection state machine:

```text
idle
  -> connecting
  -> handshaking
  -> pairing_required | authenticating
  -> ready
  -> reconnecting
  -> ready | incompatible | revoked | failed
  -> closed
```

Account, SIP registration, OCP session, active calls, and window visibility are separate
snapshot sections. Connection state must never imply account authorization.

## Delivery Model

- Commands use request/reply and a unique request ID.
- Events use a monotonic sequence within one server instance/session epoch.
- A full snapshot is delivered after successful authentication and every reconnect.
- Mutations may include `expectedRevision`.
- Duplicate request IDs are rejected or return the cached idempotent reply.
- Non-idempotent commands are never replayed automatically by the SDK.

## Dependency Rules

```text
application code -> @axata/axatalk-sdk -> @axata/axatalk-protocol
test code        -> @axata/axatalk-sdk-testing -> @axata/axatalk-protocol
```

No reverse dependency is allowed. The desktop consumes the same protocol package or the
same generated fixtures, but the SDK never imports desktop source.

## Chosen Technologies

SDK-00 must record exact versions after checking current stable releases.

- TypeScript in strict mode.
- ESM-first package output with explicit exports.
- A browser-compatible WebSocket abstraction injected behind an internal transport port,
  with the official production adapter `createBrowserWebSocketTransport`.
- One runtime schema system for all protocol messages.
- Vitest for unit and contract tests.
- API Extractor or an equivalent deterministic API-report gate.
- A browser test runner for Chrome and Edge; add Firefox only after transport feasibility.
- Changesets or an equivalent package release workflow.

No framework runtime is allowed. React bindings, if ever needed, are a separate package
and a separate decision.

## Rejected Alternatives

### Export desktop Domain Events

Rejected because internal events are not versioned public DTOs and include implementation
details, loose payload typing, and unstable semantics.

### Recreate `window.Softphone`

Rejected because global mutation, DOM event transport, and embed coupling violate the
desktop architecture and F-011.

### Put the SDK server in the Electron renderer

Rejected because the sandboxed renderer must not own a listening socket.

### Create a second desktop Application composition in main

Rejected because it would create independent call/account state and duplicate side effects.

### Send raw credentials in normal SDK configuration

Rejected because any page script, XSS, extension, or developer tool could read them.

## Architecture Change Gate

Any change to process ownership, trust model, credential flow, event semantics, or package
boundaries requires an ADR before implementation.
