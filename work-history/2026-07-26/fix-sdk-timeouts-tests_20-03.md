# Fix SDK settings test expectations

**Дата:** 2026-07-26 20:03
**Статус:** выполнено
**Коммит:** —

## Где
- src/application/settings/migrateUserSettings.test.ts
- src/application/settings/sdkIntegrationSettingsCommands.test.ts

## Что
- Ожидания тестов учитывают operatorModalTimeouts из SDK defaults

## Зачем
- Убрать 2 ложных FAIL после добавления timeouts в sdkIntegration policy

## Результат
- vitest 14/14 PASS на этих файлах
