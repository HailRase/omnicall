# OCP modal Disconnect + scoped Reconnect

**Дата:** 2026-07-19 22:01
**Статус:** выполнено
**Коммит:** `64eec42`

## Где
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/projections/settings/accountSignInViewModel.ts`
- `src/application/facades/AccountBootstrapFacade.accountSignIn.test.ts`
- `src/application/projections/settings/accountSignInViewModel.test.ts`
- `docs/softphone/Feature-Registry.md` (F-028)

## Что
- Modal «Отключить OCP» (`cancelOcpSignInAttempt`) после OCP idle вызывает `EndUserSessionUseCase` — снимает account session / SIP и разблокирует «Войти».
- Перед disconnect добавлен `disarmTransportRecoveryForUserLogout` (ADR-AF-002).
- Account recovery `reconnect` («Переподключить») показывается только если выбранный сохранённый профиль совпадает с `activeSessionProfileId`.
- Обновлены acceptance criteria F-028 и фокус-тесты.

## Зачем
- Disconnect из модалки входа должен возвращать полный pre-login idle, а не оставлять Login lock до avatar Logout.
- «Переподключить» не должен появляться на чужих сохранённых профилях при активной OCP-сессии.

## Результат
- `npx vitest run` (facade accountSignIn + accountSignInViewModel + useAccountActions): 35 passed.
