# SDK-09 — Developer Documentation and Examples

**Дата:** 2026-07-20 23:40
**Статус:** выполнено
**Коммит:** `e06a8ac`

## Где
- `axatalk-sdk/docs/guide/**`
- `axatalk-sdk/examples/crm-pairing-lite/**`
- `axatalk-sdk/packages/sdk/src/docs/**`
- `axatalk-sdk/scripts/docs-check.mjs`
- `axatalk-sdk/evidence/SDK-09-developer-docs-examples.md`
- `axatalk-sdk/docs/WORK-UNITS.md`, `axatalk-sdk/README.md`
- `docs/softphone/Feature-Registry.md` (F-011 factual note)

## Что
- Канонический developer guide (`docs/guide/`) — security-first, API/events/errors/capabilities, logout/activate/reconnect
- Пример CRM (`examples/crm-pairing-lite`) на публичном `@axata/axatalk-sdk` + fake-peer demo в `packages/sdk/src/docs`
- Тесты smoke/secret-scan/types + `npm run docs:check` в preflight
- Evidence SDK-09 → `review`; F-011 остаётся `in progress`; DI-10 не разблокирован

## Зачем
- Сделать безопасную DX-документацию и компилируемые примеры без новых product API и без publish

## Результат
- `npm run preflight` PASS: sdk src **113**, workspace **121**, types **7**, browser **7**, api **47** / protocol **169**
- Handoff: `/sdk-review` SDK-09 only
