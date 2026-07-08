# Incoming Call Overlay motion and elevation

**Дата:** 2026-07-08 22:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`
- `src/renderer/styles/tokens.css`

## Что
- Framer Motion spring быстрее: enter 420/32/0.65, exit 480/36/0.45
- Иконка входящего: круг 40px, иконка 18px, насыщеннее green bg/color
- Тени light/dark + hover (`--shadow-incoming-call-banner-hover`), фон баннера чуть плотнее

## Зачем
Лучшая заметность overlay и более отзывчивая анимация.

## Результат
- `IncomingCallOverlay.test.tsx` — 8/8 pass
