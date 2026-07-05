# Release v0.1.1 — update-flow fixes

**Дата:** 2026-07-05 14:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/updates/evaluateUpdateAvailability.ts`
- `src/renderer/hooks/useAppUpdate.ts`, `useSettingsActions.ts`
- `src/domain/settings/UserSettings.ts`, `validateUserSettings.ts`
- `src/renderer/components/header/RegistrationStatusDot.*`
- `src/renderer/components/updates/UpdateAvailableBanner.module.css`
- `src/renderer/styles/tokens.css`
- `package.json`, `CHANGELOG.md`, manifest copies, docs

## Что
- `downloadUrl` в snapshot всегда из manifest (`/releases/latest`), не из `platforms.*`
- Фоновая проверка обновлений не пишет error/unavailable/invalidManifest в snapshot настроек
- «Позже» сохраняет `dismissedUpdateBannerVersion` в `UserSettings` до следующей версии
- Исправлено позиционирование registration dot (anchor IconTooltip на угол аватара)
- Primary-кнопка баннера: `--color-text-on-accent` вместо `#fff`
- Версия `0.1.1`, CHANGELOG, `release:sync-manifest`, обновлены Feature Registry и guides

## Зачем
Закрыть регрессии update-flow после 0.1.0 и выпустить PATCH `v0.1.1` с ручным механизмом manifest.

## Результат
- `npm run release:preflight` — OK (1054 tests)
- `npm run i18n:check` — OK
- Manifest copies: `latestVersion: "0.1.1"`
- Tag/push `v0.1.1` не выполнялся — требуется явное одобрение пользователя
