# ADR-0015: SDK Endpoint Discovery and Browser Local-Network Policy

## Type

DOCUMENT.

## Status

Accepted (2026-07-20) — closes **O-DISC-1**, **O-DISC-2**, **O-BRW-1**, **O-BRW-2** (SDK-01)

## Context

- **Features:** F-011
- **Legacy:** LF-080
- **Roadmap:** P12
- **Contexts:** Integration
- **Layers:** Electron main (gateway), `@axata/axatalk-sdk` transport

ADR-0010 closed loopback-only bind and fail-closed port ownership, but left exact discovery
URL/schema and HTTPS→loopback browser feasibility to SDK-01. Chrome/Edge Local Network
Access (LNA) now covers WebSockets; Firefox has aligned LNA for WebSockets. Evidence:
`axatalk-sdk/evidence/SDK-01-browser-spike.md`.

## Decision

### O-DISC-2 — Discovery mechanism

Use a **tiny loopback HTTP discovery helper** owned by Electron main on the same loopback
listener that serves the WebSocket upgrade (one process, one port). Rejected: WS-only
bootstrap (harder to version, no cacheable GET, poorer CRM diagnostics).

### O-DISC-1 — Exact discovery contract

1. **Default bind:** `127.0.0.1:17341` (IPv4). Optional dual-stack `::1` may be enabled in
   settings later; discovery documents always list concrete endpoints the instance owns.
   Occupied port → gateway fails closed (ADR-0010); core softphone still starts.

2. **URL (v1):** `GET http://127.0.0.1:17341/axatalk/v1/discovery`  
   (and `http://[::1]:17341/axatalk/v1/discovery` when IPv6 loopback is enabled).

3. **Method/headers:** GET only. No cookies. No `Authorization`. CORS for browser tabs:
   reflect **exact** approved Origin when present on the allowlist; otherwise omit ACAO /
   fail closed for credentialed misuse. Discovery itself reveals no product PII.

4. **Response schema (`discoveryVersion: 1`)** — JSON object, all fields required unless
   marked optional:

| Field | Type | Notes |
| --- | --- | --- |
| `discoveryVersion` | `1` | Breaking change → bump |
| `protocolMin` | number | Inclusive protocol major min |
| `protocolMax` | number | Inclusive protocol major max |
| `desktopVersion` | string | Informational SemVer |
| `serverInstanceId` | string | Opaque; changes on desktop restart |
| `wsUrl` | string | e.g. `ws://127.0.0.1:17341/axatalk/v1/ws` |
| `maxMessageBytes` | number | Matches gateway frame limit |
| `heartbeatSeconds` | number | Server heartbeat policy hint |
| `pairingRequired` | boolean | Hint only; auth still required |

Forbidden in discovery: pairing secrets, tokens, phone numbers, account IDs, SIP/OCP
credentials, capability grants.

5. **Versioning:** additive optional fields are compatible within `discoveryVersion: 1`.
   Removals/renames/semantic changes require `discoveryVersion` bump. SDK clients that do
   not understand the document fail closed with a stable client error (no silent guess).

6. **WS path:** `ws://127.0.0.1:17341/axatalk/v1/ws` (same host/port as discovery).

### O-BRW-1 — Supported browser matrix (P12)

| Browser | Policy (as of research 2026-07-20) | P12 support |
| --- | --- | --- |
| Chrome current + previous stable | LNA permission for public→loopback; WS covered (Chrome 147+) | **Supported** |
| Edge current + previous stable | Chromium LNA parity | **Supported** |
| Firefox current stable | LNA includes WebSockets (`network.lna.websocket.enabled`) | **Supported** with documented LNA prompt |
| Safari | Not validated in this spike | **Unsupported** in P12 (fail closed) |

Host pages for production CRM must be **secure contexts (HTTPS)**. Non-secure public HTTP
hosts cannot reliably obtain LNA permission and are unsupported.

`http://localhost` / loopback-hosted pages used only for local SDK development may connect
without public→loopback LNA; still subject to Origin allowlist on the desktop.

### O-BRW-2 — Permission / UX copy keys (implementation in DI-09)

Stable i18n key IDs reserved for DI-09 (no Russian/English copy frozen here):

| Key ID | Purpose |
| --- | --- |
| `sdk.lna.loopback.required.title` | User must allow loopback/local-network access |
| `sdk.lna.loopback.required.body` | Explain Axatalk Desktop local connection |
| `sdk.lna.loopback.denied.title` | User blocked permission |
| `sdk.lna.loopback.denied.body` | How to re-enable via site settings |
| `sdk.lna.unsupportedBrowser.title` | Browser not in support matrix |
| `sdk.discovery.unreachable.title` | Desktop/gateway not reachable |
| `sdk.discovery.incompatible.title` | Discovery/protocol version incompatible |

SDK public errors remain machine-readable (`local_network_permission_required`,
`local_network_permission_denied`, `discovery_unreachable`, `incompatible_version`).
Localized sentences stay in desktop/CRM UI, not on the wire.

Permissions-Policy guidance for embedders (document in SDK-09): prefer
`Permissions-Policy: loopback-network=(self "https://crm.example")` (and `local-network`
only if ever needed). Axatalk v1 targets **loopback only**, not LAN devices.

## Alternatives Considered

| Alternative | Why not |
| --- | --- |
| WS-only bootstrap | No versioned GET document; harder CRM health checks |
| mDNS / custom URI scheme | Extra OS privileges; weak browser story |
| Bind `0.0.0.0` | Forbidden by ADR-0010 |
| Defer Firefox | Spike shows LNA path exists; document prompts instead of excluding |

## Consequences

- DI-03 publishes discovery + WS on the decided paths; must not invent alternate URLs.
- SDK-03/05 implement discovery client + LNA error mapping; no product mutations.
- DI-09 wires i18n keys above when Settings/onboarding UX lands.
- Packaged E2E (DI-10 / SDK-05+) must exercise Chrome LNA allow path.

## Architecture Checks

- Discovery is never a credential channel.
- Gateway remains main-owned (ADR-0009/0010).
- Unsupported browsers fail closed without weakening Origin/pairing.

## Related Links

- Closes: O-DISC-1, O-DISC-2, O-BRW-1, O-BRW-2
- Evidence: `axatalk-sdk/evidence/SDK-01-browser-spike.md`
- Related: ADR-0010, ADR-0011, MDN Local network access
