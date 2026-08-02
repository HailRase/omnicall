# F-011 SDK Production-Readiness Work Units

- Purpose: execute corrective track in dependency order; one open WU per session.
- Inputs: `00-VERIFIED-FINDINGS.md`, ADR-0027, PROTOCOL/SECURITY, Feature Registry F-011.
- Outputs: coordinator, window join, SDK tracker, dedup/pairing migrations, docs/SemVer/licensing close.

## Dependency order

```txt
WU-00 (design/ADR)
  → WU-01 Shared revision coordinator
      → WU-02 Window correction
      → WU-03 SDK latest-known revision tracker
      → WU-04 Dedup Origin+clientId+requestId
      → WU-05 Pairing Origin+clientId migration
  → WU-06 Docs / SemVer / workspace / licensing (may start after WU-00 for docs-only;
           must not claim green sdk-09 until workspace dual-package fixed)
  → WU-01…WU-06 → WU-07 Closeout + review
```

Statuses: `pending` | `in progress` | `review` | `done` | `blocked`.

---

## WU-00 — Verified design and ADR

### Goal

Verify audit findings against current code; accept ADR-0027; publish remediation track + acceptance.

### Why

Production behavior must not change until ownership, migration, and rejected alternatives are locked.

### How

1. Verify findings 1–11 with file evidence (`00-VERIFIED-FINDINGS.md`).
2. Map F-011 + ADR-0017/0021 → ADR-0027.
3. Define Application integration coordinator as authoritative owner.
4. Define migration/compatibility + SemVer/licensing decisions.
5. Publish acceptance checklist (`11-ACCEPTANCE.md`).
6. Record rejected alternatives in ADR-0027.
7. Update Feature Registry / STATUS / P12 handoff / TASK-QUEUE for design-accepted corrective track.
8. Work-history + continuation prompt for WU-01.

### Boundaries

- No production behavior changes.
- Do not start WU-01 implementation.
- Do not weaken sdk-09 assertions.

### Evidence

- ADR-0027 Accepted (design)
- `00-VERIFIED-FINDINGS.md`, `11-ACCEPTANCE.md`, this file, `PROGRESS.md`
- Registry/STATUS/handoff/TASK-QUEUE pointers
- sdk-09 failure root-cause note (dual-package 0.1.0 vs 0.1.4)

### Done when

- [x] Findings verified
- [x] ADR-0027 written
- [x] Track + acceptance published
- [x] Registry/STATUS/handoff updated (design / in progress — not implemented)
- [x] Work-history + WU-01 continuation prompt

### Continue hint

Implement WU-01 from this file (Shared revision coordinator).

---

## WU-01 — Shared revision coordinator

### Goal

Introduce Application-owned `SdkSessionRevisionCoordinator` as the sole public aggregate revision authority for call/account/operator (window join is WU-02).

### Why

ADR-0017/`expectedRevision` require one monotonic aggregate; handlers share a clock today but lack a single serialization + stale_state ownership façade.

### How

1. Add coordinator at Application integration boundary (wrap peek/validate/advance/stale + aggregate mutex).
2. Route ExternalSdk call/account/operator mutation paths through coordinator.
3. Preserve post-success reply.revision semantics for product mutations.
4. Tests: stale_state, monotonic advance, multi-client serialize, no Domain imports of protocol clock.

### Boundaries

- No window clock merge yet (WU-02).
- No SDK client tracker (WU-03).
- No dedup/pairing key changes.

### Evidence

- Unit tests on coordinator + handler wiring
- Feature Registry note for WU-01
- work-history entry

### Done when

- [x] Coordinator owns product mutation revision validate/advance/serialize
- [x] Acceptance §A product items green (window items deferred to WU-02)
- [x] Independent review — **PASS WITH NOTES** (2026-08-02)

### Continue hint

Implement WU-02 (Window correction onto shared coordinator).

---

## WU-02 — Window correction

### Goal

Eliminate main-only window revision clock; window ops share coordinator path; post-success reply.revision.

### Why

Dual clocks behind one public `revision` break CRM chains and contradict ADR-0017/ADR-0027.

### How

1. Route window mutation revision validate/advance through Application coordinator (broker), keeping native show/hide in main.
2. Remove or demote `SdkWindowCommandHandler` private revision as public authority.
3. Align success reply to post-success revision.
4. Tests: window+call interleave; hide expectedRevision; get-state peek-only.
5. Handshake: short critical section under aggregate lock (validate → native IPC → advance); no lock across UI modals; no second public clock.

