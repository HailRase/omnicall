# F-031 изоляция query журнала и UX загрузки

**Дата:** 2026-08-03 11:34
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/use-cases/integration/QueryExternalServicesUseCase.ts`
- `src/renderer/hooks/useExternalServicesJournal.ts`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/hooks/externalServicesPanel/useExternalServicesPanelDialogs.ts`
- `src/renderer/components/settings/external-services/ExternalServicesPanel.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesJournal.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesCollectionsDialogs.tsx`
- `src/renderer/shells/SoftphoneReadyShell.tsx`
- `external-services-plan/{01,05,06,12}*`, `docs/softphone/Feature-Registry.md`, `CHANGELOG.md`

## Что
- Query возвращает `journalStatus` (`ready` / `skipped` / `error`); при `journalLimit: 0` journal I/O не вызывается
- Ошибка journal repository больше не валит загрузку коллекций/настроек
- Баннер load error вынесен наверх workspace (не ломает flex layout)
- History показывает компактную локальную ошибку + Retry
- Тесты Use Case + Panel; docs/registry/UI catalog/CHANGELOG Unreleased

## Зачем
- Убрать двойные «кривые» ошибки в Настройки → Внешние сервисы и сохранить редактирование коллекций при повреждённом журнале

## Результат
- `vitest` (Query + Panel + Journal + collections projection): PASS
- `npm run typecheck`: PASS
- `npm run ui:catalog`: PASS
- Версию не бампал (ожидает `/release`); запись в CHANGELOG `[Unreleased]`
