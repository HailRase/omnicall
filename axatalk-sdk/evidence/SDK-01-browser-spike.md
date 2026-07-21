# SDK-01 Browser Feasibility Spike — HTTPS → Loopback WS / Discovery

**Date:** 2026-07-20  
**Work unit:** SDK-01  
**Closes:** O-BRW-1, O-BRW-2 (policy); informs ADR-0015  
**Method:** documentation spike against current browser platform status (no product transport code)

## Goal

Confirm whether a **public HTTPS** CRM page can reach Axatalk Desktop on
`http://127.0.0.1` discovery + `ws://127.0.0.1` under current Local Network Access (LNA)
rules, and record UX/permission implications for DI-09.

## Sources (2026-07-20)

| Source | Relevance |
| --- | --- |
| [MDN — Local network access](https://developer.mozilla.org/en-US/docs/Web/Security/Defenses/Local_network_access) | Permissions `loopback-network` / `local-network`; affects fetch, WebSocket, WebTransport; secure-context only |
| [Chrome Status — Local network access restrictions](https://chromestatus.com/feature/5152728072060928) | Chromium LNA rollout; WS/WebTransport expansion; enterprise policies |
| Industry notes on Chrome 147+ WS LNA | Public→loopback WS requires user permission; HTTPS required for prompt |
| Firefox Bug 2042339 / `network.lna.websocket.enabled` | Firefox enables LNA checks for WebSockets (2026-07) |
| WICG local-network-access discussions | `targetAddressSpace` exists for `fetch`; WebSocket has no equivalent init option |

## Findings

### Chromium (Chrome / Edge)

1. Public origins talking to loopback are gated by LNA permission (`loopback-network`).
2. Restrictions apply to **WebSockets** in current Chromium trains (documented expansion
   around Chrome 147+).
3. Permission prompts require a **secure context**. Plain HTTP public pages are unsupported
   for this product path.
4. Mixed-content relaxation for loopback HTTP discovery is tied to granted LNA permission;
   `fetch(..., { targetAddressSpace: "loopback" })` is the documented way to declare intent
   for HTTP discovery from HTTPS pages.
5. WebSocket constructors do **not** expose `targetAddressSpace`; connecting to the IP
   literal `ws://127.0.0.1:...` is the supported Axatalk approach (ADR-0015).

### Firefox

1. Firefox implements LNA and has enabled WebSocket LNA checks (`network.lna.websocket.enabled`).
2. User permission / enterprise policy paths exist; behavior is close enough to Chromium for
   P12 **supported** status with documented prompts.
3. Packaged E2E should still verify allow/deny on a recent Firefox stable before SDK-05 claims
   browser matrix green (execution deferred to SDK-05 / DI-10 harness — out of SDK-01 scope).

### Safari

Not validated in this spike → **unsupported** for P12 (fail closed with stable client error).

## Feasibility verdict

| Path | Feasible for P12? | Notes |
| --- | --- | --- |
| HTTPS page → `GET http://127.0.0.1:17341/axatalk/v1/discovery` | **Yes**, with LNA allow | Use `targetAddressSpace: "loopback"` when calling `fetch` |
| HTTPS page → `ws://127.0.0.1:17341/axatalk/v1/ws` | **Yes**, with LNA allow | Exact Origin still enforced by desktop (ADR-0011) |
| HTTP public page → loopback | **No** | Unsupported |
| LAN bind / non-loopback | **No** | Forbidden by ADR-0010 |

## UX keys reserved (O-BRW-2)

See ADR-0015 table (`sdk.lna.*`, `sdk.discovery.*`). Copy and i18n catalogs land in DI-09.

## Explicit non-goals of this spike

- No Electron gateway implementation (DI-03).
- No `@axata/axatalk-sdk` transport client (SDK-03).
- No Playwright LNA interactive run in CI (deferred; CI still uses existing SDK-00 browser
  scaffold only).
- No Safari polyfill research.

## Decision link

Policy frozen in **ADR-0015**. Runtime proof moves to DI-03 + SDK-03/05 + DI-10 packaged E2E.
