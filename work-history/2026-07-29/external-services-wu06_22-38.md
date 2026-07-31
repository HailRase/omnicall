# F-031 WU-06 F-030 preferences extension

**Дата:** 2026-07-29 22:38
**Статус:** выполнено
**Коммит:** —

## Где
- `src/domain/settings/PreferencesExportDocument.ts`
- `src/application/facades/AccountBootstrapFacade.ts`
- `src/application/facades/OperatorPreferencesExternalServices.integration.test.ts`
- `docs/softphone/P11-Operator-Preferences-Export-Design.md`
- `external-services-plan/PROGRESS.md`

## Что
- Подтверждён round-trip `UserSettings.externalServices` внутри `omnicall.preferences` v1 (без bump outer format).
- Journal / Run results исключены; authored header/query values остаются portable.
- После успешного import facade вызывает `replaceActiveSettings` для F-031 runtime.
- Добавлены Domain/UseCase/integration тесты fail-closed и secret exclusions.
- Синхронизированы F-030/F-031 registry, handoff, STATUS, TASK-QUEUE, P11 design.

## Зачем
- Портативный перенос профиля должен включать External Services config и применять его без перезапуска.

## Результат
- Focused vitest 14/14 PASS; `npm run typecheck` PASS; `npm run registry:check` 75/0 PASS; targeted eslint PASS.
- Next: `Implement WU-07 from external-services-plan/10-WORK-UNITS.md`
