# F-030 Перенос настроек оператора (export/import)

**Дата:** 2026-07-24 17:02
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/PreferencesExportDocument.ts`
- `src/application/use-cases/settings/ExportOperatorPreferencesUseCase.ts`
- `src/application/use-cases/settings/ImportOperatorPreferencesUseCase.ts`
- `src/ports/settings/PreferencesFileGateway.ts`
- `src/adapters/mock/MockPreferencesFileGateway.ts`
- `src/adapters/platform/PreloadPreferencesFileGateway.ts`
- `src/main/settings/registerPreferencesFileIpc.ts`
- `src/renderer/hooks/usePreferencesTransferActions.ts`
- `src/renderer/components/settings/panels/SettingsPreferencesTransferSection.tsx`
- `docs/softphone/P11-Operator-Preferences-Export-Design.md`
- `docs/softphone/Feature-Registry.md` (F-030)

## Что
- Добавлен portable bundle `axatalk.preferences` v1 без секретов и machine device ids
- Use Cases + facade + typed IPC dialogs по паттерну contacts CSV
- UI в Settings → General (все локали ru/en/fr/de/bg)
- Импорт через `migrateUserSettings`; новая schema/format на старом приложении — fail closed
- Документация синхронизирована (design, registry, STATUS, I18N, Legacy LF-077, CHANGELOG Unreleased)

## Зачем
- Безопасный перенос предпочтений оператора на другой ПК без даунгрейда схемы и без утечки паролей

## Результат
- `npx vitest run` F-030 slice — PASS
- `npm run i18n:check` — PASS
- `npm run registry:check` — PASS
- `SETTINGS_SCHEMA_VERSION` не менялся (нет downgrade path)
