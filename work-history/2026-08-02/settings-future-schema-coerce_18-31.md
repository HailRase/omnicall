# Coerce будущих schemaVersion настроек

**Дата:** 2026-08-02 18:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/migrateUserSettings.ts`
- `src/application/settings/migrateUserSettings.test.ts`
- `src/domain/settings/PreferencesExportDocument.test.ts`
- `src/adapters/settings/FileSettingsRepository.test.ts`

## Что
- Целочисленные `schemaVersion > SETTINGS_SCHEMA_VERSION` (например 18 с `feature/external-applications`) читаются через best-effort `coerceToCurrentUserSettings`
- Известные поля сохраняются; будущие ключи отбрасываются; non-integer версии по-прежнему fail-closed
- Обновлены тесты migrate / F-030 import / FileSettingsRepository

## Зачем
Убрать `settings_corrupt:unsupported_schema_version:18` при запуске ветки Notification Center на userData, записанном более новой параллельной веткой.

## Результат
Тесты migrate/export/repository PASS. После запуска приложения profiles settings перепишутся в schema 14.
