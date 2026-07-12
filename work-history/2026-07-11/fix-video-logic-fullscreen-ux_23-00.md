# Fix video logic revert and fullscreen UX

**Дата:** 2026-07-11 23:00
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/BrowserLocalMediaCaptureAdapter.ts` (+ port/orchestrators)
- `src/renderer/components/call/VideoFullscreenModal.module.css`
- `src/renderer/components/call/CallVideoSurface.tsx`
- `src/renderer/components/call/CallControlsBar.tsx`
- i18n `call.controls.label.viewMode`

## Что
- Откат только outbound-sync/unmute replaceTrack логики (кнопка камеры снова как до WU9c media sync)
- Fullscreen modal: `pointer-events: auto` (overlays были `none` — кнопки не кликались)
- PiP: ResizeObserver + дефолт справа снизу с inset как у controls bar
- View-mode caption фиксированный «Вид»; иконка меняется по режиму

## Зачем
- Восстановить рабочую video-логику и починить UX fullscreen/controls без регрессии остального UI

## Результат
- vitest adapter/i18n/CallControlsBar: passed; tsc ok
