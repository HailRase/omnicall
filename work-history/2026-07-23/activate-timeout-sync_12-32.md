# Согласованные таймауты account:activate

**Дата:** 2026-07-23 12:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/integration/sdkActivateTimeouts.ts`
- `src/application/integration/DeferredSdkActivateConsent.ts`
- `src/application/integration/ExternalSdkAccountHandler.ts`
- `src/application/integration/externalSdkAccountActivateHelpers.ts`
- `src/adapters/integration/MainToRendererBroker.ts`
- `axatalk-sdk/packages/protocol/src/constants.ts`
- `axatalk-sdk/packages/sdk/src/internal/account-activate-commands.ts`
- ADR-0018, PROTOCOL.md, guide, Feature-Registry, evidence DI-08/SDK-08

## Что
- Введены бюджеты: consent TTL 120s, sip_only 60s, OCP = sum stage timeouts + slack, hop ~240s
- Consent modal auto-dismiss по TTL → `timeout` + `activate_phase: consent`
- Broker длинный timeout только для `account:activate-profile`; остальные команды 5s
- После Allow — auth budget + cancel OCP при expiry; details `auth_mode` / `failure_kind`
- SDK `activateProfile` ждёт `SDK_ACTIVATE_CLIENT_TIMEOUT_MS`, не глобальные 5s
- Документация и API reports синхронизированы

## Зачем
- Убрать рассинхрон SDK timeout ↔ висящая модалка / orphan Allow после 5s hop

## Результат
- Desktop targeted tests: 43 passed
- SDK activate + protocol tests: 27 passed
- `axatalk-sdk` `api:check` / `docs:check`: PASS
- Версию не бампили (contract fix / timeout sync; F-011 ещё in progress)
