# P05 WU4 polish — residual reviewer gaps

**Дата:** 2026-06-23 23:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/transferFailureReasons.ts`
- `src/renderer/helpers/mapTransferDisabledReason.ts`
- `src/application/projections/transferPanelProjection.ts`, `multiLineCallProjection.ts`, `transferProjection.ts`
- `src/renderer/components/call/TransferPanel.tsx`, `ActiveCallControlsPanel.tsx`
- `docs/softphone/handoffs/P05-WU4-Transfer-Panel-Handoff.md`, `P05-Agent-Continuation-Handoff.md`

## Что
- DRY: `isBenignTransferFailureReason` + `BENIGN_TRANSFER_FAILURE_REASONS` в одном модуле, re-export из `application/index.ts`
- Shared `mapTransferDisabledReason` для transfer disabled labels incl. `transfer_mode_active`
- `TransferPanel` и `ActiveCallControlsPanel` делегируют transfer-related labels в helper
- Handoff WU4: секция Post-WU4 polish, test count 250+
- Тесты: `transferFailureReasons.test.ts`, `mapTransferDisabledReason.test.ts`

## Зачем
Закрыть остаточные Low-замечания reviewer после fix-review-gaps без изменения cancel/failure semantics.

## Результат
- `npm run test` — 258 passed
- `npm run lint` — green
- `npm run typecheck` — green
- P06 не затронут
