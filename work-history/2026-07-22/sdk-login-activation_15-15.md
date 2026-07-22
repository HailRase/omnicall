# Активация аккаунта по логину SDK

**Дата:** 2026-07-22 15:15
**Статус:** выполнено
**Коммит:** —

## Где
- `axatalk-sdk/packages/protocol/src`
- `axatalk-sdk/packages/sdk/src`
- `axatalk-sdk/docs`, `axatalk-sdk/evidence`, `axatalk-sdk/examples`

## Что
- Добавлена и экспортирована схема `AccountLoginSchema`.
- Payload `account:activate-profile` переведён с `profileRef` на `login` и необязательный `mode`.
- Клиент SDK возвращает опциональный `alreadyAuthenticated`.
- Обновлены unit/browser/type тесты, CRM-пример, руководства, evidence и API-отчёты.
- Обновлён docs-check для актуального списка публичных символов.

## Зачем
- Активация сохранённого аккаунта теперь адресуется логином без передачи секретов по wire.
- Доступ по-прежнему ограничен capability `account.activate` и матрицей Origin.

## Результат
- Прошли focused SDK tests (18), protocol tests (8), typecheck, type tests (7), docs-check и browser tests (7).
- `npm run api:check` прошёл и обновил API reports.
- `npm run lint` не прошёл из-за существующего несвязанного импорта типа в `packages/sdk/src/internal/origin-policy-errors.ts`.
