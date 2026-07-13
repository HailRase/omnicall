# OCP E-04 — Application Use Cases

**Дата:** 2026-07-13 17:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/integration/ocp/`
- `src/ports/integration/OcpOperatorReadModel.ts`
- `src/ports/settings/DndReadModel.ts`
- `docs/softphone/Feature-Registry.md` (F-028)
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Реализованы 7 Use Cases: Connect, Disconnect, ChangeOperatorStatus, LogoutOperator, ReservePostCallStatus, AcceptCampaign, RejectCampaign
- Добавлены порты `OcpOperatorReadModel` и `DndReadModel` для read-model зависимостей
- `ChangeOperatorStatusUseCase`: DND guard, busy → `update_post_call_status`, idle → FSM + direct command
- `LogoutOperatorUseCase`: logout command + disconnect; опциональный `OperatorLoggedOut` при `cascadeSipLogout`
- 13 unit-тестов с `MockOcpGateway` и test doubles
- Обновлены Feature Registry и план E-04 → 🟢

## Зачем
Этап E-04 OCP Integration: оркестрация OCP-сессии и смены статуса оператора через порт `OcpGateway`, без UI и без прямой зависимости от Zustand.

## Результат
- `npm run test` — 1902 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
- Следующий этап: E-05 (projections + bridge services)
