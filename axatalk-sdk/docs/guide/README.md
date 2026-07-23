# Axatalk SDK — Developer Guide

Canonical developer documentation for `@axata/axatalk-sdk` while the workspace incubates
inside the desktop repository. **RC staging (SDK-10 Mode A)** — not on npm `latest`;
stable blocked on desktop DI-10.

Public contract truth: [`etc/api/sdk.api.md`](../../etc/api/sdk.api.md).  
Example (fake peer only): [`examples/crm-pairing-lite/`](../../examples/crm-pairing-lite/).

## Read in this order

| # | Page | Purpose |
| --- | --- | --- |
| 1 | [Security anti-patterns](./security-anti-patterns.md) | What never to do |
| 2 | [Capabilities matrix](./capabilities.md) | Profile defaults vs privileged grants |
| 3 | [Installation & support](./installation.md) | Engines, ESM, browsers, HTTPS→loopback |
| 4 | [Pairing quick start](./pairing-quick-start.md) | Connect → pair → ready → snapshot |
| 5 | [API reference](./api-reference.md) | Namespaced methods only |
| 6 | [Events catalog](./events.md) | Public protocol event names |
| 7 | [Errors catalog](./errors.md) | Stable codes + host next steps |
| 8 | [Reconnect & multi-tab](./reconnect-multi-tab.md) | Fresh snapshot; no mutation replay |
| 9 | [Logout workflow](./logout-workflow.md) | single-shot logout / abandon |
| 10 | [Saved-account activation](./saved-profile-activation.md) | Login + optional mode; server-grant only |
| 11 | [Upgrade & deprecation](./upgrade-deprecation.md) | Additive fields; protocol vs package |
| 12 | [Compatibility matrix](./compatibility-matrix.md) | Browser + SDK↔desktop gates (DI-10 cells) |
| 13 | [Release, rollback, revoke & support](./release-and-support.md) | RC tag, SBOM, provenance, stable gate |

## Hard rules (every page assumes these)

1. Never request `account.activate` or `window.hide` at pairing — SDK strips them.
2. Never pass SIP password / OCP apiKey through the SDK.
3. Never store PoP keys or tokens in `localStorage` / `sessionStorage`.
4. Reconnect never replays mutations; disconnect never hangup / logout / activate.
5. Document only symbols that exist in `etc/api/sdk.api.md` today.

## Related (agents / architecture)

- [`../ARCHITECTURE.md`](../ARCHITECTURE.md), [`../SECURITY.md`](../SECURITY.md), [`../PROTOCOL.md`](../PROTOCOL.md)
- Desktop grant UX (operators elevate `account.activate`): DI-09 — Settings integrations
- Feature Registry: F-011 remains **in progress** until DI-10 / P12 close (SDK-10 Mode A does not flip it)
