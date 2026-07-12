# Inbound video renegotiate + fullscreen no flicker

**Дата:** 2026-07-12 00:46
**Статус:** не выполнено
**Коммит:** — (откат: `rollback-video-to-81aeb84_02-13.md`)

## Где
- `src/adapters/telephony/jssip/executeJsSipRenegotiate.ts`, `JsSipTelephonyAdapter.ts`, `JsSipRtcSessionPort.ts`
- `src/renderer/shells/call/CallContextShell.tsx`, `useCallFeatureShell.ts`
- `src/renderer/components/call/VideoFullscreenModal.tsx`, `CallVideoSurface.tsx`
- `src/adapters/media/browser/peerConnectionMedia.ts`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- После inbound video answer: sync sender + `session.renegotiate` на `accepted`/`confirmed` (тот же класс операции, что hold/unhold)
- Убраны timer-based sync retries; один стабильный `CallVideoSurface` при fullscreen (modal = только chrome)
- `displayVideoSession` держит surface при входящем поверх fullscreen; skip лишнего `srcObject` rebind

## Зачем
- Надёжно отдать локальное видео remote без hold/unhold
- Убрать мерцание при смене display mode (не re-capture)

## Результат
- Vitest: renegotiate helper, JsSipTelephonyAdapter, VideoFullscreenModal, CallVideoSurface, BrowserLocalMediaCapture — OK
- ESLint touched files — OK
