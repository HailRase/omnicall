# F-034 Notification Center WU-01

**Дата:** 2026-08-02 17:09
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/UserNotificationPreferences.ts`
- `src/domain/settings/userNotificationPreferencesTypes.ts`
- `src/domain/settings/coerceUserNotificationPreferences.ts`
- `src/domain/settings/parseUserNotificationModulePreferences.ts`
- `src/domain/settings/UserSettings.ts` / `validateUserSettings.ts` / `migrateUserSettings.ts`
- `src/domain/settings/UserNotificationJournalEntry.ts`
- `docs/softphone/adr/ADR-0025-notification-center-preferences-policy.md`
- `notification-center/PROGRESS.md`

## Что
- Schema `SETTINGS_SCHEMA_VERSION` 13→14; nested `notificationPreferences` (Strategy A) как единственный source of truth
- Расширен каталог модулей: `sdk`, `updates`, `externalServices` (+ i18n ru/en/fr/de/bg)
- Миграция flat `notification*` / `notificationPopupEnabled` → nested с сохранением popup-on defaults
- Fail-closed validate для malformed prefs и unknown module keys; strip unknown на migrate
- Обновлены call sites shell/settings actions; тесты domain/migration

## Зачем
- Стабильная модель preferences до wiring capture policy (WU-02) и Preferences UI

## Результат
- Фокус-тесты preferences/validate/migrate PASS
- `npm run typecheck` PASS; `npm run lint` PASS; `npm run registry:check` 75/0; `npm run i18n:check` PASS
- `externalApplications` отложен (нет producers на ветке)
- Следующий шаг: WU-02
