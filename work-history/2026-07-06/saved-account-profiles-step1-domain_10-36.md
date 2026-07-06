# F-024 Step 1 — Saved account profiles domain

**Дата:** 2026-07-06 10:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/SavedAccountProfile.ts`
- `src/domain/settings/persistedSavedAccountProfiles.ts`
- `src/domain/settings/SavedAccountProfile.test.ts`
- `src/domain/settings/persistedSavedAccountProfiles.test.ts`
- `src/domain/index.ts`

## Что
- Модель `SavedAccountProfile` без password; id = `SettingsAccountKey` через `deriveSavedAccountProfileId`
- Валидация username/domain/server; `assertSavedAccountProfileValueExcludesSecrets`
- Нормализация полей; поиск дубликатов по normalized identity
- Парсер/сериализатор документа `schemaVersion: 1` + `profiles[]`
- 19 unit-тестов (нормализация, стабильность ключа, дубликаты, invalid shapes, secret exclusion)

## Зачем
Доменный фундамент для сохранённых SIP-профилей (username/domain/server) в Settings → Account без хранения секретов.

## Результат
- `npm run test -- src/domain/settings/SavedAccountProfile.test.ts src/domain/settings/persistedSavedAccountProfiles.test.ts` — 19/19 PASS
- Следующий шаг: Application ports + use cases (Step 2)
