# OmniCall Desktop SDK Integration

This directory is the execution plan for implementing the desktop side of the OmniCall
browser SDK integration in the existing Electron softphone.

## Scope

Feature: **F-011 — Host Integration Contract**  
Roadmap: **P12 — External Host API Compatibility**  
Legacy coverage: **LF-051, LF-065, LF-080, LF-081**  
Primary bounded context: **Integration**

## Start Here

Every desktop integration agent must read:

1. [`AGENTS.md`](AGENTS.md)
2. [`00-SNAPSHOT.md`](00-SNAPSHOT.md)
3. [`IMPLEMENTATION-PLAN.md`](IMPLEMENTATION-PLAN.md)
4. [`WORK-UNITS.md`](WORK-UNITS.md)
5. [`TEST-MATRIX.md`](TEST-MATRIX.md)
6. [`SMOKE-CHECKLIST.md`](SMOKE-CHECKLIST.md)
7. [`../omnicall-kit/docs/PROTOCOL.md`](../omnicall-kit/docs/PROTOCOL.md)
8. [`../omnicall-kit/docs/SECURITY.md`](../omnicall-kit/docs/SECURITY.md)
9. Corrective track (post P12): [`sdk-production-readiness/`](sdk-production-readiness/) — ADR-0027; WU-00 done; next WU-01

Then read the repository onboarding and current status:

- `../AGENTS.md`
- `../docs/softphone/STATUS.md`
- `../docs/softphone/Architecture-Constitution.md`
- `../docs/softphone/Feature-Registry.md`
- `../docs/softphone/Implementation-Roadmap.md`
- `../ocp-integration/OCP-IMPLEMENTATION-PLAN.md` — EXT and E-12

## Core Decision

The local WebSocket server belongs in Electron main, while the existing
`AccountBootstrapFacade`, Call Engine, SIP/OCP adapters, and projections currently belong
to the renderer composition.

The integration therefore requires one typed main-to-renderer broker. It must not create
a second Facade or telephony composition in main.

```text
Browser SDK
  -> LocalWsServerAdapter in main
  -> capability and command gateway
  -> typed main-to-renderer broker
  -> ExternalCommandRouter in the existing renderer composition
  -> existing Facades / Use Cases / Call Engine
```

Native window commands remain in main.

## Current Status

- F-011: **`in-progress / gate fail`** — corrective WU-07 is open; 2026-08-03 DI-10 exposed hostile-Origin upgrade acceptance.
- ADRs: ADR-0009…0013 Accepted; precision rows closed by SDK-01 ADR-0014…0017 (`done`)
- SDK-02: `@softomnitel/omnicall-protocol` `done`; desktop consumes same fixtures (DI-01)
- P12 handoff: `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md` (**P12 closed** 2026-07-27)
- Baseline: `evidence/DI-00-baseline.md`
- DI-01 evidence: `evidence/DI-01-protocol-ports-mocks.md`
- DI-02 evidence: `evidence/DI-02-typed-main-renderer-broker.md` (`/sdk-review` PASS)
- DI-03 evidence: `evidence/DI-03-loopback-websocket-transport.md` (`/sdk-review` PASS)
- DI-04 evidence: `evidence/DI-04-pairing-origin-capabilities.md` (`/sdk-review` PASS)
- DI-05 evidence: `evidence/DI-05-read-only-snapshot-events-window-show.md` (`done` — `/sdk-review` PASS)
- DI-06 evidence: `evidence/DI-06-call-command-router.md` (`done` — `/sdk-review` PASS)
- DI-07 evidence: `evidence/DI-07-operator-logout-workflow.md` (`done` — `/sdk-review` PASS)
- DI-08 evidence: `evidence/DI-08-saved-profile-activation.md` (`done` — `/sdk-review` PASS)
- DI-09 evidence: `evidence/DI-09-settings-operational-ux.md` (`done` — `/sdk-review` PASS)
- OCP E-12 command subset: implemented
- External gateway: loopback WS + pairing/PoP/capabilities + read-only + call + operator/logout + activate-profile (DI-08 `done`); mock retained; **ADR-0021** shared-desk call control + granular call matrix (2026-07-27)
- External handlers: `ExternalSdkProductHandler` (read + call + operator + account activate)
- Main-to-renderer command broker: real IPC adapter `done` (DI-02); mock retained for unit tests
- SDK Settings UX: **`done`** (DI-09) — origins/paired/revoke/grant/diagnostics; hide disabled;
  **listener enable toggle superseded by DI-11** (always-on gateway per ADR-0018 — `done`)
- Read-only event/snapshot transport: implemented (DI-05 `done`)
- DI-10 evidence: historical archive only — agents must not re-run packaged/browser smoke for gates.
- DI-11 evidence: `evidence/DI-11-origin-tofu-blacklist-activate.md` (`done` — `/sdk-review` PASS 2026-07-21)
- Corrective track: `sdk-production-readiness/CLOSEOUT.md` — WU-07 **PASS** (2026-08-03); unit + integration + preflight only.
- Next (human): SemVer cut, license review, npm publish authorization.
- DI-11 planning (decisions frozen): `evidence/DI-11-origin-tofu-blacklist-activate-planning.md`

P12 / F-011 corrective track is **closed** (`implemented`). Agents must not run packaged Electron / Chromium / Edge smoke for F-011 gates.