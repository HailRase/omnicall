# ADR-0004: SIP Session Health — Transport and Registration Orthogonality

## Type

DOCUMENT.

This document records one architecture decision.

## Status

Accepted (2026-07-02)

## Context

SIP connectivity has two independent axes: **transport** (WebSocket) and **registration** (SIP REGISTER). Legacy code mixed them in a single recovery projection and fullscreen overlay, causing false «registered» state and blocked call UI (LF-057).

- Registration shown as healthy when WebSocket is down (`isRegistered()` stale after disconnect).
- OCP recovery rows in SIP-only product path (ADR-0002 defers OCP).
- Fullscreen recovery overlay blocked call UI during registration retry (LF-057).
- Header `control-reregister-sip` and avatar recovery ring (LF-009) duplicate settings actions.
- User-selectable online/offline presence conflicts with auth/logout-only model.

**Affected features:** F-001, F-014, F-016 (partial F-017 diagnostics surface).  
**Legacy:** LF-008, LF-009 (cancelled), LF-010, LF-011; LF-057 (superseded).  
**Bounded context:** Telephony (primary), Settings (system-state panel).  
**Layers:** Domain (`SipSessionHealth`), Application (`SipRecoveryOrchestrationService`), Adapters (JsSIP transport events), UI (header + settings).

Product owner confirmed contract 2026-07-02 (`TRANSPORT-REGISTER-STATE-REFACTORING.md` §1).

## Decision

### 1. Domain model: `SipSessionHealth`

Two orthogonal FSMs plus lifecycle:

```typescript
type SipLifecyclePhase = "idle" | "active";
type SipTransportState = "idle" | "connecting" | "connected" | "reconnecting" | "disconnected";
type SipRegistrationState = "idle" | "registering" | "registered" | "failed";
```

**Invariants (unit-tested):**

- `transport !== "connected"` ⇒ effective registration = `idle` (never show `registered` in projections).
- `recovery.target === "registration"` ⇒ `transport === "connected"`.
- `recovery.target === "transport"` ⇒ no registration retry in flight.
- Logout ⇒ `lifecycle === "idle"`, all recovery timers cleared.

`effectiveRegistered = isConnected && ua.isRegistered()` — enforced in adapter and projections.

### 2. Recovery pipeline (strict order)

```txt
Transport disconnect → clear registration projection → transport reconnect (if auto)
  → on connected → registration retry (if auto)
```

Never schedule REGISTER retry while transport ≠ `connected`.  
Registration failures (including 401/403) follow the same auto-reregister policy as other failures when `sipAutoReregisterEnabled` is on.

During active call + socket drop: header shows fault immediately; recovery scheduling pauses until call ends.

### 3. Application orchestration

Replace SIP path in `ConnectionRecoveryOrchestrationService` with **`SipRecoveryOrchestrationService`** (SIP-only). OCP orchestration code remains dormant (ADR-0002).

New/changed Use Cases:

- `ManualSipTransportReconnectUseCase` (replaces `RetryConnectionUseCase` for SIP).
- `ReregisterSipUseCase` — guard: transport connected; calls `TelephonyGateway.reregister()` (`unregister({ all: true })` then `register()`).

New projections:

- `sipSessionHealthProjection` — unified read model.
- `deriveSipStatusShell` — header dot + label + timer suffix (§1.2 Russian copy).
- `deriveSipSystemStateShell` — settings panel VM.

`SipTransportReconnectSucceeded` must **not** publish `RegistrationSucceeded`.  
`SipRegistrationRetrySucceeded` **must** publish `RegistrationSucceeded` when account id known.

### 4. Adapter (JsSIP)

Listen `connecting`, `connected`, `disconnected`; emit typed transport domain events.  
On `disconnected`: emit `SipTransportDisconnected` + `SipRegistrationCleared`; do not trust stale `isRegistered()`.  
Add `effectiveIsRegistered()`; expose proactive refresh via `reregister(correlationId)` on `TelephonyGateway`.

Keep UA config: `register: false`, `connection_recovery_*` at 300s (app owns UI timers).

### 5. UI changes

**Header:** single dot + status line; priority idle → transport → registration → registered → DND.  
**Remove:** `ConnectionOverlay`, `RecoveryFeatureShell`, header `control-reregister-sip`, user online/offline toggles.  
**Add:** Settings section **«Состояние системы»** (`system-state`) with policies, manual actions, in-memory journal.

Manual actions (settings only): **Переподключить сервер** (`ManualSipTransportReconnectUseCase`), **Перерегистрировать** (`ReregisterSipUseCase` → `gateway.reregister()`). A separate «Обновить регистрацию» control was dropped — same gateway path as manual reregister.

### 6. Auth model

No user-selectable online/offline presence. Flow: authorize → work → logout (full teardown). DND remains optional flag when registered.

Logout teardown: `hangupAll → unregister({ all: true }) → ua.stop() → SipSessionReset → idle`.

### 7. UserSettings v2

Add SIP recovery fields: `sipAutoReconnectEnabled`, `sipReconnectIntervalSec`, `sipReconnectMaxAttempts`, `sipAutoRegisterOnStartup`. Migrate v1 → v2. Move recovery toggles from General to System State panel.

### 8. Explicitly out of scope

- OCP recovery UI and orchestration wiring (ADR-0002).
- Avatar recovery ring (LF-009 cancelled).
- `navigator.onLine`, tray disconnect notifications, `registrationExpiring` UI.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Keep `ConnectionOverlay`, add transport rows | Blocks call UI; superseded by header + settings (LF-057) |
| Single combined reconnect for transport + REGISTER | Violates strict pipeline; races JsSIP internal reconnect |
| Header manual retry buttons | Clutters chrome; settings panel is canonical (§1.6) |
| User online/offline presence toggle | Product: auth/logout only; DND separate |
| Delete OCP recovery code | ADR-0002: preserve plugin architecture |

## Consequences

**Positive:**

- Clear transport vs registration semantics; no false «registered» on disconnect.
- SIP-only path free of OCP overlay rows.
- Recovery observable in settings journal with correlation IDs.
- Header always shows connection truth during active calls.

**Negative:**

- Large refactor across domain, application, adapter, UI (phased in T-008).
- `ConnectionOverlay`, legacy recovery shell, and `connectionRecoveryProjection` removed — SIP read model is `sipSessionHealthProjection`; OCP-only deferred path uses `ocpConnectionRecoveryProjection`.
- Settings schema v2 migration required.

**Testing:** domain FSM unit tests; adapter disconnect→cleared registration; `SipRecoveryOrchestration.integration.test.ts`; projection tests for all §4 header rows; component tests for Russian copy.

**Migration:** phased implementation (`TRANSPORT-REGISTER-STATE-REFACTORING.md` Phases 0–7). OCP mock tests unchanged until backlog resumes.

**Rollback:** revert branch; ADR remains for future reference.

## Architecture Checks

- [x] Domain remains framework-independent (`SipSessionHealth`, transport events).
- [x] UI does not access adapters (projections + Use Cases only).
- [x] OCP remains optional; SIP-only path has no OCP recovery UI.
- [x] JsSIP replaceable behind `TelephonyGateway`.
- [x] State transitions explicit via Domain Events.
- [x] Critical flows observable (journal, correlation IDs, logs).

## Related Links

- Feature Registry: F-001, F-014, F-016
- Plan: `docs/softphone/TRANSPORT-REGISTER-STATE-REFACTORING.md`
- Supersedes: LF-057 overlay UX, LF-009 avatar ring
- Superseded By: —
- ADR-0002 (OCP deferred)
