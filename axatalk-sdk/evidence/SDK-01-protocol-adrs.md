# SDK-01 Evidence — Protocol and Security ADRs

**Date:** 2026-07-20  
**Work unit:** SDK-01 — Protocol and security ADRs  
**Status:** `done` — `/sdk-review` PASS 2026-07-20  
**Prerequisites:** SDK-00 `done`; DI-00 `done` (ADR-0009…0013)

## Scope Restatement

Close all PROTOCOL.md O-* rows with shared desktop ADRs; browser feasibility spike only.
No AxatalkClient, no Zod install, no transport, no publish, no desktop `src/`, no DI-*
implementation, no SDK-02.

## Deliverables

| Item | Path |
| --- | --- |
| Schema SoT | `docs/softphone/adr/ADR-0014-sdk-runtime-schema-source-of-truth.md` |
| Discovery + browsers | `docs/softphone/adr/ADR-0015-sdk-discovery-and-browser-lna-policy.md` |
| PoP + profiles | `docs/softphone/adr/ADR-0016-sdk-pop-pairing-capability-profiles.md` |
| PII / ownership / OCP / deprecation | `docs/softphone/adr/ADR-0017-sdk-privacy-ownership-ocp-map-deprecation.md` |
| PROTOCOL closed table | `axatalk-sdk/docs/PROTOCOL.md` |
| Fixture format | `axatalk-sdk/docs/COMPATIBILITY-FIXTURES.md` |
| Browser spike | `axatalk-sdk/evidence/SDK-01-browser-spike.md` |
| ADR-0010/0011/0012 open tables | amended → closed pointers |
| P12 handoff / Registry / STATUS | updated planning refs only |

## O-* Closure Map

| ID | ADR |
| --- | --- |
| O-SCHEMA-1 | ADR-0014 |
| O-DISC-1, O-DISC-2, O-BRW-1, O-BRW-2 | ADR-0015 |
| O-POP-1, O-POP-2, O-CAP-1 | ADR-0016 |
| O-PII-1, O-OWN-1, O-CAMP-1, O-OCP-1 (+ deprecation window) | ADR-0017 |

## Explicit Non-Goals (verified)

- No changes under desktop `src/`
- No npm dependency install for Zod (deferred to SDK-02; noted in DEPENDENCIES.md)
- No `@axatalk/protocol` schemas or fixtures content files yet
- No DI-01…DI-10 code
- SDK-02 not started

## Verification

Commands run from `axatalk-sdk/`:

```bash
npm run preflight
```

Results recorded after execution in this file’s Verification Results section.

## Public API / Compatibility Impact

- Public npm API: **unchanged** (still placeholder packages).
- Protocol design: O-* closed; wire schemas still unimplementable until SDK-02.
- Security: PoP, discovery, LNA, PII, ownership, OCP map frozen for implementers.

## Desktop Integration Dependency

- DI-01 unblocked after SDK-01 `/sdk-review` PASS.
- DI-03 must use ADR-0015 paths; DI-04 must use ADR-0016; DI-05/06/07 follow ADR-0017.

## Remaining Risks

- Interactive LNA allow/deny not executed in a real browser this session (doc spike only) —
  must be proven in SDK-05 / DI-10.
- Zod gzipped size evidence deferred to SDK-02 install.
- Reviewer may request ownership/PoP wording tightening before `done`.

## Reviewer

`/sdk-review` **PASS** (2026-07-20).

- Blocker: none
- High: none
- Low: interactive LNA allow/deny not executed this unit (doc spike only → SDK-05/DI-10); Zod gzipped size deferred to SDK-02 install; ADR-0010 Related Links still mentions historical “Open Decisions” wording

## Verification Results

```text
cd axatalk-sdk && npm run preflight
→ SDK preflight PASS
  lint / typecheck / build / test (3) / test:types (2) / test:browser scaffold /
  api:check / package:check — all PASS
  No publish performed
```

Confirmed: no desktop `src/` changes in this unit; no Zod install; packages remain placeholders.
