# Убрать заголовки из шапки renderer

**Дата:** 2026-06-25 15:44
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/shells/SoftphoneShellHeader.tsx`
- `src/renderer/shells/SoftphoneShellHeader.test.tsx`
- `src/renderer/styles.css`

## Что
- Удалён блок `shell__header-titles` с «Enterprise Softphone» и подзаголовком фазы P01
- Убраны неиспользуемые стили `.shell__header-titles`, `.shell__title`, `.shell__subtitle`
- Обновлён тест: проверка скрытия recovery row при collapse без привязки к заголовку

## Зачем
- Упростить шапку приложения: оставить аватар, индикатор регистрации и действия без dev/маркетинговых подписей.

## Результат
- `npm run test -- --run src/renderer/shells/SoftphoneShellHeader.test.tsx` — 2 passed
