# Axatalk SDK Agent Contract

This file is the mandatory entry point for every agent working in `axatalk-sdk/`.

## Mission

Build a small, stable, secure, and strictly typed browser client for Axatalk Desktop.
The SDK is a protocol client, not a second softphone and not a mirror of desktop internals.

## Required Reading

Read all documents listed in [`README.md`](README.md) before changing production files.
For cross-repository work also read:

- `../AGENTS.md`
- `../docs/softphone/Architecture-Constitution.md`
- `../docs/softphone/Feature-Registry.md` — F-011
- `../docs/softphone/Implementation-Roadmap.md` — Phase 12
- `../axatalk-sdk-integration/AGENTS.md`

## Work Unit Rule

An agent may execute exactly one open work unit from
[`docs/WORK-UNITS.md`](docs/WORK-UNITS.md) per session.

Before implementation:

1. Confirm all prerequisite work units are closed.
2. Mark the selected work unit `in progress` in its progress checklist.
3. Restate scope, expected files, tests, and explicit non-goals.
4. Stop and request a decision if the protocol or security documents conflict.

After implementation:

1. Run every work-unit verification command.
2. Update the checklist and evidence paths.
3. Update changelog or API documentation when the public contract changes.
4. Hand off to an independent reviewer.
5. Do not start the next work unit in the same session.

## Architecture Rules

- Dependency direction: `sdk -> protocol`; never `protocol -> sdk`.
- Neither package may import desktop Domain, Application, Electron, JsSIP, React, or Zustand.
- Public payloads are JSON-safe readonly objects and arrays.
- Runtime schemas are the source of truth; TypeScript types are derived or parity-tested.
- Every inbound message is `unknown` until runtime validation succeeds.
- Constructors have no network or authentication side effects.
- Transport connection, SDK authentication, account sign-in, and account logout are distinct.
- Events use a public anti-corruption mapper; internal Domain Event names are not exported.
- All public identifiers are opaque strings.
- Stable machine-readable error codes are required; user-facing text is not part of protocol.
- No `any`, `@ts-ignore`, `as unknown as`, deprecated APIs, default exports, or mutable public data.
- No browser globals, DOM event bus, `window.Softphone`, or direct localhost `fetch` fallback.

## Security Rules

- Never place pairing credentials, SIP passwords, OCP API keys, tokens, phone numbers, or
  message payloads in logs.
- Never persist authorization material in `localStorage` or `sessionStorage`.
- Never embed a shared secret in the npm bundle.
- Capabilities are server-issued and fail closed.
- The SDK must expose disconnect/revoke/incompatible states explicitly.
- Reconnect must be bounded, cancellable, jittered, and must obtain a fresh snapshot.

## API Quality Rules

- Prefer `AxatalkClient`; reserve “agent” for an autonomous product concept.
- Namespace methods by responsibility: `calls`, `account`, `operator`, `window`.
- Promise-returning commands require timeout, cancellation where practical, and typed failure.
- Event subscription returns an unsubscribe function.
- Reconnection never silently repeats a non-idempotent mutation.
- Additive optional fields are compatible; removals, renames, and semantic changes are breaking.

## Testing Rules

Each public behavior requires:

- schema validation tests;
- type-level API tests;
- deterministic unit tests with fake time and fake transport;
- protocol fixture tests;
- reconnect and cancellation tests where applicable;
- negative tests for malformed and unauthorized messages;
- browser tests for supported targets before release.

No test may require a real SIP, OCP, or Electron instance except the explicit end-to-end gate.

## Scope Protection

Do not implement:

- telephony or OCP business rules;
- desktop window policy;
- credential storage;
- server-side authorization decisions;
- contact or history APIs not approved by a new protocol decision;
- compatibility shims for legacy `window.Softphone`.

## Stop Conditions

Stop the work unit and report a blocker when:

- a prerequisite is not closed;
- the desktop protocol fixture disagrees with the SDK fixture;
- a requested method requires a capability that is not defined;
- a secret would enter normal browser configuration;
- backward compatibility cannot be preserved;
- security behavior is left to documentation instead of enforcement.
