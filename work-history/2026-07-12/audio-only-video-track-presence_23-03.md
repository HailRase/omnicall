# Audio-only video track presence fix

**Дата:** 2026-07-12 23:03
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/peerConnectionMedia.ts`
- `src/adapters/media/browser/peerConnectionMedia.test.ts`

## Что
- `hasLiveRemoteVideoTrack` теперь требует unmuted video track, а не только `readyState !== ended`
- В `wirePeerConnectionRemoteVideo` статус presence пересчитывается через `hasLiveRemoteVideoTrack`, а не жёстко `true`
- Добавлены слушатели `mute`/`unmute`/`ended` для актуализации presence при смене состояния трека
- Добавлены тесты на recvonly-like (muted) и sendrecv-like (unmuted) сценарии

## Зачем
При SDP `m=video ... a=recvonly` могли считаться «видео присутствует», из-за чего не срабатывал downgrade в audio-only и уведомление.

## Результат
`peerConnectionMedia.test`, `detectRemoteVideoPresence.test`, `CallEngine.test`, `typecheck` — passed
