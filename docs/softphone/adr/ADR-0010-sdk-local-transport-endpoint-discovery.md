# ADR-0010: SDK Local Transport, Endpoint Discovery, and Browser Support

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — with open items owned by SDK-01

## Context

- **Features:** F-011
- **Legacy:** LF-080
- **Roadmap:** P12
- **Contexts:** Integration
- **Layers:** Electron main infrastructure, public protocol (SDK package)

Browser tabs must reach Axatalk over a local WebSocket. Loopback is not trust. Endpoint
discovery, port ownership, and HTTPS→local WS browser policies must be decided before
DI-03/SDK-03 implement transport.

## Decision

1. **Binding:** Desktop binds the SDK WebSocket server **only** to explicit loopback
   addresses (`127.0.0.1` and/or `::1` as configured). Non-loopback bind is forbidden for
   protocol v1.

2. **Single-instance ownership:** Electron single-instance lock (or equivalent) must run
   before fixed endpoint ownership. If the configured port is occupied, startup **fails
   closed** for the gateway (observable error) without blocking core softphone.

3. **Dependency selection:** DI-03 selects a maintained, non-deprecated WebSocket server
   library after official-doc review (no `@deprecated` APIs). The choice is recorded in
   DI-03 evidence; this ADR only requires replaceability behind `LocalWsServerAdapter`.

4. **Resource limits (mandatory for DI-03):** bounded frame size, JSON depth, connection
   count, outbound queue, heartbeat, unauthenticated idle timeout, and rate limits. Slow
   consumers are disconnected without affecting desktop telephony.

5. **No product data before auth:** handshake framing may exist in DI-03, but snapshots,
   events, and product commands are impossible until DI-04 authentication succeeds
   (ADR-0011).

6. **Endpoint discovery (closed for desktop side):**
   - Desktop publishes a **stable local discovery document** only on loopback (exact path
     and format finalized with SDK-01; candidates: well-known localhost HTTP resource owned
     by main, or SDK settings-exported endpoint metadata without secrets).
   - Discovery responses contain no pairing secrets, tokens, phone numbers, or account PII.
   - Clients must not hard-code secrets; they may hard-code only the documented discovery
     contract version.

7. **Browser support (policy baseline):**
   - Target browsers for P12: Chromium-family (Chrome/Edge) current stable and previous
     stable, plus documented Firefox if SDK-01 confirms local WS policy.
   - HTTPS pages connecting to `ws://127.0.0.1` / `ws://[::1]` must be validated against
     current browser mixed-content / private-network access policies in SDK-01.
   - Unsupported browsers fail closed with a stable client error; desktop still serves
     supported clients.

## Open Decisions (owner: SDK-01; must close before SDK-03 / DI-03 product exposure)

| ID | Decision | Owner | Blocks |
| --- | --- | --- | --- |
| O-DISC-1 | Exact discovery URL/path, response schema, and versioning | SDK-01 | SDK-03, DI-03 endpoint publish |
| O-DISC-2 | Whether discovery uses a tiny loopback HTTP helper vs WS-only bootstrap | SDK-01 | DI-03 |
| O-BRW-1 | Confirmed Chrome/Edge/Firefox policy matrix for HTTPS→loopback WS | SDK-01 | SDK-05 packaged E2E |
| O-BRW-2 | Private Network Access / permission-prompt UX copy keys (i18n later in DI-09) | SDK-01 → DI-09 | DI-09 |

Desktop agents must not invent these in production code; if blocked, mark the DI unit
`blocked` and cite this ADR.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Bind `0.0.0.0` for LAN CRM hosts | Expands attack surface; out of P12 scope |
| mDNS / custom URI scheme as sole discovery | Extra OS privileges; harder browser support |
| Shared static port without single-instance lock | Competing listeners; silent wrong-app control |

## Consequences

- DI-03 implements transport + limits + teardown only.
- Security tests cover occupied port, second instance, and loopback peer checks
  (`TEST-MATRIX.md`).
- Rollback: disable gateway; no listener remains.

## Architecture Checks

- Transport adapter stays in main infrastructure.
- Domain never imports the WS library.
- Discovery never becomes a credential channel.

## Related Links

- Feature Registry: F-011
- `axatalk-sdk/docs/PROTOCOL.md` (Open Decisions)
- `axatalk-sdk/docs/SECURITY.md`
- Related: ADR-0009, ADR-0011
