# ADR-0011: SDK Pairing, Origin, Capabilities, Replay, and Revocation

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — open PoP/profile detail **closed by SDK-01** (ADR-0016, 2026-07-20)

## Context

- **Features:** F-011
- **Legacy:** LF-080, LF-081
- **Roadmap:** P12
- **Contexts:** Integration, Settings
- **Layers:** Main infrastructure, Application settings, Ports (`SecretStoragePort`)

Loopback WebSocket is a privileged control surface. Exact Origin alone is insufficient.
P12 requires fail-closed pairing, per-client capabilities, replay protection, and
revocation before any product state is exposed (DI-04).

## Decision

1. **Exact Origin gate:** WebSocket upgrade requires an **exact** Origin string from the
   desktop allowlist. Missing, `null`, wildcard, suffix, and substring matches are rejected.
   Origin is an additional gate, **not** client identity.

2. **Pairing:** Explicit local user/admin approval is required before a client installation
   becomes trusted. Each client receives a distinct revocable identity. Pairing material is
   never embedded in web bundles, URLs, or discovery documents.

3. **Storage:** Pairing secrets and session material use `SecretStoragePort` or an approved
   dedicated secure service. Settings UI (DI-09) may show client metadata and revoke
   controls, never reusable bearer secrets for copy/paste into browser apps.

4. **Sessions:** After pairing, short-lived session credentials are bound to Origin, client
   ID, server instance ID, session epoch, and negotiated capabilities. Desktop restart
   changes instance/epoch; clients must reauthenticate and resync.

5. **Capabilities (server-issued; checked on every command/subscription):**
   - `session.read.redacted`
   - `window.show`
   - `window.hide`
   - `operator.status.write`
   - `call.originate`
   - `call.control`
   - `account.activate`
   - `session.logout`

   Capability levels follow `axatalk-sdk/docs/SECURITY.md` (Unauthenticated → Privileged).

6. **Replay / idempotency:** Nonces on handshake, unique request IDs, expiry, and a bounded
   deduplication cache. Replayed challenge, session, or request ID fails closed. Mutations
   are serialized per call/account aggregate (details refined in ADR-0012 / DI-06).

7. **Revocation and expiry:** Revoke immediately stops events and commands for that client
   (`sdk:revoked`). Revoke **must not** terminate calls or account sessions. Expiry fails
   closed the same way.

8. **Unauthenticated surface:** handshake and pairing request only — no snapshot, events, or
   product commands.

9. **Audit logs:** allowlisted fields only (command type, request ID, client ID, correlation
   ID, result, duration). No payloads, tokens, secrets, or unauthorized PII.

## Open Decisions

**Closed by SDK-01** — see **ADR-0016** (shared freeze with DI-04 implementation).

| ID | Resolution |
| --- | --- |
| O-POP-1 | Web Crypto ECDSA P-256 challenge/response; non-extractable keys in IndexedDB |
| O-POP-2 | `pairing:request` / `pending` / `approved`\|`denied` payload shapes in ADR-0016 |
| O-CAP-1 | Profiles `presentation` / `operator` / `call_controller` with listed defaults |

DI-03 transport must not invent crypto or capability grants; DI-04 implements ADR-0016.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| Shared static bearer token in CRM config | Trivially leaked; XSS reuses forever |
| Origin-only trust | XSS/extension in approved origin fully controls softphone |
| Broadcast events to all local sockets | Cross-tab/cross-app data leak |

## Consequences

- DI-04 owns implementation and independent security review gate.
- DI-05+ product paths assume authenticated + capability-checked sessions.
- Rollback: revoke all clients / disable gateway.

## Architecture Checks

- Domain never sees pairing secrets.
- Settings projections never include secret material (ADR-AF-006 spirit).
- OCP endpoint fields cannot be used for SSRF via SDK.

## Related Links

- Feature Registry: F-011
- `axatalk-sdk/docs/SECURITY.md`
- Related: ADR-0009, ADR-0010, ADR-0012, ADR-AF-006
