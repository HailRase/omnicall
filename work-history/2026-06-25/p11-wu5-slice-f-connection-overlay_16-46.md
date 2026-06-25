# P11 WU5 Slice F — ConnectionOverlay CSS Modules

**Дата:** 2026-06-25 16:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/recovery/ConnectionOverlay.tsx`
- `src/renderer/components/recovery/ConnectionOverlay.module.css`
- `src/renderer/styles/tokens.css` (`--color-overlay-scrim-strong`)
- `src/renderer/styles.css` (удалены `.connection-overlay*`)
- `docs/softphone/handoffs/P11-WU5-Slice-F-Connection-Overlay-Handoff.md`

## Что
- Мигрирован `ConnectionOverlay` на CSS Modules + `clsx` (blocking/banner variants)
- Добавлен semantic token `--color-overlay-scrim-strong` для blocking scrim (LF-057)
- Удалено ~106 строк global CSS из `styles.css`
- Обновлён тест scrim: `aria-modal` вместо проверки global class name
- Обновлены `P11-CSS-Modules-Tokens-Migration.md`, Feature Registry F-016, UI catalog

## Зачем
Продолжение UI-4 (WU5): перевод recovery overlay на co-located modules без визуального редизайна.

## Результат
- `npm run test` — 694 passed, 1 skipped
- `npm run lint` — OK
- `npm run typecheck` — OK
- `npm run ui:catalog` — OK (41 components)
