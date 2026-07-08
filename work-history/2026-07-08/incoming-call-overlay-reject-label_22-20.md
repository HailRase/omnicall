# Incoming Call Overlay reject label and icon

**Дата:** 2026-07-08 22:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/styles/tokens.css`
- `src/renderer/components/call/IncomingCallOverlay.test.tsx`

## Что
- Убран блок `incoming-answer-disabled-reason` (в т.ч. «Отклонение выполняется»)
- Иконка входящего: static `AppIcon`, `line-height: 0`, центрирование svg
- Насыщеннее green токены icon circle light/dark

## Зачем
Компактный баннер без служебных надписей при reject; визуальная полировка иконки.

## Результат
- `IncomingCallOverlay.test.tsx` — 8/8 pass
