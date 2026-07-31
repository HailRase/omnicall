# DI-11 refactor — Origin TOFU / Settings IA / Activate dismiss

**Дата:** 2026-07-21 15:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/ExternalSdkAccountHandler.ts` (+ tests)
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/components/icons/iconCatalog.ts`, `docs/softphone/Icon-Registry.md`
- `src/renderer/i18n/messages.ts`, `bgMessages.ts`, `bg-strings.json`
- `src/application/projections/settings/deriveSettingsNavigationAvailability.test.ts`
- `src/domain/settings/SdkIntegrationSettings.test.ts`
- `axatalk-sdk-integration/evidence/DI-11-origin-tofu-blacklist-activate.md`

## Что
- Отдельный nav leaf Axatalk SDK: i18n `settings.nav.integrations.sdk` + icon `settings.integrations.sdk` (Blocks)
- Activate consent: `dismiss` ≠ Deny — без `onActivateConsentDenied` / без persist matrix; Deny сохраняет activate=false
- Тесты: pending/allow/deny/dismiss/not_found; pre-auth `integrations-sdk`; migrate DI-09 `{enabled, allowedOrigins}`
- Удалены мёртвые ключи `settings.integrations.sdk.enabled*`; evidence обновлён; DI-11 остаётся `review`

## Зачем
Закрыть Blockers ревью DI-11 перед повторным `/sdk-review` без закрытия F-011/P12 и без SemVer bump.

## Результат
- focused vitest 7 files / 34 passed; handler 11 passed
- `npm run typecheck` PASS; `npm run i18n:check` PASS
- SDK origin-policy tests 6 passed
- Следующий шаг: `/sdk-review` DI-11 only
