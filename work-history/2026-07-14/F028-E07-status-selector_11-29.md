# F-028 E-07 Operator Status Selector

**Дата:** 2026-07-14 11:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/widgets/OperatorStatusSelector/`
- `src/renderer/components/integration/ocp/`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/shells/SoftphoneShellHeader.tsx`, `SoftphoneReadyShell.tsx`
- `src/application/projections/integration/operatorStatusPresentation.ts`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `TASK-QUEUE.md`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Виджет статуса оператора в хедере (точка + label + таймер + dropdown Ready/Break)
- Баннер reconnect/failed и blocking overlay SESSION_EXIST/INVALID_TOKEN
- Hook VM + вызов `ChangeOperatorStatusUseCase` / `connectOcp`; guards SIP/DND/busy
- i18n ru/en/fr/de/bg; stories light+dark; unit-тесты
- Реестр F-028 / T-022 done; тест-счётчик 1954

## Зачем
Закрыть E-07: видимый выбор OCP-статуса только при `isAuthenticated`, без бизнес-правил в компонентах.

## Результат
- `npm run test` — 1954 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run ui:catalog` — обновлён
