# Auth orchestration

**Дата:** 2026-07-17 13:04
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/services/integration/`
- `src/application/services/platform/`
- `src/application/projections/platform/deriveSessionLogoutShell.ts`

## Что
- SIP sign-in возвращает typed readiness outcome без ложного success.
- Logout доступен для активной account session после SIP failure.
- OCP auth retry использует active attempt и ждёт credentials/SIP-ready.
- INVALID_TOKEN budget сбрасывается после новой authorized session.
- Добавлена единая Application orchestration выхода без двойного SIP teardown.

## Зачем
Разделить локальную сессию, OCP authorization и SIP readiness и устранить критические recovery/logout гонки.

## Результат
Focused tests: 66 passed. `npm run typecheck`: passed.
