# P11 WU4 Settings Schema

**Дата:** 2026-06-25 15:41
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/` — UserSettings v1, validation, migration, mapping
- `src/application/settings/migrateUserSettings.ts`
- `src/ports/settings/SettingsRepository.ts`
- `src/adapters/settings/InMemorySettingsRepository.ts`, `FileSettingsRepository.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/P11-Settings-Schema-Design.md`

## Что
- Формализована схема `UserSettings` v1 с `SettingsAccountKey` (SIP username)
- Добавлены `validateUserSettings` и миграция v0→v1
- Порт расширен `getUserSettings` / `saveUserSettings`
- `InMemorySettingsRepository` хранит per-account aggregate; `FileSettingsRepository` — JSON stub
- Facade: read/write settings, `refreshUserSettingsProjections`; multi-session через schema
- Обновлены Feature Registry F-016, Legacy LF-077/LF-076, handoff WU4

## Зачем
Подготовить типизированное per-user хранилище настроек (LF-077) без полных settings panels и без Use Case для чистого config.

## Результат
`npm run test` — 694 passed, 1 skipped (+18 к baseline 676); lint и typecheck — OK.
