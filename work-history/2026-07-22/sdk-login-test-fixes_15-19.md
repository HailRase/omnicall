# Исправление тестов login-activate SDK

**Дата:** 2026-07-22 15:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkAccountHandler.test.ts`
- `src/application/integration/createSdkAccountPortFromFacade.test.ts`
- `src/adapters/integration/LocalWsServerAdapter.operator.test.ts`
- `src/shared/ipc/SdkGatewaySettingsContract.test.ts`
- `sdk-demo/`

## Что
- Переписаны application-тесты для `login`, выбранного режима и структурированных решений consent.
- Удалены оставшиеся grant-assertions из тестов Settings и IPC.
- В интеграционном WebSocket-тесте capability `account.activate` запрашивается при pairing и разрешается матрицей.
- Демо использует `login`, объясняет matrix + consent и показывает ключи `account_not_found`, `authorization_canceled_by_user`, `logout_required`.

## Зачем
- Тесты и демонстрационный клиент приведены к актуальному контракту активации сохранённого аккаунта без `profileRef` и временных grant.

## Результат
- Focused Vitest: 8 файлов, 38 тестов — успешно.
- `tsc --noEmit -p tsconfig.node.json && tsc --noEmit -p tsconfig.web.json` — успешно.
