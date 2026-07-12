# Incoming overlay over fullscreen + outbound video sync

**Дата:** 2026-07-12 00:28
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/media/resolveFullscreenVideoSession.ts`
- `src/renderer/shells/SoftphoneReadyShell.tsx`, `IncomingCallOverlayShell.tsx`
- `src/adapters/media/browser/BrowserLocalMediaCaptureAdapter.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `docs/softphone/Feature-Registry.md` (F-027)

## Что
- Fullscreen layout/modal привязаны к `resolveFullscreenVideoSession`, а не к selected line
- При входящем во время fullscreen баннер сверху по центру; reject не выходит из fullscreen; answer → main display
- `ensureOutboundVideoSenderSynced` после answer-with-video (+ deferred retries) и при unmute камеры
- Sync на `bindPeerConnection` для video mode; тесты + registry

## Зачем
- Не сбрасывать fullscreen при входящем (как history/contacts/settings)
- Устранить плавающий баг «видео появляется только после hold/unhold»

## Результат
- Vitest: BrowserLocalMediaCaptureAdapter, resolveFullscreenVideoSession, deriveIncoming overlay, JsSipTelephonyAdapter — OK
- ESLint touched files — OK
