# Settings number fields → UI Kit Input

**Дата:** 2026-07-07 17:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsNumberInput.tsx`
- `src/renderer/components/settings/SettingsNumberInput.module.css`
- `src/renderer/components/settings/panels/SettingsGeneralPanel.tsx`
- `src/renderer/components/settings/panels/SettingsSessionsPanel.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/components/settings/SettingsForm.module.css`

## Что
- Добавлен `SettingsNumberInput` — компактная обёртка над UI Kit `Input` (`type="number"`, suffix, invalid, touch-target).
- Заменены нативные `<input type="number">` в General, Sessions и System State панелях.
- Удалены устаревшие стили `numberInputGroup` / `numberInput` / `inputSuffix` из `SettingsForm.module.css`.
- Добавлены unit-тесты для `SettingsNumberInput`.

## Зачем
Унифицировать числовые поля настроек с UI Kit и сохранить компактный layout в `fieldRow`.

## Результат
- `npm run test` (settings suites + SettingsNumberInput): 21 passed
- `npm run lint`: ok
- `npm run typecheck`: ok
