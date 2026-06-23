# P04 architecture cleanup (final)

**Дата:** 2026-06-23 20:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/CallEngine.ts`
- `src/application/services/CallTracker.ts`
- `src/application/services/OutgoingCallOrchestrator.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/application/services/DtmfOrchestrator.ts`
- `src/application/services/ActiveCallControlService.ts`
- `src/application/services/telephonyCallControlOperations.ts`
- `src/application/services/mediaCallControlOperations.ts`
- `src/application/composition/createAccountBootstrap.ts`
- `src/renderer/App.tsx`
- `src/renderer/hooks/useDialpadShell.ts`
- `src/renderer/hooks/useSoftphoneCallActions.ts`
- `src/renderer/hooks/useIncomingCallActions.ts`

## Что
- Разделил `CallEngine` (~787 → ~165 строк): orchestration делегирует в `CallTracker`, `OutgoingCallOrchestrator`, `IncomingCallOrchestrator`, `DtmfOrchestrator`, `ActiveCallControlService`.
- Разделил P04 logic: `telephonyCallControlOperations` (hangup/hold/resume), `mediaCallControlOperations` (mute/unmute), shared types/logging.
- Разгрузил `App.tsx` (~320 → ~175 строк): handlers и derived UI state вынесены в `useDialpadShell`, `useSoftphoneCallActions`, `useIncomingCallActions`, `useAuthShellFlags`.
- Перенёс `createAccountBootstrap` в `application/composition`; renderer импортирует только `@application`.
- Подтвердил отсутствие `@domain/@adapters/@ports/@infrastructure` импортов в `src/renderer/**`.

## Зачем
- Завершить architecture cleanup после P04 без изменения публичного поведения P01–P04 и восстановить границы слоёв перед P05.

## Результат
- `npm run test` — 131/131 успешно.
- `npm run lint` — успешно.
- `npm run typecheck` — успешно.
- P04 active controls, disabled reasons и вход через Use Cases сохранены.
