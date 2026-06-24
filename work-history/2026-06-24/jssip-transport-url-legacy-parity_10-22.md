# Legacy SIP transport URL normalization

**Дата:** 2026-06-24 10:22
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/resolveJsSipTransportUrl.ts`
- `src/adapters/telephony/jssip/createJsSipUserAgent.ts`
- `.env.local`, `env.local.example`

## Что
- Нормализация server → `wss://host:5063/` как в legacy initUAConfig
- Registrar в env: `onedemoserver.online:5063` (без wss://)
- 5 unit-тестов resolveJsSipTransportUrl

## Зачем
WebSocket не поднимался: использовался неверный URL (443/ws), legacy — порт 5063 с trailing slash.

## Результат
Тесты green; перезапуск `npm run dev` + Authorize and register.
