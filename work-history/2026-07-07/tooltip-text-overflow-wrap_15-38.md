# Tooltip text overflow fix

**Дата:** 2026-07-07 15:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/ui/tooltip/Tooltip.module.css`
- `src/renderer/components/icons/IconTooltip.module.css`
- `src/renderer/components/ui/tooltip/Tooltip.test.tsx`
- `src/renderer/components/icons/IconTooltip.test.tsx`

## Что
- UI Kit Tooltip: `display: block`, `width: max-content`, `max-width` с учётом Radix available width, `word-break: break-word`
- IconTooltip: убран `white-space: nowrap`, добавлен `display: inline-block` и те же правила переноса
- Добавлены тесты на длинные подписи в обоих tooltip-компонентах

## Зачем
Длинный текст (disabled reason, подсказки иконок) выходил за границы фона tooltip из-за nowrap и неработающего max-width на inline-элементе.

## Результат
`npm run test` (13 passed), `npm run lint`, `npm run typecheck` — OK.
