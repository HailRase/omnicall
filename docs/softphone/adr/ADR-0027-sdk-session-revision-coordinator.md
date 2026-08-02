# ADR-0027: SDK session revision coordinator (single aggregate clock)

- Status: **Accepted** (WU-00…WU-07 **done / PASS**)
- Date: 2026-08-02
- Deciders: Softphone platform
- Related: ADR-0017 O-OWN-1; ADR-0021; F-011; track `omnicall-kit-integration/sdk-production-readiness/`

## Context

- **Features:** F-011 (corrective production-readiness)
- **Contexts:** Integration (primary); Telephony / Operator / Settings as command sinks
- **Layers:** Application integration boundary (owner); Adapters/main must not own a second public clock

Protocol v1 exposes one aggregate `revision` / `expectedRevision` (ADR-0017). Prior to WU-02,
code had **two clocks**: product `SdkSessionRevisionClock` (renderer Application) and
`SdkWindowCommandHandler.revision` (Electron main). Product replies returned post-`advance()`
revision; window replies returned pre-increment revision. WU-02 removes the main public
clock: window show/hide/get-state join `SdkSessionRevisionCoordinator` via broker; main keeps
native BrowserWindow only. WU-03 adds SDK latest-known revision tracker. Remaining track
items (dedup/pairing/docs) closed in WU-04…WU-06; WU-07 records closeout evidence.

## Decision

### 1. Authoritative owner

- One **`SdkSessionRevisionCoordinator`** lives at the **Application integration boundary**
  (same composition as `bindSdkBrokerSession` / product handlers).
- Owns: current aggregate revision; `expectedRevision` validation; serialization of
  revision-dependent mutations; post-success advancement; `stale_state` (+ optional
  `currentRevision`); monotonic semantics across concurrent CRM clients.
- Domain remains free of protocol revision clocks. Main remains transport/native window
  executor only — **not** an independent public revision owner.

### 2. Single public clock

- Do **not** preserve two hidden clocks behind one public `revision` field.
- Window show/hide/get-state share the **same** coordinator path as call / account / operator
  mutations (validate → execute → advance → reply with **new** revision).
- Reads (`sdk:get-snapshot`, `sdk:ping`, `window:get-state`) return `peek()` without advance.

### 3. Reply / client semantics

- Successful mutation replies always return the **post-success** aggregate revision
  (align window with product / ADR-0017 contract).
- SDK tracks **latest-known revision** from: snapshots, successful replies, and public events;
  `getRevision()` returns that tracker (not cache-only).
- Clients use latest-known (or explicit snapshot) as next `expectedRevision`.

### 4. Concurrency and dedup

- One aggregate serialization boundary for all revision-dependent mutations (including window).
- Per-call mutexes may remain as nested locks; they must not bypass aggregate ordering.
- Dedup key: **`Origin + clientId + requestId`** (TTL unchanged unless a later ADR revises it).
- Pending dedup entries expire/abandon on TTL, disconnect, and failed completion (no stuck slots).

### 5. Pairing identity migration

- Pairing persistence key migrates to **`Origin + clientId`** (find/save/revoke).
- Compatible load: read legacy `clientId`-only records; rewrite on next successful save;
  never merge two Origins under one secret.

### 6. Compatibility / SemVer

- Wire field names stay; semantics harden to the documented single-clock contract.
- Desktop ships coordinator first; CRM clients that already follow reply.revision remain valid.
- Clients that assumed window revision independence may see `stale_state` until they resync —
  documented as intended correction, not a silent dual-clock forever.
- npm: reconcile published/workspace versions; example deps use workspace protocol
  (`workspace:*` or matching workspace version) to prevent dual-package `instanceof` breaks.
- Licensing / publish gate remains fail-closed (SECURITY.md); SemVer PATCH for corrective
  SDK/docs alignment, MINOR only if additive public tracker/helpers ship as features.

### 7. Non-goals (this ADR)

- No transfer/conference SDK surface; no Domain telephony rewrite; no `window.Softphone`.
- No weakening of Origin/PoP/capability fail-closed rules.

## Rejected alternatives

| Alternative | Why not |
| --- | --- |
| Keep dual clocks + document separately | One public `revision` already claims aggregate; dual clocks violate ADR-0017 |
| Expose `windowRevision` + `productRevision` | Breaks v1 simplicity; multiplies CRM races |
| Domain owns revision | Protocol session aggregate ≠ Call Engine state |
| Main-only clock for all mutations | Product mutations execute in renderer Application |
| Client-only latest-revision heuristics | Server must remain authoritative for `stale_state` |
| Weaken sdk-09 / capability assertions | Hides dual-package and contract bugs |

### Window handshake (WU-02)

1. Gateway routes `window:*` to broker (same as call/account/operator).
2. Application handler acquires aggregate lock; hide validates `expectedRevision` →
   `stale_state` on mismatch; show uses `runSerializedMutation` (empty payload).
3. Short native IPC (`sdk:native-window`) executes BrowserWindow show/hide/get-state in main.
4. On success, advance once; `reply.revision` is post-success peek. get-state peeks only.
5. Lock is held only across the short native IPC (not UI modals). No second public clock.

## Consequences

- Remediation WUs: WU-00…WU-07 **done / PASS** —
  `omnicall-kit-integration/sdk-production-readiness/CLOSEOUT.md`.
- Gate evidence: unit + integration + desktop/kit preflight only. Agents must not run or
  require packaged Electron / Chromium / Edge smoke for F-011.
- Tests: concurrent multi-client mutations; window+call interleave; stale_state; dedup
  isolation; pairing Origin+clientId; SDK getRevision after reply/event; workspace single
  package resolution for examples; Origin upgrade fail-closed; IPC sender rejection.
- Feature Registry / STATUS: F-011 **`implemented`**; corrective track closed.

## Architecture checks

- UI → Application → Domain inward deps preserved
- No SIP/JsSIP/React/Zustand in Domain; no second Facade in main
- Commands still terminate in Facade / Use Cases / Call Engine with `callType: "sdk"`
