# ADR-0009: SDK Process Ownership and Typed Broker Lifecycle

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — **amended 2026-07-21 by ADR-0018**: gateway rollback / disable is
an engineering env kill-switch (`OMNICALL_SDK_GATEWAY=0`), **not** a consumer Settings
listener toggle (DI-09 enable flag removed by DI-11). Process ownership unchanged.

## Context

- **Features:** F-011
- **Legacy:** LF-051, LF-065, LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration (primary); Telephony, Operator, Settings (consumers)
- **Layers:** Electron main, preload, Application (renderer), Ports, Adapters

F-011 requires a browser SDK over a local WebSocket. The softphone already owns Facades,
Call Engine, SIP/OCP sessions, and projections inside a **single renderer Application
composition**. Moving that composition into main for P12 would be a multi-phase rewrite and
violates the frozen non-goals in `omnicall-kit-integration/00-SNAPSHOT.md`.

Lifecycle hazards that must be decided before DI-02:

- renderer reload while SDK clients have in-flight commands;
- app quit / restart while the gateway is accepting connections;
- readiness of the renderer composition before product commands are accepted.

## Decision

1. **Electron main owns** the listening socket, connection resources, transport-level
   security enforcement, pairing storage orchestration, and **native window** operations
   (`show` / `get-state` / future `hide` under policy).

2. **Renderer owns** the single existing Application composition: Facades, Call Engine,
   SIP/OCP adapters, Domain Event bus, and product projections. No second Facade, Call
   Engine, SIP session, or OCP composition is created in main.

3. **One typed validated broker** is the only main→renderer path for product commands and
   product queries. Every WS and IPC payload is `unknown` until validated. Preload exposes
   only a narrow allowlisted API; raw `ipcRenderer` remains forbidden in renderer code.

4. **Product commands terminate** in focused Application handlers / Facades / Use Cases in
   the renderer. Call mutations always pass through Call Engine. Native window commands may
   terminate in main after capability and policy checks.

5. **Lifecycle rules:**
   - **Not ready:** until the renderer composition signals broker readiness, gateway accepts
     handshake/pairing only and returns `not_ready` for product commands/snapshots.
   - **Renderer reload:** main rejects all pending broker requests with a stable unavailable
     error; authenticated SDK sessions remain until re-auth policy decides otherwise, but
     clients must resync (fresh snapshot) after readiness returns; no automatic mutation
     replay.
   - **App quit / restart:** main stops accepting new WS connections and cancels pending
     broker work **before** telephony cleanup begins; clients receive `sdk:server-shutdown`
     when possible (`LocalWsServerAdapter.beginAppShutdown` → `reasonCode: "app_quit"`;
     `stop` → `"gateway_stop"`; idempotent announce before `terminateAll`); hard process
     kill may omit the event — clients fall back to disconnect/heartbeat. Server instance
     ID / session epoch change after restart.
   - **Gateway disable or startup failure:** observable in diagnostics; **must not** block
     SIP-only startup, active calls, logout, or optional OCP.

6. **SIP-only independence:** core softphone must function when the SDK gateway is stopped
   via engineering kill-switch or failed to bind. OCP remains optional. Consumer Settings
   no longer expose a normal “disable SDK server” toggle (ADR-0018).

## Alternatives Considered

| Alternative | Benefits | Risks | Why rejected |
| --- | --- | --- | --- |
| Move Facades/Call Engine into main | Fewer IPC hops | Massive rewrite; Domains/adapters leak into main; breaks current shell | Frozen non-goal for P12 |
| Dual compositions (main + renderer) | Faster prototype | Divergent state; SIP/OCP races; untestable ownership | Forbidden |
| Browser DOM CustomEvent / `window.Softphone` | Legacy familiarity | XSS surface; not Electron-native | Rejected (LF-080 not ported) |

## Consequences

- DI-02 implements the broker before any network product path (DI-03+).
- DI-03+ gateway code never imports Domain or Facades.
- Observability: broker timeouts, reload rejects, and shutdown cancels use allowlisted log
  fields only (no payloads/secrets).
- Rollback: set `OMNICALL_SDK_GATEWAY=0` (or omit gateway startup) without touching SIP
  bootstrap — **not** a Settings listener toggle (ADR-0018 supersedes the earlier
  “SDK settings flag” rollback wording from DI-09 era).

## Architecture Checks

- Domain remains free of Electron, WebSocket, IPC, and protocol packages.
- UI/store never receive gateway commands.
- External libraries stay behind adapters.
- State transitions remain explicit Domain Events internally; public DTOs are mapped.

## Related Links

- Feature Registry: F-011
- Roadmap: P12
- Plans: `omnicall-kit-integration/IMPLEMENTATION-PLAN.md`, `omnicall-kit/docs/PROTOCOL.md`
- Related: ADR-0010, ADR-0011, ADR-0012, ADR-0013, ADR-0018
- Handoff: `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
