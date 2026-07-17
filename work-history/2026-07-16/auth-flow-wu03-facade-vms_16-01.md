# Auth Flow WU-03 — Facade + Account VMs

**Дата:** 2026-07-16 16:01
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/facades/accountSignInCommand.ts`
- `src/application/projections/settings/accountSignInViewModel.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/facades/AccountBootstrapFacade.accountSignIn.test.ts`
- `auth-flow/auth-flow-refactoring.md`, `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Единая команда `signInAccount` (режимы `sip_only` / `ocp`) с валидацией на границе Application
- Read model `getAccountSignInViewModel`: опции профилей, boolean секретов, login disabled reason, Server/Auth recovery keys
- `dispatchAccountRecoveryAction` + маршрутизация legacy `retryAuthorization` через dual FSM
- Удалён silent unregister (`ensureUnregisteredBeforeAccountSwitch`) — reject при активной SIP-сессии
- i18n ключи login/mode/recovery для ru/en/fr/de/bg

## Зачем
- ADR-AF-003: один typed Account sign-in surface без switch-account и без утечки секретов в renderer-facing VM

## Результат
- `npm run test` — 2164 passed / 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run i18n:check` — green
- Следующий шаг: WU-04 (`/ui`)
