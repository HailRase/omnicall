# P01 Gap Closure

**Дата:** 2026-06-23 16:42
**Статус:** выполнено
**Коммит:** —

## Где

- `src/domain/operator/` — OperatorAuthState, OcpConnectionState
- `src/domain/shared/events/accountBootstrapEvents.ts` — новые Domain Events
- `src/application/use-cases/` — ResolveStartupModeUseCase, ChangePhoneStatusUseCase
- `src/application/projections/accountBootstrapProjection.ts` — event-driven UI states
- `src/renderer/` — bootstrap, AuthStateView, App (без дубли OCP auth)
- `src/adapters/index.ts` — MockSettingsRepository alias
- `docs/softphone/Feature-Registry.md` — F-001, F-009

## Что

- Domain Events: ManualSipAuthorizationRequested, AccessDeniedDetected, PhoneStatusChanged, StartupModeResolved
- ResolveStartupModeUseCase и ChangePhoneStatusUseCase
- Facade.initialize() через startup resolution; phone status только через events
- UI state `access_denied` (LF-085), dev URL `ocpScenario` / `telephonyScenario`
- 48 тестов: полная P01 матрица unit/integration/projection

## Зачем

Закрыть P01 по чеклисту LF-001…LF-085 на mock gateways с event-derived projections.

## Результат

| Проверка | Итог |
|----------|------|
| `npm test` (48) | ✓ |
| `npm run typecheck` | ✓ |
| `npm run lint` | ✓ |
| `npm run build` | ✓ |

Gate P01 mock-only закрыт. Реальный OCP WebSocket и JsSIP — вне scope.
