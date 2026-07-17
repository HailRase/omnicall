# WU-01 — Profile lifecycle and secret persistence

**Дата:** 2026-07-16 15:31
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/savedAccountProfileLifecycle.ts`
- `src/domain/settings/persistedSavedAccountProfiles.ts` (schema v2)
- `src/application/use-cases/settings/PersistDraftAccountArtifactsUseCase.ts`
- `src/application/use-cases/settings/PromoteAuthorizedSipSessionUseCase.ts`
- `src/application/projections/settings/deriveSavedAccountProfileAvailability.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `auth-flow/auth-flow-refactoring.md`, `docs/softphone/handoffs/P11-Auth-Flow-Refactoring-Handoff.md`

## Что
- Добавлен draft/successful lifecycle для `SavedAccountProfile` + secret-free `ocpDomain`
- Opt-in pre-auth persist метаданных и secrets через `PersistDraftAccountArtifactsUseCase`
- Продвижение `activeProfileKey`/settings только после успешной SIP registration
- Query VM с boolean availability (`hasSavedSipPassword` / `hasSavedOcpApiKey` / `hasCompleteOcpConfiguration`)
- Миграция secrets с provisional username-only key на SIP profile key

## Зачем
- Реализовать ADR-AF-001: reusable draft при failed auth без порчи активной сессии и без секретов в JSON

## Результат
- WU-01 checklist закрыт; focused tests + `npm run typecheck` + `npm run lint` green
- Следующий шаг: `/logic` → WU-02 (OCP dual FSM)
