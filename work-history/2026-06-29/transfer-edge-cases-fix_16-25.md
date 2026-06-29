# Исправление edge cases перевода звонка

**Дата:** 2026-06-29 16:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/attendedTransferRollback.ts`
- `src/application/services/CallEngine.ts`
- `src/application/services/attendedTransferOperations.ts`
- `src/application/projections/transferProjection.ts`
- `src/application/projections/multiLineCallProjection.ts`
- `src/application/projections/transferPanelProjection.ts`
- `src/renderer/hooks/useTransferActions.ts`
- `src/renderer/components/call/TransferPanel.tsx`

## Что
- Убрано ложное «Некорректная связь звонков» на шаге ввода номера (`deriveAttendedTransferDisabledReason` + step-aware `renderDisabledReason`)
- При асинхронном сбое консультации публикуется `ConsultationCallFailed` (`publishConsultationLegAbortion` в `handleFailed` / `handleCallEnded`)
- Проекции сбрасывают `attendedPhase` и фазу перевода при `CallFailed` консультационной линии
- Баннер ошибки: отдельные `failureTitle` и `detail`, без дублирования префикса
- Панель возвращается на шаг 2 после отмены/сбоя консультации; исходный звонок сохраняется

## Зачем
Корректная обработка ошибок и отмены консультативного перевода без зависания UI и без потери исходного звонка.

## Результат
- `npm run test` — 806 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