### Boundaries

- No SDK tracker yet; no dedup/pairing migrations.

### Done when

- [x] Acceptance §B green
- [x] No second public clock remains
- [x] Independent review — **PASS WITH NOTES** (2026-08-02)

### Continue hint

Implement WU-03 (SDK latest-known revision tracker).

---

## WU-03 — SDK latest-known revision tracker

### Goal

Browser SDK maintains latest-known revision from snapshots, successful replies, and events; `getRevision()` reads it.

### Why

Cache-only revision forces fragile CRM `expectedRevision` bookkeeping and ignores reply/event clocks.

### How

1. Add internal tracker in product orchestrator (clear on invalidate).
2. Update on snapshot, ok replies with revision, public events with revision (monotonic max).
3. Document public DX; api report if surface changes.
4. Tests with fake peer/time.

### Boundaries

- No desktop dedup/pairing changes.

### Done when

- [x] Acceptance §C green
- [x] Independent review — **PASS WITH NOTES** (2026-08-02)

### Continue hint

Implement WU-04 (Dedup isolation).

---

## WU-04 — Dedup Origin+clientId+requestId

### Goal

Isolate idempotency cache per Origin+clientId+requestId; fix pending abandon/expire.

### Why

Global requestId dedup enables cross-client replay coupling; stuck pending blocks execute forever.

### How

1. Change `SdkRequestDedupCache` keying / registry wiring.
2. Call `abandon` on disconnect/failure; prune pending by TTL.
3. Multi-client tests prove isolation + abandon.

### Boundaries

- Pairing key migration is WU-05.

### Done when

- [x] Acceptance §D green
- [x] Independent review — **PASS WITH NOTES** (2026-08-02)

### Continue hint

Implement WU-05 (Pairing Origin+clientId).

---

## WU-05 — Pairing Origin+clientId migration

### Goal

Persist pairing secrets under Origin+clientId with legacy clientId-only read migration.

### Why

clientId-only storage can overwrite across Origins; ADR-0011 principals are Origin-scoped.

### How

1. Change store secret id / index to Origin+clientId.
2. Migrate legacy blobs on touch; never cross-Origin merge.
3. Settings list/revoke paths updated; tests for isolation + migration.

### Boundaries

- No weakening of PoP/Origin matrix.

### Done when

- [x] Acceptance §E green
- [x] Independent review PASS WITH NOTES (`/sdk-review`, 2026-08-02)

### Continue hint

Implement WU-06 (Docs / SemVer / workspace / licensing).

---

## WU-06 — Docs, SemVer, workspace, licensing

### Goal

Reconcile version docs; fix example workspace dual-package; keep licensing gate fail-closed; record SemVer strategy.

### Why

0.1.0 vs 0.1.4 drift breaks sdk-09 via dual `instanceof` and misleads integrators.

### How

1. Align RELEASE-PLAYBOOK, STATUS, guides, README with workspace truth + publish state.
2. Example dep → `workspace:*` (or matching workspace version); remove nested divergent copy.
3. Prove sdk-09 smoke green **without** assertion weakening.
4. Document licensing/publish gate + SemVer PATCH/MINOR rules for this track.

### Boundaries

- No silent npm publish; no security gate bypass.

### Done when

- [x] Acceptance §F green
- [x] Independent review — **PASS WITH NOTES** (2026-08-02)

### Continue hint

Implement WU-07 (Closeout).

---

## WU-07 — Closeout and independent review

### Goal

Registry/STATUS/handoff reflect completed corrective scope; review PASS.

### Why

F-011 must not claim unfinished production-readiness as already done.

### How

1. Sync Feature Registry, STATUS, P12 handoff, TASK-QUEUE.
2. Run focused unit/integration tests + desktop `release:preflight` + kit `preflight`.
3. Do **not** run or require packaged Electron / Chromium / Edge smoke for this gate.
4. Produce `CLOSEOUT.md` + sync acceptance/progress.

### Done when

- [x] Acceptance §G green (unit + integration + preflight)
- [x] Focused verification + kit preflight + desktop `release:preflight` recorded
- [x] WU-07 **PASS** (2026-08-03)

### Continue hint

Gate state: **done / PASS**. Next work is human-only SemVer/license/publish — see `AGENT-CONTINUATION.md`.