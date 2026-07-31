# F-031 WU-07 Collection JSON import/export

**Дата:** 2026-07-29 22:46
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/integration/external-services/ExternalServiceCollectionDocument.ts`
- `src/application/use-cases/integration/ExportExternalServiceCollectionUseCase.ts`
- `src/application/use-cases/integration/ImportExternalServiceCollectionUseCase.ts`
- `src/shared/ipc/ExternalServicesCollectionFileContract.ts`
- `src/adapters/platform/PreloadExternalServicesCollectionFileGateway.ts`
- `src/main/integration/registerExternalServicesCollectionFileIpc.ts`
- `src/application/facades/AccountBootstrapFacade.ts`

## Что
- Добавлен versioned document `omnicall.external-service-collection` v1 с fail-closed parse и regenerate IDs
- Реализованы Export/Import Use Cases: active profile only, `(copy N)`, runtime registry refresh
- Typed IPC/preload/main file gateway: JSON, UTF-8, 2 MiB, cancel outcomes
- Facade `importExternalServiceCollection` / `exportExternalServiceCollection` + bootstrap wiring
- Обновлены PROGRESS, handoff, Feature Registry, STATUS, TASK-QUEUE

## Зачем
- Портативный single-collection JSON transfer без Postman и без UI (WU-08)

## Результат
- Focused tests 15/15 PASS; `npm run typecheck` PASS; targeted eslint PASS; `npm run registry:check` PASS
- Next: `Implement WU-08 from external-services-plan/10-WORK-UNITS.md`
