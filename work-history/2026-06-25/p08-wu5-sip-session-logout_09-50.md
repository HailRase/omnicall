# P08 WU5 SIP session logout

**Дата:** 2026-06-25 09:50
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/SessionTeardownOrchestrationService.ts`
- `src/application/use-cases/EndUserSessionUseCase.ts`
- `src/domain/platform/userSessionEvents.ts`
- `src/application/projections/deriveSessionLogoutShell.ts`
- `src/renderer/components/session/LogoutActiveSessionConfirmationModal.tsx`
- `src/renderer/hooks/useSessionLogoutActions.ts`
- `docs/softphone/handoffs/P08-WU5-User-Session-Logout-Handoff.md`

## Что
- Единый SIP orchestrator: dispose recovery → hangupAll → releaseAll media → unregister
- `UserSessionEnded` + сброс projections (`sip_only_ready`, idle registration)
- `MediaGateway.releaseAll` в mock и browser adapter
- Refactor `ShutdownCleanupUseCase`, `SafeLogoutUseCase`, `ServerTerminateCleanupService` на orchestrator
- SIP-only UI: `control-end-session`, confirmation modal, error banner
- Unit/integration/component тесты (+15); registry и legacy evidence обновлены

## Зачем
P08 WU5 — пользовательский SIP-only logout и тот же ordered teardown при закрытии окна без дублирования логики (LF-079, LF-048 SIP).

## Результат
`npm run test` — 614 passed, 1 skipped; `npm run lint` и `npm run typecheck` — green.
