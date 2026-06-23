# P06 WU4 Operator Status UI

**Дата:** 2026-06-23 23:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/operator/events/logoutEvents.ts`
- `src/application/use-cases/LogoutOperatorUseCase.ts`
- `src/renderer/components/status/` (StatusSelector, StatusTimer, BreakReasonPicker, LogoutReasonModal)
- `src/renderer/hooks/useOperatorStatusActions.ts`, `useOperatorStatusTimer.ts`
- `src/renderer/helpers/mapOperatorStatusDisabledReason.ts`, `mapAgentStatusRejectionReason.ts`
- `src/renderer/App.tsx`
- `docs/softphone/handoffs/P06-WU4-Operator-Status-UI-Handoff.md`

## Что
- `AgentLogoutRequested`, `LogoutOperatorUseCase`, `requestLogout` на mock gateway
- Presentational UI: селектор статуса, таймер, picker break reason, модал logout
- Hooks связывают projection + facade Use Cases без SIP/Electron в компонентах
- Интеграция в header рядом с `PhoneStatusBadge`; SIP-only скрывает селектор
- Тест gateway failure в `UpdatePostCallStatusUseCase` (no events)
- Документация: UX WU4 notes, F-010, LF-041–047 evidence

## Зачем
WU4 gate P06: UI для operator status (LF-041–043, LF-046, LF-047) поверх готового application layer WU1–WU3.

## Результат
- `npm run test` — 351 passed (84 files), baseline 327 (+24)
- `npm run lint` — ok
- `npm run typecheck` — ok
- LF-048 logout cascade не реализован (P08)
