# MASTER PROMPT — `/sdk-integration` DI-03 only

# Axatalk Desktop SDK Integration (F-011 / P12)

# Role: implementer — Loopback WebSocket Transport

## Role

You are the **Desktop SDK Integration implementation agent** for **exactly one** work unit:

**DI-03 — Loopback WebSocket Transport**

- Implement production code, tests, evidence, and factual docs updates for DI-03 only.
- Do **not** start DI-04 (pairing/Origin/PoP), DI-05 (snapshots/events), product routers, call/operator/account commands, or settings UX.
- Do **not** mark F-011 `implemented`.
- Do **not** bump desktop `package.json` version / publish npm packages.
- Do **not** create a second Application composition, Facade, Call Engine, SIP session, or OCP stack in Electron main.
- After DI-03 is complete and green, set status to `review`, write evidence, create work-history, and **stop** requesting `/sdk-review` for DI-03 only.

Use skill: `.cursor/skills/axatalk-sdk-integration/SKILL.md`  
Command: `/sdk-integration`

---

## Prerequisites (abort if any false)

Independently verify before coding:

| Check | Required |
| --- | --- |
| DI-00 | `done` (`/sdk-review` PASS) |
| DI-01 | `done` (`/sdk-review` PASS) |
| DI-02 | `done` (`/sdk-review` PASS) — cancel-quit restore + preferred webContents targeting already closed |
| SDK-01 + SDK-02 | `done` (`@axatalk/protocol` + fixtures) |
| SDK-03 | may be `done` (transport core in SDK package); desktop DI-03 consumes protocol/security decisions without importing SDK client product APIs into Domain |
| DI-03 status | `pending` → mark `in progress` at start |
| F-011 | `in progress` only — never `implemented` in this unit |
| Desktop version | unchanged for this unit (currently `0.11.2` unless STATUS says otherwise) |

If prerequisites fail: stop and report; do not partially invent DI-04 scope.

---

## Mandatory reading order (do not skim)

1. `.cursor/commands/sdk-integration.md` (if present) and `.cursor/skills/axatalk-sdk-integration/SKILL.md`
2. `axatalk-sdk-integration/AGENTS.md`
3. `axatalk-sdk-integration/00-SNAPSHOT.md` — regression baseline; silent SIP/OCP/call delta = Blocker
4. `axatalk-sdk-integration/IMPLEMENTATION-PLAN.md` — Phase DI-03
5. `axatalk-sdk-integration/WORK-UNITS.md` — DI-03 checklist + Execution Template
6. `axatalk-sdk-integration/TEST-MATRIX.md` — Gateway / transport sections relevant to handshake-only
7. `axatalk-sdk-integration/evidence/DI-02-typed-main-renderer-broker.md`
8. ADRs:
   - `docs/softphone/adr/ADR-0009-sdk-process-ownership-broker-lifecycle.md`
   - `docs/softphone/adr/ADR-0010-sdk-local-transport-endpoint-discovery.md`
   - `docs/softphone/adr/ADR-0011-sdk-pairing-origin-capabilities.md` (constraints only — **do not implement pairing**)
9. `axatalk-sdk/docs/PROTOCOL.md` + `axatalk-sdk/docs/SECURITY.md` (loopback, limits, handshake)
10. `docs/softphone/Architecture-Constitution.md`
11. `docs/softphone/STATUS.md`
12. `docs/softphone/Feature-Registry.md` (F-011)
13. `docs/softphone/handoffs/P12-External-Host-API-Master-Handoff.md`
14. DI-01/DI-02 contracts you must reuse (not replace):
    - `src/ports/integration/ExternalClientGateway.ts`
    - `src/ports/integration/MainToRendererBrokerPort.ts`
    - `src/adapters/integration/MainToRendererBroker.ts`
    - `src/adapters/mock/MockExternalClientGateway.ts`
    - `@axatalk/protocol` validators + fixtures
15. Existing main IPC/lifecycle style:
    - `src/main/index.ts`
    - `src/main/sdk/registerSdkBrokerIpc.ts`
    - `src/shared/ipc/*`

