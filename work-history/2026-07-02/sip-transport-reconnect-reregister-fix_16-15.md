# SIP transport connected + reconnect/reregister semantics

**Дата:** 2026-07-02 16:15
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/telephony/jssip/JsSipTelephonyAdapter.ts`
- `src/adapters/mock/MockTelephonyGateway.ts`
- `src/application/projections/deriveSipSystemStateShell.ts`
- `src/ports/telephony/TelephonyGateway.ts`
- тесты адаптера и projection

## Что
- После `ua.start()` синхронизируется `SipTransportConnected`, если сокет уже открыт (исправлен залипший transport `connecting`)
- `reconnectTransport`: `unregister({all:true})` → `stop()` → новый UA → только транспорт (без ложного no-op при registered)
- `reregister`: всегда `unregister({all:true})` → `register()` на том же UA
- Кнопка «Переподключить сервер» отключена при `transport === connected`
- Mock gateway эмитит transport-события при reconnect; обновлены контракты порта и тесты

## Зачем
Пользователь видел «Подключение» при открытом WebSocket; ручной reconnect не создавал новый UA; reregister не делал unregister+register.

## Результат
- `npm run test` — 1017 passed, 1 skipped
- `npm run lint` — ok
- `npm run typecheck` — ok
