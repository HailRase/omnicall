# P08 WU4 Manual Retry And Shutdown

**Дата:** 2026-06-24 00:55
**Статус:** выполнено
**Коммит:** `28593eb`

## Где
- `src/application/use-cases/RetryConnectionUseCase.ts`
- `src/application/use-cases/ShutdownCleanupUseCase.ts`
- `src/application/use-cases/SafeLogoutUseCase.ts`
- `src/application/services/ServerTerminateCleanupService.ts`
- `src/application/services/ConnectionRecoveryOrchestrationService.ts`
- `src/renderer/hooks/useConnectionRecoveryActions.ts`
- `src/renderer/hooks/useAppShutdown.ts`
- `src/shared/ipc/AppShutdownContract.ts`
- `src/main/index.ts`, `src/preload/index.ts`
- `docs/softphone/handoffs/P08-WU4-Recovery-Manual-Shutdown-Handoff.md`

## Что
- `RetryConnectionUseCase` + `requestManualRetry` в orchestration; projection `manual_retry_available`
- `useConnectionRecoveryActions` — overlay retry и safe logout через facade Use Cases
- Shell `control-reregister-sip` для LF-010
- `ServerTerminateCleanupService` — hangup, unregister, OCP logout на server terminate (LF-048)
- `ShutdownCleanupUseCase` + typed IPC `app:before-close` / ack (LF-079)
- `SafeLogoutUseCase` и enabled `control-safe-logout` в overlay
- F-014 → `implemented`; обновлены Legacy-Feature-Coverage и handoff

## Зачем
Закрыть P08 phase gate: ручной retry, cascade logout при server terminate и безопасный shutdown приложения без orphaned SIP/OCP сессий.

## Результат
- `npm run test` — 488 passed (+12 от baseline 476)
- `npm run lint` — ok
- `npm run typecheck` — ok
