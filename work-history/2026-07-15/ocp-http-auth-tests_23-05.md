# OCP HTTP auth — обновление тестов

**Дата:** 2026-07-15 23:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/shared/host-api/OcpHostApiContract.test.ts`
- `src/application/facades/AccountBootstrapFacade.test.ts`
- `src/domain/settings/validateUserSettings.test.ts`
- `src/application/settings/migrateUserSettings.test.ts`
- `src/application/projections/integration/ocpSessionProjection.test.ts`
- `src/adapters/settings/FileSettingsRepository.test.ts`
- `src/application/integration/OcpFullFlow.integration.test.ts`

## Что
- Host auth: `{ ocpDomain, login, apiKey }`; отклонение legacy `ocpAuthToken`
- Facade OCP: `saveOcpProxyApiKey` / `getOcpProxyApiKey` / `deleteOcpProxyApiKey`, `linked` вместо `autoSipAuth`
- Connect/autoConnect: `MockOcpProxyAuthenticatePort`, SIP login, `simulateAuthSuccess`
- Projection: `authFeedback` вместо `proxyStatus` для SESSION_EXIST / INVALID_TOKEN
- Settings: `schemaVersion` 8, `linked: false` в defaults и миграциях

## Зачем
Привести тесты в соответствие с рефакторингом OCP HTTP auth (F-028, schema v8).

## Результат
`npm test -- --run` — 2049 passed, 0 failed.
