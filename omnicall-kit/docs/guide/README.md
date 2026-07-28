# OmniCall Kit — Developer Guide

Canonical developer documentation for `@softomnitel/omnicall-kit`.

**Status (2026-07-27+):** F-011 **implemented**; desktop DI-10 **closed**; npm
`@softomnitel/omnicall-kit@0.1.0` / `@softomnitel/omnicall-protocol@0.1.0`
(`latest`); RC `0.1.0-rc.0` on tag `rc`.

Public contract truth: [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
Example (fake peer only): [`examples/crm-pairing-lite/`](../../examples/crm-pairing-lite/).

## RU / Integrators

| Page | Purpose |
| --- | --- |
| **[Русский гайд разработчика](./RU-DEVELOPER-GUIDE.md)** | Один канонический файл: быстрый старт → API → prod checklist (также публикуется как npm README пакета `@softomnitel/omnicall-kit`) |

## Read in this order (EN)

| # | Page | Purpose |
| --- | --- | --- |
| 1 | [Security anti-patterns](./security-anti-patterns.md) | What never to do |
| 2 | [Capabilities matrix](./capabilities.md) | Profile defaults vs privileged grants |
| 3 | [Installation & support](./installation.md) | Engines, ESM, browsers, HTTPS→loopback |
| 4 | [Transport (WebSocket port)](./transport.md) | Official browser WS adapter + injection rules |
| 5 | [Pairing quick start](./pairing-quick-start.md) | Connect → pair → ready → snapshot |
| 6 | [API reference](./api-reference.md) | Namespaced methods only |
| 6a | [TypeScript](./typescript.md) | Imports, `OmniCallEventOf`, error readers, inventory sync |
| 7 | [Events catalog](./events.md) | Public protocol event names |
| 8 | [Operator status & reservation](./operator-status-reservation.md) | `changeStatus` applied\|reserved; finish-appeal |
| 9 | [Errors catalog](./errors.md) | Stable codes + host next steps |
| 10 | [Reconnect & multi-tab](./reconnect-multi-tab.md) | Fresh snapshot; no mutation replay |
| 11 | [Logout workflow](./logout-workflow.md) | single-shot logout / abandon |
| 12 | [Saved-account activation](./saved-profile-activation.md) | Login + optional mode; server-grant only |
| 13 | [Upgrade & deprecation](./upgrade-deprecation.md) | Additive fields; protocol vs package |
| 14 | [Compatibility matrix](./compatibility-matrix.md) | Browser + SDK↔desktop gates (DI-10 cells) |
| 15 | [Release, rollback, revoke & support](./release-and-support.md) | RC tag, SBOM, provenance, stable gate |

## Hard rules (every page assumes these)

1. Never request `account.activate` or `window.hide` at pairing — SDK strips them.
   Grant both only via OmniCall Settings → SDK Origin matrix; then call
   `client.account.activateProfile` / `client.window.hide({ expectedRevision })`.
2. Never pass SIP password / OCP apiKey through the SDK.
3. Never store PoP keys or tokens in `localStorage` / `sessionStorage`.
4. Reconnect never replays mutations; disconnect never hangup / logout / activate / hide.
5. Document only symbols that exist in `etc/api/sdk.api.md` today.

## Related (agents / architecture)

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md), [`../SECURITY.md`](../SECURITY.md), [`../PROTOCOL.md`](../PROTOCOL.md)
- Desktop grant UX (operators elevate `account.activate`): DI-09 — Settings integrations
- Feature Registry: **F-011 implemented** (DI-10 full close 2026-07-27)
