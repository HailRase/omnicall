# ADR-0017: SDK PII Masks, Call Ownership, Campaign Scope, OCP Map, Deprecation

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — closes **O-PII-1**, **O-OWN-1**, **O-CAMP-1**, **O-OCP-1**;
freezes protocol support/deprecation window (SDK-01)

## Context

- **Features:** F-011; OCP baseline F-028 E-12
- **Legacy:** LF-051, LF-065, LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration, Telephony, Operator
- **Layers:** Public protocol DTOs, Application mappers (DI-05…DI-07)

ADR-0012 closed privacy/ownership principles and stated that public operator DTOs are
protocol-owned. Exact masks, lease timers, campaign inclusion, and the E-12 compatibility
map remained open for SDK-01.

## Decision

### O-PII-1 — Redaction levels and mask formats

Protocol v1 ships **one** read capability for product state: `session.read.redacted`.

| Field class | v1 redacted format | Notes |
| --- | --- | --- |
| Phone / dialed number | Keep last 4 digit characters; replace all other digits with `*`; preserve leading `+` if present | Example: `+1******7890` |
| Display name | First Unicode scalar + `***` when length > 1; single-char names → `*` | No full name without future capability |
| Account labels | Opaque profile display label already approved for desktop UI, else omitted | Never SIP password / OCP key |
| Operator reason labels | Public reason id + desktop-safe label key/text already shown in UI projections | No upstream raw dumps |
| Raw SIP URI / OCP wire ids / contacts / history | **Omitted** from v1 | ADR-0012 |

Unauthorized snapshot sections are omitted. No `session.read.unmasked` in protocol v1; a
future capability requires a new ADR.

### O-OWN-1 — Call ownership, idempotency, and revision policy

1. **Owner:** the authenticated SDK `clientId` that successfully completes `call:originate`
   owns that call for control mutations. For inbound calls, the client that successfully
   completes `call:answer` becomes owner. Ownership lasts until the call reaches a terminal
   state (ended/failed) or a future ADR defines an explicit transfer command.

2. **Control gate:** `call.control` mutations (hold/resume/mute/unmute/DTMF/hangup/reject as
   applicable) require the caller to be the recorded owner. Non-owners receive `not_owner`.
   Protocol v1 has **no** `call:claim-control` and **no** automatic ownership steal between
   tabs.

3. **`expectedRevision`:** all call and account mutations in v1 require `expectedRevision`
   equal to the server aggregate revision; mismatch → `stale_state`. This is the concurrency
   control mechanism (not a timed lease transfer).

4. **Idempotency:** duplicate `requestId` within the server deduplication TTL returns the
   cached reply and never applies a second side effect. Dedup TTL default: **120 seconds**
   (exact constant locked in SDK-02 fixtures).

5. **Multi-tab:** same Origin with a different `clientId` is a different principal; without
   ownership → `not_owner` or `conflict`. After reconnect, the same `clientId` must
   reauthenticate and resync; the SDK never replays mutations (ADR-0011/0012).

6. **Disconnect:** SDK disconnect/revoke never ends calls or account sessions.

### O-CAMP-1 — Campaign events

**Superseded by [ADR-0019](./ADR-0019-sdk-campaign-events-v1.md) (2026-07-26).**

Original decision deferred `operator:campaign-offered` / `operator:campaign-cleared`
past v1 pending privacy review. ADR-0019 admits them into protocol v1 behind
`operator.campaign.read` with a redacted public DTO (O-PII-1 masks). Desktop F-028
UI remains the accept/reject control surface.

### O-OCP-1 — Public protocol ↔ F-028 E-12 map

E-12 `OcpHostApiContract` stays an **internal** host-command baseline
(`callType: 'external'`). Public SDK protocol uses Integration namespaces and
`callType: 'sdk'` at the Facade boundary. **No OCP wire frames, channels, or apiKeys cross
the public WS.**

