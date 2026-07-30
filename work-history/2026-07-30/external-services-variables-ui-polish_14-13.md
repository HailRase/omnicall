# External Services Variables UI polish

**Дата:** 2026-07-30 14:13
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/ExternalServicesSystemVariablesHelp.tsx`
- `src/renderer/components/settings/external-services/ExternalServicesRequestUrlBar.tsx`
- `src/renderer/components/settings/external-services/ExternalServices.module.css`
- `src/renderer/i18n/messages.ts`, `catalogs/bgMessages.ts`
- `external-services-plan/05-UI-UX.md`, Feature Registry / I18N / UI catalog

## Что
- Удалён hint под URL про `{{имя}}` / вкладку Variables
- Variables: компактные label + token + краткое описание, короткие инструкции
- Исправлен лишний отступ контента вкладок (единый `--space-sm` / `--space-md`)
- i18n ru/en/bg (+ наследование fr/de) для `variables.label.*` и укороченных строк

## Зачем
- Убрать шум в URL bar, сделать Variables читаемее и выровнять spacing вкладок редактора

## Результат
- `vitest` ExternalServicesRequestsEditor + VariableCatalog: PASS (19)
- `npm run typecheck`: PASS
- `npm run i18n:check`: PASS
