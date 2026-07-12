# Outbound video audio-only detection

**Дата:** 2026-07-12 22:54
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/detectRemoteVideoPresence.ts`
- `src/adapters/telephony/jssip/detectRemoteVideoPresence.test.ts`

## Что
- SDP-детектор теперь учитывает направление видео-секции (`a=sendrecv|sendonly|recvonly|inactive`)
- `m=video` с валидным портом, но `a=inactive` или `a=recvonly` трактуется как отсутствие remote video
- Сценарии `sendonly` и `sendrecv` сохраняют `remoteVideoPresent=true`
- Добавлены тесты на inactive/recvonly/sendonly

## Зачем
Исправить кейс, когда абонент принимает вызов как audio-only, но приложение оставалось в video mode и не показывало уведомление.

## Результат
`detectRemoteVideoPresence.test`, `CallEngine.test`, `typecheck` — passed
