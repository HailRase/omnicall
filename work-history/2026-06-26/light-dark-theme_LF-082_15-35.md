# Светлая и тёмная тема (LF-082)

**Дата:** 2026-06-26 15:35
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/AppTheme.ts`, `UserSettings.ts`, `validateUserSettings.ts`
- `src/renderer/styles/tokens.css`, `src/renderer/theme/applyAppTheme.ts`
- `src/renderer/hooks/useSettingsActions.ts`, `SettingsGeneralPanel.tsx`
- `.cursor/commands/ui.md`, `.cursor/rules/ux-ui-electron-react.mdc`, `.cursor/skills/ui-implementation-agent/SKILL.md`

## Что
- Добавлено поле `theme: light | dark` в `UserSettings` (дефолт — светлая)
- `tokens.css`: светлая тема на `:root`, тёмная на `[data-theme="dark"]`
- `applyAppTheme` + сегментированный переключатель в «Настройки → Общее» (сверху)
- Персистенция через `useSettingsActions.onThemeChange`
- Правила Cursor: обязательная реализация UI на две темы для `/ui`

## Зачем
Пользователь запросил светлую тему по умолчанию, выбор темы в настройках и архитектурно корректную поддержку light/dark для будущих UI-задач.

## Результат
762 passed, 1 skipped; lint/typecheck/ui:catalog — green.
