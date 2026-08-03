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
9. Corrective track (post P12): [`sdk-production-readiness/`](sdk-production-readiness/) — ADR-0027; WU-00…WU-07 **PASS** (`CLOSEOUT.md`)

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

- F-011: **`implemented`** — P12 closed (2026-07-27); corrective WU-00…WU-07 **PASS**
  (2026-08-03). Desktop **`1.3.1`** + kit **`0.2.1`**. Gate = unit + integration +
  desktop/kit preflight only (no packaged/browser smoke for agents).
- Origin upgrade (ADR-0018 amended 2026-08-03): **fail-closed** — only exact
  **`allowed`** HTTP(S) Origins receive a WebSocket; Trusted sites / seed required
  before CRM `connect()`. Pairing Approve remains a separate step after allow.
- ADRs: ADR-0009…0018 (+0014…0017, 0021, 0027) Accepted; ADR-0018 Origin upgrade
  hardening amendment 2026-08-03
- SDK-02: `@softomnitel/omnicall-protocol` `0.1.0` `done`; desktop consumes same fixtures
- P12 handoff: `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md` (**closed**)
- DI-00…DI-11 evidence under `evidence/` — all **done** / `/sdk-review` PASS where noted;
  DI-10 packaged/browser smoke = **archival only**
- External gateway: loopback WS + pairing/PoP/capabilities + snapshot/events + call +
  operator/logout + activate-profile + window; **ADR-0021** shared-desk call control
- External handlers: `ExternalSdkProductHandler` + `routeSdkInbound` (fail-closed)
- Main-to-renderer broker: real IPC `done` (DI-02); mock retained for unit tests
- SDK Settings UX: Trusted / Blocked / matrix / revoke; always-on gateway (ADR-0018)
- Corrective track closeout: `sdk-production-readiness/CLOSEOUT.md`
- Next (human ops only): confirm private-registry access for integrators; no further
  remediation WU in this track

P12 / F-011 corrective track is **closed** (`implemented`). Agents must not run packaged
Electron / Chromium / Edge smoke for F-011 gates. Do **not** restore TOFU-on-upgrade
without a new ADR (security downgrade).