# Выравнивание бейджей удержания

**Дата:** 2026-06-30 13:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/CallSessionCard.tsx`
- `src/renderer/components/call/CallSessionCard.module.css`

## Что
- Обёртка `.badgeIcon` (10×10, flex-center) для иконок в бейджах удержания
- `line-height: 1`, `justify-content: center` на hold/remote-hold бейджах

## Зачем
- Иконка и текст «Удержание (удал.)» визуально не совпадали по вертикали.

## Результат
- `npm run test -- CallSessionCard.test.tsx` — ok
