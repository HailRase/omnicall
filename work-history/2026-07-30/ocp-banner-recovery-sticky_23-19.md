# OCP баннер: sticky recovery + читаемый текст

**Дата:** 2026-07-30 23:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/integration/ocpSessionProjection.ts`
- `src/application/read-models/OcpProjectionHub.ts`
- `src/application/services/integration/OcpTransportRecoveryService.ts`
- `src/renderer/components/integration/ocp/OcpConnectionBanner.*`
- `docs/softphone/adr/ADR-AF-002-ocp-transport-auth-dual-fsm.md`, Feature-Registry, STATUS

## Что
- `transportRecoveryActive` больше не сбрасывается на краткий WS `connected`
- during recovery не сбрасывается attempt budget на `connected`
- `clearTransportRecovery` идемпотентен (нет recurse на `sessionClosed`)
- `runRecovery` finally не обнуляет `recovering` после `scheduleRecovery`
- баннер: статус в title с wrap, шире (`22rem`), без ellipsis

## Зачем
- Баннер пропадал на первом переподключении и возвращался с toast HTTP token; текст обрезался до «OCP Переп…»

## Результат
- `vitest` recovery/projection/banner/selector: 48 passed
