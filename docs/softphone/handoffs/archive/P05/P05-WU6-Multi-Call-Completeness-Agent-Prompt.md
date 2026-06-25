# AGENT PROMPT: P05 WU6 — Multi-Call Completeness (SIP-only)

> **Read first:** `docs/softphone/P05-Multi-Call-Product-Decisions.md` (canonical product law).  
> **Deferred:** `docs/softphone/MULTI-CALL-BACKLOG.md` (Tone FSM, transfer-mode refactor).  
> **OCP:** DEFERRED — SIP-only path only.

## Mission

Complete contact-center multi-session behavior on **mock + application + domain**; then hand off **RAT step 08** for real JsSIP smoke. **Never drop calls** on policy failure.

## Onboarding (mandatory)

### Skills

- `.cursor/skills/feature-slice-design/SKILL.md`
- `.cursor/skills/telephony-flow-review/SKILL.md`
- `.cursor/skills/legacy-feature-migration/SKILL.md`
- `.cursor/skills/ux-ui-flow-design/SKILL.md`
- `.cursor/skills/softphone-architecture-review/SKILL.md` (before gate)

### Rules

- `.cursor/rules/00-core.mdc`
- `.cursor/rules/typescript-react-electron.mdc`
- `.cursor/rules/testing-observability.mdc`
- `.cursor/rules/legacy-feature-coverage.mdc`
- `.cursor/rules/feature-registry.mdc`
- `.cursor/rules/ux-ui-electron-react.mdc`
- `.cursor/rules/00-core.mdc` (includes OCP deferred + transfer backlog)

### Docs

- `docs/softphone/P05-Multi-Call-Product-Decisions.md` — **law**
- `docs/softphone/P05-Multi-Call-Policy-UX-Design.md` — WU6 UX
- `docs/softphone/UI-Architecture.md` — shells/hooks pattern
- `docs/softphone/handoffs/archive/P05/P05-WU1-Multi-Call-Policy-Handoff.md` — WU1 baseline
- `docs/softphone/Feature-Registry.md` — F-002, F-003, F-004
- `docs/softphone/Legacy-Feature-Coverage.md` — LF-021, LF-023, LF-032
- `docs/softphone/real-integration/step-08-multi-call-real.md` — after WU6 mock gate

### Reference code

- `src/domain/telephony/MultiCallPolicy.ts`
- `src/application/services/MultiCallPolicyService.ts`
- `src/application/services/OutgoingCallOrchestrator.ts`
- `src/application/services/IncomingCallOrchestrator.ts` — **gap: no hold-all on answer**
- `src/application/services/telephonyCallControlOperations.ts` — exclusive resume
- `src/application/projections/multiCallProjection.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/renderer/shells/` + `UI-Architecture.md`

## Context

- **Phase:** P05 **WU6** (multi-call completeness)
- **Legacy:** LF-021, LF-023, LF-032
- **Baseline tests:** 619 passed, 1 skipped
- **WU1 done:** hold-all outgoing, exclusive resume, second-session block (partial A3)

## Work units (execute in order; stop after each gate)

### WU6-1 — Domain events + fail-safe

| Deliverable | Path |
| --- | --- |
| Event | `MultiCallOperationRejected` in `src/domain/telephony/events/` |
| Optional | extend `AllOtherCallsHeld` payload for rollback metadata |
| Projection | `multiCallProjection.lastPolicyViolation` + reducer |
| Tests | event factory + projection |

**Gate:** publish on policy reject; no hangup side effects.

### WU6-2 — Hold-all on incoming answer (B0)

- `IncomingCallOrchestrator.answerCall`: after `checkSecondSessionBlocked`, call `holdAllBeforeOutgoing` equivalent (`trigger: before_incoming_answer`) or shared `holdAllActiveLines()`.
- Symmetry with `OutgoingCallOrchestrator.makeCall`.
- Integration test: active call A + answer incoming B → A held, B active.

### WU6-3 — Connecting guard (A1)

- Block dial, answer, resume while `hasConnectingCall` (projection + orchestrator).
- `SecondSessionBlocked` or `MultiCallOperationRejected` with `scenario: connecting_in_progress`.
- UI: disabled reasons on dialpad + incoming answer.

### WU6-4 — multiSessions OFF auto-486 (A3)

- When `multiSessionsEnabled=false` and established call exists, second incoming → **auto-reject 486** via gateway (existing DND/reject path pattern).
- Do not only disable Answer button.
- Test: active + second incoming → 486 sent, no modal answer.

### WU6-5 — Hold-all rollback (B1)

- `MultiCallPolicyService.holdAllBeforeOutgoing` (rename/generalize if needed): on mid-batch hold failure, compensating unhold for `heldCallIds` in batch.
- Emit `AllOtherCallsHeld` `phase: failed`; `MultiCallOperationRejected` if rollback partial.
- **No hangup** on failure.

### WU6-6 — Auto-answer block (F1)

- `AutoAnswerIncomingCallUseCase` / orchestrator: skip auto-answer if established/active conflict.
- Log + optional `MultiCallOperationRejected` scenario `auto_answer_blocked`.

### WU6-7 — Per-session UI shell (C3, D1)

- `CallLinesShell` + `CallLineCard` (presentational): list sessions from `multiLineCallProjection` or new `callLinesProjection` fed by tracker events.
- Per line: state, hold/mute indicators, resume/hangup callbacks (facade).
- Follow `UI-Architecture.md`: shell + `useCallLinesShell` + `useCallLinesActions`.
- **No** transfer mode refactor (E backlog).

### WU6-8 — Media / tone interim (C1, C2)

- Ensure remote audio attach only for single Active unheld (audit `remoteAudioAttach`).
- On hold-all / exclusive resume: stop ringback on other lines via `MediaGateway.stopTone`.
- Full Tone FSM → `MULTI-CALL-BACKLOG.md` (do not implement arbiter in WU6).

### WU6-9 — Tests + docs gate

- Extend `CallEngine.multiCallPolicy.test.ts` matrix per Product Decisions table.
- `MultiCallCompleteness.integration.test.ts`
- Update `Feature-Registry.md`, `Legacy-Feature-Coverage.md`, `P05-Multi-Call-Policy-UX-Design.md`
- Handoff: `handoffs/archive/P05/P05-WU6-Multi-Call-Completeness-Handoff.md`
- `work-history/YYYY-MM-DD/p05-wu6-multi-call_*.md`

**Stop WU6.** Do not start RAT step 08 in same session unless user asks.

## Architecture boundaries

- Policy in Domain (`MultiCallPolicy.ts`) + `MultiCallPolicyService`; not in React.
- UI: projections only; `MultiCallOperationRejected` → banner.
- Use Cases / CallEngine entry points unchanged for UI.
- JsSIP only in adapters (RAT step 08).

## Anti-patterns (reject)

- Hangup on policy failure
- UI guesses active line without projection
- Implement Tone FSM or transfer-per-session mode in WU6
- OCP coupling
- `any`, `@deprecated`, `@ts-ignore`

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

## After WU6 gate — advise user

1. Manual mock smoke: 2-call hold-all outgoing + incoming answer + exclusive resume + D1 hangup active.
2. Run `@real-integration-agent` for **RAT step 08** prompt.
3. Transfer backlog / Tone FSM only when user resumes `MULTI-CALL-BACKLOG.md`.

## Agent self-check before handoff

- [ ] Every row in Product Decisions **Implementation gaps** addressed or explicitly deferred with doc link
- [ ] No call dropped on policy test failures
- [ ] Feature Registry + Legacy evidence updated
- [ ] Architecture boundaries verified
