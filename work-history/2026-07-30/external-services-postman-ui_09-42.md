# F-031 External Services Postman-like UI

**Дата:** 2026-07-30 09:42
**Статус:** выполнено
**Коммит:** —

## Где
- `src/renderer/components/settings/external-services/`
- `src/renderer/hooks/useExternalServicesPanel.ts`
- `src/renderer/hooks/useExternalServicesRequestActions.ts`
- `external-services-plan/05-UI-UX.md`
- `docs/softphone/Feature-Registry.md`, `I18N-Coverage.md`, `STATUS.md`, handoff P14

## Что
- Перестроен Settings → External Services в Postman-like каркас: sidebar COLLECTIONS + workspace + Response/History
- Редактор: breadcrumb, method/URL/Send, вкладки Params/Headers/Body/Triggers
- Журнал перенесён во вкладку History; discard при смене selection
- i18n ru/en/fr/de/bg для sidebar/workspace/tabs; тесты и Storybook обновлены
- Документация апгрейднута (layout skeleton), без снятия возможностей WU-08…10

## Зачем
- Убрать «непонятный» wizard-UI и дать оператору привычный HTTP-workspace каркас по референсу Postman

## Результат
- `npm run typecheck` PASS; focused vitest External Services 13/13 PASS; `i18n:check` PASS; `ui:catalog` PASS; targeted eslint PASS
- Следующий продуктовый шаг по треку: WU-11 (`/logic`)
