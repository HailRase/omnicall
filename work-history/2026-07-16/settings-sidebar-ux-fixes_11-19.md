# Settings sidebar: click-outside, children, collapsed centering

**Дата:** 2026-07-16 11:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/SettingsSidebar.tsx`
- `src/renderer/components/settings/SettingsSidebar.module.css`
- `src/renderer/components/settings/SettingsSidebar.test.tsx`

## Что
- Сворачивание flyout при `pointerdown` вне sidebar (контент настроек и остальная область).
- Центрирование иконок в collapsed: убран padding меню, label скрыт из layout, кнопки `margin-inline: auto`.
- Children: карточка-контейнер с border/radius/background, hover и active через semantic tokens.
- Dark theme: отдельные `--settings-nav-child-*` mix для контраста вложенных пунктов.

## Зачем
Закрыть UX-дыры после миграции на UI Kit: нет auto-collapse, смещённые иконки, слабый вид children в dark.

## Результат
- `SettingsSidebar.test.tsx` — 11/11 passed
- `npm run lint` + `npm run typecheck` — passed
