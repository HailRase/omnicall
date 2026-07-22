# Align sdk-demo login-activate

**Дата:** 2026-07-22 15:33
**Статус:** выполнено
**Коммит:** —

## Где
- `C:/Users/User/Desktop/ELECTRON/sdk-demo/` (`index.html`, `app.mjs`, `styles.css`, `lib/safe-error.mjs`, docs)
- Вне softphone workspace; product `src/` не трогали

## Что
- Выровнял Settings path → **Настройки → Axatalk SDK** (убрано вложение в Integrations)
- Activate: login + mode; убран misleading pairing opt-in; checklist + chip `account.activate`
- Caps poll после `permission-changed` / matrix elevate; лог `alreadyAuthenticated`
- `safe-error` + Errors tab: `account_incomplete`, Cancel vs Deny, ADR-0018 §F
- Docs: HOW-TO / README / SMOKE / CHANGELOG-DEMO под login-activate

## Зачем
- Демо должно учить реальный контракт ADR-0018 / DI-11 (login activate, matrix elevate, без profileRef)

## Результат
- Syntax check `app.mjs` / `safe-error.mjs` / `server.mjs` — OK
- Live serve assert: новые DOM ids на месте; нет Opt-in / profileRef / «Интеграции → Axatalk»
- Полный live softphone smoke (TOFU/activate consent) — частично: UI/docs aligned; operator happy-path на живом desktop — по SMOKE-RU.md
