# Fullscreen PiP inset, CSP previews, close button

**Дата:** 2026-07-12 00:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/index.html` (CSP `img-src data: blob:`)
- `src/main/media/nativeImageToPreviewDataUrl.ts` / `registerDisplayCaptureIpc.ts`
- `src/renderer/components/call/CallVideoSurface.tsx`
- `src/renderer/components/call/VideoFullscreenModal.tsx` (+ CSS)
- `src/renderer/i18n/messages.ts` + bg catalogs

## Что
- PiP fullscreen clamp inset = 24px (`--space-lg`, как у control bar)
- Превью screen-share: корневая причина — CSP блокировал `data:` в img; + `toPNG` → base64, scale-aware thumbnailSize
- Кнопка X в fullscreen → `sessionView: expanded` (минимальный); blur/hover/tokens light+dark
- Починен `useShellWindowLayout.test` под `syncLayout` + `videoFullscreen`

## Зачем
- Production-корректные превью picker и UX fullscreen chrome без костылей

## Результат
- vitest: VideoFullscreenModal, CallVideoSurface, nativeImage, ScreenSharePicker — passed
- eslint на затронутых файлах: ok
