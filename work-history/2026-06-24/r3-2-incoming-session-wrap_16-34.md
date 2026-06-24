# R3-2 incoming crash — wrap raw RTCSession

**Дата:** 2026-06-24 16:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/wrapJsSipRtcSession.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.test.ts`

## Что
- Добавлены `isJsSipRtcSessionPort` и `ensureJsSipRtcSessionPort` для нормализации сырой JsSIP-сессии
- В `handleNewRtcSession` входящая remote-сессия оборачивается до `registerSession` / `attachSessionLifecycle`
- Regression-тест: remote `newRTCSession` с raw-like объектом без `getConnection`

## Зачем
Устранить `TypeError: session.getConnection is not a function` при входящем вызове (RAT R3-2 smoke).

## Результат
- `npm run test` — 551 passed
- `npm run lint` — ok
- `npm run typecheck` — ok
- Ручной retest R3-2 — пользователю через Smoke Conductor
