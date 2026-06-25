# P08 WU5 User Session Logout Handoff

- Scope: SIP-only user session logout, ordered teardown orchestrator, `UserSessionEnded`, end-session UI; Features `F-014`, `F-001`; legacy `LF-079`, `LF-048` (SIP cascade only).
- Out of scope WU5: OCP operator logout (`LogoutOperatorUseCase`), transfer backlog, headset teardown (P10), full P11 user menu, E2E harness.

## Delivered (WU5)

| Area | Path |
| --- | --- |
| Domain event | `src/domain/platform/userSessionEvents.ts` — `UserSessionEnded` |
| Orchestrator | `src/application/services/SessionTeardownOrchestrationService.ts` |
| Use Case | `src/application/use-cases/EndUserSessionUseCase.ts` |
| Port | `MediaGateway.releaseAll` — `MockMediaGateway`, `BrowserMediaAdapter` |
| Refactor | `ShutdownCleanupUseCase`, `SafeLogoutUseCase`, `ServerTerminateCleanupService` → orchestrator |
| Projection | `deriveSessionLogoutShell.ts`, `sessionResetEvents.ts` |
| UI modal | `LogoutActiveSessionConfirmationModal.tsx` |
| UI control | `control-end-session` in `App.tsx` header (SIP-only) |
| Hook | `useSessionLogoutActions.ts` |
| Facade | `AccountBootstrapFacade.endUserSessionCommand()` |

## Ordered Teardown (canonical)

1. `connectionRecoveryOrchestration.dispose()`
2. `callEngine.hangupAllCalls(correlationId)`
3. `mediaGateway.releaseAll(correlationId)`
4. `telephonyGateway.unregister(correlationId)`
5. `UserSessionEnded` (user logout path only via `EndUserSessionUseCase`)
6. Projection reset via `UserSessionEnded` reducers

`ShutdownCleanupUseCase` / `SafeLogoutUseCase` / `ServerTerminateCleanupService` delegate SIP steps 1–4; OCP logout unchanged where applicable (not invoked in SIP-only user logout).

## Migration Evidence — LF-079

| Step | Path |
| --- | --- |
| User logout entry | `EndUserSessionUseCase` |
| Window close | `useAppShutdown` → `ShutdownCleanupUseCase` → orchestrator |
| UI | `control-end-session`, confirmation modal, `logout-error-banner` |
| Event | `UserSessionEnded` → `accountBootstrapProjection` → `sip_only_ready` |

## Migration Evidence — LF-048 (SIP cascade only)

| Step | Path |
| --- | --- |
| Shared orchestrator | `SessionTeardownOrchestrationService` used by safe logout and server terminate |
| SIP order | dispose → hangup → release media → unregister |

## WU5 Gate

- [x] Single SIP orchestrator; no duplicated teardown logic
- [x] SIP-only `control-end-session` with confirmation on active telephony
- [x] hangupAll → releaseAll → unregister
- [x] `UserSessionEnded` published; projections reset
- [x] Zero new OCP calls in SIP-only logout path
- [x] Tests + registry + legacy evidence
- [x] Architecture boundaries preserved

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 599 → **614 tests** (+15), 1 skipped.

## Real Adapter Smoke (manual)

`npm run dev` + `?adapters=real`:

1. Register → active call → End session → confirm → calls cleared, Offline
2. Register → idle → End session → no confirm
3. Window close during call → cleanup, no orphan SIP
