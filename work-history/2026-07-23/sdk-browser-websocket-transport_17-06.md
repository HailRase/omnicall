# Official browser WebSocket transport

**Дата:** 2026-07-23 17:06
**Статус:** выполнено
**Коммит:** `837c544`

## Где
- `axatalk-sdk/packages/sdk/src/internal/browser-websocket-transport.ts`
- `axatalk-sdk/packages/sdk/src/internal/scheduler.ts`
- `axatalk-sdk/packages/sdk/src/public/auth-client.ts`
- `axatalk-sdk/packages/sdk/src/public/axatalk-client.ts`
- `axatalk-sdk/docs/guide/transport.md`
- `axatalk-sdk/evidence/SDK-browser-websocket-transport.md`

## Что
- Добавлен официальный `createBrowserWebSocketTransport` (тонкий `TransportPort` поверх browser WebSocket)
- Добавлены `createBrowserScheduler` / `createBrowserJitterSource`
- `transportFactory` / `scheduler` / `jitter` стали optional с browser defaults (inject для тестов сохранён)
- Обновлены гайды, API report (54 symbols), ARCHITECTURE, pairing quick start без throw-stub
- Unit-тесты адаптера; `npm run preflight` PASS

## Зачем
- Убрать DX-долг: интегратору больше не нужно самому писать обёртку сокета
- Сохранить архитектурный порт и тестируемость без downgrade существующего API

## Результат
- `npx vitest run packages/sdk/src` — PASS (128+)
- `npm run preflight` (axatalk-sdk) — PASS
- Существующие вызовы с явным `transportFactory` продолжают работать (аддитивное изменение)
