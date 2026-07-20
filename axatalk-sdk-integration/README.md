# Axatalk Desktop SDK Integration

This directory is the execution plan for implementing the desktop side of the Axatalk
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
7. [`../axatalk-sdk/docs/PROTOCOL.md`](../axatalk-sdk/docs/PROTOCOL.md)
8. [`../axatalk-sdk/docs/SECURITY.md`](../axatalk-sdk/docs/SECURITY.md)

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

- F-011: **in progress** (DI-01…DI-03 `done`; DI-04 pairing/Origin/PoP `review`)
- ADRs: ADR-0009…0013 Accepted; precision rows closed by SDK-01 ADR-0014…0017 (`done`)
- SDK-02: `@axatalk/protocol` `done`; desktop consumes same fixtures (DI-01)
- P12 handoff: `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
- Baseline: `evidence/DI-00-baseline.md`
- DI-01 evidence: `evidence/DI-01-protocol-ports-mocks.md`
- DI-02 evidence: `evidence/DI-02-typed-main-renderer-broker.md` (`/sdk-review` PASS)
- DI-03 evidence: `evidence/DI-03-loopback-websocket-transport.md` (`/sdk-review` PASS)
- DI-04 evidence: `evidence/DI-04-pairing-origin-capabilities.md` (`review` — awaiting `/sdk-review`)
- OCP E-12 command subset: implemented
- External gateway: loopback WS + pairing/PoP/capabilities (DI-04 `review`); product snapshots deferred to DI-05; mock retained
- External command router: not implemented
- Main-to-renderer command broker: real IPC adapter `done` (DI-02); mock retained for unit tests
- SDK pairing/settings: not implemented
- Read-only event/snapshot transport: not implemented

Do not claim P12 complete until every desktop work unit is reviewed and the packaged
Electron end-to-end and security gates pass.
