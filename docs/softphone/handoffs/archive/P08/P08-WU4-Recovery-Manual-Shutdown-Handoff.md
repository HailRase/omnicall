# P08 WU4 Recovery Manual Retry And Shutdown Handoff

- Scope: `RetryConnectionUseCase`, `SafeLogoutUseCase`, `ShutdownCleanupUseCase`, `ServerTerminateCleanupService`, IPC shutdown, recovery UI wiring; Feature `F-014`; legacy `LF-009`, `LF-010`, `LF-048`, `LF-079`.
- Out of scope WU4: real JsSIP/legacy operator platform adapters, E2E harness, full tray shell (P11).

## Delivered (WU4)

| Area | Path |
| --- | --- |
| Manual retry Use Case | `src/application/use-cases/RetryConnectionUseCase.ts` |
| Orchestration manual API | `ConnectionRecoveryOrchestrationService.requestManualRetry` |
| Recovery read model | `InMemoryConnectionRecoveryReadModel`, port `ConnectionRecoveryReadModel` |
| Terminal → manual retry projection | `connectionRecoveryProjection` → `manual_retry_available` |
| Shell derivation | `deriveConnectionRecoveryShell` — retry/reregister disabled reasons |
| Recovery actions hook | `src/renderer/hooks/useConnectionRecoveryActions.ts` |
| App shutdown hook | `src/renderer/hooks/useAppShutdown.ts` |
| Server terminate cleanup | `ServerTerminateCleanupService` |
| Safe logout | `SafeLogoutUseCase`, enabled `control-safe-logout` |
| App shutdown cleanup | `ShutdownCleanupUseCase`, `AppShutdownRequested` |
| IPC | `IpcChannels` `app:before-close`, `app:acknowledge-shutdown`, `AppShutdownContract` |
| Main/preload | `src/main/index.ts`, `src/preload/index.ts` |
| Re-register shell control | `App.tsx` `control-reregister-sip` |
| Facade wiring | `AccountBootstrapFacade` — retry, safe logout, shutdown, dispose |

## Migration Evidence — LF-009 (Re-registration Timer)

| Step | Path |
| --- | --- |
| Countdown | `useReconnectCountdown` — one-shot chained timeouts (WU3) |
| Overlay | `ConnectionOverlay` `reconnect-countdown` during `reconnecting` |
| Manual retry state | `manual_retry_available` after terminal failure |

## Migration Evidence — LF-010 (Manual Re-register)

| Step | Path |
| --- | --- |
| Use Case | `RetryConnectionUseCase` with channel `sip` / `legacy operator` / `both` |
| Overlay | `control-retry-connection` wired via `useConnectionRecoveryActions` |
| Shell | `control-reregister-sip` in header when SIP recovery visible |

## Migration Evidence — LF-048 (Logout Cascade)

| Step | Path |
| --- | --- |
| Server terminate handler | `ServerTerminateCleanupService` on `ServerTerminateReceived` |
| Ordered teardown | hangup → SIP unregister → legacy operator logout |
| Safe logout UI | `SafeLogoutUseCase` + enabled `control-safe-logout` |

## Migration Evidence — LF-079 (App Shutdown Cleanup)

| Step | Path |
| --- | --- |
| Domain event | `AppShutdownRequested` |
| IPC | main `before-quit` / window `close` → renderer `app:before-close` |
| Use Case | `ShutdownCleanupUseCase` — hangup, unregister, scheduler dispose, legacy operator logout |
| Renderer | `useAppShutdown` → ack → `app:acknowledge-shutdown` → quit |

## WU4 Gate (P08 phase gate)

- [x] Manual retry from overlay after terminal failure (LF-009/010)
- [x] Shell re-register control (LF-010)
- [x] Server terminate → safe teardown path (LF-048)
- [x] App close → SIP/legacy operator platform cleanup without orphaned sessions (LF-079)
- [x] Scheduler disposed on shutdown
- [x] F-014 acceptance complete; registry + legacy evidence
- [x] WU1–WU3 regression green

## Verification

```bash
npm run test && npm run lint && npm run typecheck
```

Baseline 476 → **488 tests** (+12).
