# Исправление call_id при завершении консультативного перевода

**Дата:** 2026-06-29 12:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/wrapJsSipRtcSession.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/telephony/jssip/executeJsSipRefer.ts`
- `src/adapters/telephony/jssip/wrapJsSipRtcSession.test.ts`
- `src/adapters/telephony/jssip/executeJsSipRefer.test.ts`

## Что
- Найдена причина: JsSIP ReferSubscriber читает `options.replaces._request.call_id`, а в REFER попадала обёртка-порт без `_request`
- Добавлено разрешение raw RTCSession через WeakMap и `resolveReplacesForRefer` перед attended REFER
- Входящие сессии регистрируются с raw RTCSession для Replaces
- Синхронные исключения REFER перехватываются в `executeJsSipRefer`
- Юнит-тесты на replaces resolution и TypeError mapping

## Зачем
- Убрать «Ошибка перевода: Cannot read properties of undefined (reading 'call_id')» при завершении консультативного перевода на реальном SIP.

## Результат
- `npm run test` — 781 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
