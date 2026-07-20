# Axatalk SDK Security Baseline

## Threat Model

The local WebSocket is a privileged control surface. Loopback does not imply trust.
Attackers include:

- an arbitrary website opened by the user;
- XSS in an approved web application;
- a malicious browser extension;
- a replaying or cloned client;
- another local process;
- an outdated SDK or desktop application;
- a client that floods, stalls, or races commands.

## Mandatory Trust Layers

### Network

- Desktop binds only to explicit loopback addresses.
- Desktop fails closed when the configured port is occupied.
- Frame size, message depth, connection count, and outbound queue are bounded.
- Idle and unauthenticated connections expire.

### Origin

- The WebSocket upgrade requires an exact approved Origin.
- Missing, `null`, wildcard, suffix, and substring matches are rejected by default.
- Origin is an additional gate, not proof of client identity.

### Pairing

- Pairing requires an explicit local user or administrator decision.
- Each client installation receives a distinct revocable identity.
- Pairing material is never embedded in JavaScript bundles or URLs.
- Session credentials are short-lived and bound to Origin, client ID, server instance,
  and negotiated capabilities.
- Replay is limited with nonces, unique request IDs, expiry, and a bounded deduplication cache.

### Authorization

Server-issued capabilities are the only authorization source:

- `session.read.redacted`
- `window.show`
- `window.hide`
- `operator.status.write`
- `call.originate`
- `call.control`
- `account.activate`
- `session.logout`

Capabilities are checked for every command, not only during handshake.

## Capability Levels

1. **Unauthenticated** — handshake and pairing request only.
2. **Presentation** — redacted state and window show.
3. **Operator** — operator status changes.
4. **Call controller** — call mutations, preferably scoped to calls created by the client.
5. **Privileged session** — account activation, logout, and window hide with short grants.

## Credential Policy

Normal browser SDK flows must not accept:

- SIP passwords;
- OCP API keys;
- OCP session tokens;
- secret-storage values;
- remembered profile secrets.

Preferred account flow:

1. SDK requests activation of an approved saved profile.
2. Desktop enforces identity/session policy.
3. Desktop retrieves secrets from its own secure storage.
4. SDK receives only an operation result and redacted state.

Raw credential provisioning, if a business requirement proves unavoidable, is a separate
administrative feature with its own ADR, capability, local approval, audit, and expiry.

## Privacy Policy

- Phone numbers and display names are masked unless a specific capability grants them.
- Events are delivered per authorized session, never indiscriminately broadcast.
- Contacts, call history, raw SIP URIs, OCP wire IDs, and upstream error text are excluded
  from protocol v1 unless separately approved.
- Logs contain command type, request ID, client ID, correlation ID, result, and duration only.
- Payloads and authorization headers are never logged.

## Command Safety

- Mutations are serialized per call or account aggregate.
- Destructive commands support ownership/lease policy and expected revision.
- Conflicts return stable errors such as `conflict`, `stale_state`, or `not_owner`.
- `window.hide` is unavailable in protocol v1 until tray/background policy is accepted
  (ADR-0013). When later enabled, hide remains denied during incoming or active calls
  unless that policy explicitly allows it.
- Focus-stealing window operations are rate-limited.
- Logout requires the OCP reason workflow when applicable.

## Compatibility Safety

Handshake negotiates:

- protocol minimum and maximum;
- SDK version;
- desktop version;
- capabilities;
- server instance ID;
- session epoch;
- current snapshot revision.

An incompatible client receives no snapshot or PII. After desktop restart, the SDK discards
old request IDs and state, reauthenticates, and obtains a fresh snapshot.

## Required Security Tests

- hostile, missing, and `null` Origin;
- unauthenticated snapshot/event access;
- replayed pairing, authentication, and command messages;
- duplicate request IDs;
- capability escalation and revoked clients;
- conflicting commands from two tabs;
- oversized frames, deep JSON, connection flood, and slow consumers;
- secret and PII absence in logs and unauthorized events;
- occupied port and second Electron instance;
- desktop restart or update during an active call;
- old SDK against new desktop and new SDK against old desktop;
- OCP endpoint injection and SSRF attempts;
- logout and hide policy bypass attempts.

## Security Release Gate

Public npm publication is blocked until an independent security review reports no Blockers
and every mandatory security test passes against a packaged desktop build.
