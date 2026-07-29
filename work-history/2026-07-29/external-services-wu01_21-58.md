# F-031 WU-01: модель и миграция

**Дата:** 2026-07-29 21:58
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/`
- `src/domain/settings/UserSettings.ts`
- `src/domain/settings/migrateUserSettings.ts`

## Что
- Добавлена неизменяемая модель External Services и валидация входных данных.
- Схема `UserSettings` повышена до v12 с пустым значением по умолчанию.
- Добавлена миграция v3–v11 и тесты модели, валидации и миграции.
- Синхронизированы реестр F-031, STATUS, handoff и прогресс WU.

## Зачем
- Подготовлена безопасная профильная конфигурация для следующих WU без HTTP и UI.

## Результат
- Focused tests, typecheck, targeted lint и registry check прошли.
- `npm run lint` блокируется 118 ранее созданными `axatalk-sdk/packages/sdk/dist` файлами вне TS-проекта ESLint.
