# Fix External Services disable save

**Дата:** 2026-07-30 12:36
**Статус:** выполнено
**Коммит:** —

## Где
- `src/application/services/integration/external-services/mutateExternalServicesRequests.ts`
- `src/renderer/hooks/useExternalServicesRequestActions.ts`
- `src/renderer/components/settings/external-services/ExternalServicesRequestEditor.tsx`

## Что
- При body mode `none` очищается `body.value` (UI + normalize на replace)
- Пустые enabled query/header rows на save отключаются
- Persist использует refs для settings/revision (без stale revision)

## Зачем
- Save после выключения падал с `saveError` из-за `body.mode=none` + непустого value

## Результат
- mutation + editor tests pass
