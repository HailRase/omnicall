# OCP post-call: резерв + кнопка завершения

**Дата:** 2026-07-19 17:28
**Статус:** выполнено
**Коммит:** `4551f39`

## Где
- `src/domain/integration/ocp/OperatorStatusMachine.ts`
- `src/application/use-cases/integration/ocp/FinishPostCallAppealUseCase.ts`
- `src/application/use-cases/integration/ocp/ReservePostCallStatusUseCase.ts`
- `src/application/projections/integration/operatorStatusProjection.ts`
- `src/application/projections/integration/operatorStatusPresentation.ts`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/components/integration/ocp/OcpStatusDropdown.*`
- `src/renderer/widgets/OperatorStatusSelector/*`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- PCP: выбор Ready/Break всегда резервирует (`mode=reserve`), модалка удалена
- Добавлен `FinishPostCallAppealUseCase` — apply зарезервированного или Ready
- Локальный reserved очищается при уходе в idle (после finish / выхода из PCP)
- `ReservePostCallStatusUseCase` пишет в ту же reserved-проекцию
- UI: красная footer-кнопка «Завершить обращение: {status}» в дропдауне
- i18n `ocp.postCall.finishAppeal` для ru/en/fr/de/bg

## Зачем
- Согласовать фронт с серверной моделью: резерв во время busy/PCP, finish применяет резерв или «Доступен»

## Результат
- `npm run test` — 2276 passed / 1 skipped
- `npm run lint` / `npm run typecheck` — green
- T-048 closed; F-028 / LF-044 обновлены
