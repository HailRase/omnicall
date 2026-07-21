# Installation & Support Matrix

## Packages (future npm names)

| Package | Role |
| --- | --- |
| `@axata/axatalk-protocol` | Runtime schemas + shared types |
| `@axata/axatalk-sdk` | Browser / Node-capable client (`AxatalkClient`) |

**Today:** incubating workspace under `axatalk-sdk/` (`private: true`, `0.0.0`).  
First public RC target: `@axata/axatalk-sdk@0.1.0-rc.0` / `@axata/axatalk-protocol@0.1.0-rc.0` on
npm dist-tag **`rc`** — see [release-and-support](./release-and-support.md).  
**Not** on `latest` until DI-10 packaged E2E passes.

Install for local development:

```bash
cd axatalk-sdk
npm ci
npm run preflight
```

Workspace packages resolve as `@axata/axatalk-sdk` / `@axata/axatalk-protocol` via npm workspaces.

## Engines

| Runtime | Requirement |
| --- | --- |
| Node | `>=20.19.0` |
| npm | `>=10.0.0` |
| Module format | **ESM only** (`"type": "module"`, `attw --profile esm-only`) |
| TypeScript (consumers) | 5.x recommended; consume `dist` types |

## Browser baseline

| Target | Status |
| --- | --- |
| Chromium / Edge (Chromium) | Supported baseline (Playwright harness) |
| Firefox / Safari | Not claimed in this incubation matrix |
| Web Crypto (ECDSA P-256, non-extractable) | Required for PoP |
| IndexedDB | Required for durable PoP store in browsers |

## HTTPS page → loopback WebSocket

CRM pages served over **HTTPS** talking to desktop **loopback WS** are constrained by
browser Local Network Access / loopback permission policy (**ADR-0015**).

| Constraint | Guidance |
| --- | --- |
| Exact Origin | Desktop matches the exact Origin string; admission is TOFU/blacklist (ADR-0018) |
| Discovery | Loopback HTTP discovery only; never embed secrets in discovery docs |
| Permission denied | Map to stable client errors (`local_network_permission_*`) — not silent success |
| Mixed content | Prefer documented desktop endpoint URL your product already approved |

Do not invent a `fetch` fallback to desktop HTTP APIs from the page.

## What this SDK is not

- Not a second softphone
- Not a SIP stack
- Not an OCP wire client
- Not a compatibility shim for legacy `window.Softphone`
