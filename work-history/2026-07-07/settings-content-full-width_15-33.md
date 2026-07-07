# Settings content layout на всю ширину (F-016)

**Дата:** 2026-07-07 15:33
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsForm.module.css`
- `src/renderer/components/settings/SettingsPanel.module.css`
- `src/renderer/components/settings/panels/SettingsPlaceholderPanel.module.css`

## Что
- Убран `max-width: 36rem` у `.section-card` и `.panel-stack` — контент секций растягивается на всю ширину content-зоны
- `SettingsPanel.layout` и `.content-body`: `width: 100%`, `flex: 1`
- Placeholder panel: снят `max-width` у описания

## Зачем
Контент настроек (general, sessions, system state и др.) занимал ~576px вместо полной ширины окна.

## Результат
- `npm run lint:css` — OK
