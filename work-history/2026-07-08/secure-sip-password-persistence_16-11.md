# Secure SIP Password Persistence (Remember Password)

**Дата:** 2026-07-08 16:11
**Статус:** выполнено
**Коммит:** `6b16663`

## Где
- `src/shared/ipc/SecretStorageContract.ts`, `src/main/secrets/`, `src/adapters/secrets/`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/hooks/useAccountActions.ts`, `AccountPanel.tsx`, `SettingsAccountPanel.tsx`
- `src/renderer/i18n/messages.ts`, `src/renderer/i18n/catalogs/bgMessages.ts`
- `docs/softphone/Feature-Registry.md`, `docs/softphone/P11-Local-Account-Profiles-Design.md`

## Что
- Реализован Path B: `SecretStoragePort` + Electron `safeStorage` IPC (`secrets:invoke`) с валидацией payload
- Main: `ElectronSafeStorageSecretService` — шифрованные blob-файлы в `{userData}/axatalk/secrets/`
- Renderer: `PreloadSecretStorageAdapter`; mock/tests: `InMemorySecretStorageAdapter`
- `AccountBootstrapFacade`: `rememberPassword`, сохранение после успешной регистрации, загрузка для saved profile, удаление при delete profile, `hasRememberedSipPassword`
- UI: чекбокс «Запомнить пароль на этом ПК» (включён при save profile или выбранном saved profile)
- i18n: ru/en/fr/de/bg + предупреждение `account.warning.passwordSaveFailed`
- Тесты: IPC, adapters, facade, hook, component

## Зачем
- Опциональное безопасное запоминание SIP-пароля для сохранённых профилей без записи в JSON профиля/настроек.

## Результат
- `npm run i18n:check` PASS
- `npm run typecheck` PASS
- `npm run lint` PASS
- `npm run registry:check` PASS
- `npm run test` PASS — 1506 passed, 1 skipped
