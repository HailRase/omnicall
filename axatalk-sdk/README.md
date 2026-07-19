# Axatalk SDK Project

This directory is the execution package for building the browser-facing Axatalk SDK.
It is intentionally documentation-only until work unit SDK-00 initializes the standalone
package. Do not add production source files before SDK-00 is approved.

## Goal

Publish a strictly typed browser SDK that connects to Axatalk Desktop through a secure
local protocol without exposing Electron, SIP, JsSIP, OCP wire objects, or internal
Domain Events.

## Start Here

Every agent must read these files in order:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/SECURITY.md`](docs/SECURITY.md)
4. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
5. [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md)
6. [`docs/WORK-UNITS.md`](docs/WORK-UNITS.md)
7. [`docs/DEFINITION-OF-DONE.md`](docs/DEFINITION-OF-DONE.md)
8. [`docs/CONSUMER-SMOKE-CHECKLIST.md`](docs/CONSUMER-SMOKE-CHECKLIST.md)

The desktop counterpart is documented in
[`../axatalk-sdk-integration/README.md`](../axatalk-sdk-integration/README.md).

## Repository Strategy

The recommended end state is a separate publishable repository containing:

- `@axatalk/protocol` — runtime schemas and public TypeScript contracts;
- `@axatalk/sdk` — browser client;
- optional `@axatalk/sdk-testing` — deterministic test server and fixtures.

During protocol incubation, this directory remains inside the desktop repository so both
tracks can evolve atomically. Extract it only after protocol v1 and compatibility fixtures
are stable. Never create a nested Git repository inside this directory.

## Current Status

- Planning: complete
- Protocol implementation: not started
- SDK implementation: not started
- npm publication: not started
- Production readiness: not claimed

## Non-Negotiable Release Rule

No public npm release is allowed until:

- desktop secure transport and pairing gates pass;
- protocol compatibility tests pass in both directions;
- a packaged Electron end-to-end test passes;
- the security review has no Blockers;
- raw SIP and OCP credentials are absent from the normal browser SDK flow.
