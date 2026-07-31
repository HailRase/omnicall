# Browser & SDK↔Desktop Compatibility Matrix

Release gate matrix for SDK-10. **DI-10 full close 2026-07-27** — all cells below are
**PASS** for the desktop integration gate. F-011 is `implemented`; P12 is closed.
See `omnicall-kit-integration/evidence/DI-10-compatibility-e2e-p12-close.md`.

## Browser baseline (SDK track)

| Target | Status | Evidence |
| --- | --- | --- |
| Chromium / Edge (Chromium) | **PASS** (Playwright harness) | `OMNICALL_SDK_BROWSER=1 npm run test:browser` |
| Firefox | Not claimed | — |
| Safari | Not claimed | — |
| Web Crypto ECDSA P-256 | Required | PoP unit + browser tests |
| IndexedDB PoP store | Required (no Web Storage) | SDK-04…09 + `docs:check` |

## SDK package surface (frozen for RC)

| Check | Status | Count / note |
| --- | --- | --- |
| `api:check` `@softomnitel/omnicall-kit` | PASS | see `etc/api/sdk.api.md` + api-reference inventory |
| `api:check` `@softomnitel/omnicall-protocol` | PASS | see `etc/api/protocol.api.md` |
| Tarball fortress | PASS | no `fake-transport` / `auth-test-peer` / docs harness |
| `docs:check` | PASS | secret + privilege scans |

## SDK ↔ Desktop matrix

| Cell | Owner | Status |
| --- | --- | --- |
| Protocol fixture parity (unit / CI) | SDK-02…08 + DI fixtures | Covered in track tests |
| Pairing + Origin trust (live desktop) | DI-04…09; DI-11 (ADR-0018) | **PASS** — DI-04…11 `done`; DI-10 full close 2026-07-27 |
| Hostile Origin / revoked client | DI-10 | **PASS** — packaged + full close 2026-07-27 |
| Old SDK ↔ new desktop | DI-10 | **PASS** (full close 2026-07-27; first public RC exists) |
| New SDK ↔ old desktop | DI-10 | **PASS** (full close 2026-07-27; N/A prior gateway accepted) |
| Packaged Electron + browser E2E | DI-10 | **PASS** — full close 2026-07-27 |

## Honesty rule

DI-10 gate-day (2026-07-21) documented a handshake/security subset first; **2026-07-27 human
full close** accepted remaining product cells and closed F-011/P12. Do not reopen DI-10 OPEN
language in live status docs.
