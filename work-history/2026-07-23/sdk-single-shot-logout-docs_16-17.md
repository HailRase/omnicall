# SDK single-shot logout docs/tests

**Дата:** 2026-07-23 16:17
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.operator.test.ts`
- `axatalk-sdk/packages/sdk/src/docs/`, `examples/crm-pairing-lite/`
- `axatalk-sdk/docs/guide/`, `evidence/`, `etc/api/`
- `docs/softphone/adr/`, `axatalk-sdk-integration/`

## Что
- Переписаны unit/browser/demo тесты на single-shot `account:logout` (без prepare/confirm/`logoutToken`)
- Обновлены CRM example helpers (`logoutDemo`), harness и SDK-09 smoke
- Синхронизированы guide/PROTOCOL/WORK-UNITS/evidence и ADR/DI docs
- Перегенерированы `etc/api/*.api.md`; `api-check`/`docs-check` ожидают 47 SDK symbols

## Зачем
- Зафиксировать новый публичный контракт logout в тестах, примерах и документации SDK/интеграции

## Результат
- `vitest` operator/activate/index/docs: PASS; `test:types` PASS; `api:check` PASS; `docs:check` PASS
