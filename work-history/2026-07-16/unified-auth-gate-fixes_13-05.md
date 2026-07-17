# Unified SIP/OCP authorization gate fixes

**Дата:** 2026-07-16 13:05
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/projections/settings/authorizationRetryContext.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/testing/sipUseCaseTestDoubles.ts`
- `src/renderer/components/account/AccountPanel.tsx`
- `src/renderer/components/settings/panels/OcpModuleSettingsCard.tsx`
- `src/renderer/hooks/useAccountActions.ts`
- `docs/softphone/handoffs/P11-Unified-Authorization-Gate-Handoff.md`
- `docs/softphone/TASK-QUEUE.md`, `Feature-Registry.md`, `UI-Component-Catalog.md`

## Что
- Один Retry на Account и Integrations через `authorizationProgress.retryAvailable` и Facade `retryAuthorization`
- `sipAutoRegisterOnStartup` управляет bootstrap-регистрацией; persistent startup failure + CTA в Account
- Renderer-тесты: методы входа, progress, first-time OCP, failure-before-success, disconnect warning
- Убраны `as unknown as` из новых auth-тестов; `AccountActionsFacadeBinding` для hook tests
- Handoff T-032, registry evidence, UI catalog sync; InputGroup dev error → key token для i18n:check

## Зачем
Закрыть failed review gate по unified OCP→SIP authorization без изменения границ слоёв и без ложного success до SIP ready.

## Результат
- `npm run test` — 2124 passed, 1 skipped
- `npm run lint` — green
- `npm run typecheck` — green
- `npm run i18n:check` — green
- `npm run registry:check` — green
- `npm run ui:catalog` — catalog обновлён; `ui:catalog:check` требует включить diff каталога в коммит WU
- SM-1…SM-16 manual smoke — не прогонялись; production-ready не заявляется
