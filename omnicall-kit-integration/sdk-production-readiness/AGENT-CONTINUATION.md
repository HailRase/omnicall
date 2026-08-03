# Continuation — after WU-07 closeout

## Current

- F-011 / T-054 / WU-07 are **done / PASS**.
- Desktop **`1.3.1`** + `@softomnitel/omnicall-kit@0.2.1` (docs/admission sync PATCH).
- Protocol remains **`0.1.0`** (no wire bump).
- Agents must **not** run or require packaged Electron / Chromium / Edge smoke for F-011.

## Integrator note

Pin `@softomnitel/omnicall-kit@0.2.1` and OmniCall Desktop ≥ `1.3.1`. See npm README
migration section. Before `connect()`, add the exact CRM Origin to Settings → OmniCall
Kit → Trusted sites (or seed `OMNICALL_SDK_ALLOWED_ORIGINS`). Unknown Origins are
rejected at WebSocket upgrade (`origin_blocked`) — TOFU-on-upgrade is not product
behavior (ADR-0018 amended 2026-08-03).
