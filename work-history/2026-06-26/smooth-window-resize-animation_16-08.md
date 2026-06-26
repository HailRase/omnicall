# Smooth shell window resize animation

**Дата:** 2026-06-26 16:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/main/shellWindow/animateWindowBounds.ts` (новый)
- `src/main/shellWindow/ShellWindowController.ts`
- `src/main/index.ts`

## Что
- Убран `setTimeout(16)` после каждого `setBounds` — он давал ~10 FPS на Windows
- Цикл по `performance.now()`: прогресс по wall-clock, `setImmediate` при отставании от 60 FPS
- Частичные `setBounds` только для изменившихся полей
- Отмена предыдущей анимации при новом layout
- macOS: нативный `setBounds(bounds, true)`
- `backgroundThrottling: false` — renderer не замирает при resize

## Зачем
Плавное изменение размера окна без рывков при открытии/закрытии настроек.

## Результат
`npm run test` — 775 passed; lint/typecheck green.
