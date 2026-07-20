# Browser & SDK↔Desktop Compatibility Matrix

Release gate matrix for SDK-10. Cells that require packaged Electron or hostile Origin
evidence are **blocked on DI-10** until that desktop unit is `done`.

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
| `api:check` `@axatalk/sdk` | PASS | **47** symbols |
| `api:check` `@axatalk/protocol` | PASS | **169** symbols |
| Tarball fortress | PASS | no `fake-transport` / `auth-test-peer` / docs harness |
| `docs:check` | PASS | secret + privilege scans |

## SDK ↔ Desktop matrix

| Cell | Owner | Status |
| --- | --- | --- |
| Protocol fixture parity (unit / CI) | SDK-02…08 + DI fixtures | Covered in track tests — not a packaged E2E substitute |
| Pairing + Origin allowlist (live desktop) | DI-04…09 | Desktop units `done`; packaged browser claim → **DI-10** |
| Hostile Origin / revoked client | DI-10 | **blocked on DI-10** |
| Old SDK ↔ new desktop | DI-10 | **blocked on DI-10** |
| New SDK ↔ old desktop | DI-10 | **blocked on DI-10** |
| Packaged Electron + browser E2E | DI-10 | **blocked on DI-10** — see `axatalk-sdk-integration/evidence/DI-10-blocker-sdk-prereqs.md` |

## Honesty rule

Do **not** mark packaged Electron E2E or full hostile/compat matrix as PASS from the SDK
track alone. Mode A (RC staging) records Chromium baseline + package fortress only.
