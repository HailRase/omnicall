# Restore fullscreen dialpad UI polish

**Дата:** 2026-07-12 02:22
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/dialpad/Dialpad.module.css`
- `src/renderer/components/call/VideoFullscreenModal.module.css`
- `src/renderer/components/call/VideoFullscreenControlsBar.tsx`
- `src/renderer/components/call/VideoFullscreenControlsBar.module.css`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- Dialpad video-call ready = зелёный стиль кнопки «Позвонить»
- Fullscreen screen-share: `buttonOff` + enabled при active share
- Close: frosted blur + hover light/dark; light = белая иконка
- Light theme session bar: белые иконки + soft white hover

## Зачем
- Вернуть UI после rollback логики; читаемость controls на светлой теме поверх видео

## Результат
- vitest VideoFullscreenControlsBar/Modal: 7 passed
- Логика media/JsSIP не менялась
