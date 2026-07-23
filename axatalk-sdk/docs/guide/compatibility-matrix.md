# Browser & SDK↔Desktop Compatibility Matrix

Release gate matrix for SDK-10. Packaged handshake/hostile subset is documented under DI-10
(`PARTIAL`); remaining product cells (pair/revoke/call/SIP) stay **OPEN** until real evidence
or a human-named waiver. Do not treat DI-10 WU `done` as F-011/`implemented`.

## Browser baseline (SDK track)

| Target | Status | Evidence |
| --- | --- | --- |
| Chromium / Edge (Chromium) | **PASS** (Playwright harness) | `AXATALK_SDK_BROWSER=1 npm run test:browser` |
| Firefox | Not claimed | — |
| Safari | Not claimed | — |
| Web Crypto ECDSA P-256 | Required | PoP unit + browser tests |
| IndexedDB PoP store | Required (no Web Storage) | SDK-04…09 + `docs:check` |

## SDK package surface (frozen for RC)

| Check | Status | Count / note |
| --- | --- | --- |
| `api:check` `@axata/axatalk-sdk` | PASS | **54** symbols |
| `api:check` `@axata/axatalk-protocol` | PASS | see `etc/api/protocol.api.md` |
| Tarball fortress | PASS | no `fake-transport` / `auth-test-peer` / docs harness |
| `docs:check` | PASS | secret + privilege scans |

## SDK ↔ Desktop matrix

| Cell | Owner | Status |
| --- | --- | --- |
| Protocol fixture parity (unit / CI) | SDK-02…08 + DI fixtures | Covered in track tests — not a packaged E2E substitute |
| Pairing + Origin trust (live desktop) | DI-04…09; DI-11 (ADR-0018) | DI-04…11 `done` (DI-11 `/sdk-review` PASS — TOFU/blacklist/matrix/boot-hydrate); Settings pair path still OPEN in DI-10 |
| Hostile Origin / revoked client | DI-10 | Hostile Origin **PASS** (packaged); live UI revoke **OPEN** — `DI-10-compatibility-e2e-p12-close.md` |
| Old SDK ↔ new desktop | DI-10 | **OPEN** — no prior published `@axata/axatalk-sdk` |
| New SDK ↔ old desktop | DI-10 | **OPEN** — prior desktops lack DI gateway surface |
| Packaged Electron + browser E2E | DI-10 | **PARTIAL PASS** — handshake/hostile/incompat on `0.11.2` + Edge; pair/call/SIP OPEN |

## Honesty rule

Do **not** mark full packaged product E2E or F-011 `implemented` from handshake-only cells.
DI-10 `done` documents partial packaged proof; P12 close still requires remaining OPEN cells.
