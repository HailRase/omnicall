# OmniCall Kit Project

This directory is the incubating npm workspace for `@softomnitel/omnicall-protocol` and `@softomnitel/omnicall-kit`.
It remains inside the desktop repository until protocol v1 and compatibility fixtures are
stable enough to extract. Never create a nested Git repository here.

## Goal

Publish a strictly typed browser SDK that connects to OmniCall Desktop through a secure
local protocol without exposing Electron, SIP, JsSIP, OCP wire objects, or internal
Domain Events.

## Start Here

### Integrators (developer docs)

1. [`docs/guide/README.md`](docs/guide/README.md) — canonical developer guide
2. [`examples/crm-pairing-lite/`](examples/crm-pairing-lite/) — fake-peer CRM example
3. Public API report: [`etc/api/sdk.api.md`](etc/api/sdk.api.md)

### Agents (implementation)

Every agent must read these files in order:

1. [`AGENTS.md`](AGENTS.md)
2. [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md)
3. [`docs/SECURITY.md`](docs/SECURITY.md)
4. [`docs/PROTOCOL.md`](docs/PROTOCOL.md)
5. [`docs/IMPLEMENTATION-PLAN.md`](docs/IMPLEMENTATION-PLAN.md)
6. [`docs/WORK-UNITS.md`](docs/WORK-UNITS.md)
7. [`docs/DEFINITION-OF-DONE.md`](docs/DEFINITION-OF-DONE.md)
8. [`docs/CONSUMER-SMOKE-CHECKLIST.md`](docs/CONSUMER-SMOKE-CHECKLIST.md)
9. [`docs/DEPENDENCIES.md`](docs/DEPENDENCIES.md)

The desktop counterpart is documented in
[`../omnicall-kit-integration/README.md`](../omnicall-kit-integration/README.md).

## Repository Strategy

The recommended end state is a separate publishable repository containing:

- `@softomnitel/omnicall-protocol` — runtime schemas and public TypeScript contracts;
- `@softomnitel/omnicall-kit` — browser client;
- optional `@softomnitel/omnicall-kit-testing` — deterministic test server and fixtures.

During protocol incubation, this directory remains inside the desktop repository so both
tracks can evolve atomically. Extract it only after protocol v1 and compatibility fixtures
are stable.

## Current Status

- Planning: complete
- Workspace / tooling / CI: **SDK-00 done**
- Protocol decisions: **SDK-01 done**
- Protocol package: **SDK-02 done**
- Transport / auth / client APIs: **SDK-03…SDK-08 done**
- Official browser WebSocket adapter + optional transport/scheduler/jitter defaults: **done**
  (`createBrowserWebSocketTransport`, guide `docs/guide/transport.md`)
- Developer docs & examples: **SDK-09 done** (`evidence/SDK-09-developer-docs-examples.md`)
- Public API: `OmniCallClient` namespaces (lifecycle, `calls`, `account`, `operator`, `window.show` / `window.hide` / `window.getState`)
  — see `etc/api/sdk.api.md` for the current allowlisted symbol count
- Release candidate staging: **SDK-10 Mode A done** — RC-ready / stable-blocked; **no** npm `latest`; prerelease mode `rc` entered (`0.1.0-rc.0` on `changeset version`)
- F-011 / P12: **not closed** — desktop DI-10 remains **blocked** until explicit `/sdk-integration` DI-10 intake
- Production readiness: not claimed

### Local commands

```bash
cd omnicall-kit
npm ci
npm run preflight
npm run release:check
```

Node engines: `>=20.19.0`.

## Non-Negotiable Release Rule

No public npm release is allowed until:

- desktop secure transport and pairing gates pass;
- protocol compatibility tests pass in both directions;
- a packaged Electron end-to-end test passes;
- the security review has no Blockers;
- raw SIP and OCP credentials are absent from the normal browser SDK flow.
