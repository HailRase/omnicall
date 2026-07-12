# Video UX hold bind PiP

**Дата:** 2026-07-10 00:37
**Статус:** выполнено
**Коммит:** —

## Где
- `CallVideoSurface.tsx` / `.module.css`
- `BrowserLocalMediaCaptureAdapter.ts` (mute via track.enabled)
- `BrowserMediaAdapter.ts` / `peerConnectionMedia.ts` (rebind refresh)
- `useVideoCallActions.ts` (fresh sessionView for expand)

## Что
- Retry/rebind remote video until tracks appear (без hold/unhold)
- Camera mute/unmute через `track.enabled`, не replaceTrack
- Короче подписи в call surface и settings preview
- Expand читает актуальный sessionView из facade
- Local PiP: hide/show с анимацией + drag внутри remote pane

## Зачем
- Закрыть smoke-баги видео UX после первого fix-пакета

## Результат
- vitest CallVideoSurface + capture adapter green
- Installer: `dist/win-fix2/Axatalk-0.8.0-win-x64.exe`
