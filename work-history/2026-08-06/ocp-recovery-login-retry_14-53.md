# OCP recovery login on Retry

**Дата:** 2026-08-06 14:53
**Статус:** выполнено
**Коммит:** `a7e61d1f`

## Где
- `AccountBootstrapFacade.ts` — `resolveOcpLogin`, `executeOcpRecoveryRepeatSignIn`, `connectOcp` attempt secrets
- `useOperatorStatusSelector.ts` — banner Retry → `retry_server`
- `ocpDualFsm.ts` — primary Retry server when Server failed + stale authorized
- ADR-AF-002, Feature-Registry, STATUS, UX blueprint, CHANGELOG

## Что
- Единый cascade логина: attempt → authenticatedLogin → SIP
- Recovery читает API key из attempt scope или SecretStorage
- Баннер «Повторить» = System State `retry_server` (fallback connectOcp)
- Тесты Facade reconnect без SIP + selector banner Retry

## Зачем
- Убрать ложный toast «Укажите логин…» при Retry после потери OCP-соединения.

## Результат
- ocpDualFsm / Facade / useOperatorStatusSelector / deriveOcpSystemStateShell — green
