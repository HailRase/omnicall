# Incoming Call Overlay row hit-area and motion

**Дата:** 2026-07-08 22:11
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/IncomingCallOverlay.tsx`
- `src/renderer/components/call/IncomingCallOverlay.module.css`

## Что
- Полноширинная `rowSurface`: hover/click на всю строку (иконка, имя, зазоры); accept/reject — отдельные кнопки поверх
- Анимация баннера: ease tween 220ms/160ms, без scale и spring-отскока

## Зачем
Единый hover по строке и быстрая плавная анимация без прыжков.

## Результат
- `IncomingCallOverlay.test.tsx` — 8/8 pass
