# F-031 WU-05 Profile Persistence

**Дата:** 2026-07-29 22:32
**Статус:** выполнено
**Коммит:** —

## Где
- `src/adapters/settings/externalServicesJournalDocument.ts`
- `src/adapters/settings/FileExternalServicesJournalRepository.ts`
- `src/adapters/settings/profileStoragePaths.ts`
- `src/application/use-cases/integration/SaveExternalServicesSettingsUseCase.ts`
- `src/application/use-cases/integration/QueryExternalServicesUseCase.ts`
- `src/application/services/integration/external-services/`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/infrastructure/bootstrap/createExternalServicesCompositionForBootstrap.ts`

## Что
- Добавлен per-profile file journal (`omnicall.external-services-journal` v1) с atomic append, cap 100 и fail-visible corrupt
- Реализованы `SaveExternalServicesSettingsUseCase` и `QueryExternalServicesUseCase` с refresh runtime revision
- Lifecycle: `AccountSessionActivated` → activate; `UserSessionEnded` → invalidate pending; in-flight пишет в старый bucket
- Matching отключён без активной генерации; failed draft sign-in не промоутит runtime
- Real bootstrap инжектит file journal; mock остаётся in-memory

## Зачем
- Обеспечить изоляцию F-031 config/journal по F-023/F-024 профилям и безопасный logout/switch без утечек между identity

## Результат
- Focused vitest (journal/paths/Save/Query/lifecycle/automation) PASS
- `npm run typecheck` PASS; targeted eslint PASS; `npm run registry:check` PASS
- Следующий шаг: WU-06
