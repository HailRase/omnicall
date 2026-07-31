# DI-01 Low nits + commit

**Дата:** 2026-07-20 13:23
**Статус:** выполнено
**Коммит:** `31b6247`

## Где
- `src/adapters/mock/MockMainToRendererBroker.ts` (+ test)
- `src/ports/integration/MainToRendererBrokerPort.ts`
- `src/ports/integration/sdk-dependency-boundary.test.ts`
- docs/evidence gate close после `/sdk-review` PASS

## Что
- Low: mock строит и хранит `BrokerProductRequest` после validate
- Low: фиксированный `occurredAt` в mock reply
- Low: store-boundary требует `targets.length > 0`
- Закрытие DI-01 `done` в WORK-UNITS/STATUS/Registry/handoff
- Коммит всех оставшихся DI-01/review изменений

## Зачем
- Дочистить nits gate review и зафиксировать DI-01 перед DI-02.

## Результат
- Focused DI-01 tests 24 PASS; `tsc -p tsconfig.web.json` PASS