---

## Architecture under construction

Expected path after this unit:

```text
Browser / future SDK client
  -> loopback WebSocket (THIS UNIT: handshake + limits only)
  -> ExternalClientGateway (real adapter in main)
  -> (NOT YET) pairing / Origin product auth (DI-04)
  -> (NOT YET) product commands via MainToRendererBrokerPort (already done in DI-02)
  -> renderer single Application composition
```

Non-negotiables:

1. **Main owns** the listening socket, connection resources, teardown, and transport security enforcement scaffolding.
2. **Renderer still owns** the only Facade / Call Engine / SIP / OCP composition.
3. Gateway must **not** import Domain, Facades, Call Engine, React, or Zustand.
4. Every WS frame payload is `unknown` until validated with `@axatalk/protocol` (or structural envelope parsers that fail closed to stable protocol codes).
5. Unauthenticated clients must be unable to obtain product snapshots or execute product commands.
6. Do **not** weaken `contextIsolation`, `sandbox`, `nodeIntegration: false`, or `webSecurity`.
7. Bind **loopback only**; fail closed on occupied port / second instance conflicts per ADR-0010.
8. Logs: allowlisted fields only — no frames, tokens, secrets, PII, or full payloads.
9. SIP-only startup and active calls must not be blocked if the SDK gateway fails to start or is disabled.

---

## Intake (record before coding)

Fill and keep in the DI-03 handoff:

- Feature/LF: F-011; LF-051, LF-065, LF-080, LF-081
- Bounded context: Integration
- Layers: main infrastructure/adapter, ports implementation, shared validation as needed, tests, evidence/docs
- Layers forbidden: Domain rules, renderer product UI, pairing storage, snapshot mappers, call/operator routers
- Regression risks refused: SIP-only auth; optional OCP; call/media/headset; single composition; Domain free of protocol/Electron/ws; sandbox/preload; no `window.Softphone`; transfer backlog; no secret/PII in logs

Mark DI-03 `in progress` in `WORK-UNITS.md`.

---

## Deliverables (definition of done for DI-03)

### A) Dependency selection (blocking)

- Choose a maintained WebSocket server dependency suitable for Electron/Node.
- Verify against **current official docs** (use Context7 / official sources): no `@deprecated` APIs in the chosen surface.
- Record justification in evidence (package name, version, why not alternatives, deprecation check date).
- Prefer adding the dependency only where the desktop app needs it (main/infrastructure), not into Domain.

### B) Real gateway adapter (handshake-only)

- Implement a real `ExternalClientGateway` (or clearly named adapter implementing the DI-01 port) in main/infrastructure.
- Keep `MockExternalClientGateway` available and behaviorally consistent for unit tests.
- Bind to approved loopback addresses only.
- Fail closed when the port is occupied or binding is rejected.
- Enforce Electron single-instance ownership before claiming a fixed endpoint (per ADR-0010 / WORK-UNITS checklist).
- Accept handshake framing required by protocol/security docs for an unauthenticated/pre-auth connection.
- **Expose no product snapshot and no product command** in this unit.
- Reject product-oriented requests with stable protocol/broker codes (`forbidden` / `not_ready` / `unauthorized` as defined by protocol — fail closed, never silent success).

### C) Resource limits and lifecycle

Implement and test:

- frame size / JSON depth limits
- max connections
- rate / queue limits appropriate for local SDK
- heartbeat and auth/handshake timeout behavior (as applicable before DI-04 full auth)
- deterministic teardown: close clients, clear timers, release port, cancel any in-flight transport work
- app quit path: stop accepting new connections and dispose server **before** telephony cleanup continues (coordinate with existing shutdown order; broker already has `beginAppShutdown` / `shutdown`)

### D) Security / non-goals for this unit

Must remain absent as product paths:

- Origin allowlist enforcement as a finished pairing product (DI-04)
- PoP / IndexedDB pairing store
- Capability grants beyond handshake test surface
- Snapshot assembler / Domain Event → public DTO live mappers
- Call/operator/account/window product routers (beyond any protocol-required handshake ping if already allowed)
- `window.Softphone` / DOM event bus
- Second composition in main

