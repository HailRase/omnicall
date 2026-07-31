# ADR-AF-002: OCP Transport/Auth Dual FSM and Recovery Ownership

## Type

DOCUMENT.

## Status

Accepted (2026-07-16)

## Context

- **Features:** F-014, F-028
- **Legacy:** LF-008, LF-048, LF-049, LF-058, LF-079
- **Contexts:** Integration (primary), Telephony
- **Layers:** Domain types, Application, Ports, Adapters

Current OCP recovery mixes WebSocket lifecycle and authorization feedback into a single `connectionState` / generic Retry path. The adapter may reconnect using a retained ephemeral token, which risks:

- dual live sockets;
- auth retry that opens a second socket;
- `SESSION_EXIST` handled incorrectly by resending into a stale socket;
- stale events from superseded attempts.

Product success for OCP sign-in is **SIP ready**, not merely WebSocket open or OCP user received.

## Decision

1. **Two independent serializable projections:**

| Projection | States | Meaning |
|---|---|---|
| Server / transport | `disconnected`, `connecting`, `connected`, `reconnecting`, `failed` | WebSocket lifecycle only |
| Authorization | `idle`, `pending`, `authorized`, `timeout`, `rejected` | OCP auth response only; `rejected` carries semantic reason (`SESSION_EXIST`, `INVALID_TOKEN`, …) |

2. **Application owns reconnects that need a fresh HTTP token.** Before every new socket, Application calls `OcpProxyAuthenticatePort`, then supplies the fresh token to `ConnectOcpUseCase`. Ephemeral tokens live only in an in-memory, attempt-scoped Application object and are cleared on success, terminal failure, logout, or supersession.
   - **OCP proxy domain ≠ SIP domain:** HTTP authenticate always uses the OCP proxy hostname (`UserSettings.ocpIntegration.domain` / saved `profile.ocpDomain` / session domain set at authenticate). `entity:creds`.domain is the SIP PBX host and **must not** overwrite the OCP session domain or drive `/proxy/authenticate`.
   - **One fresh-token HTTP per intentional Reconnect:** `OcpTransportRecoveryService` must ignore transport drops while an intentional close/Reconnect is in flight (`cancelAll` → `ignoreTransportDrops` until next `connecting|connected`). Otherwise async WS close races hub progress notifies, schedules a second delayed `/proxy/authenticate`, and supersedes the user attempt.
   - **Attempt budget must survive in-flight recovery connect:** while `recoverWithFreshToken` runs, `cancelAll("fresh_token_connect"|"sign_in_supersede")` only disarms drop handling — it must **not** reset `reconnectAttempts`. Full cancel (logout / user supersede / dispose / terminal) still zeroes the counter. Cap remains **6** attempts × **5s** delay; exhaustion marks Server `failed` for the banner Retry path.
   - **UI surface split (amendment 2026-07-30):** unexpected-drop recovery uses `authorizationProgress.uiSurface = "silent"` and **must not** open `OcpSignInProgress`. User-visible surface: global `OcpConnectionBanner` in the shell overlay layer (`--z-shell-status-banner`, above Settings/routes, below Dialogs). Account Login, modal Reconnect, and SDK activate use `uiSurface = "modal"`. Each new attempt clears prior `completedExecutionStages` (`preparing` / fresh seed).
   - **Recovery presentation ownership (amendment 2026-07-30):** `transportRecoveryActive` / `transportRecoveryAttempt` on the session projection keep the banner across intentional disconnect and brief WS `connected` flaps until `clearTransportRecovery` (success) or `markTransportRecoveryExhausted`. Auto-recovery suppresses duplicate `authFeedback` toasts while the flag is set.

3. **`OcpWebSocketAdapter` remains transport-only:**
   - create/close one socket;
   - emit typed connection/message events;
   - send typed `auth` command;
   - **no** scheduled reconnect using stored `OcpConnectionConfig.authToken`.

4. **Attempt identity:** each sign-in/recovery attempt has an opaque correlation/attempt ID. Late socket events from superseded attempts are ignored.

5. **Required actions:**

| UI situation | Action | Behavior |
|---|---|---|
| Server failed/disconnected | `Retry server` | close stale socket → fresh HTTP token → one new WebSocket → send auth |
| Server connected, auth timeout/rejected, socket open | `Retry authorization` | resend auth on **same** open socket; no second socket |
| `SESSION_EXIST` | `Retry server` | do not resend into old socket; fresh token + new socket |
| Server connected + authorized | `Reconnect` | close → fresh token → new socket → auth → await OCP + SIP outcome |
| Socket drops | recovery policy | Application retries with fresh HTTP token |

6. **`OcpBackedSignInOrchestrationService`** remains the owner of HTTP → WS → credentials → SIP-ready sequencing; WU-02 refactors it rather than duplicating a second flow.

7. **Compatibility:** temporary selectors may bridge old `connectionState` consumers; every consumer migrates before deletion.

## Alternatives Considered

| Alternative | Benefits | Risks | Why rejected |
|---|---|---|---|
| UI-only move of Connect/Retry without recovery ownership change | Fast UX | Duplicate sockets; stale-token reconnect remains | Unsafe |
| Adapter auto-reconnect with retained token | Less Application code | Stale token; dual sockets; `INVALID_TOKEN` loops | Explicitly forbidden |
| Single enum for transport+auth | Fewer types | Overloaded Retry; cannot express auth-only retry | Causes current bugs |
| HTTP authenticate inside WebSocket adapter | Fewer ports | Violates transport boundary; hard to mock | Rejected |

## Consequences

- **Positive:** one-socket invariant; clear Retry vs Reconnect; testable FSM; SIP-only path untouched.
- **Negative:** broader consumer migration; temporary compatibility layer.
- **Testing:** pure reducer suites; Application fresh-token / auth-only / SESSION_EXIST / terminate; adapter close does not schedule stale reconnect; integration concurrent-click / stale-event suppression.
- **Observability:** attempt ID on all OCP recovery logs; never log tokens.
- **Rollback:** restore prior `connectionState` + adapter reconnect only with ADR amendment.

## Architecture Checks

- Domain remains framework-independent (pure types/reducers only).
- UI does not access adapters or raw sockets.
- `OcpGateway` remains sole OCP transport boundary.
- State transitions remain explicit.
- Critical flows remain observable.

## Related Links

- Feature Registry: F-014, F-028
- Plan: `auth-flow/auth-flow-refactoring.md` (WU-02)
- Related ADRs: ADR-AF-003 (UI action placement), ADR-0004 (SIP transport/register orthogonality — same dual-FSM spirit)
