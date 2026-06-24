# RAT Step 04 — Call Lifecycle In/Out

**Дата:** 2026-06-24 11:52
**Статус:** выполнено
**Коммит:** `0f97cf8`

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/JsSipRtcSessionPort.ts`, `wrapJsSipRtcSession.ts`, `wireJsSipRtcSessionLifecycle.ts`, `executeJsSipOutboundCall.ts`, `buildOutgoingSipTarget.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.test.ts`
- `docs/softphone/real-integration/PROGRESS.md`, `docs/softphone/Feature-Registry.md`

## Что
- Реализованы `makeCall`, `answerCall`, `rejectCall`, `hangup`, `setIncomingCallHandler`, `setCallEndedHandler` в JsSipTelephonyAdapter
- Incoming через `newRTCSession` + `mapTelephonyIncomingNotification`; outgoing через `ua.call` + progress/confirmed/failed
- `bindPeerConnection` / `unbindPeerConnection` на lifecycle RTC session (peerconnection, ended, failed)
- Расширены `JsSipUaPort` и `createJsSipUserAgent` (call, newRTCSession)
- +10 unit-тестов адаптера; mock default без регрессий (525 passed)

## Зачем
RAT Step 04 (R3): end-to-end входящие/исходящие звонки через реальный JsSIP без изменения CallEngine orchestrators.

## Результат
`npm run test` 525 passed, 1 skipped; lint/typecheck green. Smoke R2+R3 — pending manual на dev SBC (код готов). Step 05 не затронут.
