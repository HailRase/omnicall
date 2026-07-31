# Матричная авторизация account.activate

**Дата:** 2026-07-22 15:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/integration/LocalWsServerAdapter.ts`
- `src/adapters/integration/LocalWsSessionRegistry.ts`
- `src/main/sdk/registerSdkGatewaySettingsIpc.ts`
- `src/renderer/components/settings/panels/`

## Что
- Удалено временное хранилище grant для `account.activate` и связанные с ним IPC-операции.
- Живые соединения синхронизируют capability из матрицы Origin и получают `sdk:permission-changed`.
- Pairing и повторная аутентификация выдают capability согласно матрице Origin.
- Удалена Settings-форма выдачи grant; удалены устаревшие тесты и файлы grant store.
- Обновлены payload-тесты `account:activate-profile` на поле `login`.

## Зачем
- Политика Origin стала единственным источником разрешения `account.activate`; временные локальные grants больше не попадают в жизненный цикл сессий.

## Результат
- `npx vitest run src/adapters/integration/sdkGatewayActivateApproval.test.ts src/adapters/integration/sdkAccountActivateSession.test.ts src/shared/integration/sdkAccountLogin.test.ts src/adapters/integration/LocalWsServerAdapter.operator.test.ts src/shared/ipc/SdkGatewaySettingsContract.test.ts` — успешно, 17 тестов.
- `npm run typecheck` не прошёл из-за несвязанных незавершённых изменений `ExternalSdkAccountHandler` и его тестов; исправлен один устаревший payload-тест маршрутизации.
