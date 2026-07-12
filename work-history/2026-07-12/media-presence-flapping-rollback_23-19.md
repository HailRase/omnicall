# Media presence flapping rollback

**Дата:** 2026-07-12 23:19
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/media/browser/peerConnectionMedia.ts`
- `src/adapters/media/browser/peerConnectionMedia.test.ts`

## Что
- Убран критерий `!track.muted` из `hasLiveRemoteVideoTrack` (возврат к стабильной логике по `readyState !== ended`)
- В `wirePeerConnectionRemoteVideo` возвращён `onRemoteVideoPresent(true)` на video track event
- Убраны обработчики `mute`/`unmute` для presence-переключения, оставлен `ended`
- Обновлён тест: live muted video track считается присутствующим для UI-стабильности

## Зачем
Исключить флаппинг `remoteVideoPresent` и повторные переходы в «Ожидание видео» во время активного видеозвонка, что давало ощущение деградации медиа.

## Результат
`peerConnectionMedia.test`, `detectRemoteVideoPresence.test`, `CallEngine.test`, `typecheck` — passed
