# Video privacy, renegotiate toggle, screen FPS

**Дата:** 2026-07-12 01:10
**Статус:** не выполнено
**Коммит:** — (откат: `rollback-video-to-81aeb84_02-13.md`)

## Где
- `BrowserLocalMediaCaptureAdapter.ts`, `applyScreenShareEncodingPolicy.ts`
- `JsSipTelephonyAdapter.ts`, `TelephonyGateway.ts`, `AccountBootstrapFacade.ts`
- `VideoFullscreenControlsBar.tsx`, `VideoFullscreenModal.module.css`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- Privacy: muted camera → `replaceTrack(null)` + re-enforce after re-INVITE/hold/resume/outbound confirmed
- Camera/screen toggle → `renegotiateCallMedia` (user recovery path + SDP sync)
- Screen share: `contentHint=motion`, 15fps, `maintain-framerate` (Chromium detail/VP9 ~5fps)
- Fullscreen screen-share active styling; light-theme close button contrast

## Зачем
- Блокер: remote не должен видеть видео при выключенной камере
- Надёжный sync без hold/unhold; исправить ~2fps и UI desync

## Результат
- Vitest: capture adapter, encoding policy, JsSIP, fullscreen controls — OK
- ESLint touched files — OK