**OCP wire `function_call_type`:** legacy `proxy_users` accepts only `internal` |
`external`. Application audit keeps `sdk`; the OCP adapter maps `sdk` → `external` in
`mapOcpCallTypeToWire` / `buildOcpCommandPayload` before `ws.send`. Do **not** pass
`function_call_type: "sdk"` on the OCP socket, and do **not** silently change Facade
`callType` from `"sdk"` to `"external"` (DI-07 binding test).

| Public protocol (v1) | Maps to desktop | E-12 channel | Notes |
| --- | --- | --- | --- |
| Snapshot `operator.*` (redacted) | `getOcpConnectionState` / projections | `ocp:get-session-state` | Read via snapshot/events, not a public OCP channel name; status enum includes `post_call_processing` |
| Snapshot / `call:*` additive `queueLabel` | `CallOcpContextProjection.queueName` via `CallOcpContextResolved` + mapper | — (not an E-12 channel) | Desktop-safe ACD title only; **never** `acallid` / OCP wire; omitted when empty/direct; see `OCP-Call-Context.md` |
| `call:acd-context` | Same Domain Event → OCP MainCallIDInfo wire fields + `callId` | — | **ADR-0020** CRM exception: `acallid` / `main_acallid` / parties; gated by `ocp.acd_context.read` |
| `operator:get-reasons` | existing reason query used by logout/status UI | — (not an E-12 channel) | Returns reason ids + safe labels |
| `operator:change-status` `{ target: "ready" \| "break", reasonId?: number }` | `changeOcpStatusFromHost` (`callType: "sdk"`) → OCP wire `function_call_type: "external"` | `ocp:change-status-ready` / `ocp:change-status-break` | Public single command; desktop splits ready/break; wire map in adapter; during busy/post-call may `kind: "reserved"` |
| `operator:finish-appeal` `{ expectedRevision }` | `finishOcpPostCallAppeal` (`callType: "sdk"`) → `FinishPostCallAppealUseCase` → apply Ready/Break | same apply path as finish UI | Only when OCP status is post-call processing; missing OCP login → `not_found`; wrong status → `conflict` + `failure_kind` |
| `account:logout` | Account logout orchestration (AF-003/005) | related to `ocp:logout` internally when OCP active | Public single-shot; may return `interaction_required` + reasons (no `logoutToken`) |
| — | — | `ocp:authenticate` | **Not public** (ADR-0013; secrets forbidden) |
| — | — | `ocp:disconnect` | **Not public**; session end projected as account/operator events |

Public field names use protocol vocabulary (`target`, `reasonId`, opaque ids). They must
not reuse raw OCP wire property names such as `apiKey`, `ocpAuthToken`, or proxy paths.

### Protocol support and deprecation window

1. Protocol major is independent of npm/desktop SemVer (ADR-0012).
2. Desktop supports **current and previous** protocol majors concurrently.
3. After publishing protocol major `N+1`, major `N-1` (if any) is unsupported; major `N`
   remains supported for **at least 90 days or two desktop minor releases**, whichever is
   longer, then may be removed in a desktop release that documents the drop.
4. Deprecation notices appear in `axatalk-sdk` changelog and PROTOCOL.md; incompatible
   clients receive `incompatible_version` before any product state.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Unmasked phones in v1 | Privacy/XSS blast radius |
| Auto lease steal between tabs | Surprising control loss; deferred |
| Campaign events in v1 | Privacy review incomplete at accept time — **revised in ADR-0019** |
| Expose `ocp:*` channel names on WS | Leaks internal E-12 / invites secret payloads |

## Consequences

- SDK-02 schemas encode masks/ownership fields and exclude campaign events from v1 unions.
- DI-05/06/07 mappers follow the E-12 table; no wire OCP objects.
- Deprecation calendar is mandatory for DI-10 / SDK-10.

## Architecture Checks

- Domain free of protocol DTOs.
- OCP remains optional; SIP-only unaffected.
- Error codes stay stable across additive releases.

## Related Links

- Closes: O-PII-1, O-OWN-1, O-CAMP-1, O-OCP-1
- Related: ADR-0012, ADR-0013, `src/shared/host-api/OcpHostApiContract.ts`, F-028 E-12
