# RAT Step 03 — Browser Media Adapter

**Дата:** 2026-06-24 11:29
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/BrowserMediaAdapter.ts`
- `src/adapters/media/browser/WebAudioTonePlayer.ts`
- `src/adapters/media/browser/peerConnectionMedia.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`
- `docs/softphone/real-integration/PROGRESS.md`

## Что
- Реализован `BrowserMediaAdapter` (MediaGateway): ringtone/ringback/busy/failed tones, attachRemoteAudio, mute/unmute
- Добавлен adapter-private hook `getPeerConnectionForCall` / `bindPeerConnection` в JsSipTelephonyAdapter
- Real bootstrap: MockMediaGateway → BrowserMediaAdapter + peer-connection provider
- Unit-тесты BrowserMediaAdapter (6) + peer-connection hook test в JsSipTelephonyAdapter
- ESLint browser globals для `src/adapters/media/browser/**`; DOM lib в tsconfig.node.json

## Зачем
RAT Step 03 (R2): реальное браузерное аудио в adapter-слое без нарушения границ Domain/Application/UI.

## Результат
- `npm run test` — 515 passed, 1 skipped (+7)
- `npm run lint` / `npm run typecheck` — green
- Smoke R2 partial: wiring готов; ringtone/bidirectional audio blocked до step 04
