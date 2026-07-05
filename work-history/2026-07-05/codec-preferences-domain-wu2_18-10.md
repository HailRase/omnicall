# Codec preferences domain WU-2

**Дата:** 2026-07-05 18:10
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/media/` — CodecId, CodecPreferences, validate, reorder
- `src/domain/settings/UserSettings.ts` — schema v3
- `src/domain/settings/migrateUserSettings.ts`, `validateUserSettings.ts`
- `docs/softphone/P11-Codec-Preferences-Design.md`
- `docs/softphone/Feature-Registry.md` — F-022

## Что
- Добавлены domain-типы кодеков (audio/video ids, MIME map, defaults)
- `UserSettings` v3 + поле `codecPreferences`
- Миграция v0/v1/v2 → v3 с дефолтным порядком кодеков
- Валидация: ≥1 voice audio, telephone-event always on, order permutation
- Pure helpers: toggle/reorder для UI
- 20+ unit-тестов; Feature Registry F-022; TASK-QUEUE T-009/T-010

## Зачем
Фундамент настройки кодеков (LF-084) без изменения TelephonyGateway и без регрессии звонков.

## Результат
- `npm run test` — 1073 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- Следующий шаг: `/logic` WU-3 (port) или `/ui` T-009
