# Incoming Call Overlay bottom gap fix

**Дата:** 2026-07-08 22:16
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.module.css`

## Что
- Убран `padding` у `.body` и отрицательные margin у `.mainRow`
- Padding только в `.mainRowForeground`; status/disabled — свой нижний отступ

## Зачем
Устранить мёртвую нижнюю зону без hover/клика и лишнюю высоту баннера.

## Результат
- `IncomingCallOverlay.test.tsx` — 8/8 pass
