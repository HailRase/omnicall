# Axatalk SDK Implementation Plan

## Objective

Deliver a framework-independent, strictly typed, secure browser SDK and protocol package
without introducing desktop regressions or creating a second source of business truth.

## Execution Policy

- Execute one work unit per agent session.
- Use [`WORK-UNITS.md`](WORK-UNITS.md) as the queue.
- Do not skip dependency gates.
- Keep the SDK read-only until secure desktop transport is proven.
- Public API additions require protocol fixtures and API-report approval.
- Run an independent review after every work unit.

## Phase SDK-00 — Project Initialization

Purpose: create a reproducible standalone package workspace without publishing anything.

Tasks:

1. Confirm Node LTS compatibility with Axatalk Desktop (`>=20.19.0` baseline).
2. Initialize an npm workspace with `packages/protocol` and `packages/sdk`.
3. Add `packages/sdk-testing` only when its first test consumer exists.
4. Configure strict TypeScript, ESM, package exports, source maps, and declaration output.
5. Install and lock current non-deprecated tooling for:
   - TypeScript compilation and package build;
   - Vitest unit/contract tests;
   - ESLint with type-aware TypeScript rules;
   - package validation (`publint` and `@arethetypeswrong/cli` or maintained equivalents);
   - browser tests;
   - API report generation;
   - changesets and npm provenance-ready publication.
6. Add scripts: `build`, `test`, `test:types`, `test:browser`, `lint`, `typecheck`,
   `api:check`, `package:check`, and `preflight`.
7. Add CI for clean install, preflight, package tarball inspection, and artifact upload.

Rules:

- Check official documentation and deprecation status before installing every dependency.
- Use exact lockfile resolution; do not copy dependency versions from this plan.
- Runtime dependencies require an ADR note and bundle-size evidence.
- Do not create a nested Git repository while this directory is inside the desktop repository.
- Do not publish packages in SDK-00.

Gate:

- clean clone + clean install + preflight passes;
- package tarballs contain only intended files;
- no production API exists yet.

## Phase SDK-01 — Protocol Decisions

Purpose: close all decisions that production code must not invent.

Tasks:

1. Write ADRs for schema source of truth, endpoint discovery, pairing proof, PII redaction,
   call ownership, and version support.
2. Resolve existing OCP naming differences between F-028 E-12 and the new public protocol.
3. Define capabilities and error taxonomy.
4. Define compatibility fixture format shared with desktop.
5. Confirm browser support for HTTPS page to local WebSocket on target Chrome/Edge policies.

Gate:

- no open protocol decision blocks implementation;
- desktop integration reviewer approves the same protocol baseline.

## Phase SDK-02 — Protocol Package

Purpose: implement `@axatalk/protocol` first.

Tasks:

- runtime schemas for handshake, auth, commands, replies, events, and snapshot;
- inferred or parity-tested readonly TypeScript types;
- size/depth limits and safe validation failures;
- golden valid/invalid fixtures;
- protocol compatibility helpers;
- public API report and documentation.

Gate:

- exhaustive schema tests pass;
- invalid and unknown input is rejected;
- fixtures pass in desktop DI-02;
- protocol package has zero desktop/framework dependencies.

## Phase SDK-03 — Transport Core

Purpose: implement deterministic SDK mechanics without a real desktop.

Tasks:

- injectable WebSocket transport port;
- request correlation and timeout cleanup;
- heartbeat and bounded reconnect with jitter;
- explicit connection state machine;
- cancellation and disconnect cleanup;
- no automatic replay of mutations;
- diagnostics sink with allowlisted fields.

Gate:

- fake transport tests cover every state and terminal path;
- fake timers show no leaked timers/listeners/promises;
- diagnostics contain no payloads.

## Phase SDK-04 — Authentication and Capabilities

Purpose: connect securely to the desktop gateway.

Tasks:

