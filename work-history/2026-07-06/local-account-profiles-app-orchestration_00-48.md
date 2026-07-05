# F-023 Step 6 — Application orchestration

**Дата:** 2026-07-06 00:48
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/AuthorizeSipAccountUseCase.ts`
- `src/application/settings/resolveSettingsAccountKey.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/adapters/settings/SettingsRepositoryCodecPreferencesAdapter.ts`
- `src/application/facades/AccountBootstrapFacade.test.ts`
- `docs/softphone/Feature-Registry.md` (F-023 Step 6 evidence)

## Что
- `AuthorizeSipAccountUseCase`: после `saveSipAccount` — `setActiveProfileKey` + загрузка `UserSettings` для профиля
- `resolveSettingsAccountKey`: предпочитает `getActiveProfileKey()` при совпадении с SIP identity
- `AccountBootstrapFacade`: `applyActiveProfileSettingsSideEffects` после успешного authorize (SIP recovery, auto-answer)
- Интеграционные тесты facade: A→B→A restore, изоляция multi-call buckets, projection refresh
- Тест use case: active profile key на authorize
- Codec adapter: resolver по active profile (без импорта Application)

## Зачем
Оркестрация переключения локальных профилей при SIP-авторизации: изолированные buckets, восстановление настроек при возврате к аккаунту A.

## Результат
- `npm run test -- src/application/facades` — 11 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
- `npm run registry:check` — ok
- Полный `npm run test`: 1154 passed; 1 flaky unrelated (`OcpQueueInfoSync.integration.test.ts`)
