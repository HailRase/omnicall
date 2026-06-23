# P05 WU4 — fix reviewer gaps

**Дата:** 2026-06-23 22:56
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/transferModeOperations.ts`, `attendedTransferRollback.ts`
- `src/application/projections/multiLineCallProjection.ts`, `transferPanelProjection.ts`, `transferProjection.ts`, `multiCallProjection.ts`, `activeCallControlsProjection.ts`
- `src/renderer/components/call/TransferPanel.tsx`, `useTransferActions.ts`, `App.tsx`
- `src/domain/telephony/events/callEvents.ts`
- тесты: `CallEngine.cancelTransfer.test.ts`, `transferPanelProjection.test.ts`, `TransferPanel.test.tsx`

## Что
- Cancel consultation: `cleanupConsultationLegOnCancel` без `ConsultationCallFailed`; enriched `TransferModeCancelled` с `restoredSourceState` / `consultationCallId`
- `reduceMultiLineCallProjection`: обработка `TransferModeCancelled`, benign-filter для `transfer_cancelled`
- `resolveTransferFailureMessage`: whitelist benign reasons, префиксы `Transfer failed:` / `Consultation failed:`
- `deriveStartTransferDisabledReason` вынесен в application projection; `autoUnholdOnTransferFailure` в `multiCallProjection` и `deriveStartConsultationDisabledReason`
- Тесты: cancel+re-enter без stale banner, disabled states, failure copy

## Зачем
Закрыть reviewer gaps после P05 WU4: cancel не должен оставлять failure banner, copy баннера по типу ошибки, projection polish.

## Результат
- `npm run test` — 250 passed
- `npm run lint` — green
- `npm run typecheck` — green
- P06 не затронут
