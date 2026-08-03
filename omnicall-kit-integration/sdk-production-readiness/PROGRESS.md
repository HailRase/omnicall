# SDK Production-Readiness Progress

| WU | Title | Status | Evidence |
| --- | --- | --- | --- |
| WU-00 | Verified design and ADR | **done** — PASS WITH NOTES (2026-08-02) | ADR-0027; `00-VERIFIED-FINDINGS.md`; `11-ACCEPTANCE.md`; `10-WORK-UNITS.md` |
| WU-01 | Shared revision coordinator | **done** — PASS WITH NOTES (2026-08-02) | `SdkSessionRevisionCoordinator.ts` + handler wiring; unit tests |
| WU-02 | Window correction | **done** — PASS WITH NOTES (2026-08-02) | `ExternalSdkWindowHandler.ts`; native-only main handler; broker route; IPC; tests |
| WU-03 | SDK latest-known revision tracker | **done** — PASS WITH NOTES (2026-08-02) | `latest-known-revision.ts`; product-orchestrator + command observe; tests |
| WU-04 | Dedup Origin+clientId+requestId | **done** — PASS WITH NOTES (2026-08-02) | `sdkGatewayRequestDedup.ts`; registry abandon; tests |
| WU-05 | Pairing Origin+clientId migration | **done** — PASS WITH NOTES (2026-08-02) | `sdkGatewayPairingStore.ts` + secret ids; Settings revoke Origin; tests |
| WU-06 | Docs / SemVer / workspace / licensing | **done** — PASS WITH NOTES (2026-08-02) | example kit `0.1.4`; docs/SemVer/licensing; sdk-09 green |
| WU-07 | Closeout + review | **done** — **PASS** (2026-08-03) | `CLOSEOUT.md`; unit/integration + preflight only |

## WU-07 verification (2026-08-03)

- Desktop `npm run release:preflight`: **PASS** — 3110 passed / 1 skipped
- OmniCall Kit `npm run preflight`: **PASS**
- Focused remediation covered: revision coordinator, activation reservation/cancel, identity isolation, coherent snapshot, IPC sender auth (incl. negative), Origin upgrade fail-closed, SDK DX
- Agent policy: do **not** run or require packaged Electron / Chromium / Edge smoke for F-011 gates
- Historical DI-10 smoke scripts/reports are archival only

## Security remediation — Origin upgrade (2026-08-03)

- Root cause: upgrade admission accepted `unknown` Origin states for deferred TOFU
- Fix: only exact configured `allowed` HTTP(S) Origins upgrade; missing/malformed/denied/unconfigured reject before pairing
- Proven by unit/integration Origin tests + desktop preflight

## Next (human only)

Shipped per `CLOSEOUT.md`: Desktop **`1.3.1`**, kit **`0.2.0`**, protocol **`0.1.0`**.
Docs/ADR/SECURITY/READMEs aligned to fail-closed Origin upgrade (2026-08-03) — no
TOFU-on-upgrade restore without a new ADR.

No further remediation WU in this track.
