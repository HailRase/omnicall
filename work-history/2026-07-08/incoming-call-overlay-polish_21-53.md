# Incoming Call Overlay polish

**Дата:** 2026-07-08 21:53
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/components/call/TruncatedTextLine.tsx`
- `src/renderer/styles/tokens.css`

## Что
- Увеличен gap между accept/reject (`--incoming-call-action-gap: 12px`)
- `TruncatedTextLine`: ellipsis + Tooltip только при overflow (ResizeObserver)
- Dismiss: flex center для иконки закрытия
- Кликабельна только nav-зона (иконка + имя), hover заливка на всю левую часть карточки
- Top offset: ниже window controls (`shell-titlebar-controls-height + 10px`)

## Зачем
Компактный баннер без перекрытия chrome, корректные tooltip и hit-target.

## Результат
- `IncomingCallOverlay.test.tsx` + `TruncatedTextLine.test.tsx` — 10/10 pass
