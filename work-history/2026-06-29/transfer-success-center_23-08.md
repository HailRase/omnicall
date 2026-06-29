# Transfer success overlay centering

**Дата:** 2026-06-29 23:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/TransferSuccessOverlay.tsx`
- `src/renderer/components/call/TransferSuccessOverlay.module.css`
- `src/renderer/components/call/TransferSuccessOverlay.test.tsx`

## Что
- Убрана кнопка закрытия и prop `onDismiss`
- Overlay переведён на `position: fixed; inset: 0` с flex-центрированием по экрану
- Обновлены тесты и Storybook

## Зачем
Анимация успеха должна быть по центру экрана без ручного dismiss в UI.

## Результат
Тесты overlay — ok; lint — ok.
