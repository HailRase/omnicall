# SDK operator events + coarse revision

**Дата:** 2026-07-23 13:27
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkEventMapper.ts`
- `src/application/integration/SdkOperatorEventRevisionGate.ts`
- `src/renderer/bootstrap/bindSdkBrokerSession.ts`
- `axatalk-sdk/docs/guide/events.md`, `errors.md`
- `axatalk-sdk-integration/evidence/DI-05-operator-events-coarse-revision.md`

## Что
- Domain → public `operator:status-changed` / `operator:session-changed` (без OperatorLoggedOut)
- Coarse-advance revision gate (coarse/reason/connected; без advance на talking↔hold)
- Врезка в `bindSdkBrokerSession` publish path
- Документация и evidence синхронизированы с фактическим emit

## Зачем
- Закрыть дыру DI-05/O-OCP: CRM получает push по статусу оператора; revision защищает UI↔SDK гонки без шума mid-call

## Результат
- Focused vitest 39 passed (mapper + gate + DI-06/07 handlers)
- `npm run lint` PASS
- Version не бампился; F-011 остаётся in progress
