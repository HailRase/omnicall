# RAT Step 07b — External Blind Transfer Refer-To (BACKLOG)

> **Status: BACKLOG** (2026-06-25). Paused by product decision. Resume via `TRANSFER-REAL-ADAPTER-BACKLOG.md`.
> **Sub-slice of step 07.** legacy operator platform deferred (ADR-0005).

## Agent mode

`refactor-research-debug-implement` — **no hasty fixes, no UI-only workarounds.**

Protocol: **Analysis → Web/GitHub research → ADR/plan → minimal adapter slice → tests → manual smoke matrix → PROGRESS/work-history.**

---

## Onboarding (read before code)

1. `docs/softphone/real-integration/MASTER-AGENT-PROMPT.md`
2. `docs/softphone/ADR-0005` (legacy operator platform out of scope)
3. `docs/softphone/adr/ADR-0003-sbc-refer-semantics.md` — **will need amend**
4. `docs/softphone/real-integration/PROGRESS.md` — step 07 status
5. `docs/softphone/real-integration/JSSIP-FORK.md`
6. `.cursor/skills/telephony-flow-review/SKILL.md`
7. `.cursor/skills/feature-slice-design/SKILL.md`
8. `.cursor/skills/integration-contract-review/SKILL.md`
9. `.cursor/skills/legacy-feature-migration/SKILL.md`

### Rules (mandatory)

- `.cursor/rules/architecture.mdc`
- `.cursor/rules/typescript-react-electron.mdc`
- `.cursor/rules/testing-observability.mdc`
- `.cursor/rules/legacy-feature-coverage.mdc`
- `.cursor/rules/feature-registry.mdc`
- `.cursor/rules/legacy operator-deferred.mdc`

---

## Context

- **Branch:** `feature/real-adapters`
- **Baseline:** 585 passed, 1 skipped (canonical per PROGRESS after 07a recovery)
- **RAT:** step 07 core REFER landed; step 07a projection + NOTIFY classification landed
- **Dev SBC:** `onedemoserver.online:5063`, domain `dev-qms.onedemoserver.online`
- **Features:** F-006 Blind Transfer; **Legacy:** LF-028

### Manual smoke matrix (user, 2026-06-24) — **primary evidence**

| # | Call leg | Transfer target | Result |
| --- | --- | --- | --- |
| A | Incoming, external client | Internal operator ext | **PASS** |
| B | Incoming, internal operator | External client number | **FAIL** |
| C | Outgoing to operator | External client number | **FAIL** |
| D | Outgoing to client | Internal operator ext | **PASS** |

**Pattern (hypothesis):** blind REFER succeeds for **on-net / extension** targets, fails for **off-net / external (PSTN/E.164)** targets — **independent of call direction**.

Not a generic «transfer broken» issue. Likely **Refer-To URI construction** or **SBC dialplan for REFER vs INVITE** mismatch.

### Current implementation (suspect)

```txt
blindTransfer → buildOutgoingSipTarget(target, account)
              → sip:{normalized}@{account.domain}
              → session.refer(target)
```

Same builder for `makeCall` and `blindTransfer` (`buildOutgoingSipTarget.ts`).

If outbound `makeCall` to external client works but REFER to same number fails, **INVITE Request-URI ≠ REFER Refer-To semantics** on this SBC.

---

## Phase 0 — Research & debug (BLOCK implementation until complete)

### 0.1 SIP trace capture (mandatory)

For **one PASS** (scenario A or D) and **one FAIL** (scenario B or C), capture from DevTools WS or JsSIP debug:

| Message | Fields to record |
| --- | --- |
| Working outbound `makeCall` to external (if used) | Request-URI, To, From |
| Failing `REFER` | `Refer-To`, `Referred-By`, full REFER |
| NOTIFY bodies | sipfrag status lines (100/180/487/…) |
| Working `REFER` to internal ext | `Refer-To` for comparison |

Enable: `localStorage.debug = "JsSIP:*"` in renderer.

### 0.2 Web / GitHub research (document findings in step notes)

Search topics (minimum):

