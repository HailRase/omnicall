# ADR-0002: Defer OCP Plugin to Far Backlog

## Status

Accepted (2026-06-24)

## Context

The platform implements OCP behind `OperatorPlatformGateway` as an optional plugin (ADR-0001, Architecture Constitution). Mock OCP and real WebSocket adapters (RAT step 06) exist in code. Product priority is a **standalone SIP softphone**: registration, calls, media, hold/mute, transfer, recovery — without operator platform integration.

Agents repeatedly treated OCP (RAT R5 smoke, real WS, operator status) as blocking or in-scope work.

## Decision

1. **OCP plugin is DEFERRED** to far backlog. Canonical doc: `docs/softphone/OCP-PLUGIN-BACKLOG.md`.
2. **Default product path** remains `mode: "sip-only"`. No OCP implementation, smoke, or debugging unless user resumes backlog.
3. **Do not remove** OCP ports, domain `operator/` context, mock gateways, or dormant real WS adapters — they preserve plugin architecture and legacy registry.
4. **RAT step 06** status: `deferred` — code may exist; **R5 manual smoke is out of active scope** until backlog resumes.
5. **Active RAT track** continues from **step 07** (real SIP transfer) and SIP slices R1–R4 maintenance.
6. Feature Registry F-009, F-010, F-015: `Product status: deferred_backlog` (mock implementation remains; real OCP parity deferred).
7. Cursor rule `.cursor/rules/ocp-deferred.mdc` applies to all agents.

## Consequences

- Positive: agents focus on core telephony; no OCP questions during SIP/transfer work.
- Positive: legacy `LF-XXX` Operator rows stay tracked for future parity.
- Negative: real OCP WebSocket unvalidated on production stand until backlog resumes.
- Unchanged: SIP-only mode must keep working; guards on `isOcpStatusAvailable` / `isOcpMode` must not be removed.

## Alternatives considered

- Delete OCP code — rejected (breaks plugin boundary and mock CI coverage).
- Keep R5 smoke as RAT blocker — rejected (blocks SIP-first delivery).
- Merge OCP into core bootstrap — rejected (violates Architecture Constitution).

## References

- `docs/softphone/OCP-PLUGIN-BACKLOG.md`
- `docs/softphone/adr/ADR-0001-real-adapter-integration.md`
- `docs/softphone/Architecture-Constitution.md` § Optional OCP Architecture
