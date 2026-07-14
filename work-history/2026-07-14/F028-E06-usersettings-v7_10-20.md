# F-028 E-06 UserSettings v7 schema

**Дата:** 2026-07-14 10:20
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/OcpIntegrationSettings.ts`
- `src/domain/settings/UserSettings.ts` (schema v7)
- `src/domain/settings/migrateUserSettings.ts` / `validateUserSettings.ts`
- `src/ports/secrets/SecretStoragePort.ts` (`OCP_TOKEN_SECRET_ID`)
- `src/application/facades/AccountBootstrapFacade.ts`
- `ocp-integration/OCP-IMPLEMENTATION-PLAN.md`, Feature Registry, TASK-QUEUE T-020/T-021

## Что
- Добавлен VO `OcpIntegrationSettings` + defaults/parse (domain пустой допустим)
- `SETTINGS_SCHEMA_VERSION = 7`, additive migrate v6→v7
- Токен OCP только через SecretStorage (`ocp-token`), не в JSON
- Facade: `updateOcpSettings`, token CRUD, `connectOcp` / `disconnectOcp`
- UI Integrations panel оставлен в T-021 `/ui` (без React в этой сессии)

## Зачем
Конфигурация OCP Module в настройках без утечки токена в profile JSON; API для будущей Settings UI.

## Результат
- `npm run test` — 1928 passed, 1 skipped
- `npm run lint` / `npm run typecheck` — green
- Следующий шаг: `/ui` T-021 или `/logic` E-10/E-11
