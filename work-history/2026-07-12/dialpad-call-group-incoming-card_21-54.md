# Dialpad call group and incoming session card

**Дата:** 2026-07-12 21:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/dialpad/Dialpad.tsx`
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/hooks/useCallFeatureShell.ts`
- `src/renderer/components/call/IncomingCallSessionCard.tsx`
- `src/renderer/components/call/IncomingCallSessionCard.module.css`

## Что
- Кнопки «Позвонить» и видео объединены в один блок с вертикальным разделителем
- Видео-кнопка использует тот же recall последнего номера, что и аудио (fill → dial)
- Единые disabled-стили для обеих сегментов внутри группы
- `IncomingCallSessionCard` переведён на frosted-glass стиль как у `IncomingCallOverlay`
- Кнопки ответа/отклонения — только иконки, без текстовых подписей
- Обновлены тесты Dialpad и IncomingCallSessionCard

## Зачем
Унифицировать UX набора и исходящего видео-вызова, а также сделать входящий блок на main display визуально согласованным с глобальным overlay.

## Результат
`npm run test -- --run Dialpad.test.tsx IncomingCallSessionCard.test.tsx` — 27/27 passed