- handshake negotiation;
- pairing-required state;
- challenge response and session authentication;
- capability projection and changes;
- revoked/incompatible handling;
- fresh authentication and snapshot after reconnect.

Gate:

- unauthenticated clients cannot access state;
- replay and stale server-instance tests fail closed;
- desktop DI-04 interoperability passes.

## Phase SDK-05 — Read-Only Client Beta

Purpose: ship an internal integration candidate without control mutations.

Tasks:

- `AxatalkClient.connect`, `disconnect`, connection state, and `getSnapshot`;
- typed subscriptions for redacted call, registration, account, operator, and window events;
- sequence/revision reconciliation;
- `window.show` only after its desktop capability is available;
- integration guide and migration-free examples.

Gate:

- reconnect obtains a fresh snapshot;
- event gaps trigger resync;
- unsupported events are safely ignored;
- browser tests pass in supported targets.

## Phase SDK-06 — Call Control

Purpose: add commands only after read-only stability.

Order:

1. originate;
2. answer/reject;
3. hang up;
4. hold/resume;
5. mute/unmute;
6. DTMF.

Each command requires:

- capability check;
- typed inputs/result/error;
- idempotency and expected-revision behavior;
- multi-tab conflict test;
- desktop Use Case mapping evidence.

Gate:

- no command bypasses the desktop Call Engine;
- race and retry tests pass;
- active calls survive SDK disconnect.

## Phase SDK-07 — Operator and Logout Workflows

Purpose: expose OCP functionality without coupling the SDK to OCP wire protocol.

Tasks:

- operator snapshot and reasons;
- status change;
- prepare/confirm logout interaction;
- typed `interaction_required` flow;
- optional campaign events after privacy approval.

Gate:

- SIP-only mode works with OCP absent;
- logout reason and cancellation flows are deterministic;
- desktop ADR-AF-002/003/005 behavior remains intact.

## Phase SDK-08 — Privileged Account Activation

Purpose: activate desktop-owned saved profiles.

Tasks:

- list only approved profile references if product policy permits;
- activate a saved profile without exposing secrets;
- local confirmation and short-lived capability;
- active-session conflict and logout-first errors.

Raw credential import is out of scope unless a separate ADR explicitly approves it.

Gate:

- SDK never reads SIP password or OCP API key;
- security review reports no Blockers;
- profile identity and session-lock tests pass.

## Phase SDK-09 — Developer Experience

Purpose: make the SDK safe and understandable for external developers.

Deliverables:

- installation and browser support guide;
- quick start using pairing and read-only snapshot;
- API reference generated from the public surface;
- event and error catalog;
- capability matrix;
- reconnect, logout, and multi-tab recipes;
- security guide with forbidden credential patterns;
- upgrade and deprecation policy;
- test utilities and example application.

Gate:

- every public symbol is documented;
- examples compile and run against a fake peer;
- no example contains secrets or unsafe persistence.

## Phase SDK-10 — Release

Purpose: publish only after desktop compatibility and security gates.

Tasks:

1. Run clean-install preflight and browser matrix.
2. Run old/new SDK-desktop compatibility matrix.
3. Run packaged Electron end-to-end tests.
4. Complete independent architecture and security reviews.
5. Generate changeset, changelog, API report, SBOM, and provenance.
6. Publish release candidate under a non-default npm tag.
7. Promote to stable only after controlled production validation.

Gate:

- all criteria in [`DEFINITION-OF-DONE.md`](DEFINITION-OF-DONE.md) pass;
- desktop F-011 and P12 gates are closed;
- rollback and revocation procedures are documented.

## Regression Policy

At every phase:

- desktop SIP-only behavior must remain unchanged;
- OCP remains optional;
- SDK failure must not terminate calls or desktop sessions;
- SDK disconnect must not log out the account;
- old supported SDK clients must receive either compatible behavior or an explicit
  `incompatible_version` response;
- no public release is used to test unfinished desktop infrastructure.
