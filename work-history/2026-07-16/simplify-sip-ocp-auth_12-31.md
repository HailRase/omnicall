# Simplify SIP and OCP Authorization

**Дата:** 2026-07-16 12:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/OcpBackedSignInOrchestrationService.ts`
- `src/application/services/integration/OcpSipCredentialService.ts`
- `src/application/services/integration/OcpInvalidTokenReauthService.ts`
- `src/application/projections/settings/authorizationProgressProjection.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `docs/softphone/Feature-Registry.md`, `STATUS.md`, `ocp-integration/*`

## Что
- Добавлен Application-оркестратор OCP→SIP с одним correlation ID и success только после SIP ready
- Unified `authorizationProgress` + typed failures / concurrent guard / identity mismatch
- INVALID_TOKEN: один capped HTTP re-auth через Application (не stale WS reconnect)
- Account UX: два метода входа (привязка аккаунта по умолчанию vs пароль телефона) + progress
- Integrations: progressive first-time setup «Подключить и войти»; Enable/autoConnect после linked
- i18n ru/en/fr/de/bg; registry/STATUS/smoke checklist обновлены

## Зачем
Сделать авторизацию понятной новичку без потери SIP/OCP/profile/secret-storage возможностей и без ложного success до готовности телефона.

## Результат
- Focused suites: 106+ passed (orchestration, Facade OCP, Account/Integrations UI)
- `tsc` web green; `registry:check` green
- Full `npm run test` / staging smoke SM-1…SM-16 — не прогонялись в этой сессии
- `i18n:check` имеет pre-existing false positive на InputGroup (вне scope)
