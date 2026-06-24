# Fix outgoing tone lifecycle (ringback/failed stop)

**Дата:** 2026-06-24 13:25
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/OutgoingCallOrchestrator.ts`
- `src/application/services/IncomingCallOrchestrator.ts`
- `src/application/services/scheduleTonePlaybackStop.ts`
- `src/application/policies/tonePlaybackPolicy.ts`
- `src/domain/telephony/events/callEvents.ts` — `ToneStopped`
- `src/application/projections/callProjection.ts`
- `src/domain/telephony/CallFailureReason.ts`

## Что
- Перед failure tone: `stopTone` снимает ringback/busy/failed
- Busy tone 3s, failed tone 2.5s → auto `stopTone` + `ToneStopped` event
- `handleCallEnded`/answer/reject/hangup: `stopTone` вместо только `stopRingtone`
- `User Denied Media Access` → failure reason `network`

## Зачем
LF-033/LF-034: после failed исходящего ringback не останавливался; terminal tones играли бесконечно.

## Результат
`npm run test` 533 passed; lint/typecheck green. Перезапустить `npm run dev`; для звонков разрешить микрофон в Electron.
