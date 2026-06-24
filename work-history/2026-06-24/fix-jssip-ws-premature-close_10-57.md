# Fix JsSIP WS closed before connection established

**Дата:** 2026-06-24 10:57
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `JsSipTelephonyAdapter.test.ts`

## Что
- Восстановлен `register: false` + ручной `ua.register()` (как legacy)
- Убран `teardownUa()` при `registrationFailed` — не рвём WS во время connect/retry
- Игнор transport disconnect пока идёт регистрация (`registrationInFlight`)
- Удалены hardcoded креды из createJsSipUserAgent

## Зачем
Ошибка `WebSocket is closed before the connection is established` на `ua.stop()`: двойная регистрация и преждевременный teardown.

## Результат
7 unit-тестов адаптера green; перезапуск `npm run dev` + Authorize and register.
