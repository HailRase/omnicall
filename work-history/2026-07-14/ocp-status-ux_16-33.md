# OCP status UX: break/reserve/post-call

**Дата:** 2026-07-14 16:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/ocp/OcpTransitionRules.ts`
- `src/domain/integration/ocp/OperatorStatusMachine.ts`
- `src/application/use-cases/integration/ocp/ChangeOperatorStatusUseCase.ts`
- `src/renderer/hooks/useOperatorStatusSelector.ts`
- `src/renderer/components/integration/ocp/OcpPostCallStatusModal.tsx`
- `docs/softphone/Feature-Registry.md`, `TASK-QUEUE.md`, `STATUS.md`

## Что
- FSM: Break→Break, Ready/Break/Preparing → Ready/Break/Logout
- `resolveOperatorStatusChangeMode` + `ChangeOperatorStatus` intent `auto|apply|reserve` с outcome reserved/applied
- Селектор не блокируется на busy; toast при резервации
- Двухшаговая blur-модалка finish/reserve в Post-call processing
- i18n ru/en/fr/de/bg для toast и модалки; тесты Domain/UC/hook/UI

## Зачем
Исправить регрессии OCP-статусов: смена причины перерыва, резервация во время busy и выбор при поствызове без блокировки селектора.

## Результат
`npm run test` — 2036 passed, 1 skipped; `lint` / `typecheck` / `i18n:check` — green. F-028 T-027 done.
