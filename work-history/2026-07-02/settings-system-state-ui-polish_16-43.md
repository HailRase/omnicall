# Settings System State UI polish

**Дата:** 2026-07-02 16:43
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsPanel.tsx`
- `src/renderer/components/settings/SettingsPanel.module.css`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.tsx`
- `src/renderer/components/settings/panels/SettingsSystemStatePanel.module.css`
- `src/renderer/components/settings/panels/settingsSystemStatePanelHelpers.ts`

## Что
- Кнопка закрытия (×) в header настроек: круглый полупрозрачный фон через `color-mix` для light/dark
- Убрана видимая подпись «Недоступно: …» у ручных действий; причина остаётся в `title` и sr-only для a11y
- Единая 4-колоночная сетка «Текущее состояние» с `align-items: center` — строки выровнены по линейке
- Скруглённые углы блоков «Текущее состояние» и «Автоматическое восстановление» (`--radius-panel` + border)
- Удалён неиспользуемый `formatManualActionDisabledReason`

## Зачем
Улучшить визуальную согласованность и читаемость экрана «Состояние системы» в настройках.

## Результат
- `npm run test` (22 теста settings) — passed
- `npm run lint` — passed
- `npm run typecheck` — passed
