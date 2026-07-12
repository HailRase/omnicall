# F-027 video stability + answer regression fix

**Дата:** 2026-07-11 19:52
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/application/projections/telephony/incomingCallProjection.ts`
- `src/renderer/hooks/useIncomingCallActions.ts`
- (+ ранее WU9/10: media bind, screen share, shell video-fullscreen)

## Что
- Исправлена регрессия: «Ответить с видео» пропадала на video-звонке — offered SDP уходил до IncomingCallReceived и отбрасывался.
- Notify offered после incoming handler; early offered сохраняется; кнопка скрывается только при `offered === false`.

## Зачем
- Вернуть video-answer на входящем video без ложного ответа на audio-only.

## Результат
- vitest: incomingCallProjection + JsSipTelephonyAdapter green.
