# R3-1 follow-up: accepted + deferred remote audio

**Дата:** 2026-06-24 16:07
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/wireJsSipRtcSessionLifecycle.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/media/browser/BrowserMediaAdapter.ts`
- `src/ports/media/MediaGateway.ts`
- `src/application/services/remoteAudioAttach.ts`
- `src/application/services/CallEngine.ts`
- `src/infrastructure/bootstrap/createRealAccountBootstrap.ts`

## Что
- Outbound answered: listener `accepted` + `confirmed` (один раз)
- `attachRemoteAudio` → `attached` | `deferred`; `RemoteAudioAttached` только при реальной проводке
- `setPeerConnectionBoundHandler` → retry attach для Active-звонков
- Dev smoke: `createConsoleLogger` при `NODE_ENV=development`
- Тесты: accepted-only SBC, deferred PC, remoteAudioAttach helper

## Зачем
One-way audio и ложный Active при гонке confirmed до peerconnection; SBC без `confirmed`.

## Результат
- `npm run test` — 550 passed
- `npm run lint` / `typecheck` — ok
- Retest R3-1: two-way audio, ringback on 180, hold/mute Active
