# F-023 Step 9 — username→composite key migration

**Дата:** 2026-07-06 01:14
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/deriveLegacyUsernameOnlySettingsAccountKey.ts`
- `src/application/settings/loadUserSettingsWithLegacyMigration.ts`
- `src/application/use-cases/AuthorizeSipAccountUseCase.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `docs/softphone/Feature-Registry.md`, `P11-Local-Account-Profiles-Design.md`

## Что
- Domain: `deriveLegacyUsernameOnlySettingsAccountKeyFromIdentity`, `isCompositeSettingsAccountKey`
- Application: one-time migration on read — legacy `username` → composite `username@domain`
- Проводка в authorize и facade load path; лог `settings_profile_key_migrated` без секретов
- При corrupt legacy — defaults, composite bucket не затирается
- Миграция `activeProfileKey` в index при совпадении с legacy key
- Тесты: unit, FileSettingsRepository on-disk, facade authorize с legacy layout
- Feature Registry Step 9 evidence

## Зачем
Операторы с сохранениями под username-only ключами должны получить настройки после перехода на composite profile key без потери данных и без перезаписи других профилей.

## Результат
- Migration tests: 37/37 PASS (4 файла)
- `registry:check`: PASS
- `tsc -p tsconfig.node.json`: PASS
- Полный `npm run test`: 1 unrelated fail (`OcpCampaignSync.integration.test.ts` — pre-existing flaky)
- `npm run lint`: 1 unrelated fail (`preload/index.ts` — pre-existing)