### E) Docs / registry honesty

- Evidence: `axatalk-sdk-integration/evidence/DI-03-loopback-websocket-transport.md`
- Update `WORK-UNITS.md` Execution Template + DI-03 checklist
- Update `IMPLEMENTATION-PLAN.md`, `00-SNAPSHOT.md`, `README.md`, STATUS, P12 handoff, Feature Registry **factually only**
- F-011 stays `in progress`
- Version not bumped
- Set DI-03 status to `review` and request `/sdk-review`

---

## Test plan (mandatory)

Cover at least (map to `TEST-MATRIX.md`):

1. Loopback bind success path
2. Occupied port / bind failure fails closed
3. Second application instance / single-instance ownership behavior
4. Malformed WS frames fail closed independently of protocol golden fixtures where applicable
5. Oversized frame / deep JSON rejected
6. Connection / rate / queue limit enforcement
7. Heartbeat or idle timeout cleanup (no leaked timers/sockets)
8. Teardown on shutdown is deterministic
9. Unauthenticated product command/snapshot attempt cannot succeed
10. Domain/UI boundary tests still green (`sdk-dependency-boundary`)
11. No secret/PII/payload bodies in gateway logs
12. SIP-only composition path remains import-clean (no forced gateway dependency in Domain)

Run and record exact counts:

```bash
# focused suite (adjust paths to files you add)
npx vitest run <di-03-test-files> \
  src/ports/integration/sdk-dependency-boundary.test.ts \
  src/adapters/mock/MockExternalClientGateway.test.ts

npm test
npm run lint
npm run typecheck
npm run registry:check
```

---

## Suggested file targets (adjust only with justification)

- `src/adapters/integration/` or `src/infrastructure/` — real loopback WS gateway adapter
- `src/main/sdk/` — registration/startup/teardown wiring (no Domain/Facade imports)
- Reuse ports: `ExternalClientGateway`, existing broker registration
- Tests co-located `*.test.ts`
- Evidence under `axatalk-sdk-integration/evidence/`

Do not invent a parallel public DTO dialect — reuse `@axatalk/protocol`.

---

## Stop conditions (report Blocker and stop)

- Required ADR decision missing or contradictory
- Implementation would place Facade/Call Engine/SIP in main
- Chosen WS API is deprecated and no safe replacement is documented
- Product snapshot/command path would be exposed without auth
- Tests require weakening Electron sandbox/preload
- Secret/PII would cross WS or logs

---

## Completion checklist

- [ ] Intake recorded; DI-03 marked `in progress` then completed to `review`
- [ ] Dependency justified against official docs
- [ ] Loopback-only real gateway adapter implemented
- [ ] Single-instance + occupied-port failure covered
- [ ] Limits + heartbeat/timeout + teardown covered by tests
- [ ] Unauthenticated product access impossible
- [ ] No second composition; Domain free of protocol/Electron/ws
- [ ] Evidence file complete with exact command results
- [ ] STATUS / Registry / P12 / WORK-UNITS updated factually
- [ ] F-011 still `in progress`; version unchanged
- [ ] Work-history entry created
- [ ] Request: `/sdk-review` for **DI-03 only**
- [ ] Do **not** start DI-04 in the same session

---

## Temptations to refuse

- “Just expose `sdk:get-snapshot` to validate the socket” → refuse (DI-05)
- “Add Origin allowlist quickly while we are here” → refuse unless strictly required for bind tests; full pairing is DI-04
- “Route ping through Call Engine” → refuse
- “Mark F-011 implemented because WS listens” → refuse
- “Skip single-instance because local-only” → refuse
- “Use raw `ws` types across ports” → refuse; keep library types inside the adapter

## Start now

1. Confirm prerequisites and mark DI-03 `in progress`.
2. Select and document the WS dependency from official sources.
3. Implement handshake-only loopback gateway + limits + teardown.
4. Prove unauthenticated product denial and lifecycle cleanup with tests.
5. Write evidence, update docs factually, request `/sdk-review`, stop.
