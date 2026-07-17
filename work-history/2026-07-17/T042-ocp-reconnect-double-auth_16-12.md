# T-042: OCP Reconnect — один `/proxy/authenticate`

**Дата:** 2026-07-17 16:12
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/OcpTransportRecoveryService.ts`
- `src/application/services/integration/OcpTransportRecoveryService.test.ts`
- `docs/softphone/adr/ADR-AF-002-ocp-transport-auth-dual-fsm.md`
- `ocp-integration/OCP-Smoke-Checklist.md` (SM-8b)
- Feature Registry / TASK-QUEUE / STATUS

## Что
- Диагноз: 1-й HTTP — ручной Reconnect; 2-й ~5 с — `OcpTransportRecoveryService` после async WS close
- Гонка: hub progress notify снова ставил `wasLive` пока auth ещё `authorized`
- `cancelAll` теперь включает `ignoreTransportDrops` до следующего `connecting|connected`
- `wasLive` вооружается только при `authorized + connected` и не во время ignore
- Тест на async-close после cancel

## Зачем
Убрать двойной `/proxy/authenticate` и «мигание» кнопки Переподключить после ручного Reconnect.

## Результат
- focused tests + lint + typecheck — green
- Перезапустить `npm run dev` / проверить SM-8b: ровно один token request
