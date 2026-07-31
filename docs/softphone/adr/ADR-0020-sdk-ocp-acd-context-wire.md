# ADR-0020: SDK `call:acd-context` Carries OCP MainCallIDInfo Wire

## Type

DOCUMENT.

## Status

Accepted (2026-07-26) — **narrow CRM exception** to ADR-0017 “never `acallid` /
OCP wire” for the dedicated `call:acd-context` event only.

## Context

- **Features:** F-011 (SDK), F-028 (OCP call context)
- **Contexts:** Integration
- **Layers:** `@softomnitel/omnicall-protocol`, Application mappers, Local WS fan-out

Desktop already syncs OCP `get_main_acallid` → MainCallIDInfo. CRM hosts that
previously consumed the raw OCP WebSocket require the same fields
(`main_acallid`, `acallid`, `event`, `caller_id`, `called_id`, `queue`,
`user_login`) on the public SDK. A purely semantic DTO (queue label + masked
phone) is insufficient for that customer integration.

## Decision

### O-ACD-1 — Capability-gated OCP MainCallIDInfo on `call:acd-context`

1. **Public event** `call:acd-context` payload includes OCP snake_case wire
   fields plus desktop `callId`:
   - `callId` — SIP/session id (correlation with other `call:*`)
   - `main_acallid?`, `acallid`, `event`, `caller_id`, `called_id`, `queue`,
     `user_login`
   - optional additive helpers: `phase`, `direction`

2. **Capability:** `ocp.acd_context.read`
   - Required with `session.read.redacted` to receive `call:acd-context`.
   - Default on pairing profiles `operator` and `call_controller` (not
     `presentation`).
   - Origin matrix governed (ADR-0018); missing persisted keys migrate with
     additive default `true`.

3. **Unchanged privacy for other surfaces:**
   - Additive `queueLabel` on `call:*` / snapshot call summaries remains
     desktop-safe and **must not** carry `acallid` / `main_acallid`.
   - Campaign DTOs stay redacted (ADR-0019).
   - Secrets / `FORBIDDEN_WIRE_KEYS` still apply.

4. **Empty queue:** event is still emitted (`queue: ""`) so CRM receives
   `main_acallid` / `acallid` for direct/internal calls; UI badge and
   `queueLabel` stay omitted when empty.

5. **Snapshot recovery (additive):** authenticated `calls[]` summaries may include
   optional `acdContext` — the same MainCallIDInfo snake_case shape as the live
   event payload (without repeating parent `callId`). Present only when desktop
   has stored `acdWire` for that SIP call **and** the client has
   `ocp.acd_context.read`; stripped otherwise. Live `call:acd-context` is
   unchanged. `queueLabel` remains available to all `session.read.redacted`
   clients.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Keep redacted-only `call:acd-context` | Blocks CRM parity with live OCP MainCallIDInfo |
| Emit under `session.read.redacted` only | Leaks wire ids to presentation-tier clients |
| Separate `ocp:raw-*` event | Extra surface; customer already expects MainCallIDInfo shape |

## Consequences

- ADR-0017 mapping table for `call:acd-context` points here for the wire
  exception; campaign / `queueLabel` rules unchanged.
- Origin matrix + Settings i18n gain `ocp.acd_context.read`.
- Fan-out / snapshot strip fails closed without the capability.
- Reconnect hosts recover ACD wire from `getSnapshot().sections.calls[].acdContext`
  without waiting for a replayed live event (desktop `CallOcpContextProjection.acdWire`).

## Architecture Checks

- Domain keeps camelCase `ocp` block; snake_case only at SDK mapper boundary.
- OCP remains optional; SIP-only unaffected.

