# Axatalk Local Protocol v1 Design

## Status

Design baseline. The contract becomes frozen only when SDK-02 and desktop DI-02 close
against the same compatibility fixtures.

## Principles

- Public DTOs are not desktop Domain objects.
- Every message is runtime-validated.
- Commands, replies, events, and snapshots are discriminated unions.
- All values are JSON-safe.
- Machine-readable codes are stable; localized text is never transported.
- Protocol version is independent from npm package and desktop versions.

## Envelope Requirements

Every message identifies:

- protocol version;
- message kind;
- message type;
- server instance and session epoch after handshake;
- request ID for commands/replies or event ID and sequence for events;
- occurrence timestamp;
- payload validated by message type.

Unknown required fields, unsupported versions, invalid payloads, and oversized messages fail
closed with a stable error or connection close according to protocol policy.

## Handshake

The client hello contains:

- supported protocol range;
- SDK version;
- client application name and version;
- stable paired client ID when available;
- requested capabilities;
- client nonce.

The server hello contains:

- selected protocol version;
- desktop version;
- server instance ID and session epoch;
- server nonce;
- pairing or authentication challenge;
- maximum message size;
- heartbeat policy.

No product snapshot or PII is sent before authentication succeeds.

## Command Namespaces

### SDK lifecycle

- `sdk:get-snapshot`
- `sdk:ping`

### Window

- `window:show`
- `window:get-state`
- `window:hide` — privileged and policy-gated

### Calls

- `call:originate`
- `call:answer`
- `call:reject`
- `call:hangup`
- `call:hold`
- `call:resume`
- `call:mute`
- `call:unmute`
- `call:send-dtmf`

### Account

- `account:activate-profile`
- `account:prepare-logout`
- `account:confirm-logout`

### Operator

- `operator:get-reasons`
- `operator:change-status`

Protocol v1 does not include raw SIP or OCP credential commands.

## Event Namespaces

### Calls

- `call:incoming`
- `call:outgoing`
- `call:ringing`
- `call:answered`
- `call:ended`
- `call:failed`
- `call:held`
- `call:resumed`
- `call:muted`
- `call:unmuted`

### Registration and account

- `registration:changed`
- `account:session-activated`
- `account:session-ended`

### Operator

- `operator:session-changed`
- `operator:status-changed`
- `operator:campaign-offered` — only after privacy review
- `operator:campaign-cleared`

### Window and SDK

- `window:visibility-changed`
- `sdk:permission-changed`
- `sdk:revoked`
- `sdk:server-shutdown`

Internal retry events, ringtone/tone events, raw SIP status codes, adapter events, headset
events, and raw OCP messages are not public events.

## Snapshot

The authenticated snapshot contains independently versioned sections:

- SDK session and granted capabilities;
- account session state;
- aggregated SIP registration/connectivity state;
- active call summaries;
- redacted operator/OCP state when enabled;
- window state;
- snapshot revision and server instance metadata.

Each field follows least privilege. Unauthorized sections are omitted, not filled with
placeholder sensitive values.

## Replies and Errors

Every command resolves to either:

- success with a typed result and resulting revision; or
- failure with a stable code, retryability, optional current revision, and safe details.

Initial error codes:

- `invalid_message`
- `invalid_payload`
- `unsupported_command`
- `incompatible_version`
- `unauthenticated`
- `forbidden`
- `revoked`
- `not_ready`
- `not_found`
- `not_owner`
- `conflict`
- `stale_state`
- `interaction_required`
- `timeout`
- `rate_limited`
- `operation_failed`

Raw exceptions and upstream SIP/OCP messages never cross the boundary.

## Versioning

- Adding an optional response field is compatible.
- Adding a new command or event is compatible when old clients may ignore it.
- Removing, renaming, changing type, or changing semantics is breaking.
- Breaking changes require a new protocol major version and a compatibility window.
- Desktop supports the documented current and previous protocol versions during migration.
- Golden fixtures are tested in both the SDK and desktop projects.

## Open Decisions for SDK-01

Desktop DI-00 closed architecture policy in ADR-0009…0013. The rows below remain **open**
and are owned by **SDK-01** (shared freeze with the listed DI units). IDs match the P12
handoff.

| ID | Decision | Owner | Blocks |
| --- | --- | --- | --- |
| O-SCHEMA-1 | Runtime schema library and canonical generation direction | SDK-01 | SDK-02, DI-01 |
| O-DISC-1 | Exact discovery URL/path, response schema, and versioning | SDK-01 | SDK-03, DI-03 |
| O-DISC-2 | Discovery via tiny loopback HTTP helper vs WS-only bootstrap | SDK-01 | DI-03 |
| O-BRW-1 | Confirmed Chrome/Edge/Firefox policy matrix for HTTPS→loopback WS | SDK-01 | SDK-05 E2E |
| O-BRW-2 | Private Network Access / permission-prompt UX keys | SDK-01 → DI-09 | DI-09 |
| O-POP-1 | Proof-of-possession mechanism for paired clients | SDK-01 | SDK-04, DI-04 |
| O-POP-2 | Pairing ceremony / approve payload shape with desktop | SDK-01 + DI-04 | DI-04, DI-09 |
| O-CAP-1 | Default capability sets per pairing profile | SDK-01 + DI-04 | DI-04 |
| O-PII-1 | Exact PII redaction levels / mask formats | SDK-01 | SDK-05, DI-05 |
| O-OWN-1 | Exact call ownership and lease semantics | SDK-01 | SDK-06, DI-06 |
| O-CAMP-1 | Whether campaign events enter v1 or a later capability | SDK-01 | SDK-05, DI-05 |
| O-OCP-1 | Public operator field names vs F-028 E-12 map | SDK-01 + DI-07 | DI-07 |

Policy baselines (not open): loopback-only bind, exact Origin, no raw credentials in v1,
per-client events, `window:hide` gated, Account sole human sign-in (ADR-AF-003) with opaque
saved-profile activation only.

No implementation agent may decide open rows implicitly in production code.
