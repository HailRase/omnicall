# Logout → Login re-enable after failed SIP auth

**Дата:** 2026-07-17 15:08
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/platform/EndUserSessionUseCase.ts`
- `src/application/use-cases/platform/EndUserSessionUseCase.test.ts`
- `src/renderer/hooks/useAccountActions.ts`
- `src/renderer/hooks/useAccountActions.test.ts`
- `docs/softphone/TASK-QUEUE.md` (T-039)
- `docs/softphone/Feature-Registry.md` (F-028 / ADR-AF-005 evidence)
- `docs/softphone/STATUS.md`

## Что
- После неуспешной SIP-авторизации локальная account session остаётся активной (ADR-AF-005) — это ожидаемо; Login блокируется до avatar logout.
- Баг: после «Выйти» SIP отключался, но кнопка «Войти» оставалась disabled с `account.signIn.disabled.logoutFirst`.
- `EndUserSessionUseCase` теперь публикует `UserSessionEnded` и при partial SIP teardown (как SafeLogout), кроме concurrent `teardown_in_progress`.
- `useAccountActions` обновляет sign-in VM при смене `hasActiveAccountSession` в bootstrap store.

## Зачем
- Avatar logout должен всегда снимать Login lock, даже если SIP успел подключиться, но REGISTER/auth не прошёл.

## Результат
- Фокус-тесты: `EndUserSessionUseCase.test.ts` + `useAccountActions.test.ts` — 21 passed.
- Ожидаемое поведение: Login → SIP connect без auth → fail → Выйти → «Войти» снова активна.
