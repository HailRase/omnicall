# P04 fix review issues

**Дата:** 2026-06-23 21:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/telephonyCallControlOperations.ts`
- `src/application/services/mediaCallControlOperations.ts`
- `src/application/projections/activeCallControlsProjection.ts`
- `src/infrastructure/bootstrap/createAccountBootstrap.ts`
- `src/domain/telephony/events/callEvents.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/renderer/hooks/useSoftphoneCallActions.ts`
- `src/renderer/components/call/ActiveCallControlsPanel.tsx`

## Что
- Hangup: `CallHangupRequested` публикуется после успешного gateway; при failure — `ActiveCallControlFailed`, projection/tracker остаются в Active
- `createAccountBootstrap` перенесён в `infrastructure/bootstrap`, удалён из `application`
- Добавлен domain event `ActiveCallControlFailed` и projection field `lastOperationError`
- UI: error banner + Retry; guards по disabled reasons в `useSoftphoneCallActions`
- Mock: `hangupScenario`; тесты hangup/resume/mute/unmute failure в `CallEngine.test.ts`
- Feature Registry обновлён (F-004, F-005)

## Зачем
Закрыть High/Medium issues после P04 Active Call Controls и architecture cleanup перед переходом к P05.

## Результат
- `npm run test` — 138 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
