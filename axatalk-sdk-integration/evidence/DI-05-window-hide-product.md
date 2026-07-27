# SDK window.hide product enablement

**Date:** 2026-07-27
**Status:** done (automated)
**Scope:** F-011 / ADR-0013 amendment — enable privileged `window:hide` with recovery + call busy deny.

## Policy

- ADR-0013 amended: product-available under Origin matrix, `expectedRevision`, telephony-busy `conflict`, hide-only tray Show.
- `V1_PRODUCT_UNAVAILABLE_COMMANDS` emptied (stable export retained).
- Pairing still never grants `window.hide`; Settings matrix elevates like `account.activate`.

## Desktop

- `SdkWindowCommandHandler.hide`
- Product surface + route/dispatch visibility `false` event
- `ShellTelephonyBusyMirror` + IPC `shell:telephony-busy`
- `SdkHideTrayController` (Show restores via `bringBrowserWindowToFront`)
- Origin matrix includes `window.hide` (default off)

## SDK

- `client.window.hide({ expectedRevision })`
- Guides + SECURITY/PROTOCOL + api report updated

## Verification

- Focused vitest desktop + SDK + product hide path PASS
- `axatalk-sdk` `docs:check` / `api:check` PASS
- Desktop SemVer `0.15.0` + CHANGELOG + manifest sync
