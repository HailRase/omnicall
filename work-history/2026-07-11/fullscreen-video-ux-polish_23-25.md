# Fullscreen video UX polish

**Дата:** 2026-07-11 23:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/call/VideoFullscreenControlsBar.tsx`
- `src/renderer/components/call/VideoFullscreenControlsBar.module.css`
- `src/renderer/components/call/CallVideoSurface.tsx`
- `src/renderer/components/call/CallVideoSurface.module.css`
- `src/renderer/components/call/CallControlsBar.tsx`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- Исправлена полярность иконки микрофона (как в `CallControlsBar`: mute=MicOff)
- Выключенные mic/camera — красный `buttonOff`; hangup — `--color-status-failed`
- Session control bar: macOS-like blur, почти прозрачный фон
- Fullscreen PiP скрывается при выключенной локальной камере
- Убран CSS `transition` на `transform` — устранено отставание PiP от курсора
- View-mode popup не показывает текущий выбранный режим

## Зачем
- Исправить UX-баги fullscreen video (F-027 WU9c) без регрессии expanded/hidden режимов

## Результат
- `npx vitest run` CallVideoSurface + VideoFullscreenControlsBar + CallControlsBar: 17 passed
- eslint на затронутых файлах: ok
