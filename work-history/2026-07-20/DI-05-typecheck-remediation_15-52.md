# DI-05 typecheck remediation + re-gate PASS

**Дата:** 2026-07-20 15:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/sdkGatewayRouteInbound.test.ts`
- `axatalk-sdk-integration/WORK-UNITS.md`
- `axatalk-sdk-integration/evidence/DI-05-read-only-snapshot-events-window-show.md`
- `docs/softphone/STATUS.md`, `Feature-Registry.md`, `handoffs/P12-External-Host-API-Master-Handoff.md`

## Что
- В deny-фикстуре `window:hide` добавлен schema-valid `expectedRevision: 12`
- Deny-семантика ADR-0013 без изменений (`forbidden`)
- DI-05 закрыт в `done` после зелёного typecheck / focused 60 / full 2407
- F-011 остаётся `in progress`; version `0.11.2` без bump

## Зачем
- Закрыть High `/sdk-review` FAIL (ложный/красный typecheck на фикстуре) и завершить DI-05 re-gate

## Результат
- focused vitest: 60 passed
- `npm test`: 2407 passed / 1 skipped
- `npm run lint` / `typecheck` / `registry:check` (71/0): PASS
- DI-05 → `done`; next DI-06
