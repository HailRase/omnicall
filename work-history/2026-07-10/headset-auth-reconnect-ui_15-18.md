# Headset auto-reconnect + compact settings

**Дата:** 2026-07-10 15:18
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/domain/settings/` (UserSettings v5, migrate/validate)
- `src/adapters/headset/webhid/`, `src/adapters/mock/MockHeadsetGateway.ts`
- `src/application/services/headset/HeadsetIntegrationService.ts`
- `src/renderer/components/settings/panels/SettingsHeadsetPanel.tsx`
- `docs/softphone/Feature-Registry.md` (F-012)

## Что
- После authorize/profile switch вызывается `applyHeadsetUserSettings` (auto-reconnect после логина)
- В UserSettings schema v5 добавлен `headsetPreferredDeviceId`; persist при успешном connect
- Auto-reconnect / USB plug предпочитают preferred id среди granted, иначе первый
- Компактная панель гарнитуры: статус + Select + Connect/Disconnect, короткие toggles; i18n ru/en/fr/de/bg

## Зачем
- Исправить отсутствие auto-reconnect после авторизации и запомнить предпочитаемую гарнитуру при нескольких устройствах.

## Результат
- Vitest: focused suites (migrate v5, preferred reconnect, facade authorize, SettingsHeadsetPanel) — green
- `npm run i18n:check` — passed
- SemVer не поднимали (до release cut)
