# Shell header: разделение window controls и avatar

**Дата:** 2026-07-06 16:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/shell/ShellTitleBar.module.css`
- `src/renderer/components/shell/ShellWindowControls.module.css`
- `src/renderer/components/shell/ShellWindowControls.tsx`
- `src/renderer/components/icons/IconControlButton.tsx`
- `src/renderer/components/icons/iconCatalog.ts`
- `docs/softphone/Icon-Registry.md`

## Что
- Titlebar: двухуровневый layout (controls сверху, avatar ниже) с разделителем
- Padding avatar-зоны: `var(--space-xs) var(--space-sm)` — как в layout zones приложения
- Window controls увеличены: 48×34px, иконки 15–16px
- Close: статичный Lucide `X` (без анимации), тот же размер 15px что и minimize
- Default-цвет close как у остальных controls; красный только на hover/active
- `IconControlButton`: опциональный `preferAnimated` для titlebar-кнопок

## Зачем
Window controls и avatar — отдельные блоки с компактным padding по дизайн-системе; titlebar-кнопки чуть крупнее, close без красной иконки в покое.

## Результат
- `npm run test` (header + window controls): 6 passed
- `npm run lint`: ok
