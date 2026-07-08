# Contacts/History Phase 1 — per-account file persistence

**Дата:** 2026-07-08 10:55
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/persistedContacts.ts`, `persistedCallHistory.ts`
- `src/adapters/settings/FileContactRepository.ts`, `FileCallHistoryRepository.ts`
- `src/adapters/settings/profileStoragePaths.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `src/infrastructure/bootstrap/createRealBootstrapContactRepository.ts`
- `src/infrastructure/bootstrap/createRealBootstrapCallHistoryRepository.ts`
- `docs/softphone/Feature-Registry.md` (F-013, F-025)
- `docs/softphone/Contacts-History-Identity-Persistence-Plan.md` (Phase 1)

## Что
- Добавлены domain parsers/serializers для contacts v1 и call-history v1 JSON.
- Реализованы `FileContactRepository` и `FileCallHistoryRepository` с `SettingsAccountKey` scoping.
- Расширены path helpers: `contacts/` и `call-history/` под profiles root.
- Real bootstrap подключает file repositories через `resolveSettingsAccountKey`.
- In-memory repositories остаются default для mock/test/storybook.
- Добавлены unit/integration тесты: isolation A↔B, reload, corrupt JSON, retention, bootstrap.

## Зачем
- Персистентность контактов и истории звонков per local SIP account на диске, без изменения UI и matching.

## Результат
- `npm run test -- --run` (5 focused files): 30 passed
- `npm run lint`: green
- `npm run typecheck`: green
- Следующий шаг: Phase 2 — profile switch reload lifecycle
