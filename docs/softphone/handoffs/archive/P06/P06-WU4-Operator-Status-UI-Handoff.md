# P06 WU4 Operator Status UI Handoff

- Scope: Status selector, timer, break reason picker, logout reason modal; legacy `LF-041`, `LF-042`, `LF-043`, `LF-046`, `LF-047`.
- Out of scope WU4: LF-048 logout cascade (P08), real OCP WebSocket, `AgentLoggedOut` full flow.

## Delivered (WU4)

- Domain: `AgentLogoutRequested` (`logoutEvents.ts`)
- Port: `OperatorPlatformGateway.requestLogout`
- Use Case: `LogoutOperatorUseCase`; facade `logoutOperator`
- Mock: `MockOperatorPlatformGateway.requestLogout`
- Projection: `allowedBreakReasons` on `operatorStatusProjection` (from `BreakReasonsReceived`)
- Helpers: `mapOperatorStatusDisabledReason`, `mapAgentStatusRejectionReason`
- Hooks: `useOperatorStatusActions`, `useOperatorStatusTimer`
- Components: `StatusSelector`, `StatusTimer`, `BreakReasonPicker`, `LogoutReasonModal`
- App: header mount next to `PhoneStatusBadge`; SIP-only hides selector

## OCP-driven post-call note

- OCP may set `ready → post_call` via `PostCallStatusUpdated` without user FSM transition; intentional bypass of user-initiated FSM for server-driven post-call (LF-044).

## Migration Evidence — LF-041 / LF-042 / LF-043

| Area | Path |
| --- | --- |
| Selector UI | `StatusSelector.tsx` |
| Actions hook | `useOperatorStatusActions.ts` |
| Disabled reasons | `deriveOperatorStatusDisabledReason.ts`, `mapOperatorStatusDisabledReason.ts` |
| Break picker | `BreakReasonPicker.tsx` |
| Use Case | `ChangeAgentStatusUseCase.ts` |
| Test | `StatusSelector.test.tsx` |

## Migration Evidence — LF-046

| Area | Path |
| --- | --- |
| Timer UI | `StatusTimer.tsx` |
| Timer hook | `useOperatorStatusTimer.ts` |
| Derive | `operatorStatusTimerProjection.ts` |
| Test | `StatusTimer.test.tsx` |

## Migration Evidence — LF-047

| Area | Path |
| --- | --- |
| Event | `logoutEvents.ts` |
| Use Case | `LogoutOperatorUseCase.ts` |
| Modal | `LogoutReasonModal.tsx` |
| Gateway | `MockOperatorPlatformGateway.requestLogout` |
| Test | `LogoutOperatorUseCase.test.ts`, `LogoutReasonModal.test.tsx` |

## WU3 pre-step included

- `UpdatePostCallStatusUseCase` gateway failure → no domain events published (test added).

## Verification

```bash
npm run test
npm run lint
npm run typecheck
```

All green after WU4: **351 tests** (84 files). Baseline WU3: 327 (+24).

## Phase P06 WU4 Gate

- [x] Status selector visible OCP mode, hidden SIP-only (LF-041)
- [x] Ready/Break → Use Cases with projection disabled reasons (LF-042, LF-043)
- [x] Break reason picker when required
- [x] Status timer UI (LF-046)
- [x] Logout reason modal + `AgentLogoutRequested` (LF-047)
- [x] a11y + test IDs from UX doc
- [x] Component tests + Use Case test
- [x] Handoff + registry + legacy evidence
- [x] Regression green

**Stop gate:** LF-048 cascade → P08 only.
