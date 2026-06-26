# Компактный layout настроек без overlay header

**Дата:** 2026-06-26 14:40
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsFullscreenOverlay.tsx`
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/components/settings/settingsSections.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `docs/softphone/Feature-Registry.md`, `UI-Component-Catalog.md`

## Что
- Убран верхний header у `SettingsFullscreenOverlay` (остались sidebar + body)
- Заголовок раздела в шапке body: `Настройки → {раздел}` через `resolveSettingsContentHeaderTitle`
- Кнопка закрытия настроек перенесена в шапку body (`settings-overlay-close`)
- Добавлен проп `onClose` в `SettingsPanel`, проброшен из `SoftphoneReadyShell`
- Обновлены тесты, Storybook, Feature Registry и UI catalog

## Зачем
Сэкономить вертикальное пространство в fullscreen overlay настроек и убрать дублирование заголовка «Настройки».

## Результат
`npm run test` — 751 passed, 1 skipped; `npm run lint`, `npm run typecheck`, `npm run ui:catalog` — OK.
