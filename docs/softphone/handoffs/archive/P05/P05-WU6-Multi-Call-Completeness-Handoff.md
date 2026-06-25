# P05 WU6 Multi-Call Completeness Handoff

- Scope: SIP-only mock gate; legacy `LF-021`, `LF-023`, `LF-032`.
- Canonical law: `docs/softphone/P05-Multi-Call-Product-Decisions.md`
- Out of scope WU6: RAT step 08, Tone FSM, transfer-per-session refactor (`MULTI-CALL-BACKLOG.md`).

## Delivered (WU6)

- Domain: `MultiCallOperationRejected` (`src/domain/telephony/events/MultiCallOperationRejected.ts`); `HoldAllTrigger` extended with `before_incoming_answer`
- Application: `MultiCallPolicyService` — `holdAllActiveLines`, compensating rollback, `checkConflictingOperationBlocked`, auto-answer block; orchestrators updated
- Projection: `multiCallProjection.lastPolicyViolation`; `deriveCallLinesShell`; per-line `muted` on `multiLineCallProjection`
- UI: `CallLinesShell`, `CallLineCard`, `useCallLinesShell`, `useCallLinesActions`; policy banner `multi-call-policy-error`
- Media interim: exclusive mock remote audio attach; `stopTonesOnOtherLines` / hold-batch tone stop
- Tests: `MultiCallCompleteness.integration.test.ts`, `MultiCallPolicyService.test.ts`, extended `CallEngine.multiCallPolicy.test.ts`, `multiCallProjection.test.ts`
- Verification: `636 passed`, `1 skipped`; lint + typecheck green

## Migration Evidence

### LF-021 — Hold-all symmetry (incoming answer)

- Application: `IncomingCallOrchestrator.answerCall` → `holdAllActiveLines(..., "before_incoming_answer")`
- Tests: `CallEngine.multiCallPolicy.test.ts`, `MultiCallCompleteness.integration.test.ts`

### LF-023 — Exclusive resume + UI

- Application: `enforceExclusiveHoldBeforeResume` (unchanged path) + connecting/hold-all guards on resume
- UI: `deriveResumeMultiCallDisabledReason`, per-line resume in `CallLinesShell`
- Tests: `CallEngine.multiCallPolicy.test.ts` (LF-023)

### LF-032 — Second session + auto-486

- Application: `handleIncomingReceived` auto-reject 486 when `multiSessionsEnabled=false` and established call exists
- Event: `CallRejectedByDnd` (sip 486)
- Tests: `CallEngine.multiCallPolicy.test.ts`, `MultiCallCompleteness.integration.test.ts`

### Fail-safe (product G2 / unhandled conflicts)

- Event: `MultiCallOperationRejected` with `scenario`, `reason`, `affectedCallIds`
- Projection: `lastPolicyViolation` → `multi-call-policy-error` banner
- **No hangup** on policy failure (hold-all rollback uses compensating unhold only)

## Manual Mock Smoke (post-gate)

1. Two-call hold-all outgoing (A active → dial B → A held, B active).
2. Incoming answer with A active → A held, B active.
3. Exclusive resume on held line → other active auto-held.
4. Hangup active line with held line remaining → no auto-resume (D1).
5. `multiSessionsEnabled=false` + active call → second incoming auto-486.

## Next: RAT Step 08

- Run `@real-integration-agent` for **RAT step 08** continuation prompt (`docs/softphone/real-integration/step-08-multi-call-real.md`).
- Do not start JsSIP multi-call smoke in the same session as WU6 mock gate.

## Deferred

- Tone priority FSM (A2) — `MULTI-CALL-BACKLOG.md`
- Transfer per-session mode (E2/E3) — `MULTI-CALL-BACKLOG.md`
- SBC diagnostics UI (G2) — P09
