# F-028 E-05 OCP Projections + Bridges

**Дата:** 2026-07-14 09:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/integration/`
- `src/application/services/integration/`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/ports/integration/OcpReasonsCachePort.ts`, `OcpNotificationPresenter.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`, `createMockAccountBootstrap.ts`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`

## Что
- Сериализуемые OCP-проекции: session, operator status, reasons, campaign
- `OcpProjectionHub` реализует `OcpOperatorReadModel`; DND read-model по событиям
- Bridge-сервисы: Telephony (call correlation map), DND→break/reserve, notifications, SIP creds stub
- Bootstrap: `MockOcpGateway` / `OcpWebSocketAdapter`; dispose в `ShutdownCleanupUseCase`
- Порт нотификаций вместо прямого импорта renderer; UI wiring — T-021

## Зачем
Связать OCP с Telephony/DND через Application bridges без нарушения слоёв и подготовить проекции для UI/Settings (E-06+).

## Результат
- `npm run lint` ✓, `npm run typecheck` ✓, `npm run test` ✓ (1916 passed, 1 skipped)
- Следующий этап: E-06 (`/logic` + `/ui`) или T-021 Zustand/toast wiring