- `SIP REFER blind transfer external number Refer-To tel vs sip`
- `Asterisk/FreeSWITCH REFER off-net PSTN Refer-To format`
- `JsSIP refer external number` / `versatica/JsSIP` issues (#817 Replaces — attended only, but read)
- RFC 3515 Refer-To for non-dialog targets
- Cisco «REFER transfer external number» NOTIFY 487

**Deliverable:** short «Research notes» section in this file or ADR amend — 5–10 bullets with links.

### 0.3 Legacy parity check

- Audit docs: `LF-028`, `onReferHandler`, legacy `ControlPanel` — how was external transfer target formatted?
- If legacy repo unavailable: document «unknown» and rely on SIP trace diff.

### 0.4 Hypothesis table (fill before coding)

| Hypothesis | How to confirm | If true, fix direction |
| --- | --- | --- |
| H1: External needs `tel:+E164` Refer-To, not `sip:...@domain` | Compare legacy/trace Refer-To | New `buildBlindReferTarget()` adapter helper |
| H2: External needs national digits without `+` | Trace INVITE vs REFER | Normalize transfer target separately from dial |
| H3: External needs outbound prefix (e.g. `9`) on REFER only | SBC admin / trace | Settings or adapter prefix port (ADR if config) |
| H4: Domain must be gateway host, not `account.domain` | Trace working external INVITE host | Separate refer host resolver |
| H5: SBC rejects REFER when source leg is inbound vs outbound | Same external target from outbound client call | Document SBC policy; may be not fixable client-side |
| H6: NOTIFY 487 = target timeout (user didn't answer) not URI bug | Target answers within ring time | UX only; not URI fix |

| ID | Status (2026-06-24) | Action |
| --- | --- | --- |
| H1 | **Implemented** | `buildBlindReferTarget` → `tel:` for off-net |
| H2 | Open | `tel:` without forced `+` for national ≥10 digits |
| H3 | Ruled out | No prefix without evidence |
| H4 | Open | Fallback if manual smoke B/C still fail |
| H5 | Ruled out | Smoke shows direction-independent failure |
| H6 | Unchanged | 487 not success per ADR-0003 |

**Gate:** Implementation proceeded without trace — manual smoke B/C required to close 07b gate.

---

## Phase 1 — Design (ADR amend + plan)

### 1.1 ADR-0003 amend (required)

Add section **«External Refer-To on onedemoserver.online»**:

- Decision: URI scheme/format for internal vs external blind transfer targets
- Evidence: trace snippets (redact PII)
- INVITE vs REFER divergence documented explicitly
- Success/failure NOTIFY expectations for external

If port/settings needed (prefix, trunk domain): ADR + minimal `SipAccount` or settings extension — **no silent env hacks**.

### 1.2 Target builder split (preferred architecture)

```txt
buildOutgoingSipTarget()     — keep for makeCall / consultation (unchanged unless trace proves shared fix)
buildBlindReferTarget()      — NEW adapter-only; inputs: PhoneNumber, SipAccount, optional leg context
```

**Do not** leak JsSIP types through `TelephonyGateway`.

Optional `ReferTargetKind: "on_net" | "off_net"` via heuristic (extension length, E.164, domain rules) — document in ADR.

### 1.3 Out of scope (unless trace proves otherwise)

- legacy operator platform transfer sync
- Attended transfer Replaces (#817) unless same root cause
- hold-before-refer unless SBC trace requires
- Changing Domain FSM / Use Cases beyond event payload if avoidable

---

## Phase 2 — Implementation

### Deliverables

1. **`buildBlindReferTarget.ts`** (or extend builder with explicit `purpose: "invite" | "refer"` — justify in ADR)
2. **`JsSipTelephonyAdapter.blindTransfer`** — use refer-specific target; log `referTarget` + `referTargetKind` (no secrets)
3. **Unit tests** — matrix: internal ext, E.164, national, `sip:` passthrough
4. **Adapter regression** — internal transfer mock tests still green
5. **ADR-0003** updated with external semantics
6. **PROGRESS.md** — step 07b notes + smoke matrix PASS/FAIL
7. **SMOKE-CHECKLIST.md** — R6 rows: internal + external blind transfer
8. **Feature Registry** — F-006 real-track note (external blind transfer)
9. **`work-history/YYYY-MM-DD/rat-step-07b_*.md`**

### Boundaries

- Mock remains default; `npm run test && npm run lint && npm run typecheck` green
- No `any`, no `@deprecated`, no Domain imports of JsSIP
- Gateway still confirms on NOTIFY `accepted` before success (ADR-0003)
- No AccountBootstrapFacade business logic bloat

### Tests (minimum)

- `buildBlindReferTarget.test.ts` — internal vs external cases per ADR
- `JsSipTelephonyAdapter.test.ts` — blind transfer asserts Refer-To string for external input
- `multiLineCallProjection` / blind transfer regression unchanged
- Mock P05 transfer tests unchanged

---

## Phase 3 — Manual smoke (gate)

Re-run full user matrix on dev SBC with `?adapters=real`:

| ID | Scenario | Expected |
| --- | --- | --- |
| A | In client → transfer internal op | PASS (regression) |
| B | In operator → transfer external client | **PASS** (primary fix) |
| C | Out operator → transfer external client | **PASS** |
| D | Out client → transfer internal op | PASS (regression) |

Record NOTIFY codes and Refer-To in PROGRESS.

**Step 07 gate:** mark `done` only when A–D pass OR external failure documented as SBC policy with ADR «won't fix client-side».

---

## Verification commands

```bash
npm run test
npm run lint
npm run typecheck
npm run dev   # ?adapters=real
```

---

## Anti-patterns (reject)

- Reusing `buildOutgoingSipTarget` without trace proof
- Treating all NOTIFY 487 as success
- UI-only disable of external transfer without ADR
- Hardcoding one user's phone number in adapter
- Skipping ADR amend
- Scope creep into legacy operator platform / multi-call hold-all (separate backlog item in step-07 file)

---

## Stop gate

Stop after step 07b gate. Do not start headset, DTMF real, or step 08.

If Phase 0 shows SBC cannot REFER off-net from WebRTC agents — write ADR «limitation», update Feature Registry acceptance, surface user-visible reason — **do not fake success**.
