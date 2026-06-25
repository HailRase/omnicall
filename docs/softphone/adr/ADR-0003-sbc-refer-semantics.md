# ADR-0003: Dev SBC REFER Semantics (onedemoserver.online)

## Type

DOCUMENT.

## Status

Accepted — **partial on real SBC**; external off-net blind transfer and attended manual smoke moved to [TRANSFER-REAL-ADAPTER-BACKLOG.md](../real-integration/TRANSFER-REAL-ADAPTER-BACKLOG.md) (2026-06-25).

## Context

RAT step 07 implements `TelephonyGateway.blindTransfer` and `attendedTransfer` on `JsSipTelephonyAdapter` via JsSIP `RTCSession.refer()` (RFC 3515). Features F-006, F-007; legacy LF-028, LF-029. Dev stand: `onedemoserver.online:5063` / domain `dev-qms.onedemoserver.online`.

Call Engine publishes `CallTransferred` / `AttendedTransferCompleted` only after the gateway returns success. The adapter must therefore wait for definitive SIP signals, not merely send REFER.

## Decision

### Blind transfer

1. Build `Refer-To` via adapter helper `buildBlindReferTarget()` (not shared with outbound INVITE).
2. **On-net** (short extension, explicit `sip:` URI): `sip:{number}@{account.domain}` — unchanged from step 07; smoke PASS on dev SBC.
3. **Off-net** (E.164 `+…` or national digits ≥ 10): `sip:{number}@{account.domain}` — same host as outbound INVITE.
4. Invoke `sourceSession.refer(target)` on the held or active source leg.
5. **Success:** JsSIP `ReferSubscriber` emits `accepted` (NOTIFY sipfrag status line `2xx`).
6. **Failure:** `requestFailed` (REFER non-2xx / transport error) or NOTIFY `failed` (sipfrag `3xx–6xx`).
7. Gateway returns `ok` only after `accepted`. Domain layer then ends the source leg via existing events.

### External Refer-To on onedemoserver.online (step 07b)

**Evidence (manual smoke 2026-06-24, no SIP trace captured):**

| Scenario | Call leg | Target | Result (step 07) |
| --- | --- | --- | --- |
| A | Incoming external client | Internal ext | PASS |
| B | Incoming internal operator | External client | FAIL |
| C | Outgoing to operator | External client | FAIL |
| D | Outgoing to client | Internal ext | PASS |

Pattern: on-net extension REFER succeeds; off-net external fails when Refer-To reused `buildOutgoingSipTarget` (`sip:{n}@{domain}`). Outbound INVITE to same external numbers works — SBC dialplan treats INVITE Request-URI and REFER Refer-To differently.

**Decision:**

| Kind | Heuristic | Refer-To format |
| --- | --- | --- |
| `on_net` | `sip:` passthrough, or digits-only length ≤ 5 | `sip:{number}@{account.domain}` |
| `off_net` | E.164 (`+…`) or digits-only length ≥ 10 | `sip:{number}@{account.domain}` (same host as INVITE) |

Classification and URI construction are adapter-only (`buildBlindReferTarget.ts`). `makeCall` continues to use `buildOutgoingSipTarget`.

**REFER completion on dev SBC:** gateway success on NOTIFY `accepted`, **or** REFER `202` (`requestSucceeded`) followed by source dialog `ended` without NOTIFY `failed` — JsSIP drops `ReferSubscriber` on `_terminate()` before late NOTIFY can arrive.

**Adapter:** `referInFlightCallIds` suppresses premature `callEnded` while REFER is in flight; orchestration owns terminal events.

**Hypothesis disposition (no trace):**

| ID | Status | Notes |
| --- | --- | --- |
| H1 | **Revised** | Off-net uses `sip:n@domain` (INVITE parity); `tel:` rejected in smoke |
| H2 | Deferred | Revisit if smoke still fails with national digits |
| H3 | Ruled out | No prefix without SBC evidence |
| H4 | Deferred | Revisit if `tel:` insufficient |
| H5 | Ruled out | Failure independent of call direction |
| H6 | Unchanged | 487 still means target canceled / no answer |

**NOTIFY expectations:** same classification as blind transfer table below; external transfer may still NOTIFY `487` if target does not answer — not treated as success.

### NOTIFY failure classification (adapter)

| sipfrag | Kind | User message |
| --- | --- | --- |
| `487` | `transfer_target_canceled` | Target canceled or did not answer |
| `486`, `600` | `transfer_target_busy` | Target busy |
| `603` | `transfer_target_declined` | Target declined |
| `404`, `410` | `transfer_target_not_found` | Target not found |
| `408`, `480`, `503` | `transfer_target_unavailable` | Target unavailable |
| other | `refer_notify_failed` | Includes raw SIP code in message |

`487` on dev SBC typically means the transfer leg to the target was canceled before completion (no answer, timeout, or remote hangup during transfer setup) — not a client stub error.

### Projection recovery

`CallTransferFailed` carries optional `restoredSourceState`; `multiLineCallProjection` must restore line state so blind transfer can be retried (LF-028 / LF-031).

### Attended transfer

1. Source leg = original call; consultation leg = outgoing consultation call.
2. Invoke `sourceSession.refer(consultationRemoteUri, { replaces: consultationRawSession })` where `consultationRemoteUri` is parsed from consultation `remote_identity` and `replaces` is the raw JsSIP `RTCSession` (adapter-private; not exposed on port).
3. Same success/failure signals as blind transfer on the source leg REFER.
4. Gateway returns `ok` only after NOTIFY `accepted`. Call Engine ends both legs.

### Observability

Adapter logs: `jssip_blind_transfer_*`, `jssip_attended_transfer_*` with correlation ID, call IDs, feature F-006/F-007, and normalized failure cause (no credentials).

### Out of scope

- Inbound REFER handling (ReferNotifier) — not required for agent-initiated transfer.
- OCP transfer sync — deferred (ADR-0002).
- Multi-call hold-all on real SBC — separate backlog item in step 07 deferred doc.

## Alternatives Considered

| Alternative | Why rejected |
| --- | --- |
| Return `ok` on REFER `202` (`requestSucceeded`) only | Premature; final result arrives via NOTIFY on dev SBC |
| Domain changes for REFER state | Port contract sufficient; mock path unchanged |
| Custom SIP stack REFER | JsSIP ReferSubscriber already implements NOTIFY handling |

## Consequences

- Positive: Gateway confirmation aligns with SBC reality; mock regression unchanged.
- Negative: Attended transfer requires adapter-private raw session map for `replaces`.
- Testing: unit tests mock ReferSubscriber eventHandlers; manual R6 smoke on two extensions.
- Rollback: revert adapter refer helpers; gateway returns `not_implemented` again.

## Architecture Checks

- Domain remains framework-independent.
- UI does not access adapters.
- OCP remains optional.
- JsSIP types do not cross `TelephonyGateway` port.
- State transitions remain explicit via existing Domain events.

## Related Links

- Feature Registry: F-006, F-007
- RAT: `docs/softphone/real-integration/step-07-transfer-and-multicall-deferred.md`
- JsSIP: `RTCSession.refer`, `RTCSession/ReferSubscriber.js`
