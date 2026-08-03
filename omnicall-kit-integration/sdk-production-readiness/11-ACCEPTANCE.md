# Acceptance Criteria — SDK Production-Readiness

- Purpose: observable gates for WU-01…WU-07 (design locked in WU-00 / ADR-0027).
- Inputs: verified findings, ADR-0027, PROTOCOL/SECURITY contracts.
- Outputs: checklist per theme; verification = unit + integration + preflight only.

## A. Shared revision coordinator — product (WU-01)

- [x] One Application-owned coordinator is the sole public aggregate revision source for **call / account / operator**
- [x] `expectedRevision !== peek()` → `stale_state` + current revision; no side effect
- [x] Successful mutation → advance once → reply.revision === new peek
- [x] Concurrent CRM clients serialize revision-dependent product mutations without dual product clocks
- [ ] ~~Window show/hide join~~ → moved to §B (WU-02)

## B. Window correction (WU-02)

- [x] Window show/hide join the same Application coordinator (no main-only public clock)
- [x] Window revision mismatch returns `stale_state` (not `conflict`) + current revision
- [x] Window success replies use **post-success** revision (same as call/account/operator)
- [x] Interleaved `window:*` + `call:*` + `account:*` share one monotonic sequence
- [x] `window:get-state` / reads do not advance revision

## C. SDK latest-known revision (WU-03)

- [x] Successful replies update latest-known revision
- [x] Public events with revision update latest-known when greater
- [x] Snapshots update latest-known
- [x] `getRevision()` returns latest-known (undefined only before first observation)
- [x] Reconnect/revoke/disconnect clears tracker with snapshot cache

## D. Dedup isolation (WU-04)

- [x] Dedup key = Origin + clientId + requestId
- [x] Client A cannot replay/steal Client B cached reply via shared requestId
- [x] Pending entries expire by TTL; abandon on disconnect / failed completion
- [x] Duplicate within TTL returns cached reply without second side effect

## E. Pairing Origin+clientId (WU-05)

- [x] Persist/load/revoke keyed by Origin + clientId
- [x] Legacy clientId-only records migrate on touch without cross-Origin merge
- [x] Same clientId on two Origins cannot share one secret blob

## F. Docs / SemVer / workspace / licensing (WU-06)

- [x] RELEASE-PLAYBOOK, STATUS, guides, README agree on current kit/protocol versions
- [x] Example package depends on workspace kit (no nested divergent copy)
- [x] sdk-09 forbidden-originate smoke **passes without weakened assertions**
- [x] Licensing/publish gate documented and fail-closed until review evidence exists
- [x] SemVer strategy recorded for corrective vs additive SDK releases

## G. Closeout (WU-07)

### Current status

- [x] F-011 / T-054 / WU-07 **PASS** (unit + integration + preflight)
- [x] Correctness, sender-security, cancellation, Origin upgrade, SDK DX verified
- [x] Desktop `release:preflight` **3110 passed / 1 skipped**; kit `preflight` PASS

### Remaining (human publish only)

- [x] Human license approval + `RELEASE_LICENSE_REVIEWED=1` (authorized cut per `CLOSEOUT.md`)
- [x] Human npm publish authorization + SemVer bump cut — Desktop **`1.3.1`**, kit **`0.2.0`**

### Agent policy

- Do not run or require packaged Electron / Chromium / Edge smoke for this track.
- Gate evidence = focused unit/integration tests + desktop/kit preflight only.

## Pending test policy

- Prefer design docs + this checklist during WU-00.
- If a failing test is added before production code: name it `*.pending-wu0N.test.ts`,
  `describe.skip` or explicit `it.fails` with comment `pending WU-0N — ADR-0027`.
- Never weaken sdk-09 capability/forbidden assertions to greenwash dual-package bugs.
